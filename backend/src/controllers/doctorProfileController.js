/**
 * Doctor Profile Controller - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Controlador para endpoints de perfil médico
 */

const doctorProfileService = require('../services/doctorProfileService');
const storageService = require('../services/storageService');
const db = require('../models');

const { DoctorProfile, User } = db;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene o crea el perfil de doctor para un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<DoctorProfile>} Perfil del doctor
 */
async function getOrCreateDoctorProfile(userId) {
  // Buscar perfil existente
  let doctorProfile = await DoctorProfile.findOne({
    where: { userId }
  });

  // Si no existe, crearlo
  if (!doctorProfile) {
    console.log(`Auto-creando perfil de doctor para userId: ${userId}`);

    const user = await User.findByPk(userId);

    if (!user || user.role !== 'doctor') {
      throw new Error('El usuario no tiene rol de doctor');
    }

    doctorProfile = await DoctorProfile.create({
      userId: user.id,
      firstName: user.firstName || 'Sin nombre',
      lastName: user.lastName || '',
      phoneNumber: user.phone || null,
      licenseNumber: `TEMP-${Date.now()}`,
      profileStatus: 'incomplete',
      isVerified: false,
      acceptingNewPatients: true,
      telemedicineEnabled: false,
      homeVisitsEnabled: false,
      consultationDuration: 30,
      languages: ['Español']
    });

    console.log(`Perfil de doctor creado exitosamente: ${doctorProfile.id}`);
  }

  return doctorProfile;
}

// ═══════════════════════════════════════════════════════════════
// PERFIL PÚBLICO
// ═══════════════════════════════════════════════════════════════

/**
 * GET /doctors/:doctorId
 * Obtiene perfil público de un doctor
 * Acepta tanto doctorProfileId como userId
 */
async function getProfile(req, res) {
  try {
    const { doctorId } = req.params;
    const id = parseInt(doctorId);

    // Primero intentar buscar directamente por doctorProfileId
    let profile;
    try {
      profile = await doctorProfileService.getPublicProfile(id);
    } catch (error) {
      if (error.message === 'Perfil de doctor no encontrado') {
        // Si no se encuentra, intentar buscar por userId
        console.log(`Perfil no encontrado por ID ${id}, buscando por userId...`);

        const doctorProfile = await DoctorProfile.findOne({
          where: { userId: id }
        });

        if (doctorProfile) {
          console.log(`Encontrado perfil por userId: ${doctorProfile.id}`);
          profile = await doctorProfileService.getPublicProfile(doctorProfile.id);
        } else {
          // Si tampoco existe por userId, verificar si hay un usuario doctor sin perfil
          const user = await User.findByPk(id);

          if (user && user.role === 'doctor') {
            // Auto-crear perfil básico para el doctor
            console.log(`Auto-creando perfil de doctor para userId: ${id}`);

            const newProfile = await DoctorProfile.create({
              userId: user.id,
              firstName: user.firstName || 'Sin nombre',
              lastName: user.lastName || '',
              phoneNumber: user.phone || null,
              licenseNumber: `TEMP-${Date.now()}`,
              profileStatus: 'incomplete',
              isVerified: false,
              acceptingNewPatients: true
            });

            console.log(`Perfil de doctor creado exitosamente: ${newProfile.id}`);
            profile = await doctorProfileService.getPublicProfile(newProfile.id);
          } else {
            throw new Error('Perfil de doctor no encontrado');
          }
        }
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);

    if (error.message === 'Perfil de doctor no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del doctor'
    });
  }
}

/**
 * GET /doctors/search
 * Busca doctores con filtros
 */
async function searchDoctors(req, res) {
  try {
    const {
      query,
      specialtyId,
      city,
      state,
      acceptsInsurance,
      telemedicine,
      maxFee,
      minRating,
      acceptingNewPatients,
      page,
      limit
    } = req.query;

    const result = await doctorProfileService.searchDoctors(
      {
        query,
        specialtyId: specialtyId ? parseInt(specialtyId) : undefined,
        city,
        state,
        acceptsInsurance: acceptsInsurance === 'true',
        telemedicine: telemedicine === 'true',
        maxFee: maxFee ? parseFloat(maxFee) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        acceptingNewPatients: acceptingNewPatients === 'true'
      },
      {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      }
    );

    res.json({
      success: true,
      data: result.doctors,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error buscando doctores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar doctores'
    });
  }
}

/**
 * GET /doctors/nearby
 * Busca doctores cercanos a una ubicación
 */
async function findNearbyDoctors(req, res) {
  try {
    const { latitude, longitude, radius, specialtyId, limit } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren latitude y longitude'
      });
    }

    const doctors = await doctorProfileService.findNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius) || 10,
      {
        specialtyId: specialtyId ? parseInt(specialtyId) : undefined,
        limit: parseInt(limit) || 20
      }
    );

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Error buscando doctores cercanos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar doctores cercanos'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// MI PERFIL (DOCTOR AUTENTICADO)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /doctors/me
 * Obtiene perfil del doctor autenticado
 * Si el perfil no existe, lo crea automáticamente
 */
