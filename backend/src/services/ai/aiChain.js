/**
 * aiChain.js - CITAMED.VE
 * M03 / Semana 7 - Orquestación de cadena de proveedores de IA con salto automático
 */

const platformSettingsService = require('../platformSettingsService');
const secretCrypto = require('../../utils/secretCrypto');
const providers = require('./providers');

// Cascada de modelos de Gemini con una misma llave: si el primero está saturado,
// retirado o tarda demasiado, se prueba el siguiente antes de pasar a otro proveedor
const GEMINI_MODEL_CASCADE = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];

function expandModels(item) {
  if (item.provider !== 'gemini') return [item];
  const models = [item.model, ...GEMINI_MODEL_CASCADE].filter(Boolean);
  return [...new Set(models)].map((model) => ({ ...item, model }));
}

/**
 * Construye la cadena de proveedores de texto priorizada
 * 1. Elementos habilitados en platform_settings ('ai_providers')
 * 2. Variables de entorno (como respaldo si existen)
 * Omite 'mock' si no está en entorno local permitido.
 */
async function buildTextChain() {
  const setting = await platformSettingsService.get('ai_providers', { chain: [] });
  const rawChain = Array.isArray(setting?.chain) ? setting.chain : [];

  const allowMock = process.env.AI_ALLOW_MOCK === '1' && process.env.NODE_ENV !== 'production';
  const resolvedChain = [];

  for (const item of rawChain) {
    if (item.enabled === false) continue;
    if (item.provider === 'mock' && !allowMock) continue;

    let apiKey = item.apiKey || null;
    if (!apiKey && item.apiKeyEnc) {
      try {
        apiKey = secretCrypto.decrypt(item.apiKeyEnc);
      } catch (_) {
        apiKey = null;
      }
    }

    if (!apiKey && item.provider !== 'mock') continue;

    resolvedChain.push({
      id: item.id,
      provider: item.provider,
      model: item.model,
      apiKey
    });
  }

  // Respaldos por variables de entorno al final de la cadena
  const envBackups = [
    { envKey: 'GEMINI_API_KEY', provider: 'gemini', model: 'gemini-3.5-flash' },
    { envKey: 'GROQ_API_KEY', provider: 'groq', model: 'openai/gpt-oss-120b' },
    { envKey: 'OPENAI_API_KEY', provider: 'openai', model: 'gpt-4o-mini' },
    { envKey: 'ANTHROPIC_API_KEY', provider: 'anthropic', model: 'claude-haiku-4-5-20251001' }
  ];

  for (const backup of envBackups) {
    const key = process.env[backup.envKey];
    if (key && key.trim()) {
      resolvedChain.push({
        id: `env-${backup.provider}`,
        provider: backup.provider,
        model: backup.model,
        apiKey: key.trim()
      });
    }
  }

  // Desduplicar por provider + apiKey + model
  const seen = new Set();
  const dedupedChain = [];
  for (const item of resolvedChain.flatMap(expandModels)) {
    const fingerprint = `${item.provider}:${item.apiKey || 'no-key'}:${item.model}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      dedupedChain.push(item);
    }
  }

  return dedupedChain;
}

/**
 * Llama a un proveedor individual según su tipo
 */
async function executeProvider(item, { systemPrompt, userText, json }) {
  switch (item.provider) {
    case 'gemini':
      return await providers.callGemini({ apiKey: item.apiKey, model: item.model, systemPrompt, userText, json });
    case 'groq':
      return await providers.callGroq({ apiKey: item.apiKey, model: item.model, systemPrompt, userText, json });
    case 'openai':
      return await providers.callOpenAI({ apiKey: item.apiKey, model: item.model, systemPrompt, userText, json });
    case 'anthropic':
      return await providers.callAnthropic({ apiKey: item.apiKey, model: item.model, systemPrompt, userText, json });
    case 'mock':
      return providers.callMock({ model: item.model, systemPrompt, userText, json });
    default:
      throw new Error(`Proveedor no soportado: ${item.provider}`);
  }
}

/**
 * Genera texto o JSON recorriendo la cadena en orden de prioridad
 * Si un proveedor falla (429, 5xx, timeout, texto vacío o JSON inválido), salta al siguiente.
 * @returns {Promise<{ text: string, parsedJson?: any, provider: string, model: string, latencyMs: number, attempts: Array }>}
 */
async function generate({ systemPrompt, userText, json = false }) {
  const chain = await buildTextChain();

  if (!chain || chain.length === 0) {
    const err = new Error('No hay proveedores de IA configurados o disponibles');
    err.code = 'AI_UNAVAILABLE';
    err.status = 503;
    throw err;
  }

  const attempts = [];

  for (const item of chain) {
    const start = Date.now();
    try {
      const rawText = await executeProvider(item, { systemPrompt, userText, json });
      const latencyMs = Date.now() - start;

      if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
        throw new Error('Respuesta vacía del proveedor');
      }

      let parsedJson = null;
      if (json) {
        try {
          parsedJson = JSON.parse(rawText);
        } catch (_) {
          const parseErr = new Error('El proveedor no devolvió un JSON válido');
          parseErr.status = 502;
          throw parseErr;
        }
      }

      attempts.push({
        provider: item.provider,
        model: item.model,
        success: true,
        latencyMs
      });

      return {
        text: rawText,
        parsedJson,
        provider: item.provider,
        model: item.model,
        latencyMs,
        attempts
      };
    } catch (error) {
      const latencyMs = Date.now() - start;
      attempts.push({
        provider: item.provider,
        model: item.model,
        success: false,
        latencyMs,
        errorCode: error.code || `HTTP_${error.status || 500}`,
        errorMessage: error.message
      });
      // Salto automático al siguiente proveedor de la cadena
    }
  }

  const allFailedErr = new Error('Todos los proveedores de IA de la cadena fallaron');
  allFailedErr.code = 'AI_UNAVAILABLE';
  allFailedErr.status = 503;
  allFailedErr.attempts = attempts;
  throw allFailedErr;
}

module.exports = {
  buildTextChain,
  generate
};
