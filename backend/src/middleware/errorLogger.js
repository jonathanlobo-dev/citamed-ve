/**
 * Error Logger Middleware - CITAMED.VE
 *
 * Logging estructurado de errores:
 * - Captura de stack traces
 * - Contexto de request
 * - Clasificación por tipo de error
 */

const { logger, logError } = require('../config/logger');
const metricsStore = require('../utils/metricsStore');

/**
 * Sanitizar datos sensibles del request
 * @param {Object} req - Express request
 * @returns {Object} - Datos sanitizados
 */
const sanitizeRequestData = (req) => {
  const headers = { ...req.headers };

  // Remover headers sensibles
  delete headers.authorization;
  delete headers.cookie;
  delete headers['x-api-key'];

  // Sanitizar body (no incluir passwords)
  const body = req.body ? { ...req.body } : {};
  const sensitiveFields = ['password', 'confirmPassword', 'token', 'secret', 'apiKey'];
  sensitiveFields.forEach(field => {
    if (body[field]) {
      body[field] = '[REDACTED]';
    }
  });

  return {
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    body: Object.keys(body).length > 0 ? body : undefined,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || 'anonymous',
    headers: process.env.NODE_ENV !== 'production' ? headers : undefined
  };
};

/**
 * Clasificar error por tipo
 * @param {Error} error - Error object
 * @returns {string} - Tipo de error
 */
const classifyError = (error) => {
  if (error.name === 'ValidationError') return 'validation';
  if (error.name === 'UnauthorizedError') return 'auth';
  if (error.name === 'JsonWebTokenError') return 'jwt';
  if (error.name === 'TokenExpiredError') return 'jwt_expired';
  if (error.name === 'SequelizeValidationError') return 'db_validation';
  if (error.name === 'SequelizeUniqueConstraintError') return 'db_constraint';
  if (error.name === 'SequelizeDatabaseError') return 'db_error';
  if (error.name === 'SequelizeConnectionError') return 'db_connection';
  if (error.code === 'ECONNREFUSED') return 'connection';
  if (error.code === 'ETIMEDOUT') return 'timeout';
  if (error.statusCode >= 500) return 'server';
  if (error.statusCode >= 400) return 'client';
  return 'unknown';
};

/**
 * Middleware para logging de errores
 * Usar ANTES del error handler final
 */
const errorLoggerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const errorType = classifyError(err);

  // Construir contexto de error
  const errorContext = {
    errorType,
    statusCode,
    errorName: err.name,
    errorCode: err.code,
    request: sanitizeRequestData(req),
    timestamp: new Date().toISOString()
  };

  // Log según severidad
  if (statusCode >= 500) {
    // Errores del servidor - siempre loggear con stack
    logger.error(err.message, {
      ...errorContext,
      stack: err.stack,
      critical: true
    });
  } else if (statusCode >= 400) {
    // Errores del cliente - log como warning
    logger.warn(err.message, {
      ...errorContext,
      // No incluir stack para errores 4xx
    });
  }

  // Registrar en métricas (si hay ruta)
  if (req.originalUrl) {
    const route = req.route?.path || req.path || req.originalUrl;
    metricsStore.recordError(statusCode, `${req.method} ${route}`);
  }

  // Pasar al siguiente middleware
  next(err);
};

/**
 * Middleware para errores no capturados
 * Usar como último middleware de errores
 */
const uncaughtErrorLogger = (err, req, res, next) => {
  // Si ya se envió respuesta, no hacer nada
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Loggear si no se ha loggeado antes
  if (!err._logged) {
    logger.error('Uncaught error in request', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
    err._logged = true;
  }

  // Respuesta de error
  res.status(statusCode).json({
    success: false,
    error: {
      message: isProduction && statusCode === 500
        ? 'Internal server error'
        : err.message,
      code: err.code || 'INTERNAL_ERROR',
      ...(isProduction ? {} : { stack: err.stack })
    }
  });
};

/**
 * Handler para errores de proceso
 * Configurar en app startup
 */
const setupProcessErrorHandlers = () => {
  // Uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack,
      type: 'uncaughtException',
      critical: true
    });

    // En producción, dar tiempo para flush de logs
    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  // Unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      type: 'unhandledRejection',
      critical: true
    });
  });

  // SIGTERM handling
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
  });
};

module.exports = {
  errorLoggerMiddleware,
  uncaughtErrorLogger,
  setupProcessErrorHandlers,
  sanitizeRequestData,
  classifyError
};
