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

// Patient registration validators (multi-step)
const {
  patientStep1Validator,
  patientStep2Validator,
  patientStep3Validator,
  patientStep4Validator,
  patientRegisterValidator,
  BLOOD_TYPES,
  GENDERS
} = require('./patientValidator');

// Doctor registration validators (multi-step)
const {
  doctorStep1Validator,
  doctorStep2Validator,
  doctorStep3Validator,
  doctorStep4Validator,
  doctorStep5Validator,
  doctorStep6Validator,
  doctorRegisterValidator,
  WEEKDAYS
} = require('./doctorRegisterValidator');

// Provider registration validators (multi-step)
const {
  providerStep1Validator,
  providerStep2Validator,
  providerStep3Validator,
  providerStep4Validator,
  providerStep5Validator,
  providerRegisterValidator,
  PROVIDER_TYPES,
  RIF_PATTERN
} = require('./providerValidator');

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

  // Patient Registration (multi-step)
  patientStep1Validator,
  patientStep2Validator,
  patientStep3Validator,
  patientStep4Validator,
  patientRegisterValidator,

  // Doctor Registration (multi-step)
  doctorStep1Validator,
  doctorStep2Validator,
  doctorStep3Validator,
  doctorStep4Validator,
  doctorStep5Validator,
  doctorStep6Validator,
  doctorRegisterValidator,

  // Provider Registration (multi-step)
  providerStep1Validator,
  providerStep2Validator,
  providerStep3Validator,
  providerStep4Validator,
  providerStep5Validator,
  providerRegisterValidator,

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
  BLOOD_TYPES,
  GENDERS,
  WEEKDAYS,
  PROVIDER_TYPES,
  RIF_PATTERN,
  VENEZUELAN_CITIES,
  VENEZUELAN_STATES,
  SUPPORTED_LANGUAGES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  CANCELLATION_REASONS
};
