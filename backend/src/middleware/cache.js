/**
 * Cache Middleware - CITAMED.VE
 *
 * Middleware para cachear respuestas de endpoints GET con:
 * - Cache automático basado en URL
 * - Bypass con query param ?nocache=true
 * - Headers Cache-Control apropiados
 * - Logging de hits/misses
 */

const cacheService = require('../services/cacheService');

// Contadores para estadísticas
let cacheHits = 0;
let cacheMisses = 0;

/**
 * Generar key de cache basada en request
 * @param {Request} req
 * @returns {string}
 */
const generateCacheKey = (req) => {
  const baseUrl = req.originalUrl || req.url;
  // Remover ?nocache=true del key
  const cleanUrl = baseUrl.replace(/[?&]nocache=true/g, '').replace(/[?&]$/, '');
  return cleanUrl;
};

/**
 * Determinar categoría basada en URL
 * @param {string} url
 * @returns {string}
 */
const getCategoryFromUrl = (url) => {
  if (url.includes('/specialties')) return 'specialties';
  if (url.includes('/doctors')) return 'doctors';
  if (url.includes('/stats')) return 'stats';
  return 'general';
};

/**
 * Middleware de cache para endpoints GET
 * @param {Object} options - Opciones de configuración
 * @param {string} options.category - Categoría de cache (specialties, doctors, etc.)
 * @param {boolean} options.enabled - Habilitar/deshabilitar cache
 * @returns {Function} Middleware
 */
const cacheMiddleware = (options = {}) => {
  const { category = 'general', enabled = true } = options;

  return async (req, res, next) => {
    // Solo cachear requests GET
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass si cache deshabilitado o nocache=true
    if (!enabled || req.query.nocache === 'true') {
      return next();
    }

    const cacheKey = generateCacheKey(req);
    const cacheCategory = category || getCategoryFromUrl(req.originalUrl);

    try {
      // Intentar obtener de cache
      const cachedData = await cacheService.get(cacheKey, cacheCategory);

      if (cachedData) {
        cacheHits++;

        // Agregar headers de cache
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        res.set('Cache-Control', 'public, max-age=60');

        return res.json(cachedData);
      }

      cacheMisses++;

      // Interceptar res.json para cachear la respuesta
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        // Solo cachear respuestas exitosas
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await cacheService.set(cacheKey, data, cacheCategory);
        }

        // Agregar headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        res.set('Cache-Control', 'public, max-age=60');

        return originalJson(data);
      };

      next();

    } catch (error) {
      console.error('[Cache Middleware] Error:', error.message);
      // En caso de error, continuar sin cache
      next();
    }
  };
};

/**
 * Middleware para invalidar cache después de mutaciones
 * @param {string} category - Categoría a invalidar
 * @returns {Function} Middleware
 */
const invalidateCacheMiddleware = (category) => {
  return async (req, res, next) => {
    // Solo para métodos que modifican datos
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      // Interceptar después de que el request termine exitosamente
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await cacheService.invalidateCategory(category);
        }
      });
    }
    next();
  };
};

/**
 * Obtener estadísticas del middleware de cache
 * @returns {Object}
 */
const getCacheMiddlewareStats = () => {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    total: total,
    hitRate: total > 0 ? ((cacheHits / total) * 100).toFixed(2) + '%' : '0%'
  };
};

/**
 * Reset contadores (para testing)
 */
const resetStats = () => {
  cacheHits = 0;
  cacheMisses = 0;
};

/**
 * Middleware preconfigurado para especialidades
 */
const cacheSpecialties = cacheMiddleware({ category: 'specialties' });

/**
 * Middleware preconfigurado para médicos
 */
const cacheDoctors = cacheMiddleware({ category: 'doctors' });

/**
 * Middleware preconfigurado para estadísticas
 */
const cacheStats = cacheMiddleware({ category: 'stats' });

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  getCacheMiddlewareStats,
  resetStats,
  // Middlewares preconfigurados
  cacheSpecialties,
  cacheDoctors,
  cacheStats
};
