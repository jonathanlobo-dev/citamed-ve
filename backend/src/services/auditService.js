// src/services/auditService.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Servicio de auditoría del sistema

const { logger } = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

// Campos sensibles que deben ser redactados
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'secret', 'token', 'apiKey', 'apiSecret',
  'twoFactorSecret', 'twoFactorBackupCodes', 'resetPasswordToken',
  'verificationToken', 'accessToken', 'refreshToken', 'creditCard',
  'cvv', 'pin', 'ssn', 'socialSecurityNumber'
];

// Campos que indican cambios críticos
const CRITICAL_CHANGE_FIELDS = ['role', 'permissions', 'customPermissions', 'isActive'];
const WARNING_CHANGE_FIELDS = ['email', 'password', 'twoFactorEnabled', 'twoFactorSecret'];

/**
 * Sanitiza datos sensibles de un objeto
 * @param {Object} data - Datos a sanitizar
 * @returns {Object} Datos sanitizados
 */
function sanitizeSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();

    // Verificar si es un campo sensible
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 8) {
        // Mostrar solo primeros y últimos 4 caracteres para API keys
        if (lowerKey.includes('apikey') || lowerKey.includes('token')) {
          sanitized[key] = `${sanitized[key].substring(0, 4)}...${sanitized[key].slice(-4)}`;
        } else {
          sanitized[key] = '[REDACTED]';
        }
      } else {
        sanitized[key] = '[REDACTED]';
      }
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursivamente sanitizar objetos anidados
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Detecta la severidad basada en los campos cambiados
 * @param {Object} changesBefore - Estado anterior
 * @param {Object} changesAfter - Estado nuevo
 * @returns {string} Severidad detectada
 */
function detectSeverityFromChanges(changesBefore, changesAfter) {
  if (!changesBefore || !changesAfter) return 'info';

  const changedFields = [];

  // Detectar campos que cambiaron
  for (const key of Object.keys(changesAfter)) {
    if (JSON.stringify(changesBefore[key]) !== JSON.stringify(changesAfter[key])) {
      changedFields.push(key);
    }
  }

  // Verificar campos críticos
  if (changedFields.some(field => CRITICAL_CHANGE_FIELDS.includes(field))) {
    return 'critical';
  }

  // Verificar campos de advertencia
  if (changedFields.some(field => WARNING_CHANGE_FIELDS.includes(field))) {
    return 'warning';
  }

  return 'info';
}

/**
 * Crea un log de auditoría
 * @param {Object} auditData - Datos del log
 * @returns {Promise<Object>} Log creado
 */
async function log(auditData) {
  const db = require('../models');
  const { AuditLog } = db;

  try {
    // Sanitizar datos sensibles
    const sanitizedBefore = sanitizeSensitiveData(auditData.changesBefore);
    const sanitizedAfter = sanitizeSensitiveData(auditData.changesAfter);
    const sanitizedMetadata = sanitizeSensitiveData(auditData.metadata);

    // Crear el log
    const auditLog = await AuditLog.createLog({
      userId: auditData.userId || null,
      action: auditData.action,
      resource: auditData.resource || null,
      resourceId: auditData.resourceId?.toString() || null,
      method: auditData.method || null,
      endpoint: auditData.endpoint || null,
      statusCode: auditData.statusCode || null,
      ipAddress: auditData.ipAddress || null,
      userAgent: auditData.userAgent || null,
      changesBefore: sanitizedBefore,
      changesAfter: sanitizedAfter,
      metadata: sanitizedMetadata || {},
      severity: auditData.severity || 'info'
    });

    // Si es crítico, trigger alerta
    if (auditData.severity === 'critical') {
      await triggerSecurityAlert(auditLog);
    }

    logger.debug('Audit log created:', {
      id: auditLog.id,
      action: auditLog.action,
      severity: auditLog.severity
    });

    return auditLog;
  } catch (error) {
    // No fallar el request principal si el log falla
    logger.error('Error creating audit log:', {
      error: error.message,
      action: auditData.action
    });
    return null;
  }
}

