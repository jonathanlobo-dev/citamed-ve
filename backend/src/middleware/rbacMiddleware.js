// src/middleware/rbacMiddleware.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Middleware de control de acceso basado en roles

const rbacService = require('../services/rbacService');
const { logger } = require('../config/logger');

/**
 * Factory para middleware que requiere un permiso específico
 * @param {string} permissionName - Nombre del permiso requerido
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.post('/appointments', requirePermission('appointments.create'), createAppointment);
 */
function requirePermission(permissionName) {
  return async (req, res, next) => {
    try {
      // Verificar que hay usuario autenticado
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await rbacService.hasPermission(req.user.id, permissionName);

      if (!hasAccess) {
        logger.warn('Acceso denegado por falta de permiso:', {
          userId: req.user.id,
          permission: permissionName,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para realizar esta acción',
          error: 'FORBIDDEN',
          requiredPermission: permissionName
        });
      }

      // Agregar información de permisos al request para uso posterior
      req.grantedPermission = permissionName;
      next();
    } catch (error) {
      logger.error('Error en verificación de permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Factory para middleware que requiere AL MENOS UNO de los permisos
 * @param {string[]} permissionNames - Lista de permisos (basta con tener uno)
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.get('/reports', requireAnyPermission(['admin.analytics', 'reports.view']), getReports);
 */
function requireAnyPermission(permissionNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await rbacService.hasAnyPermission(req.user.id, permissionNames);

      if (!hasAccess) {
        logger.warn('Acceso denegado - ningún permiso coincide:', {
          userId: req.user.id,
          permissions: permissionNames,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes ninguno de los permisos requeridos',
          error: 'FORBIDDEN',
          requiredPermissions: permissionNames,
          requirementType: 'ANY'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en verificación de permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Factory para middleware que requiere TODOS los permisos
 * @param {string[]} permissionNames - Lista de permisos (debe tener todos)
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.delete('/users/:id', requireAllPermissions(['users.delete', 'admin.dashboard']), deleteUser);
 */
function requireAllPermissions(permissionNames) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      const hasAccess = await rbacService.hasAllPermissions(req.user.id, permissionNames);

      if (!hasAccess) {
        logger.warn('Acceso denegado - faltan permisos:', {
          userId: req.user.id,
          permissions: permissionNames,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes todos los permisos requeridos',
          error: 'FORBIDDEN',
          requiredPermissions: permissionNames,
          requirementType: 'ALL'
        });
      }

      next();
    } catch (error) {
      logger.error('Error en verificación de permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Factory para middleware que verifica propiedad del recurso
 * @param {string} resource - Tipo de recurso
 * @param {string} paramName - Nombre del parámetro en req.params que contiene el ID
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.get('/appointments/:id', requireOwnership('appointments', 'id'), getAppointment);
 */
function requireOwnership(resource, paramName = 'id') {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      const resourceId = req.params[paramName];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'ID de recurso no proporcionado',
          error: 'BAD_REQUEST'
        });
      }

      const isOwner = await rbacService.checkResourceOwnership(
        req.user.id,
        resource,
        resourceId
      );

      if (!isOwner) {
        logger.warn('Acceso denegado - no es propietario:', {
          userId: req.user.id,
          resource,
          resourceId,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a este recurso',
          error: 'FORBIDDEN'
        });
      }

      req.isResourceOwner = true;
      next();
    } catch (error) {
      logger.error('Error verificando propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando acceso al recurso',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Factory para middleware que verifica permiso con propiedad
 * Permite acceso si tiene el permiso completo O si tiene permiso .own y es propietario
 * @param {string} basePermission - Permiso base (ej: 'appointments.read')
 * @param {string} resource - Tipo de recurso
 * @param {string} paramName - Nombre del parámetro con el ID
 * @returns {Function} Middleware de Express
 *
 * @example
 * // Usuario con 'appointments.read' puede ver cualquier cita
 * // Usuario con 'appointments.read.own' solo puede ver sus propias citas
 * router.get('/appointments/:id', requirePermissionWithOwnership('appointments.read', 'appointments', 'id'), getAppointment);
 */
function requirePermissionWithOwnership(basePermission, resource, paramName = 'id') {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      const resourceId = req.params[paramName];

      // Primero verificar permiso completo
      const hasFullPermission = await rbacService.hasPermission(req.user.id, basePermission);

      if (hasFullPermission) {
        req.hasFullPermission = true;
        return next();
      }

      // Luego verificar permiso .own + propiedad
      const ownPermission = `${basePermission}.own`;
      const hasOwnPermission = await rbacService.hasPermission(req.user.id, ownPermission);

      if (hasOwnPermission && resourceId) {
        const isOwner = await rbacService.checkResourceOwnership(
          req.user.id,
          resource,
          resourceId
        );

        if (isOwner) {
          req.isResourceOwner = true;
          return next();
        }
      }

      // Sin acceso
      logger.warn('Acceso denegado - sin permiso ni propiedad:', {
        userId: req.user.id,
        basePermission,
        resource,
        resourceId,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a este recurso',
        error: 'FORBIDDEN',
        requiredPermission: `${basePermission} o ${basePermission}.own`
      });
    } catch (error) {
      logger.error('Error en verificación de permisos con propiedad:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Middleware que requiere rol de admin
 * Atajo común para verificar rol admin
 */
function requireAdmin() {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      // Verificar rol directamente (más eficiente para admin)
      if (req.user.role !== 'admin') {
        logger.warn('Acceso denegado - no es admin:', {
          userId: req.user.id,
          role: req.user.role,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Se requiere rol de administrador',
          error: 'FORBIDDEN'
        });
      }

      next();
    } catch (error) {
      logger.error('Error verificando rol admin:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Middleware que verifica roles específicos
 * @param {string[]} roles - Roles permitidos
 * @returns {Function} Middleware de Express
 *
 * @example
 * router.get('/medical', requireRoles(['doctor', 'admin']), getMedicalData);
 */
function requireRoles(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Autenticación requerida',
          error: 'UNAUTHORIZED'
        });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Acceso denegado por rol:', {
          userId: req.user.id,
          userRole: req.user.role,
          allowedRoles: roles,
          path: req.path
        });

        return res.status(403).json({
          success: false,
          message: 'Tu rol no tiene acceso a esta funcionalidad',
          error: 'FORBIDDEN',
          requiredRoles: roles
        });
      }

      next();
    } catch (error) {
      logger.error('Error verificando roles:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos',
        error: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Middleware que adjunta los permisos del usuario al request
 * Útil cuando necesitas verificar permisos en el controller
 */
async function attachUserPermissions(req, res, next) {
  try {
    if (req.user && req.user.id) {
      req.userPermissions = await rbacService.getUserPermissions(req.user.id);
    } else {
      req.userPermissions = [];
    }
    next();
  } catch (error) {
    logger.error('Error adjuntando permisos:', error);
    req.userPermissions = [];
    next();
  }
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnership,
  requirePermissionWithOwnership,
  requireAdmin,
  requireRoles,
  attachUserPermissions
};
