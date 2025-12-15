/**
 * Morgan HTTP Logger Middleware - CITAMED.VE
 *
 * Logging de requests HTTP con Winston:
 * - Formato estructurado JSON
 * - Skip de rutas de health check
 * - Colorizado en desarrollo
 */

const morgan = require('morgan');
const { httpLogger } = require('../config/logger');

/**
 * Token personalizado: ID de usuario
 */
morgan.token('user-id', (req) => {
  return req.user?.id || 'anonymous';
});

/**
 * Token personalizado: Body size
 */
morgan.token('body-size', (req) => {
  const contentLength = req.headers['content-length'];
  return contentLength ? `${contentLength}B` : '0B';
});

/**
 * Token personalizado: Response time redondeado
 */
morgan.token('response-time-rounded', (req, res) => {
  const time = morgan['response-time'](req, res);
  return time ? `${Math.round(parseFloat(time))}ms` : '-';
});

/**
 * Formato JSON para producción
 * Parseable por sistemas de log aggregation
 */
const jsonFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-rounded',
  contentLength: ':res[content-length]',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  userId: ':user-id'
});

/**
 * Formato corto para desarrollo
 */
const devFormat = ':method :url :status :response-time-rounded - :res[content-length]';

/**
 * Rutas a excluir del logging
 * (evitar spam de health checks)
 */
const skipRoutes = [
  '/health',
  '/api/health',
  '/favicon.ico',
  '/robots.txt'
];

/**
 * Función skip: omitir ciertas rutas
 */
const skipFunction = (req) => {
  // Skip health checks y rutas estáticas
  if (skipRoutes.some(route => req.originalUrl.includes(route))) {
    return true;
  }

  // Skip requests sin ruta (edge case)
  if (!req.originalUrl) {
    return true;
  }

  return false;
};

/**
 * Crear middleware Morgan configurado
 * @returns {Function} Morgan middleware
 */
const createMorganLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return morgan(isProduction ? jsonFormat : devFormat, {
    stream: httpLogger,
    skip: skipFunction,
    // Immediate: false = log después de respuesta
    immediate: false
  });
};

/**
 * Morgan para errores (siempre loggear)
 * Usar después del error handler
 */
const morganErrorLogger = morgan(jsonFormat, {
  stream: httpLogger,
  skip: (req, res) => res.statusCode < 400,
  immediate: false
});

module.exports = {
  morganLogger: createMorganLogger(),
  morganErrorLogger,
  skipRoutes
};
