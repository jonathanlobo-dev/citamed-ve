/**
 * aiService.js - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Servicio de Inteligencia Artificial para el Espacio Clínico
 */

import api from './api';

const aiService = {
  /**
   * Obtiene el estado del servicio de IA y la cuota mensual del médico.
   * @returns {Promise<{success: boolean, enabled: boolean, available: boolean, transcriptionAvailable: boolean, monthlyLimit: number, usedThisMonth: number, remaining: number}>}
   */
  status: () => api.get('/ai/status').then((res) => res.data),

  /**
   * Mejora la redacción médica de un campo de la consulta.
   */
  improve: (arg1, arg2, arg3) => {
    const { appointmentId, field, text } =
      typeof arg1 === 'object' && arg1 !== null
        ? arg1
        : { appointmentId: arg1, field: arg2, text: arg3 };
    return api.post('/ai/improve', { appointmentId, field, text }).then((res) => res.data);
  },

  /**
   * Genera propuesta estructurada SOAP a partir de texto libre o dictado.
   */
  soap: (arg1, arg2) => {
    const { appointmentId, text } =
      typeof arg1 === 'object' && arg1 !== null
        ? arg1
        : { appointmentId: arg1, text: arg2 };
    return api.post('/ai/soap', { appointmentId, text }).then((res) => res.data);
  },

  /**
   * Genera propuesta de récipe médico a partir de texto libre o dictado.
   */
  rx: (arg1, arg2) => {
    const { appointmentId, text } =
      typeof arg1 === 'object' && arg1 !== null
        ? arg1
        : { appointmentId: arg1, text: arg2 };
    return api.post('/ai/rx', { appointmentId, text }).then((res) => res.data);
  },

  /**
   * Transcribe un archivo de audio grabado por el médico en la consulta.
   */
  transcribe: (arg1, arg2, arg3) => {
    const { appointmentId, audioBlob, mimeType } =
      typeof arg1 === 'object' && arg1 !== null && !(arg1 instanceof Blob)
        ? arg1
        : { appointmentId: arg1, audioBlob: arg2, mimeType: arg3 };

    const formData = new FormData();
    formData.append('appointmentId', String(appointmentId));

    const finalMime = mimeType || audioBlob?.type || 'audio/webm';
    let ext = 'webm';
    if (finalMime.includes('mp4') || finalMime.includes('m4a')) {
      ext = 'm4a';
    } else if (finalMime.includes('ogg')) {
      ext = 'ogg';
    }

    formData.append('audio', audioBlob, `consulta_${appointmentId}_${Date.now()}.${ext}`);

    return api
      .post('/ai/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((res) => res.data);
  },

  /**
   * Registra el consentimiento informado del paciente para el uso de IA en la cita.
   * @param {number|string} appointmentId
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  setConsent: (appointmentId) =>
    api.put(`/appointments/${appointmentId}/ai-consent`).then((res) => res.data)
};

export default aiService;
