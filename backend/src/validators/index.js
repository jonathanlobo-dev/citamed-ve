/**
 * Validators Index - CITAMED.VE
 *
 * Exporta todos los validators del sistema
 */

// Auth validators
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  ALLOWED_ROLES,
  PATTERNS
} = require('./authValidator');

// Doctor validators
const {
  searchDoctorsValidator,
  getDoctorByIdValidator,
  updateDoctorProfileValidator,
  workingHoursValidator,
  VENEZUELAN_CITIES,
  VENEZUELAN_STATES,
  SUPPORTED_LANGUAGES
} = require('./doctorValidator');

// Appointment validators
const {
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  getAppointmentByIdValidator,
  listAppointmentsValidator,
  confirmAppointmentValidator,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CANCELLATION_REASONS
} = require('./appointmentValidator');

// Validation error handler
const {
  validationErrorHandler,
  createValidationHandler,
  authValidationHandler,
  hasValidationErrors,
  getValidationErrors
} = require('../middleware/validationErrorHandler');

module.exports = {
  // Auth
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,

  // Doctor
  searchDoctorsValidator,
  getDoctorByIdValidator,
  updateDoctorProfileValidator,
  workingHoursValidator,

  // Appointment
  createAppointmentValidator,
  updateAppointmentValidator,
  cancelAppointmentValidator,
  getAppointmentByIdValidator,
  listAppointmentsValidator,
  confirmAppointmentValidator,

  // Error handlers
  validationErrorHandler,
  createValidationHandler,
  authValidationHandler,
  hasValidationErrors,
  getValidationErrors,

  // Constants
  ALLOWED_ROLES,
  PATTERNS,
  VENEZUELAN_CITIES,
  VENEZUELAN_STATES,
  SUPPORTED_LANGUAGES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CANCELLATION_REASONS
};
