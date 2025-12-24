// src/controllers/rbacController.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Controlador para endpoints de administración de permisos

const rbacService = require('../services/rbacService');
const { logger } = require('../config/logger');

/**
 * GET /api/rbac/permissions
 * Lista todos los permisos del sistema
 */
async function listPermissions(req, res) {
  const db = require('../models');
  const { Permission } = db;

  try {
    const { resource, action } = req.query;

    let permissions;
    if (resource) {
      permissions = await Permission.findByResource(resource);
    } else {
      permissions = await Permission.findAll({
        order: [['resource', 'ASC'], ['action', 'ASC']]
      });
    }

    // Filtrar por acción si se proporciona
    if (action) {
      permissions = permissions.filter(p => p.action === action);
    }

    res.json({
      success: true,
      data: {
        permissions,
        count: permissions.length
      }
    });
  } catch (error) {
    logger.error('Error listando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
}

/**
 * GET /api/rbac/permissions/grouped
 * Lista permisos agrupados por recurso
 */
async function listPermissionsGrouped(req, res) {
  const db = require('../models');
  const { Permission } = db;

  try {
    const grouped = await Permission.getAllGroupedByResource();

    res.json({
      success: true,
      data: {
        permissions: grouped,
        resources: Object.keys(grouped)
      }
    });
  } catch (error) {
    logger.error('Error listando permisos agrupados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/permissions
 * Crea un nuevo permiso (solo admin)
 */
async function createPermission(req, res) {
  const db = require('../models');
  const { Permission } = db;

  try {
    const { name, resource, action, description } = req.body;

    // Verificar si ya existe
    const existing = await Permission.findByName(name);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un permiso con ese nombre',
        error: 'DUPLICATE_PERMISSION'
      });
    }

    const permission = await Permission.create({
      name,
      resource,
      action,
      description,
      isSystem: false // Los permisos creados manualmente no son de sistema
    });

    logger.info('Nuevo permiso creado:', {
      permissionId: permission.id,
      name,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Permiso creado correctamente',
      data: { permission }
    });
  } catch (error) {
    logger.error('Error creando permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear permiso',
      error: error.message
    });
  }
}

/**
 * GET /api/rbac/roles/:role/permissions
 * Obtiene todos los permisos de un rol
 */
async function getRolePermissions(req, res) {
  try {
    const { role } = req.params;

    const permissions = await rbacService.getAllRolePermissions(role);

    res.json({
      success: true,
      data: {
        role,
        permissions,
        count: permissions.length
      }
    });
  } catch (error) {
    logger.error('Error obteniendo permisos de rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del rol',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/roles/:role/permissions
 * Asigna un permiso a un rol
 */
async function assignPermissionToRole(req, res) {
  const db = require('../models');
  const { RolePermission, Permission } = db;

  try {
    const { role } = req.params;
    const { permissionId } = req.body;

    // Verificar que el permiso existe
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado',
        error: 'PERMISSION_NOT_FOUND'
      });
    }

    const rolePermission = await RolePermission.assignPermission(role, permissionId);

    // Invalidar cache de todos los usuarios con ese rol
    rbacService.invalidateAllCache();

    logger.info('Permiso asignado a rol:', {
      role,
      permissionId,
      permissionName: permission.name,
      assignedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Permiso '${permission.name}' asignado al rol '${role}'`,
      data: { rolePermission }
    });
  } catch (error) {
    logger.error('Error asignando permiso a rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar permiso',
      error: error.message
    });
  }
}

/**
 * DELETE /api/rbac/roles/:role/permissions/:permissionId
 * Remueve un permiso de un rol
 */
async function removePermissionFromRole(req, res) {
  const db = require('../models');
  const { RolePermission, Permission } = db;

  try {
    const { role, permissionId } = req.params;

    // Verificar que el permiso existe
    const permission = await Permission.findByPk(permissionId);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permiso no encontrado',
        error: 'PERMISSION_NOT_FOUND'
      });
    }

    // Prevenir remover permisos de sistema de admin
    if (role === 'admin' && permission.isSystem) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden remover permisos de sistema del rol admin',
        error: 'FORBIDDEN'
      });
    }

    const removed = await RolePermission.removePermission(role, permissionId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: 'El rol no tenía ese permiso asignado',
        error: 'NOT_FOUND'
      });
    }

    // Invalidar cache
    rbacService.invalidateAllCache();

    logger.info('Permiso removido de rol:', {
      role,
      permissionId,
      permissionName: permission.name,
      removedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Permiso '${permission.name}' removido del rol '${role}'`
    });
  } catch (error) {
    logger.error('Error removiendo permiso de rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover permiso',
      error: error.message
    });
  }
}

