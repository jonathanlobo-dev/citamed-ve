/**
 * Patient Registration Validators - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Validaciones para registro de pacientes en 4 pasos:
 * - Paso 1: Credenciales (email, password, términos)
 * - Paso 2: Datos Personales (nombre, cédula, fecha nacimiento, género, teléfono)
 * - Paso 3: Información Médica (alergias, condiciones, sangre, contacto emergencia)
 * - Paso 4: Confirmación
 */

const { body } = require('express-validator');
const { PATTERNS } = require('./authValidator');

/**
 * Tipos de sangre válidos
 */
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'];

/**
 * Géneros válidos
 */
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

/**
 * Paso 1: Credenciales
 * - email (requerido, único)
 * - password (requerido, 8+ chars con mayúscula, minúscula, número)
 * - confirmPassword (requerido, debe coincidir)
 * - acceptTerms (requerido, debe ser true)
 */
const patientStep1Validator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email no puede exceder 255 caracteres'),

  body('password')
    .notEmpty()
    .withMessage('Contraseña es requerida')
    .isLength({ min: 8, max: 128 })
    .withMessage('Contraseña debe tener entre 8 y 128 caracteres')
    .matches(PATTERNS.password)
    .withMessage('Contraseña debe contener al menos una mayúscula, una minúscula y un número'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Confirmar contraseña es requerido')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),

  body('acceptTerms')
    .notEmpty()
    .withMessage('Debe aceptar los términos y condiciones')
    .isBoolean()
    .withMessage('acceptTerms debe ser un valor booleano')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Debe aceptar los términos y condiciones');
      }
      return true;
    })
];

/**
 * Paso 2: Datos Personales
 * - firstName (requerido)
 * - lastName (requerido)
 * - identificationNumber (requerido, cédula venezolana)
 * - dateOfBirth (requerido)
 * - gender (requerido)
 * - phone (requerido, formato venezolano)
 */
const patientStep2Validator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres')
    .matches(PATTERNS.nameOnly)
    .withMessage('Nombre solo puede contener letras y espacios'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Apellido es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('Apellido debe tener entre 2 y 100 caracteres')
    .matches(PATTERNS.nameOnly)
    .withMessage('Apellido solo puede contener letras y espacios'),

  body('identificationNumber')
    .trim()
    .notEmpty()
    .withMessage('Cédula es requerida')
    .matches(PATTERNS.cedulaVE)
    .withMessage('Cédula debe tener formato venezolano válido (V-12345678 o E-12345678)'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Fecha de nacimiento es requerida')
    .isISO8601()
    .withMessage('Fecha de nacimiento debe ser una fecha válida')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const minAge = 18;
      const maxAge = 120;

      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < minAge) {
        throw new Error('Debe ser mayor de 18 años para registrarse');
      }
      if (age > maxAge) {
        throw new Error('Fecha de nacimiento inválida');
      }
      if (birthDate > today) {
        throw new Error('Fecha de nacimiento no puede ser en el futuro');
      }
      return true;
    }),

  body('gender')
    .notEmpty()
    .withMessage('Género es requerido')
    .isIn(GENDERS)
    .withMessage(`Género debe ser uno de: ${GENDERS.join(', ')}`),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Teléfono es requerido')
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono debe ser un número venezolano válido (0412-1234567)')
];

/**
 * Paso 3: Información Médica
 * - allergies (opcional, texto)
 * - chronicConditions (opcional, texto)
 * - bloodType (requerido)
 * - emergencyContactName (requerido)
 * - emergencyContactPhone (requerido)
 */
const patientStep3Validator = [
  body('allergies')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Alergias no puede exceder 2000 caracteres'),

  body('chronicConditions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Condiciones médicas no puede exceder 2000 caracteres'),

  body('bloodType')
    .notEmpty()
    .withMessage('Tipo de sangre es requerido')
    .isIn(BLOOD_TYPES)
    .withMessage(`Tipo de sangre debe ser uno de: ${BLOOD_TYPES.join(', ')}`),

  body('emergencyContactName')
    .trim()
    .notEmpty()
    .withMessage('Nombre del contacto de emergencia es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nombre del contacto debe tener entre 2 y 200 caracteres'),

  body('emergencyContactPhone')
    .trim()
    .notEmpty()
    .withMessage('Teléfono del contacto de emergencia es requerido')
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono del contacto debe ser un número venezolano válido')
];

/**
 * Paso 4: Confirmación
 * - confirmInfo (requerido, debe ser true)
 */
const patientStep4Validator = [
  body('confirmInfo')
    .notEmpty()
    .withMessage('Debe confirmar que la información es correcta')
    .isBoolean()
    .withMessage('confirmInfo debe ser un valor booleano')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Debe confirmar que la información es correcta');
      }
      return true;
    })
];

/**
 * Validador completo para registro de paciente
 * Combina todos los pasos para validación del registro final
 */
const patientRegisterValidator = [
  // Paso 1: Credenciales
  ...patientStep1Validator,

  // Paso 2: Datos Personales
  ...patientStep2Validator,

  // Paso 3: Información Médica (allergies y chronicConditions son opcionales en validación completa)
  body('allergies')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Alergias no puede exceder 2000 caracteres'),

  body('chronicConditions')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Condiciones médicas no puede exceder 2000 caracteres'),

  body('bloodType')
    .notEmpty()
    .withMessage('Tipo de sangre es requerido')
    .isIn(BLOOD_TYPES)
    .withMessage(`Tipo de sangre debe ser uno de: ${BLOOD_TYPES.join(', ')}`),

  body('emergencyContactName')
    .trim()
    .notEmpty()
    .withMessage('Nombre del contacto de emergencia es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nombre del contacto debe tener entre 2 y 200 caracteres'),

  body('emergencyContactPhone')
    .trim()
    .notEmpty()
    .withMessage('Teléfono del contacto de emergencia es requerido')
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono del contacto debe ser un número venezolano válido'),

  // Paso 4: Confirmación (opcional en validación por paso)
  body('confirmInfo')
    .optional()
    .isBoolean()
    .withMessage('confirmInfo debe ser un valor booleano')
];

module.exports = {
  patientStep1Validator,
  patientStep2Validator,
  patientStep3Validator,
  patientStep4Validator,
  patientRegisterValidator,
  BLOOD_TYPES,
  GENDERS
};
