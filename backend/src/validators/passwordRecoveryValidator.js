/**
 * Password Recovery Validators - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Validadores para endpoints de recuperación de contraseña
 */

const { body, query, validationResult } = require('express-validator');

// Configuración
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;

// Regex para contraseña fuerte
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Validador para solicitud de reset
 */
const validateRequestReset = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Ingresa un email válido')
    .normalizeEmail(),

  handleValidationErrors
];

/**
 * Validador para verificar token
 */
const validateVerifyToken = [
  query('token')
    .trim()
    .notEmpty()
    .withMessage('El token es requerido')
    .isUUID(4)
    .withMessage('Token inválido'),

  handleValidationErrors
];

/**
 * Validador para verificar código
 */
const validateVerifyCode = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Ingresa un email válido')
    .normalizeEmail(),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ min: 6, max: 6 })
    .withMessage('El código debe tener 6 dígitos')
    .isNumeric()
    .withMessage('El código debe contener solo números'),

  handleValidationErrors
];

/**
 * Validador para reset de contraseña
 */
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('El token es requerido')
    .isUUID(4)
    .withMessage('Token inválido'),

  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .matches(/[a-z]/)
    .withMessage('La contraseña debe incluir al menos una letra minúscula')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe incluir al menos una letra mayúscula')
    .matches(/\d/)
    .withMessage('La contraseña debe incluir al menos un número'),

  body('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('La confirmación de contraseña es requerida')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  handleValidationErrors
];

/**
 * Validador para validar contraseña
 */
const validatePasswordStrength = [
  body('password')
    .trim()
    .notEmpty()
    .withMessage('La contraseña es requerida'),

  handleValidationErrors
];

module.exports = {
  validateRequestReset,
  validateVerifyToken,
  validateVerifyCode,
  validateResetPassword,
  validatePasswordStrength,
  handleValidationErrors
};
