/**
 * Authentication Validators - CITAMED.VE
 *
 * Validaciones para endpoints de autenticación:
 * - Register
 * - Login
 * - Password reset
 */

const { body } = require('express-validator');

/**
 * Roles permitidos en el sistema
 */
const ALLOWED_ROLES = ['patient', 'doctor', 'provider', 'admin'];

/**
 * Regex para validaciones
 */
const PATTERNS = {
  // Password: min 8 chars, mayúscula, minúscula, número (cualquier carácter adicional permitido)
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  // Teléfono venezolano: +58 o 04XX
  phoneVE: /^(\+58|0)?(412|414|416|424|426|212|251|261|281|241)[0-9]{7}$/,
  // Cédula venezolana: V o E seguido de números
  cedulaVE: /^[VE]-?\d{6,9}$/i,
  // Solo letras y espacios (nombres)
  nameOnly: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
};

/**
 * Validator para registro de usuarios
 */
const registerValidator = [
  // Email
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email no puede exceder 255 caracteres'),

  // Password
  body('password')
    .notEmpty()
    .withMessage('Password es requerido')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password debe tener entre 8 y 128 caracteres')
    .matches(PATTERNS.password)
    .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número'),

  // Confirmar password (opcional)
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  // Role
  body('role')
    .optional()
    .isIn(ALLOWED_ROLES)
    .withMessage(`Role debe ser uno de: ${ALLOWED_ROLES.join(', ')}`),

  // Nombre (opcional pero si existe, validar)
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(PATTERNS.nameOnly)
    .withMessage('Nombre solo puede contener letras'),

  // Apellido (opcional pero si existe, validar)
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(PATTERNS.nameOnly)
    .withMessage('Apellido solo puede contener letras'),

  // Teléfono (opcional)
  body('phone')
    .optional()
    .trim()
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono debe ser un número venezolano válido')
];

/**
 * Validator para login
 */
const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password es requerido')
];

/**
 * Validator para solicitud de reset de password
 */
const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail()
];

/**
 * Validator para reset de password
 */
const resetPasswordValidator = [
  body('token')
    .notEmpty()
    .withMessage('Token es requerido')
    .isLength({ min: 20 })
    .withMessage('Token inválido'),

  body('password')
    .notEmpty()
    .withMessage('Password es requerido')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password debe tener entre 8 y 128 caracteres')
    .matches(PATTERNS.password)
    .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirmar password es requerido')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    })
];

/**
 * Validator para cambio de password (usuario autenticado)
 */
const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Password actual es requerido'),

  body('newPassword')
    .notEmpty()
    .withMessage('Nuevo password es requerido')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password debe tener entre 8 y 128 caracteres')
    .matches(PATTERNS.password)
    .withMessage('Password debe contener al menos una mayúscula, una minúscula y un número')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('El nuevo password debe ser diferente al actual');
      }
      return true;
    })
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  ALLOWED_ROLES,
  PATTERNS
};
