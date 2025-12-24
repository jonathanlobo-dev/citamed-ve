// src/services/sessionService.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Servicio frontend para gestión de sesiones

import api from './api';

const sessionService = {
  /**
   * Obtiene todas las sesiones activas del usuario
   * @returns {Promise<Object>} Lista de sesiones
   */
  async getActiveSessions() {
    try {
      const response = await api.get('/sessions/active');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Revoca (cierra) una sesión específica
   * @param {string} sessionId - ID de la sesión a revocar
   * @returns {Promise<Object>} Resultado de la operación
   */
  async revokeSession(sessionId) {
    try {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error revocando sesión:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Revoca todas las sesiones excepto la actual
   * @returns {Promise<Object>} Resultado con cantidad de sesiones revocadas
   */
  async revokeAllSessions() {
    try {
      const response = await api.delete('/sessions/revoke-all');
      return response.data;
    } catch (error) {
      console.error('Error revocando todas las sesiones:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Obtiene el historial de inicios de sesión
   * @param {number} limit - Límite de registros (default 20)
   * @param {number} offset - Offset para paginación (default 0)
   * @returns {Promise<Object>} Historial paginado
   */
  async getLoginHistory(limit = 20, offset = 0) {
    try {
      const response = await api.get('/sessions/login-history', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Detecta sesiones sospechosas
   * @returns {Promise<Object>} Lista de sesiones sospechosas
   */
  async getSuspiciousSessions() {
    try {
      const response = await api.get('/sessions/suspicious');
      return response.data;
    } catch (error) {
      console.error('Error detectando sesiones sospechosas:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Obtiene estadísticas de login
   * @returns {Promise<Object>} Estadísticas
   */
  async getLoginStats() {
    try {
      const response = await api.get('/sessions/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error.response?.data || { success: false, error: 'Error de conexión' };
    }
  },

  /**
   * Cierra la sesión actual (logout)
   * @returns {Promise<Object>} Resultado
   */
  async logout() {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      console.error('Error en logout:', error);
      // Aunque falle el logout en el servidor, limpiamos localmente
      return { success: true };
    }
  }
};

export default sessionService;
