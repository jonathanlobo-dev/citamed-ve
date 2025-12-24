// src/routes/rbac.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Rutas de administración de permisos

const express = require('express');
const router = express.Router();

// Controllers
const rbacController = require('../controllers/rbacController');

// Middleware
const { authMiddleware } = require('../middleware/auth');
const { requirePermission, requireAdmin, attachUserPermissions } = require('../middleware/rbacMiddleware');

// Validators
const {
  validateGetUserPermissions,
  validateCheckPermission,
  validateGrantPermission,
  validateRevokePermission,
  validateGetRolePermissions,
  validateAssignPermissionToRole,
  validateRemovePermissionFromRole,
  validateCreatePermission,
  validateListPermissions
} = require('../validators/rbacValidator');

// ========================================
// RUTAS PÚBLICAS (requieren autenticación)
// ========================================

// Obtener mis propios permisos
router.get('/my-permissions',
  authMiddleware,
  rbacController.getMyPermissions
);

// Verificar si tengo un permiso específico
router.post('/my-permissions/check',
  authMiddleware,
  validateCheckPermission.slice(1), // Solo validar body, no param
  rbacController.checkMyPermission
);

// ========================================
// RUTAS DE ADMINISTRACIÓN (requieren rbac.read o rbac.manage)
// ========================================

// --- PERMISOS ---

// Listar todos los permisos
router.get('/permissions',
  authMiddleware,
  requirePermission('rbac.read'),
  validateListPermissions,
  rbacController.listPermissions
);

// Listar permisos agrupados por recurso
router.get('/permissions/grouped',
  authMiddleware,
  requirePermission('rbac.read'),
  rbacController.listPermissionsGrouped
);

// Crear un nuevo permiso
router.post('/permissions',
  authMiddleware,
  requirePermission('rbac.manage'),
  validateCreatePermission,
  rbacController.createPermission
);

// --- ROLES ---

// Obtener permisos de un rol
router.get('/roles/:role/permissions',
  authMiddleware,
  requirePermission('rbac.read'),
  validateGetRolePermissions,
  rbacController.getRolePermissions
);

// Asignar permiso a un rol
router.post('/roles/:role/permissions',
  authMiddleware,
  requirePermission('rbac.manage'),
  validateAssignPermissionToRole,
  rbacController.assignPermissionToRole
);

// Remover permiso de un rol
router.delete('/roles/:role/permissions/:permissionId',
  authMiddleware,
  requirePermission('rbac.manage'),
  validateRemovePermissionFromRole,
  rbacController.removePermissionFromRole
);

// --- USUARIOS ---

// Obtener permisos efectivos de un usuario
router.get('/users/:userId/permissions',
  authMiddleware,
  requirePermission('rbac.read'),
  validateGetUserPermissions,
  rbacController.getUserPermissions
);

// Verificar si un usuario tiene un permiso
router.post('/users/:userId/permissions/check',
  authMiddleware,
  requirePermission('rbac.read'),
  validateCheckPermission,
  rbacController.checkUserPermission
);

// Otorgar permiso personalizado a un usuario
router.post('/users/:userId/permissions/grant',
  authMiddleware,
  requirePermission('rbac.manage'),
  validateGrantPermission,
  rbacController.grantCustomPermission
);

// Revocar permiso personalizado de un usuario
router.post('/users/:userId/permissions/revoke',
  authMiddleware,
  requirePermission('rbac.manage'),
  validateRevokePermission,
  rbacController.revokeCustomPermission
);

// --- CACHE (solo admin) ---

// Estadísticas del cache
router.get('/cache/stats',
  authMiddleware,
  requireAdmin(),
  rbacController.getCacheStats
);

// Invalidar cache
router.post('/cache/invalidate',
  authMiddleware,
  requireAdmin(),
  rbacController.invalidateCache
);

module.exports = router;