/**
 * Wrapper para logging de cambios de datos
 * @param {string} resource - Tipo de recurso
 * @param {string} resourceId - ID del recurso
 * @param {number} userId - ID del usuario
 * @param {Object} changesBefore - Estado anterior
 * @param {Object} changesAfter - Estado nuevo
 * @param {Object} metadata - Metadata adicional
 * @returns {Promise<Object>} Log creado
 */
async function logChange(resource, resourceId, userId, changesBefore, changesAfter, metadata = {}) {
  const severity = detectSeverityFromChanges(changesBefore, changesAfter);

  return await log({
    userId,
    action: `${resource}.updated`,
    resource,
    resourceId,
    changesBefore,
    changesAfter,
    metadata: {
      ...metadata,
      changedFields: getChangedFields(changesBefore, changesAfter)
    },
    severity
  });
}

/**
 * Obtiene lista de campos que cambiaron
 */
function getChangedFields(before, after) {
  if (!before || !after) return [];

  const changed = [];
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changed.push(key);
    }
  }
  return changed;
}

/**
 * Wrapper para eventos de seguridad
 * @param {string} eventType - Tipo de evento
 * @param {number} userId - ID del usuario
 * @param {Object} metadata - Metadata del evento
 * @param {string} severity - Severidad (default: warning)
 * @returns {Promise<Object>} Log creado
 */
async function logSecurityEvent(eventType, userId, metadata = {}, severity = 'warning') {
  const db = require('../models');
  const { AuditLog } = db;

  // Verificar si hay demasiados login fallidos
  if (eventType === 'auth.login.failed' && userId) {
    const recentFailures = await AuditLog.countRecentLoginFailures(userId, 10);
    if (recentFailures >= 4) {
      severity = 'critical';
      metadata.consecutiveFailures = recentFailures + 1;
      metadata.potentialBruteForce = true;
    }
  }

  return await log({
    userId,
    action: eventType,
    resource: 'security',
    metadata: {
      ...metadata,
      eventType
    },
    severity
  });
}

/**
 * Trigger alerta de seguridad
 * @param {Object} auditLog - Log de auditoría
 */
async function triggerSecurityAlert(auditLog) {
  // Por ahora solo logueamos, en producción enviaría email/Slack
  logger.warn('SECURITY ALERT:', {
    id: auditLog.id,
    action: auditLog.action,
    userId: auditLog.userId,
    severity: auditLog.severity,
    ipAddress: auditLog.ipAddress
  });

  // TODO: Implementar notificaciones por email/Slack
  // await notificationService.sendSecurityAlert(auditLog);
}

/**
 * Obtiene logs con filtros y paginación
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Object>} Logs paginados
 */
async function getLogs(filters = {}) {
  const db = require('../models');
  const { AuditLog } = db;

  const {
    userId,
    action,
    resource,
    resourceId,
    severity,
    startDate,
    endDate,
    ipAddress,
    search,
    page = 1,
    limit = 50,
    orderBy = 'createdAt',
    orderDir = 'DESC'
  } = filters;

  return await AuditLog.findWithFilters({
    userId,
    action,
    resource,
    resourceId,
    severity,
    startDate,
    endDate,
    ipAddress,
    search
  }, {
    limit: Math.min(parseInt(limit), 1000),
    offset: (parseInt(page) - 1) * parseInt(limit),
    orderBy,
    orderDir
  });
}

/**
 * Obtiene un log por ID
 * @param {string} logId - ID del log
 * @returns {Promise<Object>} Log completo
 */
async function getLogById(logId) {
  const db = require('../models');
  const { AuditLog, User } = db;

  const log = await AuditLog.findByPk(logId, {
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'firstName', 'lastName', 'role']
    }]
  });

  return log;
}

/**
 * Obtiene historial de un recurso específico
 * @param {string} resource - Tipo de recurso
 * @param {string} resourceId - ID del recurso
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Array>} Lista de logs
 */
