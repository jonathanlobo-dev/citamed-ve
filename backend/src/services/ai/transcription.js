/**
 * transcription.js - CITAMED.VE
 * M03 / Semana 7 - Servicio de transcripción de audio con Whisper y filtro de alucinaciones
 */

const platformSettingsService = require('../platformSettingsService');
const secretCrypto = require('../../utils/secretCrypto');

const TIMEOUT_MS = 20000; // 20 segundos máximo

// Frases típicas de relleno o alucinación de Whisper en silencios o audios confusos
const HALLUCINATION_PHRASES = [
  'gracias por ver el video',
  'gracias por ver este video',
  'gracias por ver',
  'suscríbete al canal',
  'suscribete al canal',
  'suscríbete',
  'suscribete',
  'no olvides suscribirte',
  'dale like y suscríbete',
  'dale like',
  'subtítulos por la comunidad de amara',
  'subtítulos realizados por la comunidad de amara',
  'subtítulos creados por la comunidad de amara',
  'subtitulos por la comunidad de amara',
  'thanks for watching',
  'please subscribe',
  'like and subscribe',
  'transcripción por',
  'transcripcion por',
  '¡hasta la próxima!',
  'hasta la proxima'
];

const MEDICAL_PROMPT = 
  'Vocabulario médico venezolano: acetaminofén, ibuprofeno, amoxicilina, losartán, metformina, omeprazol, ' +
  'tensión arterial, glicemia, cada 8 horas, vía oral, cefalea, odinofagia, fiebre, saturación de oxígeno, ' +
  'hematología completa, examen físico.';

/**
 * Filtra alucinaciones comunes de Whisper y colas de relleno
 */
function filterHallucinations(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let text = rawText.trim();

  for (const phrase of HALLUCINATION_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[.,;!¡?¿\\s]*${escaped}[.,;!¡?¿\\s]*$`, 'gi');
    text = text.replace(regex, '').trim();
  }

  // Si después de quitar las frases solo quedan signos de puntuación o espacios
  const cleanOfPunct = text.replace(/[.,;!¡?¿\s\-_]/g, '');
  if (!cleanOfPunct) {
    return '';
  }

  return text;
}

/**
 * Construye la cadena de transcripción disponible
 */
async function buildTranscriptionChain() {
  const setting = await platformSettingsService.get('ai_transcription', { chain: [] });
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
      model: item.model || (item.provider === 'groq' ? 'whisper-large-v3-turbo' : 'whisper-1'),
      apiKey
    });
  }

  // Respaldos por variables de entorno
  if (process.env.GROQ_API_KEY) {
    resolvedChain.push({
      id: 'env-groq-whisper',
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      apiKey: process.env.GROQ_API_KEY.trim()
    });
  }

  if (process.env.OPENAI_API_KEY) {
    resolvedChain.push({
      id: 'env-openai-whisper',
      provider: 'openai',
      model: 'whisper-1',
      apiKey: process.env.OPENAI_API_KEY.trim()
    });
  }

  // Desduplicar
  const seen = new Set();
  const deduped = [];
  for (const item of resolvedChain) {
    const fingerprint = `${item.provider}:${item.apiKey || 'no-key'}:${item.model}`;
    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      deduped.push(item);
    }
  }

  return deduped;
}

/**
 * Transcribe un archivo de audio usando la cadena de Whisper (Groq/OpenAI)
 * @param {Object} options
 * @param {Buffer} options.buffer - Buffer del archivo de audio
 * @param {string} [options.mimeType='audio/webm']
 * @param {string} [options.filename='audio.webm']
 * @returns {Promise<{ text: string, seconds: number, provider: string, model: string, latencyMs: number, attempts: Array }>}
 */
async function transcribe({ buffer, mimeType = 'audio/webm', filename = 'audio.webm' }) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    const err = new Error('Buffer de audio requerido');
    err.status = 400;
    throw err;
  }

  const chain = await buildTranscriptionChain();
  if (!chain || chain.length === 0) {
    const err = new Error('No hay proveedores de transcripción configurados o disponibles');
    err.code = 'AI_UNAVAILABLE';
    err.status = 503;
    throw err;
  }

  const attempts = [];

  for (const item of chain) {
    const start = Date.now();

    // Proveedor Mock
    if (item.provider === 'mock') {
      if (item.model === 'fail') {
        attempts.push({
          provider: 'mock',
          model: 'fail',
          success: false,
          latencyMs: Date.now() - start,
          errorCode: 'HTTP_429'
        });
        continue;
      }
      return {
        text: 'Paciente refiere malestar general y dolor de garganta desde hace dos días.',
        seconds: 10,
        provider: 'mock',
        model: item.model,
        latencyMs: Date.now() - start,
        attempts: [{ provider: 'mock', model: item.model, success: true, latencyMs: Date.now() - start }]
      };
    }

    try {
      const url = item.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/audio/transcriptions'
        : 'https://api.openai.com/v1/audio/transcriptions';

      const formData = new FormData();
      const cleanMime = mimeType.split(';')[0].trim().toLowerCase() || 'audio/webm';
      const blob = new Blob([buffer], { type: cleanMime });

      formData.append('file', blob, filename || 'audio.webm');
      formData.append('model', item.model);
      formData.append('language', 'es');
      formData.append('response_format', 'verbose_json');
      formData.append('prompt', MEDICAL_PROMPT);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${item.apiKey}`
          },
          body: formData,
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }

      if (!res.ok) {
        let errText = '';
        try { errText = await res.text(); } catch (_) {}
        const httpErr = new Error(`${item.provider} falló con estado ${res.status}`);
        httpErr.status = res.status;
        httpErr.details = errText;
        throw httpErr;
      }

      const data = await res.json();
      const latencyMs = Date.now() - start;
      const rawText = data?.text || '';
      const seconds = typeof data?.duration === 'number' ? Math.round(data.duration) : 0;

      const filteredText = filterHallucinations(rawText);

      if (!filteredText) {
        const unintelligibleErr = new Error('No se entendió el audio proporcionado');
        unintelligibleErr.code = 'AUDIO_UNINTELLIGIBLE';
        unintelligibleErr.status = 422;
        throw unintelligibleErr;
      }

      attempts.push({
        provider: item.provider,
        model: item.model,
        success: true,
        latencyMs
      });

      return {
        text: filteredText,
        seconds,
        provider: item.provider,
        model: item.model,
        latencyMs,
        attempts
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      attempts.push({
        provider: item.provider,
        model: item.model,
        success: false,
        latencyMs,
        errorCode: err.code || `HTTP_${err.status || 500}`,
        errorMessage: err.message
      });

      // Si fue que el audio no se entendió (422), no tiene sentido reintentar con otro proveedor
      if (err.code === 'AUDIO_UNINTELLIGIBLE' || err.status === 422) {
        throw err;
      }
    }
  }

  const allFailedErr = new Error('Todos los proveedores de transcripción fallaron');
  allFailedErr.code = 'AI_UNAVAILABLE';
  allFailedErr.status = 503;
  allFailedErr.attempts = attempts;
  throw allFailedErr;
}

module.exports = {
  transcribe,
  filterHallucinations,
  buildTranscriptionChain
};
