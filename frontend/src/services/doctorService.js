/**
 * Doctor Service - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Servicio para gestión de perfiles médicos
 */

import api from './api';

// ═══════════════════════════════════════════════════════════════
// PERFIL PÚBLICO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene perfil público de un doctor
 * @param {number} doctorId - ID del perfil del doctor
 * @returns {Promise<Object>} Perfil completo
 */
export const getProfile = async (doctorId) => {
  const response = await api.get(`/doctors/${doctorId}`);
  return response.data;
};

/**
 * Busca doctores con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Lista de doctores y paginación
 */
export const searchDoctors = async (filters = {}, pagination = {}) => {
  const params = {
    ...filters,
    ...pagination
  };

  // Limpiar parámetros vacíos
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });

  const response = await api.get('/doctors/search', { params });
  return response.data;
};

/**
 * Busca doctores cercanos a una ubicación
 * @param {number} latitude - Latitud
 * @param {number} longitude - Longitud
 * @param {number} radius - Radio en km
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Lista de doctores cercanos
 */
export const findNearbyDoctors = async (latitude, longitude, radius = 10, options = {}) => {
  const params = {
    latitude,
    longitude,
    radius,
    ...options
  };

  const response = await api.get('/doctors/nearby', { params });
  return response.data;
};

/**
 * Obtiene disponibilidad semanal de un doctor
 * @param {number} doctorId - ID del doctor
 * @returns {Promise<Object>} Resumen semanal de disponibilidad
 */
export const getAvailability = async (doctorId) => {
  const response = await api.get(`/doctors/${doctorId}/availability`);
  return response.data;
};

/**
 * Obtiene slots disponibles para una fecha
 * @param {number} doctorId - ID del doctor
 * @param {string} date - Fecha (YYYY-MM-DD)
 * @returns {Promise<Object>} Lista de slots disponibles
 */
