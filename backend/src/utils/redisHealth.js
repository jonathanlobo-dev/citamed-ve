/**
 * Redis Health Check - CITAMED.VE
 *
 * Utilidades para verificar estado de salud de Redis:
 * - Ping/Pong test
 * - Memory usage
 * - Connection status
 * - Latency check
 */

const { redisClient, isRedisConnected, getConnectionStatus, ping } = require('../config/redis');
const cacheService = require('../services/cacheService');
const { getCacheMiddlewareStats } = require('../middleware/cache');

/**
 * Health check completo de Redis
 * @returns {Promise<Object>}
 */
const getRedisHealth = async () => {
  const health = {
    status: 'unknown',
    connected: false,
    latencyMs: null,
    memory: null,
    keys: null,
    uptime: null,
    version: null,
    error: null
  };

  try {
    // Verificar conexión básica
    health.connected = isRedisConnected();

    if (!health.connected) {
      health.status = 'disconnected';
      health.error = getConnectionStatus().error || 'Redis not connected';
      return health;
    }

    // Ping con medición de latencia
    const startTime = Date.now();
    const pingResult = await ping();
    health.latencyMs = Date.now() - startTime;

    if (!pingResult) {
      health.status = 'unhealthy';
      health.error = 'Ping failed';
      return health;
    }

    // Obtener info del servidor
    const info = await redisClient.info();

    // Parsear memoria
    const usedMemory = info.match(/used_memory_human:(\S+)/);
    if (usedMemory) {
      health.memory = usedMemory[1];
    }

    // Parsear uptime
    const uptime = info.match(/uptime_in_seconds:(\d+)/);
    if (uptime) {
      health.uptime = parseInt(uptime[1]);
    }

    // Parsear versión
    const version = info.match(/redis_version:(\S+)/);
    if (version) {
      health.version = version[1];
    }

    // Contar keys de CITAMED
    const keys = await redisClient.keys('citamed:*');
    health.keys = keys.length;

    // Estado final
    health.status = health.latencyMs < 100 ? 'healthy' : 'degraded';

  } catch (error) {
    health.status = 'error';
    health.error = error.message;
  }

  return health;
};

/**
 * Health check simplificado para endpoint /api/health
 * @returns {Promise<Object>}
 */
const getSimpleHealth = async () => {
  const connected = isRedisConnected();
  let latency = null;

  if (connected) {
    try {
      const start = Date.now();
      await ping();
      latency = Date.now() - start;
    } catch (e) {
      latency = -1;
    }
  }

  return {
    redis: connected ? 'connected' : 'disconnected',
    latencyMs: latency
  };
};

/**
 * Estadísticas completas del sistema de cache
 * @returns {Promise<Object>}
 */
const getCacheSystemStats = async () => {
  const redisHealth = await getRedisHealth();
  const cacheStats = await cacheService.getStats();
  const middlewareStats = getCacheMiddlewareStats();

  return {
    redis: redisHealth,
    cache: cacheStats,
    middleware: middlewareStats,
    timestamp: new Date().toISOString()
  };
};

/**
 * Endpoint handler para /api/cache/stats (solo admin)
 */
const cacheStatsHandler = async (req, res) => {
  try {
    const stats = await getCacheSystemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting cache stats',
      error: error.message
    });
  }
};

/**
 * Endpoint handler para /api/cache/flush (solo admin)
 */
const cacheFlushHandler = async (req, res) => {
  try {
    await cacheService.flush();
    res.json({
      success: true,
      message: 'Cache flushed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error flushing cache',
      error: error.message
    });
  }
};

module.exports = {
  getRedisHealth,
  getSimpleHealth,
  getCacheSystemStats,
  cacheStatsHandler,
  cacheFlushHandler
};
