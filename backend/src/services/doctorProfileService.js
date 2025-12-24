/**
 * Doctor Profile Service - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Servicio principal para gestión de perfiles médicos
 */

const { Op } = require('sequelize');
const db = require('../models');

const {
  DoctorProfile,
  DoctorSpecialty,
  DoctorEducation,
  DoctorExperience,
  DoctorAvailability,
  Specialty,
  User
} = db;

// ═══════════════════════════════════════════════════════════════
// 1. OBTENER PERFIL COMPLETO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el perfil completo de un doctor con todas las relaciones
 * @param {number} doctorProfileId - ID del perfil del doctor
 * @returns {Object} Perfil completo enriquecido
 */
async function getCompleteProfile(doctorProfileId) {
  try {
    const profile = await DoctorProfile.findByPk(doctorProfileId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive']
        },
        {
          model: Specialty,
          as: 'specialty',
          attributes: ['id', 'name', 'slug', 'icon', 'color']
        },
        {
          model: DoctorSpecialty,
          as: 'doctorSpecialties',
          include: [{
            model: Specialty,
            as: 'specialty',
            attributes: ['id', 'name', 'slug', 'icon', 'color']
          }]
        },
        {
          model: DoctorEducation,
          as: 'education'
        },
        {
          model: DoctorExperience,
          as: 'experience'
        },
        {
          model: DoctorAvailability,
          as: 'availability',
          required: false
        }
      ]
    });

    if (!profile) {
      throw new Error('Perfil de doctor no encontrado');
    }

    // Enriquecer con datos calculados
    const completeness = await calculateProfileCompleteness(doctorProfileId);
    let totalExperienceYears = 0;
    try {
      totalExperienceYears = await DoctorExperience.calculateTotalYears(doctorProfileId);
    } catch (expError) {
      console.warn('Error calculando años de experiencia:', expError.message);
    }

    // Filtrar disponibilidades activas si existen
    const activeAvailability = profile.availability?.filter(a => a.isActive) || [];

    return {
      ...profile.toJSON(),
      availability: activeAvailability,
      completeness,
      calculatedExperienceYears: totalExperienceYears,
      specialtiesList: profile.doctorSpecialties?.map(ds => ({
        id: ds.specialty?.id,
        name: ds.specialty?.name,
        isPrimary: ds.isPrimary,
        certificationNumber: ds.certificationNumber
      })) || []
    };
  } catch (error) {
    console.error('Error en getCompleteProfile:', error);
    throw error;
  }
}

/**
 * Obtiene perfil público (sin datos sensibles)
 */
async function getPublicProfile(doctorProfileId) {
  const profile = await getCompleteProfile(doctorProfileId);

  // Remover datos sensibles
  if (profile.user) {
    delete profile.user.email;
  }

  return profile;
}

// ═══════════════════════════════════════════════════════════════
// 2. ACTUALIZAR INFORMACIÓN BÁSICA
// ═══════════════════════════════════════════════════════════════

/**
 * Actualiza campos básicos del perfil
 */
