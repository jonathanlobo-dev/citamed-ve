/**
 * paymentService.js - CitaMed
 * M05 / Semana 8 - Servicio frontend para cobros, métodos de pago y recibos
 */

import api from './api';

const paymentService = {
  /**
   * Obtiene la lista oficial de bancos venezolanos
   * @returns {Promise<{success: boolean, data: Array<{code: string, name: string}>}>}
   */
  getBanks: () =>
    api.get('/payments/banks').then((res) => res.data),

  /**
   * Obtiene la configuración de métodos de cobro del médico autenticado
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getSettings: () =>
    api.get('/payments/settings').then((res) => res.data),

  /**
   * Guarda o actualiza los métodos de cobro del médico autenticado
   * @param {Object} settings
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  updateSettings: (settings) =>
    api.put('/payments/settings', settings).then((res) => res.data),

  /**
   * Obtiene el resumen de cobro de una cita médica (tarifa, tasa, métodos e historial)
   * @param {number|string} appointmentId
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getAppointmentSummary: (appointmentId) =>
    api.get(`/payments/appointment/${appointmentId}`).then((res) => res.data),

  /**
   * Lista los cobros reportados pendientes de validación por el médico
   * @returns {Promise<{success: boolean, total: number, data: Array}>}
   */
  listPending: () =>
    api.get('/payments/pending').then((res) => res.data),

  /**
   * Lista las consultas atendidas pendientes por cobrar
   * @returns {Promise<{success: boolean, totalCount: number, totalAmountUsd: number, data: Array}>}
   */
  listReceivable: () =>
    api.get('/payments/receivable').then((res) => res.data),

  /**
   * Obtiene el historial de cobros con filtros y totales para el médico
   * @param {Object} params - { from, to, status, page, limit }
   * @returns {Promise<{success: boolean, total: number, totals: Object, data: Array, page: number, totalPages: number}>}
   */
  listHistory: (params = {}) =>
    api.get('/payments/history', { params }).then((res) => res.data),

  /**
   * Lista los pagos reportados o realizados por el paciente autenticado
   * @returns {Promise<{success: boolean, total: number, data: Array}>}
   */
  listMine: () =>
    api.get('/payments/mine').then((res) => res.data),

  /**
   * Paciente reporta un pago realizado
   * @param {Object} data - { appointmentId, method, reference, payerBank, payerNote, idempotencyKey }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  reportPayment: (data) =>
    api.post('/payments/report', data).then((res) => res.data),

  /**
   * Médico registra un cobro directo en el consultorio
   * @param {Object} data - { appointmentId, method, reference, payerBank, payerNote }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  recordPayment: (data) =>
    api.post('/payments/record', data).then((res) => res.data),

  /**
   * Médico aprueba un pago reportado por el paciente
   * @param {number|string} id - ID del cobro
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  approve: (id) =>
    api.put(`/payments/${id}/approve`).then((res) => res.data),

  /**
   * Médico rechaza un pago reportado con motivo obligatorio
   * @param {number|string} id - ID del cobro
   * @param {string} reason - Motivo del rechazo
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  reject: (id, reason) =>
    api.put(`/payments/${id}/reject`, { reason }).then((res) => res.data),

  /**
   * Médico anula un cobro que había sido aprobado
   * @param {number|string} id - ID del cobro
   * @param {string} reason - Motivo de anulación
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  voidPayment: (id, reason) =>
    api.put(`/payments/${id}/void`, { reason }).then((res) => res.data),

  /**
   * Descarga el recibo oficial en PDF como blob
   * @param {number|string} id - ID del cobro
   * @returns {Promise<Blob>}
   */
  downloadReceipt: (id) =>
    api.get(`/payments/${id}/receipt`, { responseType: 'blob' }).then((res) => res.data)
};

export default paymentService;
