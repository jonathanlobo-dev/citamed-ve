/**
 * Two-Factor Authentication Validators - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Validadores para endpoints de 2FA
 */

const { body, query, validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const twoFactorValidator = {
  /**
   * Validación para activar 2FA
   */
  validateEnable: [
    body('secret')
      .trim()
      .notEmpty().withMessage('Secret es requerido')
      .isLength({ min: 16 }).withMessage('Secret debe tener al menos 16 caracteres'),

    body('token')
      .trim()
      .notEmpty().withMessage('Código es requerido')
      .isLength({ min: 6, max: 6 }).withMessage('Código debe tener 6 dígitos')
      .isNumeric().withMessage('Código debe ser numérico'),

    handleValidationErrors
  ],

  /**
   * Validación para verificar código 2FA
   */
  validateVerify: [
    body('userId')
      .notEmpty().withMessage('userId es requerido')
      .isInt({ min: 1 }).withMessage('userId debe ser un número válido'),

    body('token')
      .trim()
      .notEmpty().withMessage('Código es requerido')
      .isLength({ min: 6, max: 8 }).withMessage('Código debe tener 6-8 caracteres')
      .matches(/^[A-Za-z0-9]+$/).withMessage('Código solo puede contener letras y números'),

    handleValidationErrors
  ],

  /**
   * Validación para desactivar 2FA
   */
  validateDisable: [
    body('password')
      .notEmpty().withMessage('Contraseña es requerida')
      .isLength({ min: 1 }).withMessage('Contraseña es requerida'),

    handleValidationErrors
  ],

  /**
   * Validación para regenerar backup codes
   */
  validateRegenerateBackupCodes: [
    body('password')
      .notEmpty().withMessage('Contraseña es requerida')
      .isLength({ min: 1 }).withMessage('Contraseña es requerida'),

    handleValidationErrors
  ],

  /**
   * Validación para historial
   */
  validateGetHistory: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit debe ser entre 1 y 100'),

    handleValidationErrors
  ]
};

module.exports = twoFactorValidator;
