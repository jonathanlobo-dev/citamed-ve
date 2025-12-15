/**
 * Appointment Validators - CITAMED.VE
 *
 * Validaciones para endpoints de citas:
 * - Crear cita
 * - Actualizar cita
 * - Cancelar cita
 */

const { body, query, param } = require('express-validator');

/**
 * Estados válidos de cita
 */
const APPOINTMENT_STATUSES = [
  'scheduled',    // Programada
  'confirmed',    // Confirmada por el médico
  'in_progress',  // En progreso
  'completed',    // Completada
  'cancelled',    // Cancelada
  'no_show'       // No se presentó
];

/**
 * Tipos de cita
 */
const APPOINTMENT_TYPES = [
  'first_time',     // Primera vez
  'follow_up',      // Seguimiento
  'emergency',      // Emergencia
  'telemedicine'    // Telemedicina
];

/**
 * Razones de cancelación
 */
const CANCELLATION_REASONS = [
  'patient_request',       // Solicitud del paciente
  'doctor_unavailable',    // Médico no disponible
  'schedule_conflict',     // Conflicto de horario
  'emergency',             // Emergencia
  'other'                  // Otro
];

/**
 * Validator para crear cita
 */
const createAppointmentValidator = [
  body('doctorId')
    .notEmpty()
    .withMessage('ID del médico es requerido')
    .isInt({ min: 1 })
    .withMessage('ID del médico debe ser un número positivo')
    .toInt(),

  body('appointmentDate')
    .notEmpty()
    .withMessage('Fecha de cita es requerida')
    .isISO8601()
    .withMessage('Fecha debe estar en formato ISO 8601')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();

      // La cita debe ser en el futuro
      if (appointmentDate <= now) {
        throw new Error('La fecha de la cita debe ser en el futuro');
      }

      // No permitir citas a más de 3 meses
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      if (appointmentDate > maxDate) {
        throw new Error('No se pueden programar citas a más de 3 meses');
      }

      return true;
    }),

  body('appointmentType')
    .optional()
    .isIn(APPOINTMENT_TYPES)
    .withMessage(`Tipo de cita debe ser uno de: ${APPOINTMENT_TYPES.join(', ')}`),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Motivo de consulta no puede exceder 500 caracteres'),

  body('symptoms')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Síntomas no puede exceder 1000 caracteres'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas no puede exceder 1000 caracteres'),

  body('isTelemedicine')
    .optional()
    .isBoolean()
    .withMessage('Telemedicina debe ser true o false')
    .toBoolean()
];

/**
 * Validator para actualizar cita
 */
const updateAppointmentValidator = [
  param('id')
    .notEmpty()
    .withMessage('ID de cita es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de cita debe ser un número positivo')
    .toInt(),

  body('appointmentDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha debe estar en formato ISO 8601')
    .custom((value) => {
      const appointmentDate = new Date(value);
      const now = new Date();

      if (appointmentDate <= now) {
        throw new Error('La fecha de la cita debe ser en el futuro');
      }

      return true;
    }),

  body('status')
    .optional()
    .isIn(APPOINTMENT_STATUSES)
    .withMessage(`Estado debe ser uno de: ${APPOINTMENT_STATUSES.join(', ')}`),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Motivo no puede exceder 500 caracteres'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notas no puede exceder 1000 caracteres')
];

/**
 * Validator para cancelar cita
 */
const cancelAppointmentValidator = [
  param('id')
    .notEmpty()
    .withMessage('ID de cita es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de cita debe ser un número positivo')
    .toInt(),

  body('cancellationReason')
    .optional()
    .isIn(CANCELLATION_REASONS)
    .withMessage(`Razón de cancelación debe ser una de: ${CANCELLATION_REASONS.join(', ')}`),

  body('cancellationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas de cancelación no puede exceder 500 caracteres')
];

/**
 * Validator para obtener cita por ID
 */
const getAppointmentByIdValidator = [
  param('id')
    .notEmpty()
    .withMessage('ID de cita es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de cita debe ser un número positivo')
    .toInt()
];

/**
 * Validator para listar citas
 */
const listAppointmentsValidator = [
  query('doctorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID del médico debe ser un número positivo')
    .toInt(),

  query('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID del paciente debe ser un número positivo')
    .toInt(),

  query('status')
    .optional()
    .isIn(APPOINTMENT_STATUSES)
    .withMessage(`Estado debe ser uno de: ${APPOINTMENT_STATUSES.join(', ')}`),

  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde debe estar en formato ISO 8601'),

  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta debe estar en formato ISO 8601')
    .custom((value, { req }) => {
      if (req.query.fromDate && new Date(value) < new Date(req.query.fromDate)) {
        throw new Error('Fecha hasta debe ser posterior a fecha desde');
      }
      return true;
    }),

  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Página debe ser un número entre 1 y 1000')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100')
    .toInt()
];

/**
 * Validator para confirmar cita (médico)
 */
const confirmAppointmentValidator = [
  param('id')
    .notEmpty()
    .withMessage('ID de cita es requerido')
    .isInt({ min: 1 })
    .withMessage('ID de cita debe ser un número positivo')
    .toInt(),

  body('confirmationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas de confirmación no puede exceder 500 caracteres')
];

module.exports = {
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  getAppointmentByIdValidator,
  listAppointmentsValidator,
  confirmAppointmentValidator,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CANCELLATION_REASONS
};
