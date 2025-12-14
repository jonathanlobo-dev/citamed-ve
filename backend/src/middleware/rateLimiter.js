/**
 * Rate Limiting Middleware - CITAMED.VE
 *
 * Middleware de protección contra abuso de API:
 * - Múltiples estrategias según tipo de endpoint
 * - Storage en Redis (con fallback a memoria)
 * - Headers informativos RateLimit-*
 * - Logging de violaciones
 * - Whitelist de IPs y paths
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient, isRedisConnected } = require('../config/redis');
const { rateLimitConfig, headerConfig, isRateLimitEnabled } = require('../config/rateLimit.config');
const { shouldSkipRateLimit } = require('../config/rateLimit.whitelist');
const { logRateLimitExceeded, createSkipFunction, getClientIP } = require('../utils/rateLimitLogger');

/**
 * Crear store de Redis o fallback a memoria
 * @param {string} prefix - Prefijo para keys de Redis
 * @returns {Object|undefined} - Redis store o undefined para memoria
 */
const createStore = (prefix) => {
  // Si Redis no está conectado, usar store en memoria (default)
  if (!redisClient || !isRedisConnected()) {
    console.log(`[RateLimit] Redis not available, using memory store for ${prefix}`);
    return undefined;
  }

  try {
    return new RedisStore({
      // Usar sendCommand para ioredis
      sendCommand: (...args) => redisClient.call(...args),
      prefix: `${rateLimitConfig.redisPrefix}${prefix}:`
    });
  } catch (error) {
    console.error(`[RateLimit] Failed to create Redis store: ${error.message}`);
    return undefined;
  }
};

/**
 * Handler de respuesta personalizada para rate limit excedido
 * @param {string} category - Categoría del limiter
 * @returns {Function} - Handler para express-rate-limit
 */
const createHandler = (category) => (req, res, next, options) => {
  const retryAfter = Math.ceil((options.windowMs - (Date.now() % options.windowMs)) / 1000);

  // Log de violación
  logRateLimitExceeded(req, category, {
    limit: options.limit,
    retryAfter
  });

  // Formatear minutos para mensaje
  const minutes = Math.ceil(retryAfter / 60);
  const timeMessage = minutes > 1 ? `${minutes} minutos` : `${retryAfter} segundos`;

  res.status(429).json({
    error: rateLimitConfig[category].message.error,
    message: `${rateLimitConfig[category].message.message.replace('unos minutos', timeMessage)}`,
    code: rateLimitConfig[category].message.code,
    retryAfter,
    limit: options.limit,
    remaining: 0
  });
};

/**
 * Key generator por IP (default)
 */
const keyGeneratorByIP = (req) => {
  return getClientIP(req);
};

/**
 * Key generator por usuario autenticado
 * Fallback a IP si no hay usuario
 */
const keyGeneratorByUser = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return keyGeneratorByIP(req);
};

/**
 * Key generator combinado IP + User
 */
const keyGeneratorIPAndUser = (req) => {
  const ip = getClientIP(req);
  const userId = req.user?.id || 'anon';
  return `${ip}:${userId}`;
};

// ==========================================
// RATE LIMITERS
// ==========================================

/**
 * General API Limiter
 * 100 requests / 15 minutos por IP
 * Para endpoints GET generales
 */
const generalLimiter = rateLimit({
  store: createStore('general'),
  windowMs: rateLimitConfig.general.windowMs,
  limit: rateLimitConfig.general.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorByIP,
  skip: createSkipFunction(shouldSkipRateLimit),
  handler: createHandler('general')
});

/**
 * Auth Limiter (Estricto)
 * 5 requests / 15 minutos por IP
 * Para login, register, password reset
 */
const authLimiter = rateLimit({
  store: createStore('auth'),
  windowMs: rateLimitConfig.auth.windowMs,
  limit: rateLimitConfig.auth.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorByIP,
  skip: createSkipFunction(shouldSkipRateLimit),
  handler: createHandler('auth')
});

/**
 * Search Limiter
 * 30 requests / 1 minuto por usuario autenticado
 * Para búsquedas de doctores, especialidades
 */
const searchLimiter = rateLimit({
  store: createStore('search'),
  windowMs: rateLimitConfig.search.windowMs,
  limit: rateLimitConfig.search.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorByUser,
  skip: createSkipFunction(shouldSkipRateLimit),
  handler: createHandler('search')
});