async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;

    // Obtener o crear perfil
    const doctorProfile = await getOrCreateDoctorProfile(userId);
    const profile = await doctorProfileService.getCompleteProfile(doctorProfile.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error obteniendo mi perfil:', error);

    if (error.message === 'El usuario no tiene rol de doctor') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
}

/**
 * PUT /doctors/me
 * Actualiza información básica del perfil
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;

    // Obtener o crear perfil si no existe
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const updatedProfile = await doctorProfileService.updateBasicInfo(
      doctorProfile.id,
      req.body
    );

    // Sincronizar caché de búsqueda en background
    doctorProfileService.syncSearchCache(doctorProfile.id).catch(err =>
      console.error('Error sincronizando caché:', err.message)
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);

    if (error.message === 'El usuario no tiene rol de doctor') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar perfil'
    });
  }
}

/**
 * PUT /doctors/me/location
 * Actualiza ubicación del consultorio
 */
async function updateLocation(req, res) {
  try {
    const userId = req.user.id;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const updatedProfile = await doctorProfileService.updateLocation(
      doctorProfile.id,
      req.body
    );

    // Sincronizar caché de búsqueda
    doctorProfileService.syncSearchCache(doctorProfile.id).catch(err =>
      console.error('Error sincronizando caché:', err.message)
    );

    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error actualizando ubicación:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar ubicación'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// ESPECIALIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/specialties
 * Agrega una especialidad
 */
async function addSpecialty(req, res) {
  try {
    const userId = req.user.id;
    const { specialtyId, isPrimary, certificationDate, certificationNumber, certificationInstitution } = req.body;

    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const specialty = await doctorProfileService.addSpecialty(
      doctorProfile.id,
      parseInt(specialtyId),
      { isPrimary, certificationDate, certificationNumber, certificationInstitution }
    );

    res.status(201).json({
      success: true,
      message: 'Especialidad agregada exitosamente',
      data: specialty
    });
  } catch (error) {
    console.error('Error agregando especialidad:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar especialidad'
    });
  }
}

/**
 * DELETE /doctors/me/specialties/:specialtyId
 * Elimina una especialidad
 */
async function removeSpecialty(req, res) {
  try {
    const userId = req.user.id;
    const { specialtyId } = req.params;

    const doctorProfile = await getOrCreateDoctorProfile(userId);

    await doctorProfileService.removeSpecialty(
      doctorProfile.id,
      parseInt(specialtyId)
    );

    res.json({
      success: true,
      message: 'Especialidad eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando especialidad:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar especialidad'
    });
  }
}

/**
 * GET /doctors/me/specialties
 * Obtiene las especialidades del doctor
 */
async function getMySpecialties(req, res) {
  try {
    const userId = req.user.id;
    const doctorProfile = await getOrCreateDoctorProfile(userId);
    const specialties = await doctorProfileService.getSpecialties(doctorProfile.id);

    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EDUCACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/education
 * Agrega registro de educación
 */
async function addEducation(req, res) {
  try {
    const userId = req.user.id;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const education = await doctorProfileService.addEducation(
      doctorProfile.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Educación agregada exitosamente',
      data: education
    });
  } catch (error) {
    console.error('Error agregando educación:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar educación'
    });
  }
}

/**
 * PUT /doctors/me/education/:educationId
 * Actualiza registro de educación
 */
async function updateEducation(req, res) {
  try {
    const userId = req.user.id;
    const { educationId } = req.params;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const education = await doctorProfileService.updateEducation(
      parseInt(educationId),
      doctorProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Educación actualizada exitosamente',
      data: education
    });
  } catch (error) {
    console.error('Error actualizando educación:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar educación'
    });
  }
}

/**
 * DELETE /doctors/me/education/:educationId
 * Elimina registro de educación
 */
async function deleteEducation(req, res) {
  try {
    const userId = req.user.id;
    const { educationId } = req.params;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    await doctorProfileService.deleteEducation(
      parseInt(educationId),
      doctorProfile.id
    );

    res.json({
      success: true,
      message: 'Educación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando educación:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar educación'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPERIENCIA
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/experience
 * Agrega experiencia laboral
 */
async function addExperience(req, res) {
  try {
    const userId = req.user.id;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const experience = await doctorProfileService.addExperience(
      doctorProfile.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Experiencia agregada exitosamente',
      data: experience
    });
  } catch (error) {
    console.error('Error agregando experiencia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar experiencia'
    });
  }
}

/**
 * PUT /doctors/me/experience/:experienceId
 * Actualiza experiencia laboral
 */
async function updateExperience(req, res) {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const experience = await doctorProfileService.updateExperience(
      parseInt(experienceId),
      doctorProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Experiencia actualizada exitosamente',
      data: experience
    });
  } catch (error) {
    console.error('Error actualizando experiencia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar experiencia'
    });
  }
}

/**
 * DELETE /doctors/me/experience/:experienceId
 * Elimina experiencia laboral
 */
