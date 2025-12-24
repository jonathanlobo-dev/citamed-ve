/**
 * Reviews Service - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Servicio para gestión de reviews y reputación
 */

import api from './api';

// ═══════════════════════════════════════════════════════════════
// REVIEWS PUBLICOS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene reviews públicos de un doctor
 * @param {number} doctorProfileId - ID del perfil del doctor
 * @param {Object} filters - Filtros (rating, sortBy, hasComment)
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Lista de reviews con paginación
 */
export const getPublicReviews = async (doctorProfileId, filters = {}, pagination = {}) => {
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

  const response = await api.get(`/reviews/doctor/${doctorProfileId}`, { params });
  return response.data;
};

/**
 * Obtiene estadísticas públicas de reviews de un doctor
 * @param {number} doctorProfileId - ID del perfil del doctor
 * @returns {Promise<Object>} Estadísticas de reviews
 */
export const getPublicStats = async (doctorProfileId) => {
  const response = await api.get(`/reviews/doctor/${doctorProfileId}/stats`);
  return response.data;
};

/**
 * Obtiene información de reputación pública de un doctor
 * @param {number} doctorProfileId - ID del perfil del doctor
 * @returns {Promise<Object>} Datos de reputación
 */
export const getPublicReputation = async (doctorProfileId) => {
  const response = await api.get(`/reviews/doctor/${doctorProfileId}/reputation`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// REVIEWS DE PACIENTE
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un nuevo review para una cita
 * @param {Object} reviewData - Datos del review
 * @returns {Promise<Object>} Review creado
 */
export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

/**
 * Actualiza un review propio (solo dentro de 7 días)
 * @param {number} reviewId - ID del review
 * @param {Object} updates - Datos a actualizar
 * @returns {Promise<Object>} Review actualizado
 */
export const updateReview = async (reviewId, updates) => {
  const response = await api.put(`/reviews/${reviewId}`, updates);
  return response.data;
};

/**
 * Elimina un review propio (solo dentro de 7 días)
 * @param {number} reviewId - ID del review
 * @returns {Promise<Object>} Confirmación
 */
export const deleteReview = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}`);
  return response.data;
};

/**
 * Obtiene reviews del paciente autenticado
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Lista de reviews del paciente
 */
export const getMyReviews = async (pagination = {}) => {
  const response = await api.get('/reviews/my-reviews', { params: pagination });
  return response.data;
};

/**
 * Verifica si el paciente puede dejar review para una cita
 * @param {number} appointmentId - ID de la cita
 * @returns {Promise<Object>} Estado de permiso
 */
export const canLeaveReview = async (appointmentId) => {
  const response = await api.get(`/reviews/can-review/${appointmentId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// VOTOS
// ═══════════════════════════════════════════════════════════════

/**
 * Vota si un review fue útil o no
 * @param {number} reviewId - ID del review
 * @param {boolean} isHelpful - Si fue útil
 * @returns {Promise<Object>} Resultado del voto
 */
export const voteHelpful = async (reviewId, isHelpful) => {
  const response = await api.post(`/reviews/${reviewId}/vote`, { isHelpful });
  return response.data;
};

/**
 * Elimina voto de un review
 * @param {number} reviewId - ID del review
 * @returns {Promise<Object>} Confirmación
 */
export const removeVote = async (reviewId) => {
  const response = await api.delete(`/reviews/${reviewId}/vote`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// REPORTAR
// ═══════════════════════════════════════════════════════════════

/**
 * Reporta un review inapropiado
 * @param {number} reviewId - ID del review
 * @param {string} reason - Razón del reporte
 * @returns {Promise<Object>} Confirmación
 */
export const flagReview = async (reviewId, reason) => {
  const response = await api.post(`/reviews/${reviewId}/flag`, { reason });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PARA MÉDICOS
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene reviews recibidos como médico
 * @param {Object} filters - Filtros de búsqueda
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Lista de reviews
 */
export const getDoctorReviews = async (filters = {}, pagination = {}) => {
  const params = {
    ...filters,
    ...pagination
  };

  const response = await api.get('/reviews/doctor-dashboard/my-reviews', { params });
  return response.data;
};

/**
 * Responde a un review como médico
 * @param {number} reviewId - ID del review
 * @param {string} reply - Texto de la respuesta
 * @returns {Promise<Object>} Review actualizado
 */
export const replyToReview = async (reviewId, reply) => {
  const response = await api.post(`/reviews/${reviewId}/reply`, { reply });
  return response.data;
};

/**
 * Obtiene estadísticas del médico autenticado
 * @returns {Promise<Object>} Estadísticas de reviews
 */
export const getDoctorStats = async () => {
  const response = await api.get('/reviews/doctor-dashboard/stats');
  return response.data;
};

/**
 * Obtiene progreso de reputación del médico
 * @returns {Promise<Object>} Insights de reputación
 */
export const getReputationProgress = async () => {
  const response = await api.get('/reviews/doctor-dashboard/reputation');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// FUNCIONES PARA ADMIN
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene reviews reportados para moderación
 * @param {Object} pagination - Opciones de paginación
 * @returns {Promise<Object>} Lista de reviews reportados
 */
export const getFlaggedReviews = async (pagination = {}) => {
  const response = await api.get('/reviews/admin/flagged', { params: pagination });
  return response.data;
};

/**
 * Modera un review
 * @param {number} reviewId - ID del review
 * @param {string} action - Acción (approve, hide, delete)
 * @param {string} reason - Razón opcional
 * @returns {Promise<Object>} Review moderado
 */
export const moderateReview = async (reviewId, action, reason = null) => {
  const response = await api.post(`/reviews/${reviewId}/moderate`, { action, reason });
  return response.data;
};

/**
 * Recalcula ratings de un doctor
 * @param {number} doctorProfileId - ID del perfil del doctor
 * @returns {Promise<Object>} Confirmación
 */
export const recalculateRatings = async (doctorProfileId) => {
  const response = await api.post(`/reviews/admin/recalculate/${doctorProfileId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Formatea el nombre del nivel de reputación
 */
export const formatReputationLevel = (level) => {
  const levels = {
    new: 'Nuevo',
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    platinum: 'Platino'
  };
  return levels[level] || level;
};

/**
 * Obtiene el color del nivel de reputación
 */
export const getReputationColor = (level) => {
  const colors = {
    new: '#9CA3AF',      // gray-400
    bronze: '#CD7F32',   // bronze
    silver: '#C0C0C0',   // silver
    gold: '#FFD700',     // gold
    platinum: '#E5E4E2'  // platinum
  };
  return colors[level] || colors.new;
};

/**
 * Obtiene el color de fondo del nivel
 */
export const getReputationBgColor = (level) => {
  const colors = {
    new: 'bg-gray-100',
    bronze: 'bg-amber-100',
    silver: 'bg-slate-100',
    gold: 'bg-yellow-100',
    platinum: 'bg-purple-100'
  };
  return colors[level] || colors.new;
};

/**
 * Obtiene el color del texto del nivel
 */
export const getReputationTextColor = (level) => {
  const colors = {
    new: 'text-gray-700',
    bronze: 'text-amber-800',
    silver: 'text-slate-700',
    gold: 'text-yellow-800',
    platinum: 'text-purple-800'
  };
  return colors[level] || colors.new;
};

/**
 * Formatea fecha relativa
 */
export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Hoy';
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return `Hace ${diffDays} días`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  }
};

/**
 * Calcula el porcentaje de progreso hacia el siguiente nivel
 */
export const calculateLevelProgress = (current, required) => {
  if (!required) return 100;
  return Math.min(100, Math.round((current / required) * 100));
};

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

export default {
  // Públicos
  getPublicReviews,
  getPublicStats,
  getPublicReputation,

  // Paciente
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  canLeaveReview,

  // Votos
  voteHelpful,
  removeVote,

  // Reportar
  flagReview,

  // Médico
  getDoctorReviews,
  replyToReview,
  getDoctorStats,
  getReputationProgress,

  // Admin
  getFlaggedReviews,
  moderateReview,
  recalculateRatings,

  // Utilidades
  formatReputationLevel,
  getReputationColor,
  getReputationBgColor,
  getReputationTextColor,
  formatRelativeDate,
  calculateLevelProgress
};
