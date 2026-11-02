/**
 * accountService.js (frontend) - CITAMED.VE
 * Mi cuenta: correo, clave y solicitudes de cambio de datos protegidos.
 */

import api from './api';

const accountService = {
  async getSummary() {
    const res = await api.get('/account');
    return res.data.data;
  },

  async requestEmailChange({ newEmail, currentPassword }) {
    const res = await api.post('/account/email/request', { newEmail, currentPassword });
    return res.data.data;
  },

  async confirmEmailChange({ token, code }) {
    const res = await api.post('/account/email/confirm', { token, code });
    return res.data.data;
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await api.post('/account/password', { currentPassword, newPassword });
    return res.data.data;
  },

  async listChangeRequests() {
    const res = await api.get('/account/change-requests');
    return res.data.data;
  },

  async createChangeRequest({ field, value, reason }) {
    const res = await api.post('/account/change-requests', { field, value, reason });
    return res.data.data;
  }
};

/** Mensaje legible de un error de la API */
export function accountErrorMessage(error, fallback = 'No pudimos completar la operación. Intenta de nuevo.') {
  return error?.response?.data?.message || fallback;
}

export default accountService;
