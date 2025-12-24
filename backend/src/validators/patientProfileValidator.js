/**
 * Patient Profile Validators - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Validadores para endpoints de perfil de paciente
 */

const { body, param, validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array()
    });
  }
  next();
};

// ═══════════════════════════════════════════════════════════════
// VALIDADORES
// ═══════════════════════════════════════════════════════════════

/**
 * Validar actualización de perfil básico
 */
const validateUpdateProfile = [
  body('bloodType')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'])
    .withMessage('Tipo de sangre no válido'),

  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('La altura debe estar entre 50 y 250 cm'),

  body('weight')
    .optional()
    .isFloat({ min: 2, max: 300 })
    .withMessage('El peso debe estar entre 2 y 300 kg'),

  body('smokingStatus')
    .optional()
    .isIn(['never', 'former', 'current', 'unknown'])
    .withMessage('Estado de fumador no válido'),

  body('alcoholConsumption')
    .optional()
    .isIn(['never', 'occasional', 'moderate', 'heavy', 'unknown'])
    .withMessage('Consumo de alcohol no válido'),

  body('exerciseFrequency')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active', 'unknown'])
    .withMessage('Frecuencia de ejercicio no válida'),

  body('notes')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Las notas no pueden exceder 5000 caracteres'),

  handleValidation
];

/**
 * Validar actualización de contacto de emergencia
 */
const validateEmergencyContact = [
  body('name')
    .notEmpty()
    .withMessage('El nombre del contacto es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('phone')
    .notEmpty()
    .withMessage('El teléfono del contacto es requerido')
    .matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage('Formato de teléfono no válido'),

  body('relationship')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La relación no puede exceder 100 caracteres'),

  handleValidation
];

/**
 * Validar actualización de seguro médico
 */
const validateInsurance = [
  body('company')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El nombre de la aseguradora no puede exceder 200 caracteres'),

  body('policyNumber')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El número de póliza no puede exceder 100 caracteres'),

  body('validUntil')
    .optional()
    .isISO8601()
    .withMessage('Fecha de vencimiento no válida'),

  body('type')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El tipo de plan no puede exceder 100 caracteres'),

  handleValidation
];

/**
 * Validar agregar historial médico
 */
const validateAddMedicalHistory = [
  body('condition')
    .notEmpty()
    .withMessage('El nombre de la condición es requerido')
    .isLength({ min: 3, max: 200 })
    .withMessage('La condición debe tener entre 3 y 200 caracteres'),

  body('diagnosedDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de diagnóstico no válida')
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('La fecha de diagnóstico no puede ser futura');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['active', 'resolved', 'chronic'])
    .withMessage('Estado no válido'),

  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe'])
    .withMessage('Severidad no válida'),

  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden exceder 2000 caracteres'),

  body('diagnosedBy')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El nombre del médico no puede exceder 200 caracteres'),

  handleValidation
];

/**
 * Validar actualizar historial médico
 */
const validateUpdateMedicalHistory = [
  param('historyId')
    .isInt({ min: 1 })
    .withMessage('ID de historial no válido'),

  ...validateAddMedicalHistory.slice(0, -1), // Reutilizar validaciones sin handleValidation

  handleValidation
];

/**
 * Validar ID de historial médico
 */
const validateHistoryId = [
  param('historyId')
    .isInt({ min: 1 })
    .withMessage('ID de historial no válido'),

  handleValidation
];

/**
 * Validar agregar alergia
 */
const validateAddAllergy = [
  body('allergyType')
    .notEmpty()
    .withMessage('El tipo de alergia es requerido')
    .isIn(['medication', 'food', 'environmental', 'other'])
    .withMessage('Tipo de alergia no válido'),

  body('allergen')
    .notEmpty()
    .withMessage('El alérgeno es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('El alérgeno debe tener entre 2 y 200 caracteres'),

  body('severity')
    .notEmpty()
    .withMessage('La severidad es requerida')
    .isIn(['mild', 'moderate', 'severe', 'life_threatening'])
    .withMessage('Severidad no válida'),

  body('reaction')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La descripción de la reacción no puede exceder 2000 caracteres'),

  body('diagnosedDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de diagnóstico no válida'),

  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden exceder 2000 caracteres'),

  handleValidation
];

/**
 * Validar actualizar alergia
 */
const validateUpdateAllergy = [
  param('allergyId')
    .isInt({ min: 1 })
    .withMessage('ID de alergia no válido'),

  // Campos opcionales para actualización
  body('allergyType')
    .optional()
    .isIn(['medication', 'food', 'environmental', 'other'])
    .withMessage('Tipo de alergia no válido'),

  body('allergen')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('El alérgeno debe tener entre 2 y 200 caracteres'),

  body('severity')
    .optional()
    .isIn(['mild', 'moderate', 'severe', 'life_threatening'])
    .withMessage('Severidad no válida'),

  body('reaction')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La descripción de la reacción no puede exceder 2000 caracteres'),

  handleValidation
];

/**
 * Validar ID de alergia
 */
const validateAllergyId = [
  param('allergyId')
    .isInt({ min: 1 })
    .withMessage('ID de alergia no válido'),

  handleValidation
];

/**
 * Validar agregar medicamento
 */
const validateAddMedication = [
  body('medicationName')
    .notEmpty()
    .withMessage('El nombre del medicamento es requerido')
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('dosage')
    .notEmpty()
    .withMessage('La dosis es requerida')
    .isLength({ max: 100 })
    .withMessage('La dosis no puede exceder 100 caracteres'),

  body('frequency')
    .notEmpty()
    .withMessage('La frecuencia es requerida')
    .isLength({ max: 100 })
    .withMessage('La frecuencia no puede exceder 100 caracteres'),

  body('route')
    .optional()
    .isLength({ max: 50 })
    .withMessage('La vía de administración no puede exceder 50 caracteres'),

  body('startDate')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('Fecha de inicio no válida'),

  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin no válida')
    .custom((value, { req }) => {
      if (value && req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    }),

  body('prescribedBy')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El nombre del médico no puede exceder 200 caracteres'),

  body('reason')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('La razón no puede exceder 2000 caracteres'),

  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Las notas no pueden exceder 2000 caracteres'),

  handleValidation
];

/**
 * Validar actualizar medicamento
 */
const validateUpdateMedication = [
  param('medicationId')
    .isInt({ min: 1 })
    .withMessage('ID de medicamento no válido'),

  body('medicationName')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('El nombre debe tener entre 2 y 200 caracteres'),

  body('dosage')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La dosis no puede exceder 100 caracteres'),

  body('frequency')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La frecuencia no puede exceder 100 caracteres'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano'),

  handleValidation
];

/**
 * Validar ID de medicamento
 */
const validateMedicationId = [
  param('medicationId')
    .isInt({ min: 1 })
    .withMessage('ID de medicamento no válido'),

  handleValidation
];

/**
 * Validar ID de paciente
 */
const validatePatientId = [
  param('patientId')
    .isInt({ min: 1 })
    .withMessage('ID de paciente no válido'),

  handleValidation
];

module.exports = {
  validateUpdateProfile,
  validateEmergencyContact,
  validateInsurance,
  validateAddMedicalHistory,
  validateUpdateMedicalHistory,
  validateHistoryId,
  validateAddAllergy,
  validateUpdateAllergy,
  validateAllergyId,
  validateAddMedication,
  validateUpdateMedication,
  validateMedicationId,
  validatePatientId
};
