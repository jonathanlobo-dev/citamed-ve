/**
 * Doctor Profile Validators - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 */

const { body, param, query, validationResult } = require('express-validator');

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

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE PARÁMETROS
// ═══════════════════════════════════════════════════════════════

const validateDoctorId = [
  param('doctorId')
    .isInt({ min: 1 })
    .withMessage('ID de doctor inválido'),
  handleValidationErrors
];

const validateEducationId = [
  param('educationId')
    .isInt({ min: 1 })
    .withMessage('ID de educación inválido'),
  handleValidationErrors
];

const validateExperienceId = [
  param('experienceId')
    .isInt({ min: 1 })
    .withMessage('ID de experiencia inválido'),
  handleValidationErrors
];

const validateSpecialtyId = [
  param('specialtyId')
    .isInt({ min: 1 })
    .withMessage('ID de especialidad inválido'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE PERFIL
// ═══════════════════════════════════════════════════════════════

const validateUpdateProfile = [
  body('bio')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La biografía no puede exceder 2000 caracteres'),
  body('experienceYears')
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage('Los años de experiencia deben estar entre 0 y 70'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa de consulta debe ser un número positivo'),
  body('followUpFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa de seguimiento debe ser un número positivo'),
  body('priceTeleconsultation')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de teleconsulta debe ser un número positivo'),
  body('priceHomeVisit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio de visita a domicilio debe ser un número positivo'),
  body('acceptsInsurance')
    .optional()
    .isBoolean()
    .withMessage('acceptsInsurance debe ser booleano'),
  body('insuranceProviders')
    .optional()
    .isArray()
    .withMessage('insuranceProviders debe ser un array'),
  body('consultationDuration')
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage('La duración debe estar entre 5 y 180 minutos'),
  body('languages')
    .optional()
    .isArray()
    .withMessage('languages debe ser un array'),
  body('availableForEmergencies')
    .optional()
    .isBoolean()
    .withMessage('availableForEmergencies debe ser booleano'),
  body('telemedicineEnabled')
    .optional()
    .isBoolean()
    .withMessage('telemedicineEnabled debe ser booleano'),
  body('homeVisitsEnabled')
    .optional()
    .isBoolean()
    .withMessage('homeVisitsEnabled debe ser booleano'),
  body('acceptingNewPatients')
    .optional()
    .isBoolean()
    .withMessage('acceptingNewPatients debe ser booleano'),
  body('averageWaitTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo de espera debe ser un número positivo'),
  body('websiteUrl')
    .optional()
    .isURL()
    .withMessage('URL del sitio web inválida'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE UBICACIÓN
// ═══════════════════════════════════════════════════════════════

const validateUpdateLocation = [
  body('clinicName')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El nombre del consultorio no puede exceder 200 caracteres'),
  body('clinicAddress')
    .optional()
    .isLength({ max: 300 })
    .withMessage('La dirección no puede exceder 300 caracteres'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede exceder 100 caracteres'),
  body('state')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El estado no puede exceder 100 caracteres'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida. Debe estar entre -90 y 90'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida. Debe estar entre -180 y 180'),
  body('phoneNumber')
    .optional()
    .matches(/^[+]?[\d\s\-()]{7,20}$/)
    .withMessage('Número de teléfono inválido'),
  body('whatsappNumber')
    .optional()
    .matches(/^[+]?[\d\s\-()]{7,20}$/)
    .withMessage('Número de WhatsApp inválido'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE ESPECIALIDAD
// ═══════════════════════════════════════════════════════════════

const validateAddSpecialty = [
  body('specialtyId')
    .notEmpty()
    .withMessage('Se requiere ID de especialidad')
    .isInt({ min: 1 })
    .withMessage('ID de especialidad inválido'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary debe ser booleano'),
  body('certificationDate')
    .optional()
    .isDate()
    .withMessage('Fecha de certificación inválida'),
  body('certificationNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El número de certificación no puede exceder 100 caracteres'),
  body('certificationInstitution')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La institución no puede exceder 200 caracteres'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE EDUCACIÓN
// ═══════════════════════════════════════════════════════════════

const validateAddEducation = [
  body('degree')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),
  body('institution')
    .notEmpty()
    .withMessage('La institución es requerida')
    .isLength({ max: 200 })
    .withMessage('La institución no puede exceder 200 caracteres'),
  body('country')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El país no puede exceder 100 caracteres'),
  body('startYear')
    .notEmpty()
    .withMessage('El año de inicio es requerido')
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Año de inicio inválido'),
  body('endYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Año de fin inválido'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  handleValidationErrors
];

const validateUpdateEducation = [
  param('educationId')
    .isInt({ min: 1 })
    .withMessage('ID de educación inválido'),
  body('degree')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),
  body('institution')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La institución no puede exceder 200 caracteres'),
  body('startYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage('Año de inicio inválido'),
  body('endYear')
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage('Año de fin inválido'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE EXPERIENCIA
// ═══════════════════════════════════════════════════════════════

const validateAddExperience = [
  body('position')
    .notEmpty()
    .withMessage('El cargo es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('El cargo debe tener entre 3 y 200 caracteres'),
  body('institution')
    .notEmpty()
    .withMessage('La institución es requerida')
    .isLength({ max: 200 })
    .withMessage('La institución no puede exceder 200 caracteres'),
  body('institutionType')
    .optional()
    .isIn(['hospital_publico', 'hospital_privado', 'clinica', 'consultorio', 'centro_medico', 'universidad', 'laboratorio', 'otro'])
    .withMessage('Tipo de institución inválido'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede exceder 100 caracteres'),
  body('startDate')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isDate()
    .withMessage('Fecha de inicio inválida'),
  body('endDate')
    .optional()
    .isDate()
    .withMessage('Fecha de fin inválida'),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent debe ser booleano'),
  body('description')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La descripción no puede exceder 2000 caracteres'),
  handleValidationErrors
];

const validateUpdateExperience = [
  param('experienceId')
    .isInt({ min: 1 })
    .withMessage('ID de experiencia inválido'),
  body('position')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El cargo debe tener entre 3 y 200 caracteres'),
  body('institution')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La institución no puede exceder 200 caracteres'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════

const validateSetAvailability = [
  body('schedules')
    .isArray()
    .withMessage('schedules debe ser un array'),
  body('schedules.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek debe estar entre 0 (Domingo) y 6 (Sábado)'),
  body('schedules.*.startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('startTime debe estar en formato HH:MM o HH:MM:SS'),
  body('schedules.*.endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('endTime debe estar en formato HH:MM o HH:MM:SS'),
  body('schedules.*.slotDuration')
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage('slotDuration debe estar entre 5 y 180 minutos'),
  body('schedules.*.consultationType')
    .optional()
    .isIn(['presencial', 'telemedicina', 'domicilio', 'mixto'])
    .withMessage('Tipo de consulta inválido'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// VALIDADORES DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════════

const validateSearch = [
  query('query')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La búsqueda no puede exceder 100 caracteres'),
  query('specialtyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de especialidad inválido'),
  query('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La ciudad no puede exceder 100 caracteres'),
  query('maxFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La tarifa máxima debe ser un número positivo'),
  query('minRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('El rating debe estar entre 0 y 5'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  handleValidationErrors
];

const validateNearby = [
  query('latitude')
    .notEmpty()
    .withMessage('Se requiere latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitud inválida'),
  query('longitude')
    .notEmpty()
    .withMessage('Se requiere longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitud inválida'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('El radio debe estar entre 0.1 y 100 km'),
  handleValidationErrors
];

const validateGetSlots = [
  param('doctorId')
    .isInt({ min: 1 })
    .withMessage('ID de doctor inválido'),
  query('date')
    .notEmpty()
    .withMessage('Se requiere la fecha')
    .isDate()
    .withMessage('Formato de fecha inválido (use YYYY-MM-DD)'),
  handleValidationErrors
];

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Params
  validateDoctorId,
  validateEducationId,
  validateExperienceId,
  validateSpecialtyId,

  // Perfil
  validateUpdateProfile,
  validateUpdateLocation,

  // Especialidad
  validateAddSpecialty,

  // Educación
  validateAddEducation,
  validateUpdateEducation,

  // Experiencia
  validateAddExperience,
  validateUpdateExperience,

  // Disponibilidad
  validateSetAvailability,

  // Búsqueda
  validateSearch,
  validateNearby,
  validateGetSlots,

  // Handler
  handleValidationErrors
};
