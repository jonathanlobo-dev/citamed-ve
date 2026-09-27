/**
 * adminService.js - CITAMED.VE
 * M01 / Semana 7 - Servicio de API para el panel de Superadministración
 */

import api from './api';

export const adminService = {
  /**
   * Obtiene métricas y resumen general de la plataforma
   */
  async getOverview() {
    const res = await api.get('/admin/overview');
    return res.data;
  },

  /**
   * Lista usuarios con filtros de búsqueda, rol, estado y paginación
   */
  async getUsers({ search = '', role = '', status = '', page = 1, limit = 15 } = {}) {
    const params = {};
    if (search) params.search = search;
    if (role && role !== 'all') params.role = role;
    if (status && status !== 'all') params.status = status;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  /**
   * Obtiene el detalle completo de un usuario por su ID
   */
  async getUserById(id) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  /**
   * Actualiza el estado de activación/suspensión de un usuario
   */
  async updateUserStatus(id, { isActive, reason }) {
    const res = await api.put(`/admin/users/${id}/status`, { isActive, reason });
    return res.data;
  },

  /**
   * Lista médicos con filtros de búsqueda, verificación KYC, estado y paginación
   */
  async getDoctors({ search = '', verification = '', status = '', page = 1, limit = 15 } = {}) {
    const params = {};
    if (search) params.search = search;
    if (verification && verification !== 'all') params.verification = verification;
    if (status && status !== 'all') params.status = status;
    if (page) params.page = page;
    if (limit) params.limit = limit;

    const res = await api.get('/admin/doctors', { params });
    return res.data;
  },

  /**
   * Obtiene la configuración de IA (proveedores, transcripción, límites y env flags)
   */
  async getAiConfig() {
    const res = await api.get('/admin/ai/config');
    return res.data;
  },

  /**
   * Actualiza la configuración de IA
   */
  async updateAiConfig(config) {
    const res = await api.put('/admin/ai/config', config);
    return res.data;
  },

  /**
   * Prueba conectividad de un proveedor o modelo de IA
   */
  async testAiConnection({ kind = 'text', provider, model, apiKey, entryId }) {
    const res = await api.post('/admin/ai/test', {
      kind,
      provider,
      model,
      ...(apiKey ? { apiKey } : {}),
      ...(entryId ? { entryId } : {})
    });
    return res.data;
  },

  /**
   * Consulta los modelos soportados por un proveedor (vía POST para no exponer llaves en URL)
   */
  async getAiModels({ provider, entryId, apiKey }) {
    const res = await api.post('/admin/ai/models', {
      provider,
      ...(entryId ? { entryId } : {}),
      ...(apiKey ? { apiKey } : {})
    });
    return res.data;
  },

  /**
   * Obtiene estadísticas de uso de IA de los últimos N días
   */
  async getAiUsage({ days = 30 } = {}) {
    const res = await api.get('/admin/ai/usage', { params: { days } });
    return res.data;
  }
};

export default adminService;
