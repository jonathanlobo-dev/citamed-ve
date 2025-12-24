/**
 * Specialties Service - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Servicio para catálogo de especialidades
 */

import api from './api';

/**
 * Obtiene lista de especialidades activas
 * @returns {Promise<Object>} Lista de especialidades
 */
export const getSpecialties = async () => {
  const response = await api.get('/specialties');
  return response.data;
};

/**
 * Obtiene categorías de especialidades
 * @returns {Promise<Object>} Lista de categorías
 */
export const getCategories = async () => {
  const response = await api.get('/specialties/categories');
  return response.data;
};

/**
 * Busca especialidades por nombre
 * @param {string} query - Texto a buscar
 * @returns {Promise<Object>} Lista de especialidades
 */
export const searchSpecialties = async (query) => {
  const response = await api.get('/specialties/search', {
    params: { q: query }
  });
  return response.data;
};

/**
 * Obtiene detalle de una especialidad
 * @param {number} id - ID de la especialidad
 * @returns {Promise<Object>} Detalle de la especialidad
 */
export const getSpecialty = async (id) => {
  const response = await api.get(`/specialties/${id}`);
  return response.data;
};

export default {
  getSpecialties,
  getCategories,
  searchSpecialties,
  getSpecialty
};
