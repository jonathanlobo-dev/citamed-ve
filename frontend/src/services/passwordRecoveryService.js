/**
 * Password Recovery Service - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Servicio para interactuar con API de recuperación de contraseña
 */

import api from './api';

const passwordRecoveryService = {
  /**
   * Solicita recuperación de contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<Object>} { success, message, devCode?, devToken? }
   */
  async requestReset(email) {
    const response = await api.post('/password-recovery/request', { email });
    return response.data;
  },

  /**
   * Verifica si un token es válido
   * @param {string} token - Token UUID de la URL
   * @returns {Promise<Object>} { success, valid, email?, reason? }
   */
  async verifyToken(token) {
    const response = await api.get('/password-recovery/verify-token', {
      params: { token }
    });
    return response.data;
  },

  /**
   * Verifica código de 6 dígitos
   * @param {string} email - Email del usuario
   * @param {string} code - Código de 6 dígitos
   * @returns {Promise<Object>} { success, valid, token?, reason? }
   */
  async verifyCode(email, code) {
    const response = await api.post('/password-recovery/verify-code', {
      email,
      code
    });
    return response.data;
  },

  /**
   * Cambia la contraseña
   * @param {string} token - Token de verificación
   * @param {string} newPassword - Nueva contraseña
   * @param {string} confirmPassword - Confirmación de contraseña
   * @returns {Promise<Object>} { success, message }
   */
  async resetPassword(token, newPassword, confirmPassword) {
    const response = await api.post('/password-recovery/reset', {
      token,
      newPassword,
      confirmPassword
    });
    return response.data;
  },

  /**
   * Valida fortaleza de contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Promise<Object>} { valid, strength, requirements }
   */
  async validatePassword(password) {
    const response = await api.post('/password-recovery/validate-password', {
      password
    });
    return response.data;
  }
};

export default passwordRecoveryService;
