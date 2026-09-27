/**
 * ai.js - CITAMED.VE
 * M03 / Semana 7 - Rutas de Inteligencia Artificial para el Espacio Clínico del Médico
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { uploadAudioFile } = require('../middleware/uploadMiddleware');
const platformSettingsService = require('../services/platformSettingsService');
const aiService = require('../services/ai/aiService');

// Todas las rutas requieren autenticación y rol de médico
router.use(authenticateToken, requireRoles(['doctor']));

// Limitador de ráfaga por usuario (ventana de 60s, max configurable por ai_limits.perMinutePerUser)
const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: async () => {
    try {
      const limits = await platformSettingsService.get('ai_limits', { perMinutePerUser: 10 });
      return typeof limits?.perMinutePerUser === 'number' ? limits.perMinutePerUser : 10;
    } catch (_) {
      return 10;
    }
  },
  keyGenerator: (req) => (req.user?.id ? String(req.user.id) : req.ip),
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Has realizado demasiadas solicitudes de IA en poco tiempo. Por favor espera un minuto.'
    });
  }
});

router.use(aiBurstLimiter);

/**
 * Helper centralizado para capturar errores de IA y formatear respuesta
 */
function handleAiError(res, err, defaultMsg) {
  let status = err.status || 500;
  let code = err.code || `ERR_${status}`;

  if (code === 'AI_QUOTA_EXCEEDED') status = 402;
  else if (code === 'AI_CONSENT_REQUIRED' || code === 'INVALID_APPOINTMENT_STATUS') status = 409;
  else if (code === 'AI_UNAVAILABLE') status = 503;
  else if (code === 'AUDIO_UNINTELLIGIBLE') status = 422;

  return res.status(status).json({
    success: false,
    code,
    message: err.message || defaultMsg
  });
}

/**
 * GET /api/ai/status
 * Estado del servicio de IA y cuota mensual del médico
 */
router.get('/status', async (req, res) => {
  try {
    const status = await aiService.getStatus(req.user.id);
    return res.json({
      success: true,
      ...status
    });
  } catch (err) {
    return handleAiError(res, err, 'Error al obtener estado de IA');
  }
});

/**
 * POST /api/ai/improve
 * Mejora la redacción de un campo de la historia clínica
 */
router.post('/improve', async (req, res) => {
  try {
    const { appointmentId, field, text } = req.body;
    const result = await aiService.improve(req.user.id, { appointmentId, field, text });
    return res.json({
      success: true,
      text: result.text
    });
  } catch (err) {
    return handleAiError(res, err, 'Error al mejorar redacción');
  }
});

/**
 * POST /api/ai/soap
 * Genera propuesta SOAP estructurada a partir de dictado o texto libre
 */
router.post('/soap', async (req, res) => {
  try {
    const { appointmentId, text } = req.body;
    const result = await aiService.soap(req.user.id, { appointmentId, text });
    return res.json({
      success: true,
      proposal: result.proposal,
      provider: result.provider
    });
  } catch (err) {
    return handleAiError(res, err, 'Error al generar estructura SOAP');
  }
});

/**
 * POST /api/ai/rx
 * Genera propuesta de récipe médico a partir de dictado o texto libre
 */
router.post('/rx', async (req, res) => {
  try {
    const { appointmentId, text } = req.body;
    const result = await aiService.rx(req.user.id, { appointmentId, text });
    return res.json({
      success: true,
      proposal: result.proposal,
      provider: result.provider
    });
  } catch (err) {
    return handleAiError(res, err, 'Error al generar récipe médico');
  }
});

/**
 * POST /api/ai/transcribe
 * Transcribe un archivo de audio grabado durante la consulta
 */
router.post('/transcribe', uploadAudioFile, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_FILE',
        message: 'No se recibió ningún archivo de audio para transcribir'
      });
    }

    const { appointmentId } = req.body;
    const result = await aiService.transcribe(req.user.id, {
      appointmentId,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      filename: req.file.originalname
    });

    return res.json({
      success: true,
      text: result.text,
      seconds: result.seconds
    });
  } catch (err) {
    return handleAiError(res, err, 'Error al transcribir audio');
  }
});

module.exports = router;
