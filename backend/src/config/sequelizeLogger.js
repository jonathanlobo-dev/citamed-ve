/**
 * Sequelize Query Logger - CITAMED.VE
 *
 * Logging de queries de base de datos:
 * - Detectar queries lentas (>200ms)
 * - Formato consistente con Winston
 * - Métricas de performance DB
 */

const { logger } = require('./logger');

// Almacenar queries lentas para métricas
const slowQueries = [];
const MAX_SLOW_QUERIES = 100;

/**
 * Umbral para considerar query lenta (ms)
 */
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 200;

/**
 * Logging function para Sequelize
 * Usar como: sequelize.options.logging = sequelizeLogger
 *
 * @param {string} sql - Query SQL ejecutada
 * @param {Object} options - Opciones de Sequelize (incluye timing)
 */
const sequelizeLogger = (sql, options) => {
  // Extraer tiempo de ejecución si está disponible
  const timing = options?.benchmark ? options.timing : null;

  // Sanitizar SQL (remover datos sensibles)
  const sanitizedSql = sanitizeQuery(sql);

  if (timing !== null && timing > SLOW_QUERY_THRESHOLD) {
    // Query lenta - log como warning
    logger.warn('Slow database query detected', {
      sql: sanitizedSql.substring(0, 500),
      executionTime: `${timing}ms`,
      threshold: `${SLOW_QUERY_THRESHOLD}ms`,
      type: 'slow_query'
    });

    // Almacenar para métricas
    recordSlowQuery(sanitizedSql, timing);
  } else if (process.env.NODE_ENV !== 'production') {
    // En desarrollo, loggear todas las queries
    logger.debug('Database query', {
      sql: sanitizedSql.substring(0, 200),
      executionTime: timing ? `${timing}ms` : 'N/A'
    });
  }
};

/**
 * Sanitizar query para remover datos sensibles
 * @param {string} sql - Query original
 * @returns {string} - Query sanitizada
 */
const sanitizeQuery = (sql) => {
  if (!sql) return '';

  return sql
    // Remover valores de password
    .replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'")
    // Remover tokens
    .replace(/token\s*=\s*'[^']*'/gi, "token='[REDACTED]'")
    // Remover emails en valores (opcional)
    .replace(/'[^']*@[^']*'/g, "'[EMAIL]'")
    // Limpiar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Registrar query lenta para métricas
 * @param {string} sql - Query SQL
 * @param {number} timing - Tiempo de ejecución en ms
 */
const recordSlowQuery = (sql, timing) => {
  slowQueries.push({
    sql: sql.substring(0, 200),
    timing,
    timestamp: new Date().toISOString()
  });

  // Mantener solo últimas N queries
  if (slowQueries.length > MAX_SLOW_QUERIES) {
    slowQueries.shift();
  }
};

/**
 * Obtener queries lentas para métricas
 * @param {number} limit - Máximo de queries a retornar
 * @returns {Array} - Lista de queries lentas
 */
const getSlowQueries = (limit = 20) => {
  return slowQueries
    .slice(-limit)
    .reverse()
    .map(q => ({
      sql: q.sql,
      executionTime: `${q.timing}ms`,
      timestamp: q.timestamp
    }));
};

/**
 * Obtener estadísticas de queries
 * @returns {Object} - Estadísticas
 */
const getQueryStats = () => {
  if (slowQueries.length === 0) {
    return {
      totalSlowQueries: 0,
      averageTime: 0,
      maxTime: 0
    };
  }

  const times = slowQueries.map(q => q.timing);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    totalSlowQueries: slowQueries.length,
    averageTime: Math.round(sum / times.length),
    maxTime: Math.max(...times),
    threshold: SLOW_QUERY_THRESHOLD
  };
};

/**
 * Limpiar historial de queries (para testing)
 */
const clearSlowQueries = () => {
  slowQueries.length = 0;
};

/**
 * Configuración para Sequelize con benchmark
 * Usar en database.js:
 * const sequelize = new Sequelize({
 *   ...config,
 *   logging: sequelizeLogger,
 *   benchmark: true
 * });
 */
const sequelizeConfig = {
  logging: sequelizeLogger,
  benchmark: true
};

module.exports = {
  sequelizeLogger,
  getSlowQueries,
  getQueryStats,
  clearSlowQueries,
  sequelizeConfig,
  SLOW_QUERY_THRESHOLD
};
