/**
 * publicService.js - CITAMED.VE
 * Servicios para páginas públicas: perfil del médico por slug y confirmación de citas
 */

import api from './api';

export const publicService = {
  /**
   * Obtiene la información pública de un médico a través de su slug
   * @param {string} slug - Identificador amigable del médico (ej: 'alejandro-rivas')
   */
  getDoctorBySlug: async (slug) => {
    const res = await api.get(`/public/doctors/${encodeURIComponent(slug)}`);
    return res.data;
  },

  /**
   * Obtiene los datos públicos de una cita mediante su token de confirmación
   * @param {string} token - Token aleatorio de confirmación
   */
  getAppointmentByToken: async (token) => {
    const res = await api.get(`/public/appointments/${encodeURIComponent(token)}`);
    return res.data;
  },

  /**
   * Confirma la asistencia a una cita futura
   * @param {string} token - Token aleatorio de confirmación
   * @param {string} [via='whatsapp'] - Canal de confirmación
   */
  confirmAppointment: async (token, via = 'whatsapp') => {
    const res = await api.post(`/public/appointments/${encodeURIComponent(token)}/confirm`, { via });
    return res.data;
  },

  /**
   * Cancela una cita a petición del paciente
   * @param {string} token - Token aleatorio de confirmación
   * @param {string} [reason] - Motivo opcional de cancelación
   */
  cancelAppointment: async (token, reason = '') => {
    const res = await api.post(`/public/appointments/${encodeURIComponent(token)}/cancel`, { reason });
    return res.data;
  },

  /**
   * Genera o recupera el token de confirmación de una cita para enviar por WhatsApp
   * (Requiere autenticación de médico o asistente con permiso agenda)
   * @param {number|string} appointmentId
   */
  getOrCreateConfirmationToken: async (appointmentId) => {
    const res = await api.post(`/appointments/${appointmentId}/confirmation-token`);
    const payload = res.data?.data || res.data;
    return {
      ...payload,
      waUrl: payload.whatsappUrl || payload.waUrl
    };
  }
};

export default publicService;
