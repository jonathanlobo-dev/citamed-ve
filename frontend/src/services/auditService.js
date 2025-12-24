/**
 * Audit Service - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Servicio para consulta y gestión de logs de auditoría
 * Solo accesible para administradores
 */

import api from './api';

// ========================================
// CONSULTA DE LOGS
// ========================================

/**
 * Obtiene lista de logs de auditoría con filtros
 * @param {Object} filters - Filtros de búsqueda
 * @param {number} page - Número de página (1-indexed)
 * @param {number} limit - Cantidad por página
 * @returns {Promise<Object>} Lista de logs paginada
 */
export const getLogs = async (filters = {}, page = 1, limit = 50) => {
  const params = {
    page,
    limit,
    ...filters
  };

  // Limpiar parámetros vacíos
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });

  const response = await api.get('/audit/logs', { params });
  return response.data;
};

/**
 * Obtiene un log específico por ID
 * @param {string} logId - UUID del log
 * @returns {Promise<Object>} Detalle del log
 */
export const getLogById = async (logId) => {
  const response = await api.get(`/audit/logs/${logId}`);
  return response.data;
};

/**
 * Obtiene historial de cambios de un recurso específico
 * @param {string} resource - Tipo de recurso (user, role, permission, etc.)
 * @param {string|number} resourceId - ID del recurso
 * @param {number} limit - Cantidad máxima de registros
 * @returns {Promise<Object>} Historial del recurso
 */
export const getResourceHistory = async (resource, resourceId, limit = 50) => {
  const response = await api.get(`/audit/logs/resource/${resource}/${resourceId}`, {
    params: { limit }
  });
  return response.data;
};

// ========================================
// SEGURIDAD
// ========================================

/**
 * Obtiene alertas de seguridad recientes
 * @param {number} since - Horas hacia atrás para buscar (default: 24)
 * @returns {Promise<Object>} Lista de alertas de seguridad
 */
export const getSecurityAlerts = async (since = 24) => {
  const response = await api.get('/audit/security-alerts', {
    params: { since }
  });
  return response.data;
};

// ========================================
// ESTADÍSTICAS
// ========================================

/**
 * Obtiene estadísticas de auditoría
 * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha fin (YYYY-MM-DD)
 * @returns {Promise<Object>} Estadísticas agregadas
 */
export const getAuditStats = async (startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get('/audit/stats', { params });
  return response.data;
};

/**
 * Obtiene lista de acciones disponibles para filtrar
 * @returns {Promise<Object>} Lista de acciones únicas
 */
export const getAvailableActions = async () => {
  const response = await api.get('/audit/actions');
  return response.data;
};

// ========================================
// EXPORTACIÓN
// ========================================

/**
 * Exporta logs de auditoría a archivo
 * @param {Object} filters - Filtros de búsqueda
 * @param {string} format - Formato de exportación ('csv' o 'json')
 * @returns {Promise<Object>} Información del archivo generado
 */
export const exportLogs = async (filters = {}, format = 'csv') => {
  const response = await api.post('/audit/export', {
    filters,
    format
  });
  return response.data;
};

/**
 * Descarga un archivo de exportación
 * @param {string} filename - Nombre del archivo a descargar
 * @returns {Promise<Blob>} Blob del archivo
 */
export const downloadExport = async (filename) => {
  const response = await api.get(`/audit/download/${filename}`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Inicia la descarga de un archivo de exportación en el navegador
 * @param {string} filename - Nombre del archivo a descargar
 */
export const downloadExportFile = async (filename) => {
  try {
    const blob = await downloadExport(filename);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error descargando archivo:', error);
    throw error;
  }
};

// ========================================
// UTILIDADES
// ========================================

/**
 * Formatea la severidad para mostrar
 * @param {string} severity - Nivel de severidad
 * @returns {Object} Objeto con label y color
 */
export const formatSeverity = (severity) => {
  const severityMap = {
    info: { label: 'Info', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
    warning: { label: 'Advertencia', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    error: { label: 'Error', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    critical: { label: 'Crítico', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-800' }
  };
  return severityMap[severity] || severityMap.info;
};

/**
 * Formatea una acción para mostrar
 * @param {string} action - Nombre de la acción
 * @returns {string} Descripción legible
 */
export const formatAction = (action) => {
  const actionMap = {
    // Auth
    'auth.login.attempt': 'Intento de inicio de sesión',
    'auth.login.success': 'Inicio de sesión exitoso',
    'auth.login.failed': 'Inicio de sesión fallido',
    'auth.login.2fa': 'Verificación 2FA',
    'auth.logout': 'Cierre de sesión',
    'auth.2fa.enabled': '2FA activado',
    'auth.2fa.disabled': '2FA desactivado',

    // User
    'user.created': 'Usuario creado',
    'user.updated': 'Usuario actualizado',
    'user.deleted': 'Usuario eliminado',
    'user.password.changed': 'Contraseña cambiada',
    'user.password.reset': 'Contraseña restablecida',
    'user.status.changed': 'Estado de usuario cambiado',

    // Session
    'session.created': 'Sesión creada',
    'session.revoked': 'Sesión revocada',
    'session.revoked_all': 'Todas las sesiones revocadas',
    'session.expired': 'Sesión expirada',

    // RBAC
    'rbac.permission.granted': 'Permiso otorgado',
    'rbac.permission.revoked': 'Permiso revocado',
    'rbac.role.created': 'Rol creado',
    'rbac.role.updated': 'Rol actualizado',
    'rbac.role.deleted': 'Rol eliminado',

    // Profile
    'profile.updated': 'Perfil actualizado',
    'profile.verified': 'Perfil verificado',

    // Security
    'security.suspicious_activity': 'Actividad sospechosa detectada',
    'security.brute_force': 'Intento de fuerza bruta',
    'security.account_locked': 'Cuenta bloqueada'
  };

  return actionMap[action] || action;
};

/**
 * Formatea un recurso para mostrar
 * @param {string} resource - Tipo de recurso
 * @returns {string} Nombre legible
 */
export const formatResource = (resource) => {
  const resourceMap = {
    user: 'Usuario',
    session: 'Sesión',
    auth: 'Autenticación',
    role: 'Rol',
    permission: 'Permiso',
    profile: 'Perfil',
    appointment: 'Cita',
    prescription: 'Receta',
    medical_record: 'Historia Médica'
  };
  return resourceMap[resource] || resource;
};

/**
 * Obtiene icono para un tipo de acción
 * @param {string} action - Nombre de la acción
 * @returns {string} Nombre del icono
 */
export const getActionIcon = (action) => {
  if (action.startsWith('auth.login')) return 'login';
  if (action.startsWith('auth.logout')) return 'logout';
  if (action.includes('2fa')) return 'shield';
  if (action.includes('password')) return 'key';
  if (action.includes('created')) return 'plus-circle';
  if (action.includes('updated')) return 'edit';
  if (action.includes('deleted')) return 'trash';
  if (action.includes('revoked')) return 'x-circle';
  if (action.includes('security')) return 'alert-triangle';
  return 'activity';
};

export default {
  // Consulta
  getLogs,
  getLogById,
  getResourceHistory,

  // Seguridad
  getSecurityAlerts,

  // Estadísticas
  getAuditStats,
  getAvailableActions,

  // Exportación
  exportLogs,
  downloadExport,
  downloadExportFile,

  // Utilidades
  formatSeverity,
  formatAction,
  formatResource,
  getActionIcon
};
