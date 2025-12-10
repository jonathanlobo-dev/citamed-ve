// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Obtener todas las especialidades
export const getSpecialties = async () => {
  try {
    const response = await api.get('/specialties');
    return response.data;
  } catch (error) {
    console.error('Error fetching specialties:', error);
    throw error;
  }
};

// Buscar especialidades
export const searchSpecialties = async (query) => {
  try {
    const response = await api.get('/specialties/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching specialties:', error);
    throw error;
  }
};

// Obtener estadísticas
export const getStats = async () => {
  try {
    const response = await api.get('/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
};

export default api;