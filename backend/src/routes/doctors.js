/**
 * Doctor Profile Routes - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 */

const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorProfileController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission, requireRoles } = require('../middleware/rbacMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');
const { uploadProfilePhoto, handleUploadError } = require('../middleware/uploadMiddleware');
const validators = require('../validators/doctorProfileValidator');

// Rate limiter para búsqueda
const searchLimiter = generalLimiter;

// ═══════════════════════════════════════════════════════════════
// RUTAS PÚBLICAS (Sin autenticación)
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/doctors
 * @desc    Lista doctores activos y verificados para el directorio
 * @access  Public
 */
router.get('/',
  searchLimiter,
  doctorController.listDoctors
);

/**
 * @route   GET /api/doctors/search
 * @desc    Busca doctores con filtros
 * @access  Public
 */
router.get('/search',
  searchLimiter,
  validators.validateSearch,
  doctorController.searchDoctors
);

/**
 * @route   GET /api/doctors/nearby
 * @desc    Busca doctores cercanos a una ubicación
 * @access  Public
 */
router.get('/nearby',
  searchLimiter,
  validators.validateNearby,
  doctorController.findNearbyDoctors
);

// ═══════════════════════════════════════════════════════════════
// RUTAS AUTENTICADAS - MI PERFIL
// IMPORTANTE: Deben ir ANTES de /:doctorId para evitar conflictos
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/doctors/me
 * @desc    Obtiene perfil del doctor autenticado
 * @access  Private (Doctor)
 */
router.get('/me',
  authenticateToken,
  requireRoles(['doctor']),
  doctorController.getMyProfile
);

/**
 * @route   GET /api/doctors/:doctorId
 * @desc    Obtiene perfil público de un doctor
 * @access  Public
 */
router.get('/:doctorId',
  validators.validateDoctorId,
  doctorController.getProfile
);

/**
 * @route   GET /api/doctors/:doctorId/availability
 * @desc    Obtiene disponibilidad semanal de un doctor
 * @access  Public
 */
router.get('/:doctorId/availability',
  validators.validateDoctorId,
  doctorController.getAvailability
);

/**
 * @route   GET /api/doctors/:doctorId/slots
 * @desc    Obtiene slots disponibles para una fecha
 * @access  Public
 */
router.get('/:doctorId/slots',
  validators.validateGetSlots,
  doctorController.getAvailableSlots
);

// ═══════════════════════════════════════════════════════════════
// RUTAS AUTENTICADAS - MI PERFIL (CONTINUACIÓN)
// ═══════════════════════════════════════════════════════════════

// Aplicar autenticación a todas las rutas /me restantes
router.use('/me', authenticateToken);

/**
 * @route   PUT /api/doctors/me
 * @desc    Actualiza información básica del perfil
 * @access  Private (Doctor)
 */
router.put('/me',
  requireRoles(['doctor']),
  validators.validateUpdateProfile,
  doctorController.updateProfile
);

/**
 * @route   PUT /api/doctors/me/location
 * @desc    Actualiza ubicación del consultorio
 * @access  Private (Doctor)
 */
router.put('/me/location',
  requireRoles(['doctor']),
  validators.validateUpdateLocation,
  doctorController.updateLocation
);

/**
 * @route   POST /api/doctors/me/profile-photo
 * @desc    Sube foto de perfil del doctor
 * @access  Private (Doctor)
 */
router.post('/me/profile-photo',
  requireRoles(['doctor']),
  (req, res, next) => {
    uploadProfilePhoto(req, res, (err) => {
      if (err) {
        return handleUploadError(err, req, res, next);
      }
      next();
    });
  },
  doctorController.uploadProfilePhoto
);

/**
 * @route   GET /api/doctors/me/completeness
 * @desc    Obtiene porcentaje de completitud del perfil
 * @access  Private (Doctor)
 */
