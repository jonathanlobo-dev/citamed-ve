/**
 * Search Service - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Servicio frontend para búsqueda de médicos
 */

import api from './api';

const API_BASE = '/search';

/**
 * Buscar médicos con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Object>}
 */
export const searchDoctors = async (filters = {}) => {
  try {
    // Construir query params
    const params = new URLSearchParams();

    if (filters.query) params.append('query', filters.query);
    if (filters.specialtyIds?.length) {
      filters.specialtyIds.forEach(id => params.append('specialtyIds', id));
    }
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice);
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating);
    if (filters.minExperience !== undefined) params.append('minExperience', filters.minExperience);
    if (filters.languages?.length) {
      filters.languages.forEach(lang => params.append('languages', lang));
    }
    if (filters.acceptsInsurance !== undefined) params.append('acceptsInsurance', filters.acceptsInsurance);
    if (filters.insuranceNames?.length) {
      filters.insuranceNames.forEach(name => params.append('insuranceNames', name));
    }
    if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified);
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.reputationLevels?.length) {
      filters.reputationLevels.forEach(level => params.append('reputationLevels', level));
    }
    if (filters.hasAvailability !== undefined) params.append('hasAvailability', filters.hasAvailability);
    if (filters.acceptsNewPatients !== undefined) params.append('acceptsNewPatients', filters.acceptsNewPatients);
    if (filters.userLat !== undefined) params.append('userLat', filters.userLat);
    if (filters.userLng !== undefined) params.append('userLng', filters.userLng);
    if (filters.maxDistance !== undefined) params.append('maxDistance', filters.maxDistance);
    if (filters.consultationType) params.append('consultationType', filters.consultationType);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`${API_BASE}/doctors?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Search doctors error:', error);
    throw error;
  }
};

/**
 * Búsqueda rápida para autocomplete
 * @param {string} query - Texto de búsqueda
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Object>}
 */
export const quickSearch = async (query, limit = 5) => {
  try {
    const response = await api.get(`${API_BASE}/quick`, {
      params: { query, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Quick search error:', error);
    throw error;
  }
};

/**
 * Obtener especialidades
 * @param {string} query - Texto de búsqueda opcional
 * @returns {Promise<Object>}
 */
export const getSpecialties = async (query = '') => {
  try {
    const response = await api.get(`${API_BASE}/specialties`, {
      params: query ? { query } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Get specialties error:', error);
    throw error;
  }
};

/**
 * Obtener ciudades
 * @param {string} query - Texto de búsqueda opcional
 * @param {string} state - Estado para filtrar
 * @returns {Promise<Object>}
 */
export const getCities = async (query = '', state = '') => {
  try {
    const params = {};
    if (query) params.query = query;
    if (state) params.state = state;
    const response = await api.get(`${API_BASE}/cities`, { params });
    return response.data;
  } catch (error) {
    console.error('Get cities error:', error);
    throw error;
  }
};

/**
 * Obtener estados
 * @param {string} query - Texto de búsqueda opcional
 * @returns {Promise<Object>}
 */
export const getStates = async (query = '') => {
  try {
    const response = await api.get(`${API_BASE}/states`, {
      params: query ? { query } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Get states error:', error);
    throw error;
  }
};

/**
 * Obtener proveedores de seguros
 * @returns {Promise<Object>}
 */
export const getInsuranceProviders = async () => {
  try {
    const response = await api.get(`${API_BASE}/insurance-providers`);
    return response.data;
  } catch (error) {
    console.error('Get insurance providers error:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas de búsqueda
 * @returns {Promise<Object>}
 */
export const getSearchStats = async () => {
  try {
    const response = await api.get(`${API_BASE}/stats`);
    return response.data;
  } catch (error) {
    console.error('Get search stats error:', error);
    throw error;
  }
};

/**
 * Formatea los niveles de reputación para mostrar
 */
export const REPUTATION_LEVELS = {
  new: { label: 'Nuevo', color: 'gray', icon: 'star' },
  bronze: { label: 'Bronce', color: 'amber-700', icon: 'award' },
  silver: { label: 'Plata', color: 'gray-400', icon: 'award' },
  gold: { label: 'Oro', color: 'yellow-500', icon: 'crown' },
  platinum: { label: 'Platino', color: 'purple-500', icon: 'gem' }
};

/**
 * Opciones de ordenamiento
 */
export const SORT_OPTIONS = [
  { value: 'average_rating', label: 'Mejor valorados' },
  { value: 'total_reviews', label: 'Más reseñas' },
  { value: 'years_of_experience', label: 'Más experiencia' },
  { value: 'consultation_price_online', label: 'Precio (menor a mayor)' },
  { value: 'distance', label: 'Más cercanos' }
];

/**
 * Tipos de consulta
 */
export const CONSULTATION_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'online', label: 'Teleconsulta' },
  { value: 'in_person', label: 'Presencial' }
];

/**
 * Rangos de precio predefinidos
 */
export const PRICE_RANGES = [
  { min: 0, max: 20, label: 'Hasta $20' },
  { min: 20, max: 50, label: '$20 - $50' },
  { min: 50, max: 100, label: '$50 - $100' },
  { min: 100, max: null, label: 'Más de $100' }
];

/**
 * Rangos de experiencia
 */
export const EXPERIENCE_RANGES = [
  { min: 0, label: 'Cualquiera' },
  { min: 1, label: '1+ años' },
  { min: 5, label: '5+ años' },
  { min: 10, label: '10+ años' },
  { min: 20, label: '20+ años' }
];

/**
 * Rangos de distancia
 */
export const DISTANCE_RANGES = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' }
];

export default {
  searchDoctors,
  quickSearch,
  getSpecialties,
  getCities,
  getStates,
  getInsuranceProviders,
  getSearchStats,
  REPUTATION_LEVELS,
  SORT_OPTIONS,
  CONSULTATION_TYPES,
  PRICE_RANGES,
  EXPERIENCE_RANGES,
  DISTANCE_RANGES
};