async function getLogsByResource(resource, resourceId, limit = 50) {
  const db = require('../models');
  const { AuditLog } = db;

  return await AuditLog.findByResource(resource, resourceId.toString(), limit);
}

/**
 * Obtiene alertas de seguridad recientes
 * @param {number} hoursAgo - Horas hacia atrás (default: 24)
 * @returns {Promise<Array>} Lista de alertas
 */
async function getSecurityAlerts(hoursAgo = 24) {
  const db = require('../models');
  const { AuditLog } = db;

  return await AuditLog.getSecurityAlerts(hoursAgo);
}

/**
 * Obtiene estadísticas de auditoría
 * @param {string} startDate - Fecha inicio
 * @param {string} endDate - Fecha fin
 * @returns {Promise<Object>} Estadísticas
 */
async function getAuditStats(startDate, endDate) {
  const db = require('../models');
  const { AuditLog } = db;

  // Si no hay fechas, usar última semana
  if (!startDate) {
    startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (!endDate) {
    endDate = new Date().toISOString();
  }

  return await AuditLog.getStats(startDate, endDate);
}

/**
 * Exporta logs a archivo
 * @param {Object} filters - Filtros de búsqueda
 * @param {string} format - Formato: 'csv', 'json', 'xlsx'
 * @returns {Promise<Object>} Info del archivo generado
 */
async function exportLogs(filters = {}, format = 'csv') {
  const { logs } = await getLogs({ ...filters, limit: 10000 });

  const exportDir = process.env.AUDIT_EXPORT_TEMP_DIR || '/tmp/audit-exports';

  // Crear directorio si no existe
  try {
    await fs.mkdir(exportDir, { recursive: true });
  } catch (err) {
    // Ignorar si ya existe
  }

  const timestamp = Date.now();
  const filename = `audit-logs-${timestamp}.${format}`;
  const filepath = path.join(exportDir, filename);

  if (format === 'json') {
    // Exportar como JSON
    const data = logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      user: log.user ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})` : 'Sistema',
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      severity: log.severity,
      ipAddress: log.ipAddress,
      statusCode: log.statusCode,
      endpoint: log.endpoint,
      changesBefore: log.changesBefore,
      changesAfter: log.changesAfter,
      metadata: log.metadata
    }));

    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  } else if (format === 'csv') {
    // Exportar como CSV
    const headers = ['ID', 'Timestamp', 'Usuario', 'Acción', 'Recurso', 'ResourceID', 'Severidad', 'IP', 'Status', 'Endpoint'];
    const rows = logs.map(log => [
      log.id,
      log.createdAt?.toISOString() || '',
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema',
      log.action,
      log.resource || '',
      log.resourceId || '',
      log.severity,
      log.ipAddress || '',
      log.statusCode || '',
      log.endpoint || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    await fs.writeFile(filepath, csvContent);
  }

  // Programar eliminación después de 1 hora
  setTimeout(async () => {
    try {
      await fs.unlink(filepath);
      logger.info('Export file deleted:', filename);
    } catch (err) {
      // Ignorar si ya fue eliminado
    }
  }, 60 * 60 * 1000);

  return {
    filename,
    filepath,
    format,
    recordCount: logs.length,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
}

/**
 * Log rápido para requests
 */
async function logRequest(req, statusCode, options = {}) {
  return await log({
    userId: req.user?.id || null,
    action: options.action || `${req.method.toLowerCase()}.request`,
    resource: options.resource || null,
    resourceId: options.resourceId || req.params?.id || null,
    method: req.method,
    endpoint: req.originalUrl || req.path,
    statusCode,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers?.['user-agent'],
    metadata: options.metadata || {},
    severity: options.severity || (statusCode >= 400 ? 'error' : 'info')
  });
}

module.exports = {
  log,
  logChange,
  logSecurityEvent,
  logRequest,
  getLogs,
  getLogById,
  getLogsByResource,
  getSecurityAlerts,
  getAuditStats,
  exportLogs,
  sanitizeSensitiveData,
  detectSeverityFromChanges
};
