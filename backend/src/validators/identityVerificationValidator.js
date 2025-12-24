// src/validators/identityVerificationValidator.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Validadores para endpoints de verificación de email y teléfono

const { body, param } = require('express-validator');

/**
 * Validadores de Verificación de Identidad
 */
const identityVerificationValidator = {
  /**
   * Validar envío de verificación de email
   * POST /api/verification/send-email
   */
  validateSendEmail: [
    body('userId')
      .notEmpty()
      .withMessage('userId es requerido')
      .isInt({ min: 1 })
      .withMessage('userId debe ser un número entero positivo')
      .toInt()
  ],

  /**
   * Validar verificación de email
   * POST /api/verification/verify-email
   */
  validateVerifyEmail: [
    body('token')
      .notEmpty()
      .withMessage('Token es requerido')
      .isUUID(4)
      .withMessage('Token debe ser un UUID válido'),
    body('code')
      .notEmpty()
      .withMessage('Código es requerido')
      .isLength({ min: 6, max: 6 })
      .withMessage('Código debe tener exactamente 6 dígitos')
      .matches(/^\d{6}$/)
      .withMessage('Código debe contener solo números')
  ],

  /**
   * Validar reenvío de verificación de email
   * POST /api/verification/resend-email
   */
  validateResendEmail: [
    body('userId')
      .notEmpty()
      .withMessage('userId es requerido')
      .isInt({ min: 1 })
      .withMessage('userId debe ser un número entero positivo')
      .toInt()
  ],

  /**
   * Validar envío de verificación de teléfono
   * POST /api/verification/send-phone
   */
  validateSendPhone: [
    body('userId')
      .notEmpty()
      .withMessage('userId es requerido')
      .isInt({ min: 1 })
      .withMessage('userId debe ser un número entero positivo')
      .toInt(),
    body('phoneNumber')
      .notEmpty()
      .withMessage('Número de teléfono es requerido')
      .custom((value) => {
        // Limpiar caracteres no numéricos excepto +
        const cleaned = value.replace(/[^\d+]/g, '');

        // Validar formatos venezolanos aceptados
        // +58XXXXXXXXXX (13 chars)
        // 58XXXXXXXXXX (12 chars)
        // 0XXXXXXXXXX (11 chars)
        // XXXXXXXXXX (10 chars)

        if (cleaned.startsWith('+58') && cleaned.length === 13) return true;
        if (cleaned.startsWith('58') && cleaned.length === 12) return true;
        if (cleaned.startsWith('0') && cleaned.length === 11) return true;
        if (cleaned.length === 10) return true;

        throw new Error('Formato de teléfono inválido. Use formato venezolano (+58XXX... o 04XX...)');
      })
  ],

  /**
   * Validar verificación de teléfono
   * POST /api/verification/verify-phone
   */
  validateVerifyPhone: [
    body('token')
      .notEmpty()
      .withMessage('Token es requerido')
      .isUUID(4)
      .withMessage('Token debe ser un UUID válido'),
    body('code')
      .notEmpty()
      .withMessage('Código es requerido')
      .isLength({ min: 6, max: 6 })
      .withMessage('Código debe tener exactamente 6 dígitos')
      .matches(/^\d{6}$/)
      .withMessage('Código debe contener solo números')
  ],

  /**
   * Validar reenvío de verificación de teléfono
   * POST /api/verification/resend-phone
   */
  validateResendPhone: [
    body('userId')
      .notEmpty()
      .withMessage('userId es requerido')
      .isInt({ min: 1 })
      .withMessage('userId debe ser un número entero positivo')
      .toInt(),
    body('phoneNumber')
      .notEmpty()
      .withMessage('Número de teléfono es requerido')
      .custom((value) => {
        const cleaned = value.replace(/[^\d+]/g, '');
        if (cleaned.startsWith('+58') && cleaned.length === 13) return true;
        if (cleaned.startsWith('58') && cleaned.length === 12) return true;
        if (cleaned.startsWith('0') && cleaned.length === 11) return true;
        if (cleaned.length === 10) return true;
        throw new Error('Formato de teléfono inválido');
      })
  ],

  /**
   * Validar obtener estado de verificación
   * GET /api/verification/status/:userId
   */
  validateGetStatus: [
    param('userId')
      .notEmpty()
      .withMessage('userId es requerido')
      .isInt({ min: 1 })
      .withMessage('userId debe ser un número entero positivo')
      .toInt()
  ],

  /**
   * Validar verificación de token
   * GET /api/verification/check-token/:token
   */
  validateCheckToken: [
    param('token')
      .notEmpty()
      .withMessage('Token es requerido')
      .isUUID(4)
      .withMessage('Token debe ser un UUID válido')
  ]
};

module.exports = identityVerificationValidator;