/**
 * GET /api/rbac/users/:userId/permissions
 * Obtiene los permisos efectivos de un usuario
 */
async function getUserPermissions(req, res) {
  const db = require('../models');
  const { User } = db;

  try {
    const userId = parseInt(req.params.userId);

    // Verificar que el usuario existe
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'customPermissions', 'isActive']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    const permissions = await rbacService.getUserPermissions(userId);
    const rolePermissions = await rbacService.getAllRolePermissions(user.role);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        rolePermissions: rolePermissions.map(p => p.name),
        customPermissions: user.customPermissions || { granted: [], revoked: [] },
        effectivePermissions: permissions,
        totalPermissions: permissions.length
      }
    });
  } catch (error) {
    logger.error('Error obteniendo permisos de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del usuario',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/users/:userId/permissions/check
 * Verifica si un usuario tiene un permiso específico
 */
async function checkUserPermission(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { permission } = req.body;

    const hasPermission = await rbacService.hasPermission(userId, permission);

    res.json({
      success: true,
      data: {
        userId,
        permission,
        hasPermission
      }
    });
  } catch (error) {
    logger.error('Error verificando permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permiso',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/users/:userId/permissions/grant
 * Otorga un permiso personalizado a un usuario
 */
async function grantCustomPermission(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { permission } = req.body;

    await rbacService.grantCustomPermission(userId, permission);

    logger.info('Permiso personalizado otorgado:', {
      userId,
      permission,
      grantedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Permiso '${permission}' otorgado al usuario ${userId}`
    });
  } catch (error) {
    logger.error('Error otorgando permiso:', error);

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al otorgar permiso',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/users/:userId/permissions/revoke
 * Revoca un permiso personalizado de un usuario
 */
async function revokeCustomPermission(req, res) {
  try {
    const userId = parseInt(req.params.userId);
    const { permission } = req.body;

    await rbacService.revokeCustomPermission(userId, permission);

    logger.info('Permiso personalizado revocado:', {
      userId,
      permission,
      revokedBy: req.user.id
    });

    res.json({
      success: true,
      message: `Permiso '${permission}' revocado del usuario ${userId}`
    });
  } catch (error) {
    logger.error('Error revocando permiso:', error);

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al revocar permiso',
      error: error.message
    });
  }
}

/**
 * GET /api/rbac/my-permissions
 * Obtiene los permisos del usuario autenticado
 */
async function getMyPermissions(req, res) {
  try {
    const userId = req.user.id;
    const permissions = await rbacService.getUserPermissions(userId);

    res.json({
      success: true,
      data: {
        permissions,
        role: req.user.role,
        count: permissions.length
      }
    });
  } catch (error) {
    logger.error('Error obteniendo mis permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus permisos',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/my-permissions/check
 * Verifica si el usuario autenticado tiene un permiso
 */
async function checkMyPermission(req, res) {
  try {
    const { permission } = req.body;
    const hasPermission = await rbacService.hasPermission(req.user.id, permission);

    res.json({
      success: true,
      data: {
        permission,
        hasPermission
      }
    });
  } catch (error) {
    logger.error('Error verificando permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permiso',
      error: error.message
    });
  }
}

/**
 * GET /api/rbac/cache/stats
 * Obtiene estadísticas del cache (solo admin)
 */
async function getCacheStats(req, res) {
  try {
    const stats = rbacService.getCacheStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo stats de cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
}

/**
 * POST /api/rbac/cache/invalidate
 * Invalida todo el cache de permisos (solo admin)
 */
async function invalidateCache(req, res) {
  try {
    rbacService.invalidateAllCache();

    logger.info('Cache de permisos invalidado por:', {
      adminId: req.user.id
    });

    res.json({
      success: true,
      message: 'Cache de permisos invalidado correctamente'
    });
  } catch (error) {
    logger.error('Error invalidando cache:', error);
    res.status(500).json({
      success: false,
      message: 'Error al invalidar cache',
      error: error.message
    });
  }
}

module.exports = {
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
  getMyPermissions,
  checkMyPermission,
  getCacheStats,
  invalidateCache
};
