/**
 * Doctor Registration Validators - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Validaciones para registro de médicos en 6 pasos:
 * - Paso 1: Credenciales
 * - Paso 2: Datos Personales
 * - Paso 3: Datos Profesionales
 * - Paso 4: Ubicación y Horarios
 * - Paso 5: Precios y Servicios
 * - Paso 6: Confirmación
 */

const { body } = require('express-validator');
const { PATTERNS } = require('./authValidator');
const { GENDERS } = require('./patientValidator');

/**
 * Días de la semana válidos
 */
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Paso 1: Credenciales
 */
const doctorStep1Validator = [
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
];

/**
 * Paso 2: Datos Personales
 */
const doctorStep2Validator = [
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
    .withMessage('Cédula debe tener formato venezolano válido'),

  body('dateOfBirth')
    .notEmpty()
    .withMessage('Fecha de nacimiento es requerida')
    .isISO8601()
    .withMessage('Fecha de nacimiento debe ser una fecha válida'),

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
    .withMessage('Teléfono debe ser un número venezolano válido')
];

/**
 * Paso 3: Datos Profesionales
 */
const doctorStep3Validator = [
  body('mppsNumber')
    .trim()
    .notEmpty()
    .withMessage('Número MPPS es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('Número MPPS debe tener entre 3 y 50 caracteres'),

  body('specialtyId')
    .notEmpty()
    .withMessage('Especialidad es requerida')
    .isInt({ min: 1 })
    .withMessage('Especialidad debe ser un ID válido'),

  body('university')
    .trim()
    .notEmpty()
    .withMessage('Universidad es requerida')
    .isLength({ min: 3, max: 200 })
    .withMessage('Universidad debe tener entre 3 y 200 caracteres'),

  body('graduationYear')
    .notEmpty()
    .withMessage('Año de graduación es requerido')
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Año de graduación debe ser un año válido')
];

/**
 * Paso 4: Ubicación y Horarios
 */
const doctorStep4Validator = [
  body('consultationAddress')
    .trim()
    .notEmpty()
    .withMessage('Dirección del consultorio es requerida')
    .isLength({ max: 300 })
    .withMessage('Dirección no puede exceder 300 caracteres'),

  body('city')
    .trim()
    .notEmpty()
    .withMessage('Ciudad es requerida')
    .isLength({ max: 100 })
    .withMessage('Ciudad no puede exceder 100 caracteres'),

  body('state')
    .trim()
    .notEmpty()
    .withMessage('Estado es requerido')
    .isLength({ max: 100 })
    .withMessage('Estado no puede exceder 100 caracteres'),

  body('latitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud debe ser un valor válido'),

  body('longitude')
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud debe ser un valor válido'),

  body('availableDays')
    .notEmpty()
    .withMessage('Días disponibles son requeridos')
    .isArray({ min: 1 })
    .withMessage('Debe seleccionar al menos un día')
    .custom((days) => {
      for (const day of days) {
        if (!WEEKDAYS.includes(day)) {
          throw new Error(`Día inválido: ${day}`);
        }
      }
      return true;
    }),

  body('startTime')
    .notEmpty()
    .withMessage('Hora de inicio es requerida')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio debe tener formato HH:MM'),

  body('endTime')
    .notEmpty()
    .withMessage('Hora de fin es requerida')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin debe tener formato HH:MM'),

  body('consultationDuration')
    .optional()
    .isInt({ min: 10, max: 120 })
    .withMessage('Duración de consulta debe ser entre 10 y 120 minutos')
];

/**
 * Paso 5: Precios y Servicios
 */
const doctorStep5Validator = [
  body('priceConsultation')
    .notEmpty()
    .withMessage('Precio de consulta es requerido')
    .isFloat({ min: 0 })
    .withMessage('Precio de consulta debe ser un número positivo'),

  body('priceTeleconsultation')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Precio de teleconsulta debe ser un número positivo'),

  body('acceptsHomeVisits')
    .optional()
    .isBoolean()
    .withMessage('acceptsHomeVisits debe ser un valor booleano'),

  body('priceHomeVisit')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Precio de visita a domicilio debe ser un número positivo'),

  body('acceptsInsurance')
    .optional()
    .isBoolean()
    .withMessage('acceptsInsurance debe ser un valor booleano'),

  body('acceptedInsurances')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Lista de seguros no puede exceder 2000 caracteres')
];

/**
 * Paso 6: Confirmación
 */
const doctorStep6Validator = [
  body('confirmInfo')
    .notEmpty()
    .withMessage('Debe confirmar que la información es correcta')
    .isBoolean()
    .withMessage('confirmInfo debe ser un valor booleano')
];

/**
 * Validador completo para registro de médico
 */
const doctorRegisterValidator = [
  // Paso 1: Credenciales
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email es requerido')
    .isEmail()
    .withMessage('Email debe ser válido')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('Contraseña debe tener mínimo 8 caracteres')
    .matches(PATTERNS.password)
    .withMessage('Contraseña debe contener mayúscula, minúscula y número'),

  // Paso 2: Datos Personales
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Nombre es requerido'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Apellido es requerido'),

  body('phone')
    .optional()
    .trim()
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono debe ser formato venezolano'),

  // Paso 3: Datos Profesionales
  body('mppsNumber')
    .trim()
    .notEmpty()
    .withMessage('Número MPPS es requerido'),

  body('specialtyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Especialidad debe ser válida'),

  body('university')
    .optional()
    .trim()
    .isLength({ max: 200 }),

  body('graduationYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() }),

  // Paso 4: Ubicación y Horarios
  body('consultationAddress')
    .optional()
    .trim()
    .isLength({ max: 300 }),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('availableDays')
    .optional()
    .isArray(),

  body('startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),

  body('endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),

  // Paso 5: Precios
  body('priceConsultation')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }),

  body('priceTeleconsultation')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }),

  body('priceHomeVisit')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 }),

  body('acceptsHomeVisits')
    .optional()
    .isBoolean(),

  body('acceptsInsurance')
    .optional()
    .isBoolean()
];

module.exports = {
  doctorStep1Validator,
  doctorStep2Validator,
  doctorStep3Validator,
  doctorStep4Validator,
  doctorStep5Validator,
  doctorStep6Validator,
  doctorRegisterValidator,
  WEEKDAYS
};
