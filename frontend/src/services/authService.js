/**
 * Auth Service - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Servicio de autenticación con métodos para:
 * - Registro multi-paso (patient, doctor, provider)
 * - Verificación de disponibilidad (email, cédula)
 * - Login/Logout
 */

import api from './api';

/**
 * Servicio de autenticación
 */
const authService = {
  /**
   * Login de usuario (paso 1)
   * @param {Object} credentials - { email, password }
   * @returns {Promise} Respuesta del servidor
   * Puede retornar { requires2FA: true, userId } si el usuario tiene 2FA
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Login con verificación 2FA (paso 2)
   * @param {number} userId - ID del usuario
   * @param {string} token - Código TOTP o backup code
   * @returns {Promise} Respuesta del servidor con token JWT
   */
  loginWith2FA: async (userId, token) => {
    const response = await api.post('/auth/login/2fa', { userId, token });
    return response.data;
  },

  /**
   * Registro genérico (legacy)
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} Respuesta del servidor
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Registro de paciente (multi-paso)
   * @param {Object} data - Todos los datos del wizard de paciente
   * @returns {Promise} Respuesta del servidor
   */
  registerPatient: async (data) => {
    const response = await api.post('/auth/register/patient', data);
    return response.data;
  },

  /**
   * Registro de médico (multi-paso)
   * @param {Object} data - Todos los datos del wizard de médico
   * @returns {Promise} Respuesta del servidor
   */
  registerDoctor: async (data) => {
    const response = await api.post('/auth/register/doctor', data);
    return response.data;
  },

  /**
   * Registro de proveedor (multi-paso)
   * @param {Object} data - Todos los datos del wizard de proveedor
   * @returns {Promise} Respuesta del servidor
   */
  registerProvider: async (data) => {
    const response = await api.post('/auth/register/provider', data);
    return response.data;
  },

  /**
   * Verificar disponibilidad de email
   * @param {string} email - Email a verificar
   * @returns {Promise<{available: boolean, exists: boolean}>}
   */
  checkEmail: async (email) => {
    const response = await api.get('/auth/check-email', { params: { email } });
    return response.data;
  },

  /**
   * Verificar disponibilidad de cédula
   * @param {string} cedula - Cédula a verificar
   * @returns {Promise<{available: boolean, exists: boolean}>}
   */
  checkCedula: async (cedula) => {
    const response = await api.get('/auth/check-cedula', { params: { cedula } });
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   * @returns {Promise} Perfil del usuario
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Logout - Limpia tokens locales
   */
  logout: () => {
    localStorage.removeItem('citamed_token');
    localStorage.removeItem('citamed_user');
    // Limpiar datos de wizards guardados
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('citamed_wizard_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

export default authService;