async function deleteExperience(req, res) {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    await doctorProfileService.deleteExperience(
      parseInt(experienceId),
      doctorProfile.id
    );

    res.json({
      success: true,
      message: 'Experiencia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando experiencia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar experiencia'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/availability
 * Establece disponibilidad semanal
 */
async function setAvailability(req, res) {
  try {
    const userId = req.user.id;
    const { schedules } = req.body;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const availability = await doctorProfileService.setAvailability(
      doctorProfile.id,
      schedules
    );

    res.json({
      success: true,
      message: 'Disponibilidad actualizada exitosamente',
      data: availability
    });
  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar disponibilidad'
    });
  }
}

/**
 * GET /doctors/:doctorId/availability
 * Obtiene disponibilidad de un doctor (público)
 */
async function getAvailability(req, res) {
  try {
    const { doctorId } = req.params;

    const summary = await doctorProfileService.getWeeklySummary(parseInt(doctorId));

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad'
    });
  }
}

/**
 * GET /doctors/:doctorId/slots
 * Obtiene slots disponibles para una fecha
 */
async function getAvailableSlots(req, res) {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el parámetro date (YYYY-MM-DD)'
      });
    }

    const slots = await doctorProfileService.getAvailableSlots(
      parseInt(doctorId),
      date
    );

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Error obteniendo slots:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al obtener slots disponibles'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// FOTOS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/photos
 * Sube una foto del consultorio
 */
async function uploadPhoto(req, res) {
  try {
    const userId = req.user.id;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere photoUrl'
      });
    }

    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const photos = await doctorProfileService.uploadPhoto(
      doctorProfile.id,
      photoUrl
    );

    res.status(201).json({
      success: true,
      message: 'Foto agregada exitosamente',
      data: { photos }
    });
  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al subir foto'
    });
  }
}

/**
 * DELETE /doctors/me/photos
 * Elimina una foto del consultorio
 */
async function deletePhoto(req, res) {
  try {
    const userId = req.user.id;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere photoUrl'
      });
    }

    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const photos = await doctorProfileService.deletePhoto(
      doctorProfile.id,
      photoUrl
    );

    res.json({
      success: true,
      message: 'Foto eliminada exitosamente',
      data: { photos }
    });
  } catch (error) {
    console.error('Error eliminando foto:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar foto'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPLETITUD
// ═══════════════════════════════════════════════════════════════

/**
 * GET /doctors/me/completeness
 * Obtiene el porcentaje de completitud del perfil
 */
async function getCompleteness(req, res) {
  try {
    const userId = req.user.id;
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    const completeness = await doctorProfileService.calculateProfileCompleteness(
      doctorProfile.id
    );

    res.json({
      success: true,
      data: completeness
    });
  } catch (error) {
    console.error('Error obteniendo completitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener completitud del perfil'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// LISTAR MÉDICOS PARA DIRECTORIO
// ═══════════════════════════════════════════════════════════════

/**
 * GET /doctors
 * Lista médicos activos y verificados para el directorio público
 */
async function listDoctors(req, res) {
  try {
    const doctors = await DoctorProfile.findAll({
      where: {
        profileStatus: 'active'
      },
      attributes: [
        'id', 'firstName', 'lastName', 'profilePhoto', 'subSpecialty',
        'experienceYears', 'city', 'state', 'consultationFee', 'isVerified',
        'averageRating', 'totalReviews', 'telemedicineEnabled', 'acceptingNewPatients'
      ],
      order: [
        ['isVerified', 'DESC'],
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC']
      ],
      limit: 100
    });

    res.json({
      success: true,
      data: doctors,
      total: doctors.length
    });
  } catch (error) {
    console.error('Error listando médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista de médicos'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// SUBIDA DE FOTO DE PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * POST /doctors/me/profile-photo
 * Sube foto de perfil del doctor (acepta FormData)
 */
async function uploadProfilePhoto(req, res) {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Obtener o crear perfil
    const doctorProfile = await getOrCreateDoctorProfile(userId);

    // Guardar foto usando storageService
    const savedPhoto = await storageService.saveProfilePhoto(req.file, doctorProfile.id);

    // Actualizar perfil con la nueva URL
    await doctorProfile.update({
      profilePhoto: savedPhoto.fullUrl
    });

    console.log(`Foto de perfil actualizada para doctor ${doctorProfile.id}: ${savedPhoto.fullUrl}`);

    // Sincronizar caché de búsqueda
    doctorProfileService.syncSearchCache(doctorProfile.id).catch(err =>
      console.error('Error sincronizando caché:', err.message)
    );

    res.json({
      success: true,
      data: {
        profilePhoto: savedPhoto.fullUrl
      },
      message: 'Foto de perfil actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al subir foto de perfil'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Público
  listDoctors,
  getProfile,
  searchDoctors,
  findNearbyDoctors,
  getAvailability,
  getAvailableSlots,

  // Autenticado
  getMyProfile,
  updateProfile,
  updateLocation,

  // Especialidades
  addSpecialty,
  removeSpecialty,
  getMySpecialties,

  // Educación
  addEducation,
  updateEducation,
  deleteEducation,

  // Experiencia
  addExperience,
  updateExperience,
  deleteExperience,

  // Disponibilidad
  setAvailability,

  // Fotos
  uploadPhoto,
  deletePhoto,
  uploadProfilePhoto,

  // Completitud
  getCompleteness
};
