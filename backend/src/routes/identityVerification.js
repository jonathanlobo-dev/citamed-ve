// src/routes/identityVerification.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Rutas para verificación de email y teléfono

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const identityVerificationController = require('../controllers/identityVerificationController');
const validator = require('../validators/identityVerificationValidator');

// ============================================================
// RATE LIMITERS ESPECÍFICOS PARA VERIFICACIÓN
// ============================================================

/**
 * Rate limiter para envío de emails de verificación
 * 3 requests por hora por IP
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 requests por hora (un poco más permisivo para testing)
  message: {
    success: false,
    message: 'Demasiados intentos de verificación de email. Intenta en 1 hora.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para envío de SMS
 * Más estricto debido al costo
 */
const phoneVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 SMS por hora
  message: {
    success: false,
    message: 'Límite de SMS alcanzado. Intenta en 1 hora.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para intentos de verificación de código
 * Previene fuerza bruta
 */
const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por 15 minutos
  message: {
    success: false,
    message: 'Demasiados intentos de verificación. Espera 15 minutos.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================
// RUTAS DE VERIFICACIÓN DE EMAIL
// ============================================================

/**
 * @route   POST /api/verification/send-email
 * @desc    Envía código de verificación por email
 * @access  Public (requiere userId)
 */
router.post(
  '/send-email',
  emailVerificationLimiter,
  validator.validateSendEmail,
  identityVerificationController.sendEmailVerification
);

/**
 * @route   POST /api/verification/verify-email
 * @desc    Verifica el código de email
 * @access  Public
 */
router.post(
  '/verify-email',
  verifyCodeLimiter,
  validator.validateVerifyEmail,
  identityVerificationController.verifyEmail
);

/**
 * @route   POST /api/verification/resend-email
 * @desc    Reenvía el código de verificación por email
 * @access  Public (requiere userId)
 */
router.post(
  '/resend-email',
  emailVerificationLimiter,
  validator.validateResendEmail,
  identityVerificationController.resendEmailVerification
);

// ============================================================
// RUTAS DE VERIFICACIÓN DE TELÉFONO (SMS)
// ============================================================

/**
 * @route   POST /api/verification/send-phone
 * @desc    Envía código de verificación por SMS
 * @access  Public (requiere userId + phoneNumber)
 */
router.post(
  '/send-phone',
  phoneVerificationLimiter,
  validator.validateSendPhone,
  identityVerificationController.sendPhoneVerification
);

/**
 * @route   POST /api/verification/verify-phone
 * @desc    Verifica el código de teléfono (SMS)
 * @access  Public
 */
router.post(
  '/verify-phone',
  verifyCodeLimiter,
  validator.validateVerifyPhone,
  identityVerificationController.verifyPhone
);

/**
 * @route   POST /api/verification/resend-phone
 * @desc    Reenvía el código de verificación por SMS
 * @access  Public (requiere userId + phoneNumber)
 */
router.post(
  '/resend-phone',
  phoneVerificationLimiter,
  validator.validateResendPhone,
  identityVerificationController.resendPhoneVerification
);

// ============================================================
// RUTAS DE ESTADO
// ============================================================

/**
 * @route   GET /api/verification/status/:userId
 * @desc    Obtiene el estado de verificación de un usuario
 * @access  Public (considerar proteger con auth en producción)
 */
router.get(
  '/status/:userId',
  validator.validateGetStatus,
  identityVerificationController.getStatus
);

/**
 * @route   GET /api/verification/check-token/:token
 * @desc    Verifica si un token es válido (sin verificar código)
 * @access  Public
 */
router.get(
  '/check-token/:token',
  validator.validateCheckToken,
  identityVerificationController.checkToken
);

module.exports = router;
