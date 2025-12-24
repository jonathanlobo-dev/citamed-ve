// src/middleware/auditMiddleware.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Middleware de auditoría automática

const auditService = require('../services/auditService');
const { logger } = require('../config/logger');

/**
 * Factory para middleware de auditoría
 * @param {Object} options - Opciones de configuración
 * @param {string} options.action - Acción a registrar (auto-generada si no se provee)
 * @param {string} options.resource - Tipo de recurso
 * @param {boolean} options.includeBody - Incluir req.body en metadata
 * @param {boolean} options.includeQuery - Incluir req.query en metadata
 * @param {boolean} options.trackChanges - Capturar estado before/after
 * @param {string} options.severity - Severidad (default: 'info')
 * @param {Function} options.getResourceId - Función para extraer resourceId
 * @returns {Function} Middleware de Express
 */
function auditLog(options = {}) {
  const {
    action,
    resource,
    includeBody = false,
    includeQuery = false,
    trackChanges = false,
    severity = 'info',
    getResourceId = (req) => req.params.id || req.params.userId || req.params.sessionId
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    let beforeState = null;

    // Si trackChanges, capturar estado ANTES
    if (trackChanges && resource) {
      try {
        beforeState = await getResourceState(resource, getResourceId(req));
        req.auditBeforeState = beforeState;
      } catch (err) {
        logger.warn('Error capturing before state for audit:', err.message);
      }
    }

    // Guardar el método original de res.json para interceptar la respuesta
    const originalJson = res.json.bind(res);
    let responseBody = null;

    res.json = function(body) {
      responseBody = body;
      return originalJson(body);
    };

    // Interceptar cuando la respuesta termine
    res.on('finish', async () => {
      try {
        const duration = Date.now() - startTime;
        let afterState = null;

        // Si trackChanges, capturar estado DESPUÉS
        if (trackChanges && resource && res.statusCode < 400) {
          try {
            afterState = await getResourceState(resource, getResourceId(req));
          } catch (err) {
            logger.warn('Error capturing after state for audit:', err.message);
          }
        }

        // Construir metadata
        const metadata = {
          requestDuration: duration
        };

        if (includeBody && req.body) {
          metadata.requestBody = auditService.sanitizeSensitiveData(req.body);
        }

        if (includeQuery && req.query && Object.keys(req.query).length > 0) {
          metadata.queryParams = req.query;
        }

        // Detectar severidad automática
        let finalSeverity = severity;
        if (res.statusCode >= 500) {
          finalSeverity = 'error';
        } else if (res.statusCode === 403 || res.statusCode === 401) {
          finalSeverity = 'warning';
        } else if (trackChanges && beforeState && afterState) {
          finalSeverity = auditService.detectSeverityFromChanges(beforeState, afterState);
        }

        // Generar acción automática si no se provee
        const finalAction = action || generateAction(req.method, resource);

        // Crear log de auditoría (async, no bloquear)
        auditService.log({
          userId: req.user?.id || null,
          action: finalAction,
          resource: resource || extractResourceFromPath(req.path),
          resourceId: getResourceId(req),
          method: req.method,
          endpoint: req.originalUrl || req.path,
          statusCode: res.statusCode,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          changesBefore: beforeState,
          changesAfter: afterState,
          metadata,
          severity: finalSeverity
        }).catch(err => {
          logger.error('Failed to create audit log:', err.message);
        });
      } catch (err) {
        logger.error('Error in audit middleware:', err.message);
      }
    });

    next();
  };
}

/**
 * Middleware global para logging básico de requests sensibles
 * Solo para endpoints específicos, no para todos los GET
 */
function auditRequest() {
  return (req, res, next) => {
    // Solo auditar métodos que modifican datos
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalJson = res.json.bind(res);

      res.json = function(body) {
        // Log asíncrono
        auditService.logRequest(req, res.statusCode, {
          action: `${req.method.toLowerCase()}.${extractResourceFromPath(req.path)}`
        }).catch(err => {
          logger.error('Failed to log request:', err.message);
        });

        return originalJson(body);
      };
    }

    next();
  };
}