async function updateBasicInfo(doctorProfileId, data) {
  const profile = await DoctorProfile.findByPk(doctorProfileId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Campos permitidos para actualizar
  const allowedFields = [
    'bio', 'experienceYears', 'consultationFee', 'followUpFee',
    'priceTeleconsultation', 'priceHomeVisit', 'acceptsInsurance',
    'insuranceProviders', 'consultationDuration', 'languages',
    'treatmentApproaches', 'specialConditions', 'availableForEmergencies',
    'telemedicineEnabled', 'homeVisitsEnabled', 'acceptingNewPatients',
    'averageWaitTime', 'websiteUrl', 'socialMediaLinks'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  await profile.update(updateData);

  // Recalcular completitud
  await updateProfileCompleteness(doctorProfileId);

  return profile.reload();
}

// ═══════════════════════════════════════════════════════════════
// 3. ACTUALIZAR UBICACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Actualiza la ubicación del consultorio
 */
async function updateLocation(doctorProfileId, locationData) {
  const profile = await DoctorProfile.findByPk(doctorProfileId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Validar coordenadas si se proporcionan
  if (locationData.latitude !== undefined || locationData.longitude !== undefined) {
    const lat = parseFloat(locationData.latitude);
    const lng = parseFloat(locationData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      throw new Error('Latitud inválida. Debe estar entre -90 y 90');
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      throw new Error('Longitud inválida. Debe estar entre -180 y 180');
    }

    locationData.officeLatitude = lat;
    locationData.officeLongitude = lng;
    locationData.coordinates = { lat, lng };
  }

  const updateData = {};
  const locationFields = [
    'clinicName', 'clinicAddress', 'city', 'state', 'country', 'zipCode',
    'coordinates', 'officeLatitude', 'officeLongitude',
    'phoneNumber', 'alternatePhoneNumber', 'whatsappNumber'
  ];

  for (const field of locationFields) {
    if (locationData[field] !== undefined) {
      updateData[field] = locationData[field];
    }
  }

  await profile.update(updateData);
  await updateProfileCompleteness(doctorProfileId);

  return profile.reload();
}

// ═══════════════════════════════════════════════════════════════
// 4-5. GESTIÓN DE ESPECIALIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega una especialidad al doctor
 */
async function addSpecialty(doctorProfileId, specialtyId, data = {}) {
  // Verificar que la especialidad existe
  const specialty = await Specialty.findByPk(specialtyId);
  if (!specialty) {
    throw new Error('Especialidad no encontrada');
  }

  const result = await DoctorSpecialty.assignSpecialty(doctorProfileId, specialtyId, {
    isPrimary: data.isPrimary || false,
    certificationDate: data.certificationDate,
    certificationNumber: data.certificationNumber,
    certificationInstitution: data.certificationInstitution
  });

  await updateProfileCompleteness(doctorProfileId);
  return result;
}

/**
 * Elimina una especialidad del doctor
 */
async function removeSpecialty(doctorProfileId, specialtyId) {
  await DoctorSpecialty.removeSpecialty(doctorProfileId, specialtyId);
  await updateProfileCompleteness(doctorProfileId);
  return true;
}

/**
 * Obtiene todas las especialidades del doctor
 */
async function getSpecialties(doctorProfileId) {
  return await DoctorSpecialty.getSpecialtiesByDoctor(doctorProfileId);
}

// ═══════════════════════════════════════════════════════════════
// 6-8. GESTIÓN DE EDUCACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega un registro de educación
 */
async function addEducation(doctorProfileId, educationData) {
  const education = await DoctorEducation.addEducation(doctorProfileId, educationData);
  await updateProfileCompleteness(doctorProfileId);
  return education;
}

/**
 * Actualiza un registro de educación
 */
async function updateEducation(educationId, doctorProfileId, educationData) {
  const education = await DoctorEducation.updateEducation(educationId, doctorProfileId, educationData);
  await updateProfileCompleteness(doctorProfileId);
  return education;
}

/**
 * Elimina un registro de educación
 */
async function deleteEducation(educationId, doctorProfileId) {
  await DoctorEducation.deleteEducation(educationId, doctorProfileId);
  await updateProfileCompleteness(doctorProfileId);
  return true;
}

/**
 * Obtiene toda la educación del doctor
 */
async function getEducation(doctorProfileId) {
  return await DoctorEducation.getByDoctor(doctorProfileId);
}

// ═══════════════════════════════════════════════════════════════
// 9-11. GESTIÓN DE EXPERIENCIA
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega experiencia laboral
 */
async function addExperience(doctorProfileId, experienceData) {
  const experience = await DoctorExperience.addExperience(doctorProfileId, experienceData);

  // Actualizar años de experiencia calculados
  const totalYears = await DoctorExperience.calculateTotalYears(doctorProfileId);
  await DoctorProfile.update(
    { experienceYears: totalYears },
    { where: { id: doctorProfileId } }
  );

  await updateProfileCompleteness(doctorProfileId);
  return experience;
}

/**
 * Actualiza experiencia laboral
 */
async function updateExperience(experienceId, doctorProfileId, experienceData) {
  const experience = await DoctorExperience.updateExperience(experienceId, doctorProfileId, experienceData);

  // Actualizar años de experiencia calculados
  const totalYears = await DoctorExperience.calculateTotalYears(doctorProfileId);
  await DoctorProfile.update(
    { experienceYears: totalYears },
    { where: { id: doctorProfileId } }
  );

  await updateProfileCompleteness(doctorProfileId);
  return experience;
}

/**
 * Elimina experiencia laboral
 */
async function deleteExperience(experienceId, doctorProfileId) {
  await DoctorExperience.deleteExperience(experienceId, doctorProfileId);

  // Actualizar años de experiencia calculados
  const totalYears = await DoctorExperience.calculateTotalYears(doctorProfileId);
  await DoctorProfile.update(
    { experienceYears: totalYears },
    { where: { id: doctorProfileId } }
  );

  await updateProfileCompleteness(doctorProfileId);
  return true;
}

/**
 * Obtiene toda la experiencia del doctor
 */
async function getExperience(doctorProfileId) {
  return await DoctorExperience.getByDoctor(doctorProfileId);
}

// ═══════════════════════════════════════════════════════════════
// 12-13. GESTIÓN DE DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════

/**
 * Establece la disponibilidad semanal completa
 */
async function setAvailability(doctorProfileId, availabilityData) {
  const schedules = await DoctorAvailability.setWeeklySchedule(doctorProfileId, availabilityData);
  await updateProfileCompleteness(doctorProfileId);
  return schedules;
}

/**
 * Obtiene la disponibilidad del doctor
 */
async function getAvailability(doctorProfileId) {
  return await DoctorAvailability.getByDoctor(doctorProfileId);
}

/**
 * Obtiene el resumen semanal de disponibilidad
 */
async function getWeeklySummary(doctorProfileId) {
  return await DoctorAvailability.getWeeklySummary(doctorProfileId);
}

/**
 * Obtiene slots disponibles para una fecha específica
 */
async function getAvailableSlots(doctorProfileId, date) {
  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) {
    throw new Error('Fecha inválida');
  }

  // Verificar que la fecha no sea pasada
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (targetDate < today) {
    throw new Error('No se pueden consultar slots de fechas pasadas');
  }

  return await DoctorAvailability.getAvailableSlots(doctorProfileId, targetDate);
}

// ═══════════════════════════════════════════════════════════════
// 14-15. GESTIÓN DE FOTOS
// ═══════════════════════════════════════════════════════════════

const MAX_PHOTOS = 10;

/**
 * Agrega una foto del consultorio
 */
async function uploadPhoto(doctorProfileId, photoUrl) {
  const profile = await DoctorProfile.findByPk(doctorProfileId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  // Validar URL
  try {
    new URL(photoUrl);
  } catch (e) {
    throw new Error('URL de foto inválida');
  }

  const photos = profile.officePhotos || [];

  if (photos.length >= MAX_PHOTOS) {
    throw new Error(`Máximo ${MAX_PHOTOS} fotos permitidas`);
  }

  if (photos.includes(photoUrl)) {
    throw new Error('Esta foto ya existe en el perfil');
  }

  photos.push(photoUrl);
  await profile.update({ officePhotos: photos });

  return photos;
}

/**
 * Elimina una foto del consultorio
 */
async function deletePhoto(doctorProfileId, photoUrl) {
  const profile = await DoctorProfile.findByPk(doctorProfileId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  const photos = profile.officePhotos || [];
  const index = photos.indexOf(photoUrl);

  if (index === -1) {
    throw new Error('Foto no encontrada en el perfil');
  }

  photos.splice(index, 1);
  await profile.update({ officePhotos: photos });

  return photos;
}

// ═══════════════════════════════════════════════════════════════
// 16. CÁLCULO DE COMPLETITUD DEL PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula el porcentaje de completitud del perfil
 */
async function calculateProfileCompleteness(doctorProfileId) {
  const profile = await DoctorProfile.findByPk(doctorProfileId);

  if (!profile) {
    throw new Error('Perfil no encontrado');
  }

  let percentage = 0;
  const missing = [];

  // === BÁSICO (30%) ===
  // Bio (10%)
  if (profile.bio && profile.bio.length >= 50) {
    percentage += 10;
  } else {
    missing.push('Biografía profesional (mínimo 50 caracteres)');
  }

  // Años de experiencia (5%)
  if (profile.experienceYears && profile.experienceYears > 0) {
    percentage += 5;
  } else {
    missing.push('Años de experiencia');
  }

  // Tarifa de consulta (10%)
  if (profile.consultationFee && parseFloat(profile.consultationFee) > 0) {
    percentage += 10;
  } else {
    missing.push('Tarifa de consulta');
  }

  // Idiomas (5%)
  if (profile.languages && profile.languages.length > 0) {
    percentage += 5;
  } else {
    missing.push('Idiomas que habla');
  }

  // === ESPECIALIDADES (20%) ===
  const specialtiesCount = await DoctorSpecialty.count({
    where: { doctorProfileId }
  });

  if (specialtiesCount >= 1) {
    percentage += 20;
  } else {
    missing.push('Al menos una especialidad');
  }

  // === EDUCACIÓN (15%) ===
  const educationCount = await DoctorEducation.count({
    where: { doctorProfileId }
  });

  if (educationCount >= 1) {
    percentage += 15;
  } else {
    missing.push('Historial educativo');
  }

  // === EXPERIENCIA (15%) ===
  const experienceCount = await DoctorExperience.count({
    where: { doctorProfileId }
  });

  if (experienceCount >= 1) {
    percentage += 15;
  } else {
    missing.push('Experiencia laboral');
  }

  // === UBICACIÓN (10%) ===
  const hasLocation = profile.clinicAddress && profile.city &&
    (profile.officeLatitude || (profile.coordinates && profile.coordinates.lat));

  if (hasLocation) {
    percentage += 10;
  } else {
    missing.push('Ubicación del consultorio con dirección y coordenadas');
  }

  // === DISPONIBILIDAD (10%) ===
  const availabilityCount = await DoctorAvailability.count({
    where: { doctorProfileId, isActive: true }
  });

  if (availabilityCount >= 1) {
    percentage += 10;
  } else {
    missing.push('Horarios de disponibilidad');
  }

  return {
    percentage: Math.min(100, percentage),
    missing,
    isComplete: percentage >= 100
  };
}

/**
 * Actualiza el campo profileCompleteness del doctor
 */
async function updateProfileCompleteness(doctorProfileId) {
  const { percentage } = await calculateProfileCompleteness(doctorProfileId);

  await DoctorProfile.update(
    { profileCompleteness: percentage },
    { where: { id: doctorProfileId } }
  );

  return percentage;
}

// ═══════════════════════════════════════════════════════════════
// BÚSQUEDA Y FILTRADO
// ═══════════════════════════════════════════════════════════════

/**
 * Busca doctores con filtros
 */
async function searchDoctors(filters = {}, pagination = {}) {
  const {
    query,
    specialtyId,
    city,
    state,
    acceptsInsurance,
    telemedicine,
    maxFee,
    minRating,
    acceptingNewPatients
  } = filters;

  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  const where = {
    profileStatus: 'active',
    isVerified: true
  };

  if (specialtyId) {
    where.specialtyId = specialtyId;
  }

  if (city) {
    where.city = { [Op.iLike]: `%${city}%` };
  }

  if (state) {
    where.state = { [Op.iLike]: `%${state}%` };
  }

  if (acceptsInsurance !== undefined) {
    where.acceptsInsurance = acceptsInsurance;
  }

  if (telemedicine !== undefined) {
    where.telemedicineEnabled = telemedicine;
  }

  if (maxFee) {
    where.consultationFee = { [Op.lte]: maxFee };
  }

  if (minRating) {
    where.averageRating = { [Op.gte]: minRating };
  }

  if (acceptingNewPatients !== undefined) {
    where.acceptingNewPatients = acceptingNewPatients;
  }

  // Búsqueda por texto
  if (query) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${query}%` } },
      { lastName: { [Op.iLike]: `%${query}%` } },
      { bio: { [Op.iLike]: `%${query}%` } },
      { searchKeywords: { [Op.contains]: [query.toLowerCase()] } }
    ];
  }

  const { rows: doctors, count } = await DoctorProfile.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName']
      },
      {
        model: Specialty,
        as: 'specialty',
        attributes: ['id', 'name', 'slug', 'icon']
      }
    ],
    order: [['averageRating', 'DESC'], ['totalAppointments', 'DESC']],
    limit,
    offset
  });

  return {
    doctors,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
}

/**
 * Busca doctores cercanos a una ubicación
 */
async function findNearby(latitude, longitude, radiusKm = 10, filters = {}) {
  const { limit = 20, specialtyId } = filters;

  // Usar la función SQL de distancia
  const query = `
    SELECT dp.*,
           calculate_distance($1, $2, dp.office_latitude, dp.office_longitude) as distance
    FROM doctor_profiles dp
    WHERE dp.profile_status = 'active'
      AND dp.is_verified = true
      AND dp.office_latitude IS NOT NULL
      AND dp.office_longitude IS NOT NULL
      AND calculate_distance($1, $2, dp.office_latitude, dp.office_longitude) <= $3
      ${specialtyId ? 'AND dp.specialty_id = $4' : ''}
    ORDER BY distance ASC
    LIMIT $${specialtyId ? 5 : 4}
  `;

  const params = specialtyId
    ? [latitude, longitude, radiusKm, specialtyId, limit]
    : [latitude, longitude, radiusKm, limit];

  const [results] = await db.sequelize.query(query, {
    bind: params
  });

  return results;
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN DE CACHÉ DE BÚSQUEDA
// ═══════════════════════════════════════════════════════════════

/**
 * Sincroniza un perfil de doctor con la caché de búsqueda
 * Solo incluye médicos REALES (no mocks/test)
 * @param {number} doctorProfileId - ID del perfil del doctor
 */
async function syncSearchCache(doctorProfileId) {
  try {
    const profile = await DoctorProfile.findByPk(doctorProfileId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        {
          model: DoctorSpecialty,
          as: 'doctorSpecialties',
          include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!profile || !profile.user) {
      console.log(`syncSearchCache: No se encontró perfil ${doctorProfileId}`);
      return;
    }

    // Verificar si es un email de prueba/mock/sembrado - NO incluir en cache
    // EXCEPCIÓN: Usuarios estándar de prueba del seeder oficial
    const email = profile.user.email?.toLowerCase() || '';
    const standardTestEmails = [
      'doctor@citamed.ve',
      'paciente@citamed.ve',
      'proveedor@citamed.ve',
      'admin@citamed.ve'
    ];

    const isStandardTestUser = standardTestEmails.includes(email);
    const isMockEmail = !isStandardTestUser && (
      email.includes('@test') ||
      email.includes('@example') ||
      email.includes('@mock') ||
      email.includes('@citamed.ve') ||
      email.includes('fake') ||
      email.includes('demo') ||
      email.includes('prueba') ||
      email.includes('localhost')
    );

    if (isMockEmail) {
      // Eliminar del cache si existe (por si se agregó antes)
      await db.sequelize.query(
        'DELETE FROM doctor_search_cache WHERE doctor_profile_id = $1',
        { bind: [doctorProfileId] }
      );
      console.log(`syncSearchCache: Email de prueba detectado, no se incluye en cache (${email})`);
      return;
    }

    // Preparar datos
    const fullName = `${profile.firstName || profile.user.firstName} ${profile.lastName || profile.user.lastName}`.trim();
    const specialtiesText = profile.doctorSpecialties?.map(ds => ds.specialty?.name).filter(Boolean) || [];
    const specialtyIds = profile.doctorSpecialties?.map(ds => ds.specialtyId).filter(Boolean) || [];

    // Verificar si ya existe en caché
    const [existing] = await db.sequelize.query(
      'SELECT doctor_profile_id FROM doctor_search_cache WHERE doctor_profile_id = $1',
      { bind: [doctorProfileId] }
    );

    if (existing.length > 0) {
      // Actualizar
      await db.sequelize.query(`
        UPDATE doctor_search_cache SET
          full_name = $1,
          specialties_text = $2,
          specialty_ids = $3,
          city = $4,
          state = $5,
          country = $6,
          consultation_price_online = $7,
          consultation_price_in_person = $8,
          latitude = $9,
          longitude = $10,
          years_of_experience = $11,
          accepts_insurance = $12,
          languages = $13,
          reputation_level = $14,
          average_rating = $15,
          total_reviews = $16,
          accepts_new_patients = $17,
          is_verified = $18,
          profile_photo = $19,
          updated_at = NOW()
        WHERE doctor_profile_id = $20
      `, {
        bind: [
          fullName,
          specialtiesText,
          specialtyIds,
          profile.city,
          profile.state,
          profile.country || 'Venezuela',
          profile.priceTeleconsultation,
          profile.consultationFee,
          profile.officeLatitude,
          profile.officeLongitude,
          profile.experienceYears || 0,
          profile.acceptsInsurance || false,
          profile.languages || ['Español'],
          profile.reputationLevel || 'new',
          profile.averageRating || 0,
          profile.totalReviews || 0,
          profile.acceptingNewPatients !== false,
          profile.isVerified || false,
          profile.profilePhoto,
          doctorProfileId
        ]
      });
      console.log(`syncSearchCache: Actualizado doctor ${doctorProfileId}`);
    } else {
      // Insertar nuevo
      await db.sequelize.query(`
        INSERT INTO doctor_search_cache (
          doctor_id, doctor_profile_id, full_name, specialties_text, specialty_ids,
          city, state, country, consultation_price_online, consultation_price_in_person,
          latitude, longitude, years_of_experience, accepts_insurance, languages,
          reputation_level, average_rating, total_reviews, accepts_new_patients,
          is_verified, profile_photo, has_availability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, true)
      `, {
        bind: [
          profile.userId,
          doctorProfileId,
          fullName,
          specialtiesText,
          specialtyIds,
          profile.city,
          profile.state,
          profile.country || 'Venezuela',
          profile.priceTeleconsultation,
          profile.consultationFee,
          profile.officeLatitude,
          profile.officeLongitude,
          profile.experienceYears || 0,
          profile.acceptsInsurance || false,
          profile.languages || ['Español'],
          profile.reputationLevel || 'new',
          profile.averageRating || 0,
          profile.totalReviews || 0,
          profile.acceptingNewPatients !== false,
          profile.isVerified || false,
          profile.profilePhoto
        ]
      });
      console.log(`syncSearchCache: Insertado doctor ${doctorProfileId}`);
    }
  } catch (error) {
    console.error('Error sincronizando caché de búsqueda:', error.message);
    // No lanzar error para no interrumpir la operación principal
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Perfil completo
  getCompleteProfile,
  getPublicProfile,

  // Información básica
  updateBasicInfo,
  updateLocation,

  // Especialidades
  addSpecialty,
  removeSpecialty,
  getSpecialties,

  // Educación
  addEducation,
  updateEducation,
  deleteEducation,
  getEducation,

  // Experiencia
  addExperience,
  updateExperience,
  deleteExperience,
  getExperience,

  // Disponibilidad
  setAvailability,
  getAvailability,
  getWeeklySummary,
  getAvailableSlots,

  // Fotos
  uploadPhoto,
  deletePhoto,

  // Completitud
  calculateProfileCompleteness,
  updateProfileCompleteness,

  // Búsqueda
  searchDoctors,
  findNearby,

  // Sincronización caché
  syncSearchCache
};
