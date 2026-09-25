/**
 * 📅 APPOINTMENT SERVICE - CITAMED.VE
 * M03 - Gestión de Citas
 * Conecta con los endpoints de /api/appointments del backend.
 *
 * Todas las funciones devuelven el body de la respuesta:
 * { success, message?, data } — así el frontend consume response.data directamente.
 */

import api from './api';

const appointmentService = {
  /**
   * Obtener slots disponibles de un médico para una fecha.
   * @param {number|string} doctorProfileId - ID del perfil del médico
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<{success: boolean, data: {available: boolean, slots: Array, reason?: string}}>}
   */
  getAvailableSlots: (doctorProfileId, date) =>
    api
      .get('/appointments/available-slots', {
        params: { doctorProfileId, date },
      })
      .then((res) => res.data),

  /**
   * Crear una nueva cita.
   * @param {Object} appointmentData
   * @returns {Promise<{success: boolean, data: Object}>} data = cita creada
   */
  create: (appointmentData) =>
    api.post('/appointments', appointmentData).then((res) => res.data),

  /**
   * Obtener las citas del usuario autenticado (paciente o médico).
   * @param {Object} [params] - { page, limit, upcoming }
   * @returns {Promise<{success: boolean, data: Array}>} data = lista de citas
   */
  getMyAppointments: (params = {}) =>
    api.get('/appointments/my', { params }).then((res) => res.data),

  /**
   * Obtener el detalle de una cita por ID.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getById: (id) => api.get(`/appointments/${id}`).then((res) => res.data),

  /**
   * Cancelar una cita.
   * @param {number|string} id
   * @param {string} reason - Motivo de la cancelación
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  cancel: (id, reason) =>
    api.put(`/appointments/${id}/cancel`, { reason }).then((res) => res.data),

  /**
   * Reprogramar una cita.
   * @param {number|string} id
   * @param {string} newDate - YYYY-MM-DD
   * @param {string} newTime - HH:mm
   * @param {string} [reason]
   * @returns {Promise<{success: boolean, data: Object}>} data = nueva cita
   */
  reschedule: (id, newDate, newTime, reason) =>
    api
      .put(`/appointments/${id}/reschedule`, { newDate, newTime, reason })
      .then((res) => res.data),

  /**
   * Confirmar una cita (rol médico/admin).
   * @param {number|string} id
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  confirm: (id) =>
    api.put(`/appointments/${id}/confirm`).then((res) => res.data),

  /**
   * Obtener las citas del día o rango para el médico autenticado.
   * @param {string|Object} [param] - YYYY-MM-DD o { date, startDate, endDate }
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getDoctorToday: (param) => {
    const params = typeof param === 'string' ? { date: param } : (param || {});
    return api
      .get('/appointments/doctor/today', { params })
      .then((res) => res.data);
  },

  /**
   * Marcar cita como completada con notas y diagnóstico opcionales.
   * @param {number|string} id
   * @param {Object} [data] - { doctorNotes, diagnosis }
   */
  complete: (id, data = {}) =>
    api.put(`/appointments/${id}/complete`, data).then((res) => res.data),

  /**
   * Marcar cita como no asistió (no-show).
   * @param {number|string} id
   */
  markNoShow: (id) =>
    api.put(`/appointments/${id}/no-show`).then((res) => res.data),

  /**
   * Actualizar notas y diagnóstico de la cita.
   * @param {number|string} id
   * @param {Object} data - { doctorNotes, diagnosis }
   */
  updateNotes: (id, data) =>
    api.put(`/appointments/${id}/notes`, data).then((res) => res.data),
};

export default appointmentService;