/**
 * Creation Limiter
 * 10 requests / 1 minuto por usuario
 * Para crear appointments, reviews, etc.
 */
const creationLimiter = rateLimit({
  store: createStore('creation'),
  windowMs: rateLimitConfig.creation.windowMs,
  limit: rateLimitConfig.creation.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorByUser,
  skip: createSkipFunction(shouldSkipRateLimit),
  handler: createHandler('creation')
});

/**
 * Admin Limiter
 * 200 requests / 15 minutos por admin
 * Solo para endpoints administrativos
 */
const adminLimiter = rateLimit({
  store: createStore('admin'),
  windowMs: rateLimitConfig.admin.windowMs,
  limit: rateLimitConfig.admin.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorByUser,
  skip: (req) => {
    // Skip si no es admin o está en whitelist
    if (shouldSkipRateLimit(req)) return true;
    if (req.user?.role !== 'admin') return true;
    return false;
  },
  handler: createHandler('admin')
});

/**
 * Strict Limiter
 * 3 requests / 1 hora por IP
 * Para endpoints muy sensibles (password reset)
 */
const strictLimiter = rateLimit({
  store: createStore('strict'),
  windowMs: rateLimitConfig.strict.windowMs,
  limit: rateLimitConfig.strict.max,
  standardHeaders: headerConfig.standardHeaders,
  legacyHeaders: headerConfig.legacyHeaders,
  keyGenerator: keyGeneratorIPAndUser,
  skip: createSkipFunction(shouldSkipRateLimit),
  handler: createHandler('strict')
});

// ==========================================
// WEBSOCKET RATE LIMITER
// ==========================================

/**
 * Rate limiter para eventos WebSocket
 * Almacena contadores en memoria (Map)
 * No usa express-rate-limit (es para Socket.io)
 */
const socketRateLimiter = (() => {
  const counters = new Map();
  const { windowMs, max } = rateLimitConfig.websocket;

  /**
   * Verificar si un socket excede el límite
   * @param {string} socketId - ID del socket
   * @returns {boolean} - true si está permitido, false si excede
   */
  const checkLimit = (socketId) => {
    const now = Date.now();
    let counter = counters.get(socketId);

    if (!counter || now - counter.startTime > windowMs) {
      // Nueva ventana
      counter = { count: 1, startTime: now };
      counters.set(socketId, counter);
      return true;
    }

    counter.count++;

    if (counter.count > max) {
      console.warn(`[RateLimit] WebSocket limit exceeded for socket: ${socketId}`);
      return false;
    }

    return true;
  };

  /**
   * Limpiar contador de un socket (disconnect)
   * @param {string} socketId
   */
  const clearSocket = (socketId) => {
    counters.delete(socketId);
  };

  /**
   * Obtener estadísticas
   */
  const getStats = () => ({
    activeSockets: counters.size,
    config: { windowMs, max }
  });

  // Limpiar sockets inactivos cada minuto
  setInterval(() => {
    const now = Date.now();
    for (const [socketId, counter] of counters) {
      if (now - counter.startTime > windowMs * 2) {
        counters.delete(socketId);
      }
    }
  }, 60000);

  return {
    checkLimit,
    clearSocket,
    getStats
  };
})();

// ==========================================
// MIDDLEWARE CONDICIONAL
// ==========================================

/**
 * Wrapper que verifica si rate limiting está habilitado
 * @param {Function} limiter - Rate limiter middleware
 * @returns {Function} - Middleware condicionado
 */
const conditionalLimiter = (limiter) => {
  return (req, res, next) => {
    if (!isRateLimitEnabled()) {
      return next();
    }
    return limiter(req, res, next);
  };
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Limiters principales (condicionados)
  generalLimiter: conditionalLimiter(generalLimiter),
  authLimiter: conditionalLimiter(authLimiter),
  searchLimiter: conditionalLimiter(searchLimiter),
  creationLimiter: conditionalLimiter(creationLimiter),
  adminLimiter: conditionalLimiter(adminLimiter),
  strictLimiter: conditionalLimiter(strictLimiter),

  // WebSocket limiter
  socketRateLimiter,

  // Utilities
  keyGeneratorByIP,
  keyGeneratorByUser,
  keyGeneratorIPAndUser,

  // Para testing
  _limiters: {
    general: generalLimiter,
    auth: authLimiter,
    search: searchLimiter,
    creation: creationLimiter,
    admin: adminLimiter,
    strict: strictLimiter
  }
};
