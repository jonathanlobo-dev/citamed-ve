// src/validators/auditValidator.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Validadores para endpoints de auditoría

const { query, param, body, validationResult } = require('express-validator');

// Severidades válidas
const VALID_SEVERITIES = ['info', 'warning', 'error', 'critical'];

// Formatos de exportación válidos
const VALID_EXPORT_FORMATS = ['csv', 'json'];

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
 * Validación para obtener logs
 */
const validateGetLogs = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Límite debe estar entre 1 y 1000'),
  query('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Acción inválida'),
  query('resource')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Recurso inválido'),
  query('resourceId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('ID de recurso inválido'),
  query('severity')
    .optional()
    .custom(value => {
      const severities = value.split(',');
      return severities.every(s => VALID_SEVERITIES.includes(s.trim()));
    })
    .withMessage(`Severidad inválida. Valores válidos: ${VALID_SEVERITIES.join(', ')}`),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida (formato ISO 8601)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida (formato ISO 8601)'),
  query('ipAddress')
    .optional()
    .isIP()
    .withMessage('Dirección IP inválida'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Búsqueda inválida'),
  validateRequest
];

/**
 * Validación para obtener log por ID
 */
const validateGetLogById = [
  param('logId')
    .isUUID(4)
    .withMessage('ID de log inválido (debe ser UUID)'),
  validateRequest
];

/**
 * Validación para obtener historial de recurso
 */
const validateGetResourceHistory = [
  param('resource')
    .trim()
    .notEmpty()
    .withMessage('Recurso requerido')
    .isLength({ max: 50 })
    .withMessage('Recurso muy largo'),
  param('resourceId')
    .trim()
    .notEmpty()
    .withMessage('ID de recurso requerido'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Límite debe estar entre 1 y 500'),
  validateRequest
];

/**
 * Validación para obtener alertas de seguridad
 */
const validateGetSecurityAlerts = [
  query('since')
    .optional()
    .isInt({ min: 1, max: 168 }) // Máximo 1 semana (168 horas)
    .withMessage('Horas debe estar entre 1 y 168'),
  validateRequest
];

/**
 * Validación para obtener estadísticas
 */
const validateGetStats = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  validateRequest
];

/**
 * Validación para exportar logs
 */
const validateExportLogs = [
  query('format')
    .optional()
    .isIn(VALID_EXPORT_FORMATS)
    .withMessage(`Formato inválido. Valores válidos: ${VALID_EXPORT_FORMATS.join(', ')}`),
  // Validar filtros en body
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filtros debe ser un objeto'),
  body('filters.userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de usuario inválido'),
  body('filters.startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio inválida'),
  body('filters.endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin inválida'),
  body('filters.severity')
    .optional()
    .custom(value => {
      if (Array.isArray(value)) {
        return value.every(s => VALID_SEVERITIES.includes(s));
      }
      return VALID_SEVERITIES.includes(value);
    })
    .withMessage('Severidad inválida'),
  validateRequest
];

module.exports = {
  validateGetLogs,
  validateGetLogById,
  validateGetResourceHistory,
  validateGetSecurityAlerts,
  validateGetStats,
  validateExportLogs
};
