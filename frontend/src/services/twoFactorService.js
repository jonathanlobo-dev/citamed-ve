/**
 * Two-Factor Authentication Service - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Servicio para interactuar con API de 2FA
 */

import api from './api';

const twoFactorService = {
  /**
   * Genera secret y QR code para configurar 2FA
   * @returns {Promise<Object>} { qrCode, manualEntryKey, secret }
   */
  async generateSecret() {
    const response = await api.post('/2fa/generate');
    return response.data;
  },

  /**
   * Activa 2FA con el primer código verificado
   * @param {string} secret - Secret en base32
   * @param {string} token - Código de 6 dígitos
   * @returns {Promise<Object>} { success, backupCodes }
   */
  async enable(secret, token) {
    const response = await api.post('/2fa/enable', { secret, token });
    return response.data;
  },

  /**
   * Verifica código 2FA (durante login)
   * @param {number} userId - ID del usuario
   * @param {string} token - Código de 6 dígitos o backup code
   * @returns {Promise<Object>} { success, method }
   */
  async verify(userId, token) {
    const response = await api.post('/2fa/verify', { userId, token });
    return response.data;
  },

  /**
   * Desactiva 2FA
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} { success }
   */
  async disable(password) {
    const response = await api.post('/2fa/disable', { password });
    return response.data;
  },

  /**
   * Regenera códigos de respaldo
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} { success, backupCodes }
   */
  async regenerateBackupCodes(password) {
    const response = await api.post('/2fa/regenerate-backup-codes', { password });
    return response.data;
  },

  /**
   * Obtiene estado de 2FA del usuario
   * @returns {Promise<Object>} { enabled, activatedAt, backupCodesRemaining }
   */
  async getStatus() {
    const response = await api.get('/2fa/status');
    return response.data;
  },

  /**
   * Obtiene historial de intentos 2FA
   * @param {number} limit - Número máximo de registros
   * @returns {Promise<Array>} Lista de intentos
   */
  async getHistory(limit = 10) {
    const response = await api.get(`/2fa/history?limit=${limit}`);
    return response.data;
  }
};

export default twoFactorService;
