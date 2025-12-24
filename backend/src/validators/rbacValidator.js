// src/validators/rbacValidator.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Validadores para endpoints RBAC

const { body, param, query, validationResult } = require('express-validator');

// Roles válidos
const VALID_ROLES = ['patient', 'doctor', 'provider', 'admin'];

/**
 * Middleware para verificar errores de validación
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validación para obtener permisos de un usuario
 */
const validateGetUserPermissions = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  validateRequest
];

/**
 * Validación para verificar permiso de un usuario
 */
const validateCheckPermission = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  body('permission')
    .trim()
    .notEmpty()
    .withMessage('Nombre de permiso requerido')
    .matches(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/)
    .withMessage('Formato de permiso inválido (ej: resource.action)'),
  validateRequest
];

/**
 * Validación para otorgar permiso personalizado
 */
const validateGrantPermission = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  body('permission')
    .trim()
    .notEmpty()
    .withMessage('Nombre de permiso requerido')
    .matches(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/)
    .withMessage('Formato de permiso inválido'),
  validateRequest
];

/**
 * Validación para revocar permiso personalizado
 */
const validateRevokePermission = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  body('permission')
    .trim()
    .notEmpty()
    .withMessage('Nombre de permiso requerido')
    .matches(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/)
    .withMessage('Formato de permiso inválido'),
  validateRequest
];

/**
 * Validación para obtener permisos de un rol
 */
const validateGetRolePermissions = [
  param('role')
    .isIn(VALID_ROLES)
    .withMessage(`Rol inválido. Roles válidos: ${VALID_ROLES.join(', ')}`),
  validateRequest
];

/**
 * Validación para asignar permiso a un rol
 */
const validateAssignPermissionToRole = [
  param('role')
    .isIn(VALID_ROLES)
    .withMessage(`Rol inválido. Roles válidos: ${VALID_ROLES.join(', ')}`),
  body('permissionId')
    .isUUID(4)
    .withMessage('ID de permiso inválido (debe ser UUID)'),
  validateRequest
];

/**
 * Validación para remover permiso de un rol
 */
const validateRemovePermissionFromRole = [
  param('role')
    .isIn(VALID_ROLES)
    .withMessage(`Rol inválido. Roles válidos: ${VALID_ROLES.join(', ')}`),
  param('permissionId')
    .isUUID(4)
    .withMessage('ID de permiso inválido (debe ser UUID)'),
  validateRequest
];

/**
 * Validación para crear un permiso nuevo
 */
const validateCreatePermission = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nombre de permiso requerido')
    .matches(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/)
    .withMessage('Formato de nombre inválido (ej: resource.action)')
    .isLength({ max: 100 })
    .withMessage('Nombre muy largo (máximo 100 caracteres)'),
  body('resource')
    .trim()
    .notEmpty()
    .withMessage('Recurso requerido')
    .isLength({ max: 50 })
    .withMessage('Recurso muy largo (máximo 50 caracteres)'),
  body('action')
    .trim()
    .notEmpty()
    .withMessage('Acción requerida')
    .isLength({ max: 50 })
    .withMessage('Acción muy larga (máximo 50 caracteres)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descripción muy larga (máximo 500 caracteres)'),
  validateRequest
];

/**
 * Validación para listar permisos
 */
const validateListPermissions = [
  query('resource')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Recurso inválido'),
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Acción inválida'),
  validateRequest
];

/**
 * Validación para listar usuarios con sus permisos
 */
const validateListUsersWithPermissions = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe estar entre 1 y 100'),
  query('role')
    .optional()
    .isIn(VALID_ROLES)
    .withMessage(`Rol inválido`),
  validateRequest
];

module.exports = {
  validateGetUserPermissions,
  validateCheckPermission,
  validateGrantPermission,
  validateRevokePermission,
  validateGetRolePermissions,
  validateAssignPermissionToRole,
  validateRemovePermissionFromRole,
  validateCreatePermission,
  validateListPermissions,
  validateListUsersWithPermissions
};
