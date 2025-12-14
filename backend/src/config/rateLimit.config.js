/**
 * Rate Limiting Configuration - CITAMED.VE
 *
 * Configuración centralizada para rate limiting.
 * Diferentes estrategias según tipo de endpoint.
 *
 * Variables de entorno soportadas:
 * - RATE_LIMIT_ENABLED: Habilitar/deshabilitar (default: true)
 * - RATE_LIMIT_GENERAL_MAX: Límite general (default: 100)
 * - RATE_LIMIT_GENERAL_WINDOW: Ventana en ms (default: 900000 = 15min)
 * - RATE_LIMIT_AUTH_MAX: Límite auth (default: 5)
 * - RATE_LIMIT_AUTH_WINDOW: Ventana auth en ms (default: 900000)
 */

// Determinar si rate limiting está habilitado
const isEnabled = process.env.RATE_LIMIT_ENABLED !== 'false';

// Entorno de desarrollo vs producción
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Configuración de rate limiting por categoría
 */
const rateLimitConfig = {
  // Rate limiting habilitado globalmente
  enabled: isEnabled,

  // Prefijo Redis para keys de rate limiting
  redisPrefix: 'citamed:ratelimit:',

  /**
   * General API - Endpoints GET públicos
   * 100 requests por 15 minutos por IP
   */
  general: {
    windowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX) || (isDevelopment ? 500 : 100),
    message: {
      error: 'Rate limit exceeded',
      message: 'Demasiados requests. Intente nuevamente en unos minutos.',
      code: 'RATE_LIMIT_GENERAL'
    }
  },

  /**
   * Autenticación - Login/Register
   * 5 requests por 15 minutos por IP (estricto)
   */
  auth: {
    windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX) || (isDevelopment ? 20 : 5),
    message: {
      error: 'Too many authentication attempts',
      message: 'Demasiados intentos de autenticación. Intente nuevamente en 15 minutos.',
      code: 'RATE_LIMIT_AUTH'
    }
  },

  /**
   * Búsqueda - Endpoints de búsqueda
   * 30 requests por 1 minuto por usuario autenticado
   */
  search: {
    windowMs: parseInt(process.env.RATE_LIMIT_SEARCH_WINDOW) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_SEARCH_MAX) || (isDevelopment ? 100 : 30),
    message: {
      error: 'Search rate limit exceeded',
      message: 'Demasiadas búsquedas. Intente nuevamente en un minuto.',
      code: 'RATE_LIMIT_SEARCH'
    }
  },

  /**
   * Creación de recursos - POST appointments, reviews
   * 10 requests por 1 minuto por usuario
   */
  creation: {
    windowMs: parseInt(process.env.RATE_LIMIT_CREATION_WINDOW) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_CREATION_MAX) || (isDevelopment ? 50 : 10),
    message: {
      error: 'Creation rate limit exceeded',
      message: 'Demasiadas solicitudes de creación. Intente nuevamente en un minuto.',
      code: 'RATE_LIMIT_CREATION'
    }
  },

  /**
   * Admin endpoints - Para usuarios admin
   * 200 requests por 15 minutos
   */
  admin: {
    windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX) || 200,
    message: {
      error: 'Admin rate limit exceeded',
      message: 'Demasiados requests administrativos. Intente nuevamente en unos minutos.',
      code: 'RATE_LIMIT_ADMIN'
    }
  },

  /**
   * WebSocket eventos - Por socket ID
   * 100 eventos por 1 minuto
   */
  websocket: {
    windowMs: parseInt(process.env.RATE_LIMIT_WS_WINDOW) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_WS_MAX) || 100,
    message: {
      error: 'WebSocket rate limit exceeded',
      message: 'Demasiados eventos WebSocket. Conexión limitada.',
      code: 'RATE_LIMIT_WEBSOCKET'
    }
  },

  /**
   * Strict - Para endpoints muy sensibles (password reset, etc)
   * 3 requests por 1 hora
   */
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3,
    message: {
      error: 'Strict rate limit exceeded',
      message: 'Demasiados intentos. Intente nuevamente en 1 hora.',
      code: 'RATE_LIMIT_STRICT'
    }
  }
};

/**
 * Configuración de headers
 */
const headerConfig = {
  // Usar headers estándar RateLimit-*
  standardHeaders: true,
  // No usar headers legacy X-RateLimit-*
  legacyHeaders: false
};

/**
 * Obtener configuración de mensaje con tiempo restante
 * @param {string} category - Categoría de rate limit
 * @param {number} retryAfter - Segundos hasta reset
 * @returns {Object} - Mensaje formateado
 */
const getMessageWithRetry = (category, retryAfter) => {
  const config = rateLimitConfig[category];
  if (!config) return { error: 'Rate limit exceeded' };

  const minutes = Math.ceil(retryAfter / 60);
  const timeMessage = minutes > 1
    ? `${minutes} minutos`
    : `${retryAfter} segundos`;

  return {
    ...config.message,
    retryAfter,
    retryAfterFormatted: timeMessage,
    limit: config.max,
    remaining: 0
  };
};

/**
 * Verificar si rate limiting está habilitado
 * @returns {boolean}
 */
const isRateLimitEnabled = () => rateLimitConfig.enabled;

module.exports = {
  rateLimitConfig,
  headerConfig,
  getMessageWithRetry,
  isRateLimitEnabled
};
