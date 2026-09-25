/**
 * Prescription Service - CITAMED.VE
 * M03 / Semana 5 - Servicios frontend para Récipes Médicos
 */

import axios from 'axios';
import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const prescriptionAPI = {
  /**
   * Emite un nuevo récipe médico
   */
  create: (data) => api.post('/prescriptions', data),

  /**
   * Obtiene los récipes emitidos para una cita
   */
  getByAppointment: (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`),

  /**
   * Descarga el PDF del récipe como blob
   */
  downloadPdf: (id) => api.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),

  /**
   * Anula un récipe existente
   */
  void: (id) => api.put(`/prescriptions/${id}/void`),

  /**
   * Verificación pública sin token
   */
  verify: (code) => axios.get(`${API_URL}/prescriptions/verify/${encodeURIComponent(code)}`)
};

export default prescriptionAPI;
