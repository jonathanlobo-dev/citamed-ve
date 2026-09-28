/**
 * providers.js - CITAMED.VE
 * M03 / Semana 7 - Llamadas directas con fetch nativo a proveedores de IA
 */

// Como NeosVet: si un modelo se cuelga, se corta a los 12 s y la cascada salta al siguiente
const TIMEOUT_MS = 12000;

/**
 * Limpia bloques <think> y bloques de código markdown (```json ... ```)
 * @param {string} raw - Texto crudo retornado por el modelo
 * @returns {string} - Texto limpio
 */
function cleanAiText(raw) {
  if (typeof raw !== 'string') return '';
  // 1. Quitar etiquetas <think>...</think> (DeepSeek, modelos de razonamiento)
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // 2. Quitar bloques de código markdown
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return text;
}

/**
 * Ejecuta fetch con timeout de 20s usando AbortController
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return res;
  } catch (error) {
    if (error.name === 'AbortError' || controller.signal.aborted) {
      const timeoutErr = new Error(`Tiempo de espera agotado (${TIMEOUT_MS / 1000}s) para el proveedor de IA`);
      timeoutErr.status = 504;
      timeoutErr.code = 'AI_TIMEOUT';
      throw timeoutErr;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Llamada a Google Gemini
 * Nota de seguridad: La API key va en la cabecera 'x-goog-api-key', NUNCA en la URL.
 */
async function callGemini({ apiKey, model, systemPrompt, userText, json = false }) {
  if (!apiKey) {
    const err = new Error('Llave de API no proporcionada para Gemini');
    err.status = 400;
    throw err;
  }

  const modelName = model || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userText || '' }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      // Los modelos con razonamiento gastan tokens pensando; con un tope bajo el JSON sale cortado
      maxOutputTokens: 8192,
      // En Gemini 3 el razonamiento bajo responde en segundos y basta para ordenar la consulta
      ...(/^gemini-3/.test(modelName) ? { thinkingConfig: { thinkingLevel: 'low' } } : {}),
      ...(json ? { responseMimeType: 'application/json' } : {})
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      errBody = await res.text();
    } catch (_) {}
    const err = new Error(`Gemini respondió con estado ${res.status}`);
    err.status = res.status;
    err.details = errBody;
    throw err;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const rawText = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || '')
    .join('');
  return cleanAiText(rawText);
}

/**
 * Llamada a Groq
 */
async function callGroq({ apiKey, model, systemPrompt, userText, json = false }) {
  if (!apiKey) {
    const err = new Error('Llave de API no proporcionada para Groq');
    err.status = 400;
    throw err;
  }

  const modelName = model || 'openai/gpt-oss-120b';
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userText || '' });

  const payload = {
    model: modelName,
    temperature: 0.1,
    messages,
    ...(json ? { response_format: { type: 'json_object' } } : {})
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      errBody = await res.text();
    } catch (_) {}
    const err = new Error(`Groq respondió con estado ${res.status}`);
    err.status = res.status;
    err.details = errBody;
    throw err;
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  return cleanAiText(rawText);
}

/**
 * Llamada a OpenAI
 */
async function callOpenAI({ apiKey, model, systemPrompt, userText, json = false }) {
  if (!apiKey) {
    const err = new Error('Llave de API no proporcionada para OpenAI');
    err.status = 400;
    throw err;
  }

  const modelName = model || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userText || '' });

  const payload = {
    model: modelName,
    temperature: 0.1,
    messages,
    ...(json ? { response_format: { type: 'json_object' } } : {})
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      errBody = await res.text();
    } catch (_) {}
    const err = new Error(`OpenAI respondió con estado ${res.status}`);
    err.status = res.status;
    err.details = errBody;
    throw err;
  }

  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  return cleanAiText(rawText);
}

/**
 * Llamada a Anthropic Claude
 */
async function callAnthropic({ apiKey, model, systemPrompt, userText, json = false }) {
  if (!apiKey) {
    const err = new Error('Llave de API no proporcionada para Anthropic');
    err.status = 400;
    throw err;
  }

  const modelName = model || 'claude-haiku-4-5-20251001';
  const url = 'https://api.anthropic.com/v1/messages';

  const payload = {
    model: modelName,
    max_tokens: 4096,
    temperature: 0.1,
    ...(systemPrompt ? { system: systemPrompt } : {}),
    messages: [
      { role: 'user', content: userText || '' }
    ]
  };

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errBody = '';
    try {
      errBody = await res.text();
    } catch (_) {}
    const err = new Error(`Anthropic respondió con estado ${res.status}`);
    err.status = res.status;
    err.details = errBody;
    throw err;
  }

  const data = await res.json();
  const rawText = data?.content?.[0]?.text || '';
  return cleanAiText(rawText);
}

/**
 * Proveedor 'mock' para pruebas locales controladas
 * Solo activo si AI_ALLOW_MOCK === '1' y NODE_ENV !== 'production'
 */
function callMock({ model, userText, json = false }) {
  if (process.env.AI_ALLOW_MOCK !== '1' || process.env.NODE_ENV === 'production') {
    const err = new Error('El proveedor mock no está disponible en este entorno');
    err.status = 403;
    throw err;
  }

  if (model === 'fail') {
    const err = new Error('Fallo simulado de proveedor de IA (429 Rate Limit)');
    err.status = 429;
    throw err;
  }

  if (json) {
    return JSON.stringify({
      subjective: 'Paciente refiere malestar general y dolor de garganta desde hace 2 días.',
      objective: 'Faringe congestiva con exudado amigdalino.',
      assessment: 'Faringoamigdalitis aguda bacteriana.',
      plan: 'Reposo relativo e hidratación abundante.',
      vitalSigns: {
        systolic: 120,
        diastolic: 80,
        heartRate: 75,
        temperature: 60, // Valor fuera de rango (>45) para verificar advertencia
        oxygenSaturation: 98
      },
      physicalExam: {
        headNeck: { status: 'abnormal', findings: 'Amígdalas hiperémicas con placas' },
        cardiovascular: { status: 'normal', findings: 'Ruidos cardíacos rítmicos' },
        respiratory: { status: 'normal', findings: 'Murmullo vesicular conservado' }
      },
      labOrders: ['Hematología completa'],
      items: [
        {
          medication: 'Amoxicilina 500 mg',
          presentation: 'Cápsulas',
          dose: '500 mg',
          frequency: 'cada 8 horas',
          duration: '7 días',
          instructions: 'Tomar vía oral con agua'
        }
      ],
      indications: 'Completar los 7 días de tratamiento.',
      warnings: [],
      campoDesconocido: 'debe ser descartado'
    });
  }

  if (userText && userText.toLowerCase().includes('pasiente con fievre')) {
    return 'Paciente con fiebre de 39 grados desde ayer, tomar acetaminofén 500 mg cada 8 horas';
  }

  return userText || 'OK';
}

module.exports = {
  callGemini,
  callGroq,
  callOpenAI,
  callAnthropic,
  callMock,
  cleanAiText
};
