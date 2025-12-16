/**
 * Provider Registration Validators - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Validaciones para registro de proveedores en 5 pasos:
 * - Paso 1: Credenciales
 * - Paso 2: Datos de la Empresa
 * - Paso 3: Categoría y Servicios
 * - Paso 4: Ubicación y Cobertura
 * - Paso 5: Confirmación
 */

const { body } = require('express-validator');
const { PATTERNS } = require('./authValidator');

/**
 * Tipos de proveedor válidos
 */
const PROVIDER_TYPES = [
  'Farmacia',
  'Laboratorio clínico',
  'Laboratorio',
  'Insumos médicos',
  'Servicios de salud',
  'Clínica',
  'Hospital',
  'Centro de Diagnóstico',
  'Otro'
];

/**
 * Regex para RIF venezolano
 * Formato: J-12345678-9 o G-12345678-9 o V-12345678-9
 */
const RIF_PATTERN = /^[JGVEP]-?\d{8,9}-?\d?$/i;

/**
 * Paso 1: Credenciales
 */
const providerStep1Validator = [
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
 * Paso 2: Datos de la Empresa
 */
const providerStep2Validator = [
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Nombre comercial es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre comercial debe tener entre 2 y 255 caracteres'),

  body('rif')
    .trim()
    .notEmpty()
    .withMessage('RIF es requerido')
    .matches(RIF_PATTERN)
    .withMessage('RIF debe tener formato venezolano válido (J-12345678-9)'),

  body('legalName')
    .trim()
    .notEmpty()
    .withMessage('Razón social es requerida')
    .isLength({ min: 2, max: 255 })
    .withMessage('Razón social debe tener entre 2 y 255 caracteres'),

  body('commercialPhone')
    .trim()
    .notEmpty()
    .withMessage('Teléfono comercial es requerido')
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono debe ser un número venezolano válido'),

  body('contactEmail')
    .trim()
    .notEmpty()
    .withMessage('Email de contacto es requerido')
    .isEmail()
    .withMessage('Email de contacto debe ser válido'),

  body('legalRepresentative')
    .trim()
    .notEmpty()
    .withMessage('Nombre del representante legal es requerido')
    .isLength({ min: 2, max: 255 })
    .withMessage('Nombre del representante debe tener entre 2 y 255 caracteres')
];

/**
 * Paso 3: Categoría y Servicios
 */
const providerStep3Validator = [
  body('providerType')
    .notEmpty()
    .withMessage('Tipo de proveedor es requerido')
    .isIn(PROVIDER_TYPES)
    .withMessage(`Tipo de proveedor debe ser uno de: ${PROVIDER_TYPES.join(', ')}`),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Descripción no puede exceder 2000 caracteres'),

  body('mainProducts')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Productos principales no puede exceder 2000 caracteres')
];

/**
 * Paso 4: Ubicación y Cobertura
 */
const providerStep4Validator = [
  body('mainAddress')
    .trim()
    .notEmpty()
    .withMessage('Dirección principal es requerida')
    .isLength({ max: 500 })
    .withMessage('Dirección no puede exceder 500 caracteres'),

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

  body('coverageZones')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Zonas de cobertura no puede exceder 2000 caracteres'),

  body('hasMultipleLocations')
    .optional()
    .isBoolean()
    .withMessage('hasMultipleLocations debe ser un valor booleano'),

  body('locationCount')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Cantidad de sedes debe ser un número entre 1 y 1000')
];

/**
 * Paso 5: Confirmación
 */
const providerStep5Validator = [
  body('confirmInfo')
    .notEmpty()
    .withMessage('Debe confirmar que la información es correcta')
    .isBoolean()
    .withMessage('confirmInfo debe ser un valor booleano')
];

/**
 * Validador completo para registro de proveedor
 */
const providerRegisterValidator = [
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

  // Paso 2: Datos de la Empresa
  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Nombre comercial es requerido')
    .isLength({ min: 2, max: 255 }),

  body('rif')
    .trim()
    .notEmpty()
    .withMessage('RIF es requerido')
    .matches(RIF_PATTERN)
    .withMessage('RIF debe tener formato válido'),

  body('legalName')
    .trim()
    .notEmpty()
    .withMessage('Razón social es requerida'),

  body('commercialPhone')
    .optional()
    .trim()
    .matches(PATTERNS.phoneVE)
    .withMessage('Teléfono debe ser formato venezolano'),

  body('legalRepresentative')
    .optional()
    .trim()
    .isLength({ max: 255 }),

  // Paso 3: Categoría y Servicios
  body('providerType')
    .notEmpty()
    .withMessage('Tipo de proveedor es requerido')
    .isIn(PROVIDER_TYPES),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }),

  body('mainProducts')
    .optional()
    .trim()
    .isLength({ max: 2000 }),

  // Paso 4: Ubicación
  body('mainAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 }),

  body('coverageZones')
    .optional()
    .trim()
    .isLength({ max: 2000 }),

  body('hasMultipleLocations')
    .optional()
    .isBoolean(),

  body('locationCount')
    .optional()
    .isInt({ min: 1, max: 1000 })
];

module.exports = {
  providerStep1Validator,
  providerStep2Validator,
  providerStep3Validator,
  providerStep4Validator,
  providerStep5Validator,
  providerRegisterValidator,
  PROVIDER_TYPES,
  RIF_PATTERN
};