export const getAvailableSlots = async (doctorId, date) => {
  const response = await api.get(`/doctors/${doctorId}/slots`, {
    params: { date }
  });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// MI PERFIL (DOCTOR AUTENTICADO)
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene perfil del doctor autenticado
 * @returns {Promise<Object>} Perfil completo con completitud
 */
export const getMyProfile = async () => {
  const response = await api.get('/doctors/me');
  return response.data;
};

/**
 * Actualiza información básica del perfil
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateProfile = async (data) => {
  const response = await api.put('/doctors/me', data);
  return response.data;
};

/**
 * Actualiza ubicación del consultorio
 * @param {Object} locationData - Datos de ubicación
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateLocation = async (locationData) => {
  const response = await api.put('/doctors/me/location', locationData);
  return response.data;
};

/**
 * Obtiene porcentaje de completitud del perfil
 * @returns {Promise<Object>} Porcentaje y campos faltantes
 */
export const getCompleteness = async () => {
  const response = await api.get('/doctors/me/completeness');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// ESPECIALIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene especialidades del doctor
 * @returns {Promise<Object>} Lista de especialidades
 */
export const getMySpecialties = async () => {
  const response = await api.get('/doctors/me/specialties');
  return response.data;
};

/**
 * Agrega una especialidad
 * @param {Object} specialtyData - Datos de la especialidad
 * @returns {Promise<Object>} Especialidad agregada
 */
export const addSpecialty = async (specialtyData) => {
  const response = await api.post('/doctors/me/specialties', specialtyData);
  return response.data;
};

/**
 * Elimina una especialidad
 * @param {number} specialtyId - ID de la especialidad
 * @returns {Promise<Object>} Confirmación
 */
export const removeSpecialty = async (specialtyId) => {
  const response = await api.delete(`/doctors/me/specialties/${specialtyId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// EDUCACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega registro de educación
 * @param {Object} educationData - Datos de educación
 * @returns {Promise<Object>} Educación agregada
 */
export const addEducation = async (educationData) => {
  const response = await api.post('/doctors/me/education', educationData);
  return response.data;
};

/**
 * Actualiza registro de educación
 * @param {number} educationId - ID del registro
 * @param {Object} educationData - Datos actualizados
 * @returns {Promise<Object>} Educación actualizada
 */
export const updateEducation = async (educationId, educationData) => {
  const response = await api.put(`/doctors/me/education/${educationId}`, educationData);
  return response.data;
};

/**
 * Elimina registro de educación
 * @param {number} educationId - ID del registro
 * @returns {Promise<Object>} Confirmación
 */
export const deleteEducation = async (educationId) => {
  const response = await api.delete(`/doctors/me/education/${educationId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// EXPERIENCIA
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega experiencia laboral
 * @param {Object} experienceData - Datos de experiencia
 * @returns {Promise<Object>} Experiencia agregada
 */
export const addExperience = async (experienceData) => {
  const response = await api.post('/doctors/me/experience', experienceData);
  return response.data;
};

/**
 * Actualiza experiencia laboral
 * @param {number} experienceId - ID del registro
 * @param {Object} experienceData - Datos actualizados
 * @returns {Promise<Object>} Experiencia actualizada
 */
export const updateExperience = async (experienceId, experienceData) => {
  const response = await api.put(`/doctors/me/experience/${experienceId}`, experienceData);
  return response.data;
};

/**
 * Elimina experiencia laboral
 * @param {number} experienceId - ID del registro
 * @returns {Promise<Object>} Confirmación
 */
export const deleteExperience = async (experienceId) => {
  const response = await api.delete(`/doctors/me/experience/${experienceId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// DISPONIBILIDAD
// ═══════════════════════════════════════════════════════════════

/**
 * Establece disponibilidad semanal
 * @param {Array} schedules - Array de horarios
 * @returns {Promise<Object>} Disponibilidad actualizada
 */
export const setAvailability = async (schedules) => {
  const response = await api.post('/doctors/me/availability', { schedules });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// FOTOS
// ═══════════════════════════════════════════════════════════════

/**
 * Sube foto de perfil del doctor (FormData)
 * @param {File} file - Archivo de imagen
 * @returns {Promise<Object>} URL de la foto subida
 */
export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('profilePhoto', file);

  const response = await api.post('/doctors/me/profile-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Sube una foto del consultorio
 * @param {string} photoUrl - URL de la foto
 * @returns {Promise<Object>} Lista de fotos actualizada
 */
export const uploadPhoto = async (photoUrl) => {
  const response = await api.post('/doctors/me/photos', { photoUrl });
  return response.data;
};

/**
 * Elimina una foto del consultorio
 * @param {string} photoUrl - URL de la foto a eliminar
 * @returns {Promise<Object>} Lista de fotos actualizada
 */
export const deletePhoto = async (photoUrl) => {
  const response = await api.delete('/doctors/me/photos', {
    data: { photoUrl }
  });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Formatea el nombre del día de la semana
 */
export const getDayName = (dayOfWeek) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek] || '';
};

/**
 * Formatea la duración de experiencia
 */
export const formatDuration = (months) => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  }

  if (remainingMonths === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }

  return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
};

/**
 * Formatea el tipo de institución
 */
export const formatInstitutionType = (type) => {
  const types = {
    hospital_publico: 'Hospital Público',
    hospital_privado: 'Hospital Privado',
    clinica: 'Clínica',
    consultorio: 'Consultorio',
    centro_medico: 'Centro Médico',
    universidad: 'Universidad',
    laboratorio: 'Laboratorio',
    otro: 'Otro'
  };
  return types[type] || type;
};

/**
 * Formatea tipo de consulta
 */
export const formatConsultationType = (type) => {
  const types = {
    presencial: 'Presencial',
    telemedicina: 'Telemedicina',
    domicilio: 'A Domicilio',
    mixto: 'Mixto'
  };
  return types[type] || type;
};

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

export default {
  // Público
  getProfile,
  searchDoctors,
  findNearbyDoctors,
  getAvailability,
  getAvailableSlots,

  // Mi perfil
  getMyProfile,
  updateProfile,
  updateLocation,
  getCompleteness,

  // Especialidades
  getMySpecialties,
  addSpecialty,
  removeSpecialty,

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
  uploadProfilePhoto,
  uploadPhoto,
  deletePhoto,

  // Utilidades
  getDayName,
  formatDuration,
  formatInstitutionType,
  formatConsultationType
};
