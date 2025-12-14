/**
 * Cache Service - CITAMED.VE
 *
 * Servicio centralizado para operaciones de cache con:
 * - Redis como backend principal
 * - Fallback a memoria si Redis no disponible
 * - TTL configurable por tipo de dato
 * - Serialización JSON automática
 * - Prefijos por categoría de datos
 */

const { redisClient, isRedisConnected } = require('../config/redis');

// TTL por defecto en segundos
const DEFAULT_TTL = parseInt(process.env.REDIS_TTL) || 300; // 5 minutos

// TTLs específicos por tipo de dato
const TTL_CONFIG = {
  sessions: 86400,      // 24 horas para sesiones JWT
  specialties: 3600,    // 1 hora para especialidades (cambian poco)
  doctors: 300,         // 5 minutos para búsqueda de médicos
  stats: 60,            // 1 minuto para estadísticas
  default: DEFAULT_TTL
};

// Prefijos para keys
const KEY_PREFIX = {
  sessions: 'sessions:',
  specialties: 'specialties:',
  doctors: 'doctors:',
  stats: 'stats:',
  general: 'cache:'
};

// Fallback en memoria (LRU simple)
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 1000;

/**
 * Limpiar cache en memoria si excede límite (LRU básico)
 */
const cleanMemoryCache = () => {
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const keysToDelete = Array.from(memoryCache.keys()).slice(0, 100);
    keysToDelete.forEach(key => memoryCache.delete(key));
    console.log(`[Cache] Memory cache cleaned: ${keysToDelete.length} keys removed`);
  }
};

/**
 * Guardar en cache
 * @param {string} key - Clave única
 * @param {any} value - Valor a cachear
 * @param {string} category - Categoría (sessions, specialties, doctors, etc.)
 * @returns {Promise<boolean>}
 */
const set = async (key, value, category = 'general') => {
  const fullKey = `${KEY_PREFIX[category] || KEY_PREFIX.general}${key}`;
  const ttl = TTL_CONFIG[category] || TTL_CONFIG.default;

  try {
    const serialized = JSON.stringify(value);

    if (isRedisConnected()) {
      await redisClient.setex(fullKey, ttl, serialized);
      return true;
    }

    // Fallback a memoria
    cleanMemoryCache();
    memoryCache.set(fullKey, {
      value: serialized,
      expires: Date.now() + (ttl * 1000)
    });
    return true;

  } catch (error) {
    console.error(`[Cache] Error setting key ${fullKey}:`, error.message);
    return false;
  }
};

/**
 * Obtener de cache
 * @param {string} key - Clave única
 * @param {string} category - Categoría
 * @returns {Promise<any|null>}
 */
const get = async (key, category = 'general') => {
  const fullKey = `${KEY_PREFIX[category] || KEY_PREFIX.general}${key}`;

  try {
    if (isRedisConnected()) {
      const value = await redisClient.get(fullKey);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    }

    // Fallback a memoria
    const cached = memoryCache.get(fullKey);
    if (cached) {
      if (Date.now() < cached.expires) {
        return JSON.parse(cached.value);
      }
      // Expirado, eliminar
      memoryCache.delete(fullKey);
    }
    return null;

  } catch (error) {
    console.error(`[Cache] Error getting key ${fullKey}:`, error.message);
    return null;
  }
};

/**
 * Eliminar de cache
 * @param {string} key - Clave única
 * @param {string} category - Categoría
 * @returns {Promise<boolean>}
 */
const del = async (key, category = 'general') => {
  const fullKey = `${KEY_PREFIX[category] || KEY_PREFIX.general}${key}`;

  try {
    if (isRedisConnected()) {
      await redisClient.del(fullKey);
    }
    memoryCache.delete(fullKey);
    return true;

  } catch (error) {
    console.error(`[Cache] Error deleting key ${fullKey}:`, error.message);
    return false;
  }
};

/**
 * Eliminar todas las keys de una categoría
 * @param {string} category - Categoría
 * @returns {Promise<number>} Número de keys eliminadas
 */
const invalidateCategory = async (category) => {
  const prefix = KEY_PREFIX[category] || KEY_PREFIX.general;
  let deletedCount = 0;

  try {
    if (isRedisConnected()) {
      const keys = await redisClient.keys(`citamed:${prefix}*`);
      if (keys.length > 0) {
        deletedCount = await redisClient.del(...keys);
      }
    }

    // Limpiar también de memoria
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
        deletedCount++;
      }
    }

    console.log(`[Cache] Invalidated ${deletedCount} keys in category: ${category}`);
    return deletedCount;

  } catch (error) {
    console.error(`[Cache] Error invalidating category ${category}:`, error.message);
    return 0;
  }
};

/**
 * Limpiar todo el cache
 * @returns {Promise<boolean>}
 */
const flush = async () => {
  try {
    if (isRedisConnected()) {
      // Solo eliminar keys con prefijo citamed:
      const keys = await redisClient.keys('citamed:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    }
    memoryCache.clear();
    console.log('[Cache] All cache flushed');
    return true;

  } catch (error) {
    console.error('[Cache] Error flushing cache:', error.message);
    return false;
  }
};

/**
 * Obtener estadísticas del cache
 * @returns {Promise<Object>}
 */
const getStats = async () => {
  const stats = {
    backend: isRedisConnected() ? 'redis' : 'memory',
    memorySize: memoryCache.size,
    redisConnected: isRedisConnected(),
    ttlConfig: TTL_CONFIG
  };

  try {
    if (isRedisConnected()) {
      const info = await redisClient.info('memory');
      const usedMemory = info.match(/used_memory_human:(\S+)/);
      stats.redisMemory = usedMemory ? usedMemory[1] : 'unknown';

      const keys = await redisClient.keys('citamed:*');
      stats.redisKeys = keys.length;
    }
  } catch (error) {
    stats.error = error.message;
  }

  return stats;
};

// ==========================================
// Funciones específicas por categoría
// ==========================================

/**
 * Guardar sesión JWT
 */
const setSession = async (userId, sessionData) => {
  return set(userId, sessionData, 'sessions');
};

/**
 * Obtener sesión JWT
 */
const getSession = async (userId) => {
  return get(userId, 'sessions');
};

/**
 * Eliminar sesión (logout)
 */
const deleteSession = async (userId) => {
  return del(userId, 'sessions');
};

/**
 * Cache de especialidades
 */
const setSpecialties = async (key, data) => {
  return set(key, data, 'specialties');
};

const getSpecialties = async (key) => {
  return get(key, 'specialties');
};

/**
 * Cache de médicos
 */
const setDoctors = async (key, data) => {
  return set(key, data, 'doctors');
};

const getDoctors = async (key) => {
  return get(key, 'doctors');
};

/**
 * Cache de estadísticas
 */
const setStats = async (key, data) => {
  return set(key, data, 'stats');
};

const getStatsCache = async (key) => {
  return get(key, 'stats');
};

module.exports = {
  // Operaciones genéricas
  set,
  get,
  del,
  invalidateCategory,
  flush,
  getStats,

  // Operaciones específicas
  setSession,
  getSession,
  deleteSession,
  setSpecialties,
  getSpecialties,
  setDoctors,
  getDoctors,
  setStats,
  getStatsCache,

  // Configuración exportada
  TTL_CONFIG,
  KEY_PREFIX
};
