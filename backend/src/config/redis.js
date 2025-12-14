/**
 * Redis Configuration - CITAMED.VE
 *
 * Cliente Redis usando ioredis con:
 * - Reconnection automática
 * - Graceful degradation (fallback a memoria si Redis falla)
 * - Logging de conexión
 * - Soporte para Redis Cluster (futuro)
 */

const Redis = require('ioredis');

// Configuración desde variables de entorno
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  keyPrefix: 'citamed:',

  // Retry strategy para reconexión automática
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('[Redis] Max reconnection attempts reached. Giving up.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 2000);
    console.log(`[Redis] Reconnecting in ${delay}ms... (attempt ${times})`);
    return delay;
  },

  // Timeouts
  connectTimeout: 10000,
  commandTimeout: 5000,

  // Habilitar ready check
  enableReadyCheck: true,

  // Mantener conexión viva
  keepAlive: 30000,

  // Reconectar en error
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some(e => err.message.includes(e));
  }
};

// Variable para estado de conexión
let isConnected = false;
let connectionError = null;

// Crear cliente Redis
let redisClient;

try {
  redisClient = new Redis(redisConfig);
} catch (error) {
  console.error('[Redis] Failed to create client:', error.message);
  redisClient = null;
}

// Event handlers
if (redisClient) {
  redisClient.on('connect', () => {
    console.log('[Redis] Connecting to server...');
  });

  redisClient.on('ready', () => {
    isConnected = true;
    connectionError = null;
    console.log('[Redis] Connected successfully');
    console.log(`[Redis] Server: ${redisConfig.host}:${redisConfig.port}`);
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    connectionError = err.message;
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('close', () => {
    isConnected = false;
    console.log('[Redis] Connection closed');
  });

  redisClient.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  redisClient.on('end', () => {
    isConnected = false;
    console.log('[Redis] Connection ended');
  });
}

/**
 * Verificar si Redis está conectado
 * @returns {boolean}
 */
const isRedisConnected = () => {
  return isConnected && redisClient !== null;
};

/**
 * Obtener estado de conexión
 * @returns {Object}
 */
const getConnectionStatus = () => {
  return {
    connected: isConnected,
    error: connectionError,
    host: redisConfig.host,
    port: redisConfig.port
  };
};

/**
 * Cerrar conexión Redis (para cleanup)
 */
const closeConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    console.log('[Redis] Connection closed gracefully');
  }
};

/**
 * Ping para verificar conexión
 * @returns {Promise<boolean>}
 */
const ping = async () => {
  if (!redisClient) return false;
  try {
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch (error) {
    return false;
  }
};

module.exports = {
  redisClient,
  isRedisConnected,
  getConnectionStatus,
  closeConnection,
  ping,
  redisConfig
};