router.get('/me/completeness',
  requireRoles(['doctor']),
  doctorController.getCompleteness
);

// ═══════════════════════════════════════════════════════════════
// RUTAS DE ESPECIALIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * @route   GET /api/doctors/me/specialties
 * @desc    Obtiene especialidades del doctor
 * @access  Private (Doctor)
 */
router.get('/me/specialties',
  requireRoles(['doctor']),
  doctorController.getMySpecialties
);

/**
 * @route   POST /api/doctors/me/specialties
 * @desc    Agrega una especialidad
 * @access  Private (Doctor)
 */
router.post('/me/specialties',
  requireRoles(['doctor']),
  validators.validateAddSpecialty,
  doctorController.addSpecialty
);

/**
 * @route   DELETE /api/doctors/me/specialties/:specialtyId
 * @desc    Elimina una especialidad
 * @access  Private (Doctor)
 */
router.delete('/me/specialties/:specialtyId',
  requireRoles(['doctor']),
  validators.validateSpecialtyId,
  doctorController.removeSpecialty
);

// ═══════════════════════════════════════════════════════════════
// RUTAS DE EDUCACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/doctors/me/education
 * @desc    Agrega registro de educación
 * @access  Private (Doctor)
 */
router.post('/me/education',
  requireRoles(['doctor']),
  validators.validateAddEducation,
  doctorController.addEducation
);

/**
 * @route   PUT /api/doctors/me/education/:educationId
 * @desc    Actualiza registro de educación
 * @access  Private (Doctor)
 */
router.put('/me/education/:educationId',
  requireRoles(['doctor']),
  validators.validateUpdateEducation,
  doctorController.updateEducation
);

/**
 * @route   DELETE /api/doctors/me/education/:educationId
 * @desc    Elimina registro de educación
 * @access  Private (Doctor)
 */
router.delete('/me/education/:educationId',
  requireRoles(['doctor']),
  validators.validateEducationId,
  doctorController.deleteEducation
);

// ═══════════════════════════════════════════════════════════════
// RUTAS DE EXPERIENCIA
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/doctors/me/experience
 * @desc    Agrega experiencia laboral
 * @access  Private (Doctor)
 */
router.post('/me/experience',
  requireRoles(['doctor']),
  validators.validateAddExperience,
  doctorController.addExperience
);

/**
 * @route   PUT /api/doctors/me/experience/:experienceId
 * @desc    Actualiza experiencia laboral
 * @access  Private (Doctor)
 */
router.put('/me/experience/:experienceId',
  requireRoles(['doctor']),
  validators.validateUpdateExperience,
  doctorController.updateExperience
);

/**
 * @route   DELETE /api/doctors/me/experience/:experienceId
 * @desc    Elimina experiencia laboral
 * @access  Private (Doctor)
 */
router.delete('/me/experience/:experienceId',
  requireRoles(['doctor']),
  validators.validateExperienceId,
  doctorController.deleteExperience
);

// ═══════════════════════════════════════════════════════════════
// RUTAS DE DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/doctors/me/availability
 * @desc    Establece disponibilidad semanal
 * @access  Private (Doctor)
 */
router.post('/me/availability',
  requireRoles(['doctor']),
  validators.validateSetAvailability,
  doctorController.setAvailability
);

// ═══════════════════════════════════════════════════════════════
// RUTAS DE FOTOS
// ═══════════════════════════════════════════════════════════════

/**
 * @route   POST /api/doctors/me/photos
 * @desc    Sube una foto del consultorio
 * @access  Private (Doctor)
 */
router.post('/me/photos',
  requireRoles(['doctor']),
  doctorController.uploadPhoto
);

/**
 * @route   DELETE /api/doctors/me/photos
 * @desc    Elimina una foto del consultorio
 * @access  Private (Doctor)
 */
router.delete('/me/photos',
  requireRoles(['doctor']),
  doctorController.deletePhoto
);

module.exports = router;
