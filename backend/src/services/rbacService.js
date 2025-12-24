// src/services/rbacService.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Servicio de control de acceso basado en roles

const { logger } = require('../config/logger');

// Cache simple en memoria para permisos (TTL: 5 minutos)
const permissionsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpia entradas expiradas del cache
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of permissionsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      permissionsCache.delete(key);
    }
  }
}

// Limpiar cache cada minuto
setInterval(cleanExpiredCache, 60 * 1000);

/**
 * Obtiene los permisos de un usuario basado en su rol y permisos personalizados
 * @param {number} userId - ID del usuario
 * @returns {Promise<string[]>} Lista de nombres de permisos
 */
async function getUserPermissions(userId) {
  const db = require('../models');
  const { User, Permission, RolePermission } = db;

  // Verificar cache
  const cacheKey = `user_${userId}`;
  const cached = permissionsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    // Obtener usuario
    const user = await User.findByPk(userId, {
      attributes: ['id', 'role', 'customPermissions', 'isActive']
    });

    if (!user || !user.isActive) {
      return [];
    }

    // Obtener permisos del rol
    const rolePermissions = await RolePermission.getPermissionNamesByRole(user.role);

    // Si es admin, tiene todos los permisos
    if (user.role === 'admin') {
      const allPermissions = await Permission.findAll({
        attributes: ['name']
      });
      const adminPerms = allPermissions.map(p => p.name);

      // Guardar en cache
      permissionsCache.set(cacheKey, {
        permissions: adminPerms,
        timestamp: Date.now()
      });

      return adminPerms;
    }

    // Iniciar con permisos del rol
    let effectivePermissions = new Set(rolePermissions);

    // Aplicar permisos personalizados si existen
    if (user.customPermissions) {
      const { granted = [], revoked = [] } = user.customPermissions;

      // Agregar permisos concedidos
      granted.forEach(p => effectivePermissions.add(p));

      // Remover permisos revocados
      revoked.forEach(p => effectivePermissions.delete(p));
    }

    const permissions = Array.from(effectivePermissions);

    // Guardar en cache
    permissionsCache.set(cacheKey, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  } catch (error) {
    logger.error('Error obteniendo permisos de usuario:', { userId, error: error.message });
    return [];
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {number} userId - ID del usuario
 * @param {string} permissionName - Nombre del permiso (ej: 'appointments.create')
 * @returns {Promise<boolean>}
 */
async function hasPermission(userId, permissionName) {
  const permissions = await getUserPermissions(userId);

  // Verificar permiso exacto
  if (permissions.includes(permissionName)) {
    return true;
  }

  // Verificar permisos con wildcard
  // Ej: 'appointments.*' coincide con 'appointments.create'
  const parts = permissionName.split('.');
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
}

/**
 * Verifica si un usuario tiene AL MENOS UNO de los permisos
 * @param {number} userId - ID del usuario
 * @param {string[]} permissionNames - Lista de nombres de permisos
 * @returns {Promise<boolean>}
 */
async function hasAnyPermission(userId, permissionNames) {
  for (const permName of permissionNames) {
    if (await hasPermission(userId, permName)) {
      return true;
    }
  }
  return false;
}

/**
 * Verifica si un usuario tiene TODOS los permisos
 * @param {number} userId - ID del usuario
 * @param {string[]} permissionNames - Lista de nombres de permisos
 * @returns {Promise<boolean>}
 */
async function hasAllPermissions(userId, permissionNames) {
  for (const permName of permissionNames) {
    if (!(await hasPermission(userId, permName))) {
      return false;
    }
  }
  return true;
}

/**
 * Verifica la propiedad de un recurso
 * @param {number} userId - ID del usuario
 * @param {string} resource - Tipo de recurso (ej: 'appointments', 'users')
 * @param {number|string} resourceId - ID del recurso
 * @returns {Promise<boolean>}
 */
async function checkResourceOwnership(userId, resource, resourceId) {
  const db = require('../models');

  try {
    switch (resource) {
      case 'appointments': {
        const { Appointment } = db;
        const appointment = await Appointment.findByPk(resourceId, {
          attributes: ['patientId', 'doctorId']
        });
        if (!appointment) return false;
        return appointment.patientId === userId || appointment.doctorId === userId;
      }

      case 'users': {
        // El usuario es dueño de su propio perfil
        return parseInt(resourceId) === userId;
      }

      case 'sessions': {
        const { UserSession } = db;
        const session = await UserSession.findByPk(resourceId, {
          attributes: ['userId']
        });
        if (!session) return false;
        return session.userId === userId;
      }

      case 'doctorProfiles': {
        const { DoctorProfile } = db;
        const profile = await DoctorProfile.findByPk(resourceId, {
          attributes: ['userId']
        });
        if (!profile) return false;
        return profile.userId === userId;
      }

      case 'patientProfiles': {
        const { PatientProfile } = db;
        const profile = await PatientProfile.findByPk(resourceId, {
          attributes: ['userId']
        });
        if (!profile) return false;
        return profile.userId === userId;
      }

      case 'providerProfiles': {
        const { ProviderProfile } = db;
        const profile = await ProviderProfile.findByPk(resourceId, {
          attributes: ['userId']
        });
        if (!profile) return false;
        return profile.userId === userId;
      }

      default:
        logger.warn('Recurso no soportado para verificación de propiedad:', resource);
        return false;
    }
  } catch (error) {
    logger.error('Error verificando propiedad de recurso:', {
      userId,
      resource,
      resourceId,
      error: error.message
    });
    return false;
  }
}

/**
 * Otorga un permiso personalizado a un usuario
 * @param {number} userId - ID del usuario
 * @param {string} permissionName - Nombre del permiso
 * @returns {Promise<Object>} Usuario actualizado
 */
async function grantCustomPermission(userId, permissionName) {
  const db = require('../models');
  const { User, Permission } = db;

  // Verificar que el permiso existe
  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permiso no encontrado: ${permissionName}`);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // Obtener o inicializar customPermissions
  const customPerms = user.customPermissions || { granted: [], revoked: [] };

  // Agregar a granted si no existe
  if (!customPerms.granted.includes(permissionName)) {
    customPerms.granted.push(permissionName);
  }

  // Remover de revoked si estaba ahí
  customPerms.revoked = customPerms.revoked.filter(p => p !== permissionName);

  // Actualizar usuario
  await user.update({ customPermissions: customPerms });

  // Invalidar cache
  permissionsCache.delete(`user_${userId}`);

  logger.info('Permiso personalizado otorgado:', { userId, permissionName });

  return user;
}

/**
 * Revoca un permiso personalizado de un usuario
 * @param {number} userId - ID del usuario
 * @param {string} permissionName - Nombre del permiso
 * @returns {Promise<Object>} Usuario actualizado
 */
async function revokeCustomPermission(userId, permissionName) {
  const db = require('../models');
  const { User, Permission } = db;

  // Verificar que el permiso existe
  const permission = await Permission.findByName(permissionName);
  if (!permission) {
    throw new Error(`Permiso no encontrado: ${permissionName}`);
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error(`Usuario no encontrado: ${userId}`);
  }

  // Obtener o inicializar customPermissions
  const customPerms = user.customPermissions || { granted: [], revoked: [] };

  // Agregar a revoked si no existe
  if (!customPerms.revoked.includes(permissionName)) {
    customPerms.revoked.push(permissionName);
  }

  // Remover de granted si estaba ahí
  customPerms.granted = customPerms.granted.filter(p => p !== permissionName);

  // Actualizar usuario
  await user.update({ customPermissions: customPerms });

  // Invalidar cache
  permissionsCache.delete(`user_${userId}`);

  logger.info('Permiso personalizado revocado:', { userId, permissionName });

  return user;
}

/**
 * Obtiene todos los permisos de un rol
 * @param {string} role - Nombre del rol
 * @returns {Promise<Object[]>} Lista de permisos con detalles
 */
async function getAllRolePermissions(role) {
  const db = require('../models');
  const { RolePermission } = db;

  return await RolePermission.getPermissionsByRole(role);
}

/**
 * Invalida el cache de permisos de un usuario
 * @param {number} userId - ID del usuario
 */
function invalidateUserCache(userId) {
  permissionsCache.delete(`user_${userId}`);
}

/**
 * Invalida todo el cache de permisos
 */
function invalidateAllCache() {
  permissionsCache.clear();
  logger.info('Cache de permisos limpiado completamente');
}

/**
 * Verifica permisos con contexto de propiedad
 * Útil para permisos como 'appointments.read.own'
 * @param {number} userId - ID del usuario
 * @param {string} basePermission - Permiso base (ej: 'appointments.read')
 * @param {string} resource - Tipo de recurso
 * @param {number|string} resourceId - ID del recurso
 * @returns {Promise<boolean>}
 */
async function hasPermissionWithOwnership(userId, basePermission, resource, resourceId) {
  // Primero verificar permiso completo (sin .own)
  if (await hasPermission(userId, basePermission)) {
    return true;
  }

  // Luego verificar permiso .own con propiedad del recurso
  const ownPermission = `${basePermission}.own`;
  if (await hasPermission(userId, ownPermission)) {
    return await checkResourceOwnership(userId, resource, resourceId);
  }

  return false;
}

/**
 * Obtiene estadísticas del cache
 */
function getCacheStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const [, value] of permissionsCache.entries()) {
    if (now - value.timestamp < CACHE_TTL) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: permissionsCache.size,
    active,
    expired,
    ttlMinutes: CACHE_TTL / 60000
  };
}

module.exports = {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkResourceOwnership,
  grantCustomPermission,
  revokeCustomPermission,
  getAllRolePermissions,
  invalidateUserCache,
  invalidateAllCache,
  hasPermissionWithOwnership,
  getCacheStats
};
