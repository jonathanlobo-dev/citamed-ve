/**
 * Password Recovery Routes - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Rutas de recuperación de contraseña:
 * - POST /api/password-recovery/request - Solicitar reset
 * - GET /api/password-recovery/verify-token - Verificar token
 * - POST /api/password-recovery/verify-code - Verificar código
 * - POST /api/password-recovery/reset - Cambiar contraseña
 * - POST /api/password-recovery/validate-password - Validar fortaleza
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const passwordRecoveryController = require('../controllers/passwordRecoveryController');
const {
  validateRequestReset,
  validateVerifyToken,
  validateVerifyCode,
  validateResetPassword,
  validatePasswordStrength
} = require('../validators/passwordRecoveryValidator');

// ========================================
// Rate Limiters
// ========================================

/**
 * Limiter para solicitud de reset (estricto)
 * 5 solicitudes por 15 minutos por IP
 */
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Por favor espera 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use default keyGenerator for proper IPv6 handling
  validate: { xForwardedForHeader: false }
});

/**
 * Limiter para verificación (moderado)
 * 10 intentos por 15 minutos por IP
 */
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de verificación. Por favor espera.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Limiter para reset de contraseña
 * 5 intentos por 15 minutos por IP
 */
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de cambio de contraseña.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========================================
// Rutas
// ========================================

/**
 * @swagger
 * /api/password-recovery/request:
 *   post:
 *     tags: [Password Recovery]
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con instrucciones para restablecer la contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *     responses:
 *       200:
 *         description: Solicitud procesada (siempre retorna éxito por seguridad)
 *       429:
 *         description: Rate limit excedido
 */
router.post('/request',
  requestLimiter,
  validateRequestReset,
  passwordRecoveryController.requestReset
);

/**
 * @swagger
 * /api/password-recovery/verify-token:
 *   get:
 *     tags: [Password Recovery]
 *     summary: Verificar token de reset
 *     description: Verifica si un token de recuperación es válido
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Resultado de verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 valid:
 *                   type: boolean
 *                 email:
 *                   type: string
 *                 reason:
 *                   type: string
 */
router.get('/verify-token',
  verifyLimiter,
  validateVerifyToken,
  passwordRecoveryController.verifyToken
);

/**
 * @swagger
 * /api/password-recovery/verify-code:
 *   post:
 *     tags: [Password Recovery]
 *     summary: Verificar código de 6 dígitos
 *     description: Verifica el código enviado por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Código válido, retorna token para reset
 *       400:
 *         description: Código inválido
 */
router.post('/verify-code',
  verifyLimiter,
  validateVerifyCode,
  passwordRecoveryController.verifyCode
);

/**
 * @swagger
 * /api/password-recovery/reset:
 *   post:
 *     tags: [Password Recovery]
 *     summary: Cambiar contraseña
 *     description: Cambia la contraseña usando un token válido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 format: uuid
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: Debe incluir mayúscula, minúscula y número
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Error de validación o token inválido
 */
router.post('/reset',
  resetLimiter,
  validateResetPassword,
  passwordRecoveryController.resetPassword
);

/**
 * @swagger
 * /api/password-recovery/validate-password:
 *   post:
 *     tags: [Password Recovery]
 *     summary: Validar fortaleza de contraseña
 *     description: Verifica si una contraseña cumple los requisitos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 strength:
 *                   type: string
 *                   enum: [weak, medium, strong]
 *                 requirements:
 *                   type: object
 */
router.post('/validate-password',
  validatePasswordStrength,
  passwordRecoveryController.validatePassword
);

module.exports = router;
