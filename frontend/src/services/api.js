/**
 * 🔌 API SERVICE - CITAMED.VE
 * Conexión con el backend en Express
 */

import axios from 'axios';

// URL del backend (configurable por entorno, puerto 5000 en desarrollo)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token JWT en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('citamed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('citamed_token');
      localStorage.removeItem('citamed_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ====================================
// 🔐 AUTH ENDPOINTS
// ====================================

export const authAPI = {
  // Registro de nuevo usuario
  register: (userData) => api.post('/auth/register', userData),
  
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Obtener perfil actual
  getProfile: () => api.get('/auth/profile'),
  
  // Logout
  logout: () => {
    localStorage.removeItem('citamed_token');
    localStorage.removeItem('citamed_user');
    return Promise.resolve();
  },
};

// ====================================
// 👨‍⚕️ DOCTORS ENDPOINTS
// ====================================

export const doctorsAPI = {
  // Obtener todos los médicos
  getAll: (params) => api.get('/doctors', { params }),
  
  // Obtener médico por ID
  getById: (id) => api.get(`/doctors/${id}`),
  
  // Obtener médicos por especialidad
  getBySpecialty: (specialtyId) => api.get(`/doctors/specialty/${specialtyId}`),
  
  // Buscar médicos
  search: (query) => api.get('/doctors/search', { params: { q: query } }),
};

// ====================================
// 👤 PATIENTS ENDPOINTS
// ====================================

export const patientsAPI = {
  // Obtener perfil del paciente
  getProfile: () => api.get('/patients/profile'),
  
  // Actualizar perfil
  updateProfile: (data) => api.put('/patients/profile', data),
};

// ====================================
// 📅 APPOINTMENTS ENDPOINTS
// ====================================

export const appointmentsAPI = {
  // Crear nueva cita
  create: (appointmentData) => api.post('/appointments', appointmentData),
  
  // Obtener todas las citas del usuario
  getAll: () => api.get('/appointments'),
  
  // Obtener cita por ID
  getById: (id) => api.get(`/appointments/${id}`),
  
  // Cancelar cita
  cancel: (id) => api.delete(`/appointments/${id}`),
  
  // Actualizar estado de cita
  updateStatus: (id, status) => api.patch(`/appointments/${id}/status`, { status }),
};

// ====================================
// 🏥 SPECIALTIES ENDPOINTS
// ====================================

export const specialtiesAPI = {
  // Obtener todas las especialidades
  getAll: () => api.get('/specialties'),
  
  // Buscar especialidades
  search: (query) => api.get('/specialties/search', { params: { q: query } }),
};

// ====================================
// 🏥 PROFILES ENDPOINTS
// ====================================

export const profilesAPI = {
  // Obtener perfil por ID
  getById: (id) => api.get(`/profiles/${id}`),
  
  // Actualizar perfil
  update: (id, data) => api.put(`/profiles/${id}`, data),
};

// ====================================
// ❤️ HEALTH CHECK
// ====================================

export const healthAPI = {
  // Verificar que el backend está funcionando
  check: () => api.get('/health'),
  
  // Test de base de datos
  dbTest: () => api.get('/db-test'),
};

// Exportar instancia de axios por si se necesita
export default api;