/**
 * Middleware para eventos de seguridad
 * Detecta y registra eventos de seguridad automáticamente
 */
function auditSecurityEvent() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(body) {
      // Detectar eventos de seguridad basados en status code
      if (res.statusCode === 401) {
        auditService.logSecurityEvent(
          'auth.unauthorized',
          req.user?.id || null,
          {
            endpoint: req.originalUrl,
            method: req.method,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
          },
          'warning'
        ).catch(err => logger.error('Security event log failed:', err.message));
      } else if (res.statusCode === 403) {
        auditService.logSecurityEvent(
          'auth.forbidden',
          req.user?.id || null,
          {
            endpoint: req.originalUrl,
            method: req.method,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent']
          },
          'warning'
        ).catch(err => logger.error('Security event log failed:', err.message));
      } else if (res.statusCode === 429) {
        auditService.logSecurityEvent(
          'security.rate_limit_exceeded',
          req.user?.id || null,
          {
            endpoint: req.originalUrl,
            method: req.method,
            ipAddress: getClientIp(req)
          },
          'warning'
        ).catch(err => logger.error('Security event log failed:', err.message));
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Obtiene el estado de un recurso desde la base de datos
 * @param {string} resource - Tipo de recurso
 * @param {string} resourceId - ID del recurso
 * @returns {Promise<Object>} Estado del recurso
 */
async function getResourceState(resource, resourceId) {
  if (!resourceId) return null;

  const db = require('../models');

  try {
    switch (resource) {
      case 'user': {
        const user = await db.User.findByPk(resourceId, {
          attributes: { exclude: ['password', 'twoFactorSecret', 'twoFactorBackupCodes'] }
        });
        return user ? user.toJSON() : null;
      }

      case 'session': {
        const session = await db.UserSession.findByPk(resourceId);
        return session ? session.toJSON() : null;
      }

      case 'appointment': {
        const appointment = await db.Appointment.findByPk(resourceId);
        return appointment ? appointment.toJSON() : null;
      }

      case 'permission': {
        const permission = await db.Permission.findByPk(resourceId);
        return permission ? permission.toJSON() : null;
      }

      case 'rolePermission': {
        const rp = await db.RolePermission.findByPk(resourceId);
        return rp ? rp.toJSON() : null;
      }

      default:
        return null;
    }
  } catch (err) {
    logger.warn(`Error getting resource state for ${resource}:${resourceId}`, err.message);
    return null;
  }
}

/**
 * Genera acción automática basada en método HTTP y recurso
 */
function generateAction(method, resource) {
  const resourceName = resource || 'unknown';
  const methodActions = {
    'GET': 'read',
    'POST': 'created',
    'PUT': 'updated',
    'PATCH': 'updated',
    'DELETE': 'deleted'
  };

  return `${resourceName}.${methodActions[method] || 'accessed'}`;
}

/**
 * Extrae el nombre del recurso desde la ruta
 */
function extractResourceFromPath(path) {
  // /api/users/123 -> users
  // /api/sessions/active -> sessions
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'api' && parts[1]) {
    return parts[1];
  }
  return parts[0] || 'unknown';
}

/**
 * Obtiene la IP del cliente considerando proxies
 */
function getClientIp(req) {
  return req.ip ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown';
}

/**
 * Middleware para agregar contexto de auditoría al request
 */
function addAuditContext() {
  return (req, res, next) => {
    req.auditContext = {
      startTime: Date.now(),
      clientIp: getClientIp(req),
      userAgent: req.headers['user-agent']
    };
    next();
  };
}

module.exports = {
  auditLog,
  auditRequest,
  auditSecurityEvent,
  addAuditContext,
  getClientIp
};
