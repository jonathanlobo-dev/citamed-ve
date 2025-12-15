/**
 * Security Middleware Stack - CITAMED.VE
 *
 * Middleware centralizado que aplica todas las medidas de seguridad:
 * - Helmet (security headers)
 * - CORS
 * - Sanitización de inputs
 * - HTTPS enforcement
 * - Request logging
 */

const cors = require('cors');
const { securityHeaders } = require('../config/helmet.config');
const { corsOptions, strictCorsOptions } = require('../config/cors.config');
const { sanitizerStack } = require('./sanitizer');

// Determinar entorno
const isProduction = process.env.NODE_ENV === 'production';
const enforceHttps = process.env.ENFORCE_HTTPS === 'true';

/**
 * Middleware para forzar HTTPS en producción
 */
const httpsEnforcer = (req, res, next) => {
  if (isProduction && enforceHttps) {
    // Verificar si ya es HTTPS
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

    if (!isHttps) {
      // Redirigir a HTTPS
      const httpsUrl = `https://${req.hostname}${req.originalUrl}`;
      console.log(`[Security] Redirecting HTTP to HTTPS: ${req.originalUrl}`);
      return res.redirect(301, httpsUrl);
    }
  }

  next();
};

/**
 * Middleware para logging de requests sospechosos
 */
const securityLogger = (req, res, next) => {
  // Detectar patrones sospechosos
  const suspiciousPatterns = [
    /\.\.\//,                    // Path traversal
    /<script/i,                  // XSS attempt
    /union\s+select/i,           // SQL injection
    /\$where/i,                  // NoSQL injection
    /\$gt|\$lt|\$ne/i,           // MongoDB operators
    /javascript:/i,              // JS protocol
    /on\w+\s*=/i                 // Event handlers
  ];

  const checkValue = (value) => {
    if (typeof value !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => {
      if (typeof value === 'string') return checkValue(value);
      if (typeof value === 'object') return checkObject(value);
      return false;
    });
  };

  // Verificar body, query y params
  const isSuspicious =
    checkObject(req.body) ||
    checkObject(req.query) ||
    checkObject(req.params);

  if (isSuspicious) {
    console.warn(
      `[Security] Suspicious request detected:\n` +
      `  IP: ${req.ip}\n` +
      `  Method: ${req.method}\n` +
      `  Path: ${req.path}\n` +
      `  User-Agent: ${req.headers['user-agent']}\n` +
      `  Timestamp: ${new Date().toISOString()}`
    );

    // Opcional: bloquear request sospechoso
    // return res.status(400).json({ error: 'Bad Request' });
  }

  next();
};

/**
 * Middleware para agregar request ID
 * Útil para tracking y debugging
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] ||
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  next();
};

/**
 * Middleware para validar que el body no exceda límites
 */
const bodyLimiter = (req, res, next) => {
  // Límites de campos en body
  const maxFields = 50;
  const maxDepth = 5;

  const countFields = (obj, depth = 0) => {
    if (depth > maxDepth) return Infinity;
    if (!obj || typeof obj !== 'object') return 0;

    let count = 0;
    for (const key of Object.keys(obj)) {
      count++;
      if (typeof obj[key] === 'object') {
        count += countFields(obj[key], depth + 1);
      }
    }
    return count;
  };

  if (req.body && countFields(req.body) > maxFields) {
    console.warn(`[Security] Too many fields in request body from ${req.ip}`);
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request body has too many fields'
    });
  }

  next();
};

/**
 * Middleware para headers de seguridad en respuestas de error
 */
const secureErrorHandler = (err, req, res, next) => {
  // No revelar stack traces en producción
  const errorResponse = {
    success: false,
    error: err.name || 'Error',
    message: isProduction
      ? 'Ha ocurrido un error. Por favor intente nuevamente.'
      : err.message
  };

  // Solo incluir stack en desarrollo
  if (!isProduction && err.stack) {
    errorResponse.stack = err.stack;
  }

  // Log del error
  console.error(`[Security] Error: ${err.message}`, {
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json(errorResponse);
};

/**
 * Stack completo de seguridad
 * ORDEN IMPORTANTE - aplicar en este orden
 */
const securityStack = [
  // 1. Request ID para tracking
  requestId,

  // 2. HTTPS enforcement (solo producción)
  httpsEnforcer,

  // 3. Security headers (Helmet)
  ...securityHeaders,

  // 4. CORS
  cors(corsOptions),

  // 5. Body limiter
  bodyLimiter,

  // 6. Sanitización de inputs
  ...sanitizerStack,

  // 7. Security logging
  securityLogger
];

/**
 * Stack mínimo para endpoints públicos (health, etc)
 */
const minimalSecurityStack = [
  requestId,
  ...securityHeaders,
  cors(corsOptions)
];

/**
 * Aplicar stack de seguridad a una app Express
 * @param {Express} app - Aplicación Express
 */
const applySecurityMiddleware = (app) => {
  // Deshabilitar X-Powered-By
  app.disable('x-powered-by');

  // Aplicar stack de seguridad
  securityStack.forEach(middleware => {
    app.use(middleware);
  });

  console.log('[Security] Security middleware stack applied');
  console.log(`[Security] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Security] HTTPS enforcement: ${enforceHttps}`);
};

module.exports = {
  securityStack,
  minimalSecurityStack,
  applySecurityMiddleware,
  httpsEnforcer,
  securityLogger,
  requestId,
  bodyLimiter,
  secureErrorHandler,
  corsMiddleware: cors(corsOptions),
  strictCorsMiddleware: cors(strictCorsOptions)
};
