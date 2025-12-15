/**
 * Performance Metrics Middleware - CITAMED.VE
 *
 * Tracking de métricas de performance:
 * - Response time por endpoint
 * - Almacenamiento en metricsStore
 * - Headers de timing para debugging
 */

const responseTime = require('response-time');
const metricsStore = require('../utils/metricsStore');
const { logger } = require('../config/logger');

/**
 * Umbral para alertar requests lentos (ms)
 */
const SLOW_REQUEST_THRESHOLD = parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000;

/**
 * Rutas a excluir de métricas
 */
const excludedRoutes = [
  '/health',
  '/api/health',
  '/favicon.ico',
  '/metrics'
];

/**
 * Normalizar ruta para agregación
 * Convierte /api/users/123 -> /api/users/:id
 * @param {string} path - Ruta original
 * @returns {string} - Ruta normalizada
 */
const normalizeRoute = (path) => {
  if (!path) return 'unknown';

  return path
    // UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid')
    // IDs numéricos
    .replace(/\/\d+/g, '/:id')
    // Tokens largos
    .replace(/\/[a-zA-Z0-9]{32,}/g, '/:token')
    // Query strings (remover para agregación)
    .replace(/\?.*$/, '');
};

/**
 * Middleware de response-time con métricas
 */
const performanceMiddleware = responseTime((req, res, time) => {
  const route = normalizeRoute(req.route?.path || req.path || req.originalUrl);

  // Skip rutas excluidas
  if (excludedRoutes.some(excluded => route.includes(excluded))) {
    return;
  }

  // Redondear tiempo
  const roundedTime = Math.round(time);

  // Registrar en metrics store
  metricsStore.recordRequest(
    route,
    roundedTime,
    res.statusCode,
    req.method,
    req.user?.id || null
  );

  // Alertar requests lentos
  if (roundedTime > SLOW_REQUEST_THRESHOLD) {
    logger.warn('Slow request detected', {
      route: `${req.method} ${route}`,
      responseTime: `${roundedTime}ms`,
      threshold: `${SLOW_REQUEST_THRESHOLD}ms`,
      statusCode: res.statusCode,
      userId: req.user?.id || 'anonymous',
      type: 'slow_request'
    });
  }
});

/**
 * Middleware para agregar header X-Response-Time
 * Útil para debugging en desarrollo
 */
const responseTimeHeader = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = Math.round((diff[0] * 1e3) + (diff[1] / 1e6));

    // Solo agregar header si no está en producción
    if (process.env.NODE_ENV !== 'production') {
      res.set('X-Response-Time', `${time}ms`);
    }
  });

  next();
};

/**
 * Middleware para tracking de memoria
 * Loggear uso de memoria cada N requests
 */
let requestCount = 0;
const MEMORY_LOG_INTERVAL = 1000;

const memoryTracker = (req, res, next) => {
  requestCount++;

  if (requestCount >= MEMORY_LOG_INTERVAL) {
    const memUsage = process.memoryUsage();
    logger.debug('Memory usage snapshot', {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      requestCount: requestCount
    });
    requestCount = 0;
  }

  next();
};

module.exports = {
  performanceMiddleware,
  responseTimeHeader,
  memoryTracker,
  normalizeRoute,
  SLOW_REQUEST_THRESHOLD
};
