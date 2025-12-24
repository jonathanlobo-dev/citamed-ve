/**
 * RBAC Service - CITAMED.VE
 * M01 Sub-Partida 2.5.1
 *
 * Servicio para gestión de permisos y roles
 */

import api from './api';

/**
 * Obtiene los permisos del usuario autenticado
 */
export const getMyPermissions = async () => {
  const response = await api.get('/rbac/my-permissions');
  return response.data;
};

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Nombre del permiso
 */
export const checkMyPermission = async (permission) => {
  const response = await api.post('/rbac/my-permissions/check', { permission });
  return response.data;
};

// ========================================
// ENDPOINTS DE ADMINISTRACIÓN
// ========================================

/**
 * Lista todos los permisos del sistema
 * @param {Object} params - Parámetros de filtrado
 */
export const listPermissions = async (params = {}) => {
  const response = await api.get('/rbac/permissions', { params });
  return response.data;
};

/**
 * Lista permisos agrupados por recurso
 */
export const listPermissionsGrouped = async () => {
  const response = await api.get('/rbac/permissions/grouped');
  return response.data;
};

/**
 * Crea un nuevo permiso
 * @param {Object} data - Datos del permiso
 */
export const createPermission = async (data) => {
  const response = await api.post('/rbac/permissions', data);
  return response.data;
};

/**
 * Obtiene permisos de un rol
 * @param {string} role - Nombre del rol
 */
export const getRolePermissions = async (role) => {
  const response = await api.get(`/rbac/roles/${role}/permissions`);
  return response.data;
};

/**
 * Asigna un permiso a un rol
 * @param {string} role - Nombre del rol
 * @param {string} permissionId - ID del permiso
 */
export const assignPermissionToRole = async (role, permissionId) => {
  const response = await api.post(`/rbac/roles/${role}/permissions`, { permissionId });
  return response.data;
};

/**
 * Remueve un permiso de un rol
 * @param {string} role - Nombre del rol
 * @param {string} permissionId - ID del permiso
 */
export const removePermissionFromRole = async (role, permissionId) => {
  const response = await api.delete(`/rbac/roles/${role}/permissions/${permissionId}`);
  return response.data;
};

/**
 * Obtiene permisos efectivos de un usuario
 * @param {number} userId - ID del usuario
 */
export const getUserPermissions = async (userId) => {
  const response = await api.get(`/rbac/users/${userId}/permissions`);
  return response.data;
};

/**
 * Verifica si un usuario tiene un permiso
 * @param {number} userId - ID del usuario
 * @param {string} permission - Nombre del permiso
 */
export const checkUserPermission = async (userId, permission) => {
  const response = await api.post(`/rbac/users/${userId}/permissions/check`, { permission });
  return response.data;
};

/**
 * Otorga un permiso personalizado a un usuario
 * @param {number} userId - ID del usuario
 * @param {string} permission - Nombre del permiso
 */
export const grantCustomPermission = async (userId, permission) => {
  const response = await api.post(`/rbac/users/${userId}/permissions/grant`, { permission });
  return response.data;
};

/**
 * Revoca un permiso personalizado de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} permission - Nombre del permiso
 */
export const revokeCustomPermission = async (userId, permission) => {
  const response = await api.post(`/rbac/users/${userId}/permissions/revoke`, { permission });
  return response.data;
};

/**
 * Obtiene estadísticas del cache
 */
export const getCacheStats = async () => {
  const response = await api.get('/rbac/cache/stats');
  return response.data;
};

/**
 * Invalida el cache de permisos
 */
export const invalidateCache = async () => {
  const response = await api.post('/rbac/cache/invalidate');
  return response.data;
};

// ========================================
// UTILIDADES
// ========================================

/**
 * Verifica si un usuario tiene permiso basado en lista local
 * @param {string[]} permissions - Lista de permisos del usuario
 * @param {string} requiredPermission - Permiso a verificar
 */
export const hasPermissionLocal = (permissions, requiredPermission) => {
  if (!permissions || !Array.isArray(permissions)) return false;

  // Verificar permiso exacto
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // Verificar wildcards
  const parts = requiredPermission.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const wildcardPerm = parts.slice(0, i).join('.') + '.*';
    if (permissions.includes(wildcardPerm)) {
      return true;
    }
  }

  // Verificar wildcard global
  if (permissions.includes('*')) {
    return true;
  }

  return false;
};

/**
 * Verifica si el usuario tiene al menos uno de los permisos
 * @param {string[]} permissions - Lista de permisos del usuario
 * @param {string[]} requiredPermissions - Permisos a verificar
 */
export const hasAnyPermissionLocal = (permissions, requiredPermissions) => {
  return requiredPermissions.some(perm => hasPermissionLocal(permissions, perm));
};

/**
 * Verifica si el usuario tiene todos los permisos
 * @param {string[]} permissions - Lista de permisos del usuario
 * @param {string[]} requiredPermissions - Permisos a verificar
 */
export const hasAllPermissionsLocal = (permissions, requiredPermissions) => {
  return requiredPermissions.every(perm => hasPermissionLocal(permissions, perm));
};

export default {
  getMyPermissions,
  checkMyPermission,
  listPermissions,
  listPermissionsGrouped,
  createPermission,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  getUserPermissions,
  checkUserPermission,
  grantCustomPermission,
  revokeCustomPermission,
  getCacheStats,
  invalidateCache,
  hasPermissionLocal,
  hasAnyPermissionLocal,
  hasAllPermissionsLocal
};
