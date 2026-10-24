/**
 * assistantService.js - CITAMED.VE
 * Servicio frontend para gestión de asistentes y vinculación con médicos
 */

import api from './api';

export const assistantService = {
  // --- Rutas del Médico ---

  /**
   * Obtiene la lista de asistentes vinculadas al médico autenticado.
   * Respuesta del servidor: { success: true, count: N, data: [ { id, doctorId, assistantId, status, canAgenda, canPayments, canVoidReceipts, ... } ] }
   */
  getMyAssistants: async () => {
    const res = await api.get('/assistants');
    return res.data;
  },

  /**
   * Invita a una asistente por correo electrónico y define sus permisos iniciales.
   * @param {{ email: string, firstName?: string, lastName?: string, permissions?: { canAgenda?: boolean, canPayments?: boolean, canVoidReceipts?: boolean } }} payload
   */
  inviteAssistant: async (payload) => {
    const res = await api.post('/assistants/invite', payload);
    return res.data;
  },

  /**
   * Actualiza los permisos de una asistente vinculada.
   * @param {number|string} linkId - ID del registro en doctor_assistants
   * @param {{ canAgenda?: boolean, canPayments?: boolean, canVoidReceipts?: boolean }} permissions
   */
  updatePermissions: async (linkId, permissions) => {
    const res = await api.put(`/assistants/${linkId}/permissions`, permissions);
    return res.data;
  },

  /**
   * Revoca el vínculo del médico con una asistente.
   * @param {number|string} linkId - ID del registro en doctor_assistants
   */
  revokeAssistant: async (linkId) => {
    const res = await api.delete(`/assistants/${linkId}`);
    return res.data;
  },

  // --- Rutas de la Asistente ---

  /**
   * Obtiene la lista de médicos a los que la asistente está vinculada o invitada.
   * Respuesta del servidor: { success: true, count: N, data: [ { id, doctorId, assistantId, status, canAgenda, canPayments, canVoidReceipts, doctor: { ... } } ] }
   */
  getMyDoctors: async () => {
    const res = await api.get('/assistants/my-doctors');
    return res.data;
  },

  /**
   * Acepta una invitación de un médico.
   * @param {number|string} linkId - ID del registro en doctor_assistants
   */
  acceptInvitation: async (linkId) => {
    const res = await api.post(`/assistants/${linkId}/accept`);
    return res.data;
  },

  /**
   * Rechaza una invitación de un médico.
   * @param {number|string} linkId - ID del registro en doctor_assistants
   */
  declineInvitation: async (linkId) => {
    const res = await api.post(`/assistants/${linkId}/decline`);
    return res.data;
  }
};

export default assistantService;
