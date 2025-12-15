/**
 * Doctor Validators - CITAMED.VE
 *
 * Validaciones para endpoints de médicos:
 * - Búsqueda
 * - Perfil
 * - Actualización
 */

const { body, query, param } = require('express-validator');

/**
 * Ciudades principales de Venezuela
 */
const VENEZUELAN_CITIES = [
  'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay',
  'Ciudad Guayana', 'Barcelona', 'Maturín', 'Cumaná', 'San Cristóbal',
  'Mérida', 'Puerto La Cruz', 'Barinas', 'Guanare', 'Punto Fijo',
  'Los Teques', 'Guarenas', 'Cabimas', 'Coro', 'Acarigua'
];

/**
 * Estados de Venezuela
 */
const VENEZUELAN_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
  'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
  'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
  'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

/**
 * Idiomas soportados
 */
const SUPPORTED_LANGUAGES = ['Español', 'English', 'Português', 'Italiano', 'Français'];

/**
 * Validator para búsqueda de médicos
 */
const searchDoctorsValidator = [
  query('specialty')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Especialidad no puede exceder 100 caracteres'),

  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Ciudad no puede exceder 100 caracteres'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Búsqueda no puede exceder 100 caracteres')
    .escape(), // Escapar caracteres especiales

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Página debe ser un número entre 1 y 1000')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100')
    .toInt(),

  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating mínimo debe ser entre 0 y 5')
    .toFloat(),

  query('telemedicine')
    .optional()
    .isBoolean()
    .withMessage('Telemedicina debe ser true o false')
    .toBoolean()
];

/**
 * Validator para obtener doctor por ID
 */
const getDoctorByIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('ID es requerido')
    .isInt({ min: 1 })
    .withMessage('ID debe ser un número positivo')
    .toInt()
];

/**
 * Validator para actualizar perfil de médico
 */
const updateDoctorProfileValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Apellido debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Biografía no puede exceder 1000 caracteres'),

  body('specialtyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de especialidad debe ser un número positivo')
    .toInt(),

  body('subSpecialty')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sub-especialidad no puede exceder 100 caracteres'),

  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Años de experiencia debe ser entre 0 y 60')
    .toInt(),

  body('consultationFee')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Tarifa de consulta debe ser entre 0 y 10000')
    .toFloat(),

  body('followUpFee')
    .optional()
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Tarifa de seguimiento debe ser entre 0 y 10000')
    .toFloat(),

  body('consultationDuration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('Duración de consulta debe ser entre 15 y 120 minutos')
    .toInt(),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Ciudad no puede exceder 100 caracteres'),

  body('state')
    .optional()
    .trim()
    .isIn(VENEZUELAN_STATES)
    .withMessage('Estado debe ser un estado venezolano válido'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Dirección no puede exceder 255 caracteres'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(\+58|0)?(412|414|416|424|426|212|251|261|281|241)[0-9]{7}$/)
    .withMessage('Teléfono debe ser un número venezolano válido'),

  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Número de licencia debe tener entre 3 y 50 caracteres'),

  body('languages')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Máximo 5 idiomas permitidos'),

  body('languages.*')
    .optional()
    .isIn(SUPPORTED_LANGUAGES)
    .withMessage(`Idioma debe ser uno de: ${SUPPORTED_LANGUAGES.join(', ')}`),

  body('telemedicineEnabled')
    .optional()
    .isBoolean()
    .withMessage('Telemedicina debe ser true o false'),

  body('homeVisitsEnabled')
    .optional()
    .isBoolean()
    .withMessage('Visitas a domicilio debe ser true o false'),

  body('acceptingNewPatients')
    .optional()
    .isBoolean()
    .withMessage('Aceptando nuevos pacientes debe ser true o false')
];

/**
 * Validator para horarios de trabajo
 */
const workingHoursValidator = [
  body('workingHours')
    .optional()
    .isObject()
    .withMessage('Horarios debe ser un objeto'),

  body('workingHours.*.start')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de inicio debe estar en formato HH:MM'),

  body('workingHours.*.end')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Hora de fin debe estar en formato HH:MM')
];

module.exports = {
  searchDoctorsValidator,
  getDoctorByIdValidator,
  updateDoctorProfileValidator,
  workingHoursValidator,
  VENEZUELAN_CITIES,
  VENEZUELAN_STATES,
  SUPPORTED_LANGUAGES
};
