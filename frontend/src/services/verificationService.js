// src/services/verificationService.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Servicio de verificación para frontend

import api from './api';

/**
 * Servicio de Verificación de Identidad
 */
const verificationService = {
  // ============================================================
  // EMAIL VERIFICATION
  // ============================================================

  /**
   * Envía código de verificación por email
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} { success, token, message, expiresAt }
   */
  async sendEmailVerification(userId) {
    const response = await api.post('/verification/send-email', { userId });
    return response.data;
  },

  /**
   * Verifica el código de email
   * @param {string} token - Token UUID
   * @param {string} code - Código de 6 dígitos
   * @returns {Promise<Object>} { success, message, user }
   */
  async verifyEmail(token, code) {
    const response = await api.post('/verification/verify-email', { token, code });
    return response.data;
  },

  /**
   * Reenvía código de verificación por email
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} { success, token, message }
   */
  async resendEmailVerification(userId) {
    const response = await api.post('/verification/resend-email', { userId });
    return response.data;
  },

  // ============================================================
  // PHONE VERIFICATION
  // ============================================================

  /**
   * Envía código de verificación por SMS
   * @param {number} userId - ID del usuario
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<Object>} { success, token, message, expiresAt }
   */
  async sendPhoneVerification(userId, phoneNumber) {
    const response = await api.post('/verification/send-phone', { userId, phoneNumber });
    return response.data;
  },

  /**
   * Verifica el código de teléfono
   * @param {string} token - Token UUID
   * @param {string} code - Código de 6 dígitos
   * @returns {Promise<Object>} { success, message, user }
   */
  async verifyPhone(token, code) {
    const response = await api.post('/verification/verify-phone', { token, code });
    return response.data;
  },

  /**
   * Reenvía código de verificación por SMS
   * @param {number} userId - ID del usuario
   * @param {string} phoneNumber - Número de teléfono
   * @returns {Promise<Object>} { success, token, message }
   */
  async resendPhoneVerification(userId, phoneNumber) {
    const response = await api.post('/verification/resend-phone', { userId, phoneNumber });
    return response.data;
  },

  // ============================================================
  // STATUS
  // ============================================================

  /**
   * Obtiene estado de verificación de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Estado de verificación
   */
  async getVerificationStatus(userId) {
    const response = await api.get(`/verification/status/${userId}`);
    return response.data;
  },

  /**
   * Verifica si un token es válido
   * @param {string} token - Token UUID
   * @returns {Promise<Object>} Info del token
   */
  async checkToken(token) {
    const response = await api.get(`/verification/check-token/${token}`);
    return response.data;
  }
};

export default verificationService;
