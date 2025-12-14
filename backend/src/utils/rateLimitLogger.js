/**
 * Rate Limit Logger - CITAMED.VE
 *
 * Logging especializado para eventos de rate limiting:
 * - Violaciones de límites
 * - IPs sospechosas
 * - Métricas de bloqueo
 */

/**
 * Niveles de severidad
 */
const SEVERITY = {
  INFO: 'INFO',      // Límite alcanzado (normal)
  WARN: 'WARN',      // Límite superado (sospechoso)
  ALERT: 'ALERT'     // Múltiples violaciones (posible ataque)
};

/**
 * Contador de violaciones en memoria (para métricas)
 */
const violationStats = {
  // Por hora
  hourly: {
    count: 0,
    startTime: Date.now()
  },
  // Por IP (últimas 100)
  byIP: new Map(),
  // Por categoría
  byCategory: {}
};

/**
 * Formatear timestamp para logs
 * @returns {string}
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Obtener IP del request
 * @param {Request} req - Express request
 * @returns {string}
 */
const getClientIP = (req) => {
  return req.ip ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.connection?.remoteAddress ||
         'unknown';
};

/**
 * Log de rate limit alcanzado (INFO)
 * @param {Request} req - Express request
 * @param {string} category - Categoría del limiter
 * @param {Object} info - Información adicional
 */
const logRateLimitReached = (req, category, info = {}) => {
  const ip = getClientIP(req);
  const { limit, current } = info;

  console.log(
    `[RateLimit] ${SEVERITY.INFO} | ${getTimestamp()} | ` +
    `Category: ${category} | IP: ${ip} | ` +
    `Path: ${req.method} ${req.path} | ` +
    `Usage: ${current || 'N/A'}/${limit || 'N/A'}`
  );

  updateStats(ip, category, SEVERITY.INFO);
};

/**
 * Log de rate limit excedido (WARN)
 * @param {Request} req - Express request
 * @param {string} category - Categoría del limiter
 * @param {Object} info - Información adicional
 */
const logRateLimitExceeded = (req, category, info = {}) => {
  const ip = getClientIP(req);
  const { limit, retryAfter } = info;
  const userId = req.user?.id || 'anonymous';

  console.warn(
    `[RateLimit] ${SEVERITY.WARN} | ${getTimestamp()} | ` +
    `Category: ${category} | IP: ${ip} | User: ${userId} | ` +
    `Path: ${req.method} ${req.path} | ` +
    `Blocked for: ${retryAfter}s | Limit: ${limit}`
  );

  updateStats(ip, category, SEVERITY.WARN);
  checkForSuspiciousActivity(ip);
};

/**
 * Log de actividad sospechosa (ALERT)
 * @param {string} ip - IP sospechosa
 * @param {string} reason - Razón del alerta
 */
const logSuspiciousActivity = (ip, reason) => {
  console.error(
    `[RateLimit] ${SEVERITY.ALERT} | ${getTimestamp()} | ` +
    `IP: ${ip} | Reason: ${reason}`
  );
};

/**
 * Actualizar estadísticas
 * @param {string} ip - IP del cliente
 * @param {string} category - Categoría
 * @param {string} severity - Nivel de severidad
 */
const updateStats = (ip, category, severity) => {
  // Reset hourly counter si pasó 1 hora
  const now = Date.now();
  if (now - violationStats.hourly.startTime > 3600000) {
    violationStats.hourly.count = 0;
    violationStats.hourly.startTime = now;
  }

  // Incrementar contador horario
  violationStats.hourly.count++;

  // Actualizar stats por IP
  const ipStats = violationStats.byIP.get(ip) || { count: 0, lastSeen: 0 };
  ipStats.count++;
  ipStats.lastSeen = now;
  violationStats.byIP.set(ip, ipStats);

  // Limitar a 100 IPs (FIFO)
  if (violationStats.byIP.size > 100) {
    const firstKey = violationStats.byIP.keys().next().value;
    violationStats.byIP.delete(firstKey);
  }

  // Actualizar stats por categoría
  if (!violationStats.byCategory[category]) {
    violationStats.byCategory[category] = 0;
  }
  violationStats.byCategory[category]++;
};

/**
 * Verificar si una IP tiene actividad sospechosa
 * @param {string} ip - IP a verificar
 */
const checkForSuspiciousActivity = (ip) => {
  const ipStats = violationStats.byIP.get(ip);
  if (!ipStats) return;

  // Alerta si más de 20 violaciones en la última hora
  if (ipStats.count > 20) {
    logSuspiciousActivity(ip, `${ipStats.count} rate limit violations in recent period`);
  }
};

/**
 * Obtener estadísticas de rate limiting
 * @returns {Object}
 */
const getStats = () => {
  const topViolators = [];

  // Convertir Map a array ordenado
  for (const [ip, stats] of violationStats.byIP) {
    topViolators.push({ ip, ...stats });
  }

  topViolators.sort((a, b) => b.count - a.count);

  return {
    hourly: {
      blockedRequests: violationStats.hourly.count,
      periodStart: new Date(violationStats.hourly.startTime).toISOString()
    },
    byCategory: { ...violationStats.byCategory },
    topViolators: topViolators.slice(0, 10),
    trackedIPs: violationStats.byIP.size
  };
};

/**
 * Reset de estadísticas (para testing o mantenimiento)
 */
const resetStats = () => {
  violationStats.hourly.count = 0;
  violationStats.hourly.startTime = Date.now();
  violationStats.byIP.clear();
  violationStats.byCategory = {};

  console.log('[RateLimit] Statistics reset');
};

/**
 * Handler para express-rate-limit
 * Se ejecuta cuando se excede el límite
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 * @param {Object} options - Rate limit options
 */
const rateLimitHandler = (category) => (req, res, next, options) => {
  logRateLimitExceeded(req, category, {
    limit: options.max,
    retryAfter: Math.ceil(options.windowMs / 1000)
  });

  // La respuesta es manejada por express-rate-limit
  // Este handler solo hace logging
};

/**
 * Skip function factory para express-rate-limit
 * Genera función que verifica whitelist
 *
 * @param {Function} shouldSkipFn - Función de whitelist
 * @returns {Function}
 */
const createSkipFunction = (shouldSkipFn) => (req) => {
  const skip = shouldSkipFn(req);
  if (skip) {
    const ip = getClientIP(req);
    console.log(`[RateLimit] Skipped for IP: ${ip} | Path: ${req.path}`);
  }
  return skip;
};

module.exports = {
  SEVERITY,
  logRateLimitReached,
  logRateLimitExceeded,
  logSuspiciousActivity,
  getStats,
  resetStats,
  rateLimitHandler,
  createSkipFunction,
  getClientIP
};
