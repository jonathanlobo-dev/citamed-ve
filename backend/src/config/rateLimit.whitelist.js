/**
 * Rate Limiting Whitelist - CITAMED.VE
 *
 * IPs, API keys y rutas excluidas de rate limiting.
 * Configurables via variables de entorno.
 */

/**
 * IPs whitelisted (no sujetas a rate limiting)
 * Cargar desde RATE_LIMIT_WHITELIST env var
 */
const getWhitelistedIPs = () => {
  const envWhitelist = process.env.RATE_LIMIT_WHITELIST || '';
  const defaultIPs = [
    '127.0.0.1',      // Localhost IPv4
    '::1',            // Localhost IPv6
    '::ffff:127.0.0.1' // IPv4-mapped IPv6
  ];

  // Parsear IPs desde env (separadas por coma)
  const envIPs = envWhitelist
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0);

  return [...new Set([...defaultIPs, ...envIPs])];
};

/**
 * API Keys de servicios confiables
 * Para integraciones que necesitan bypass
 */
const getWhitelistedAPIKeys = () => {
  const envKeys = process.env.RATE_LIMIT_API_KEYS || '';

  return envKeys
    .split(',')
    .map(key => key.trim())
    .filter(key => key.length > 0);
};

/**
 * Rutas excluidas de rate limiting
 * Health checks, métricas, etc.
 */
const excludedPaths = [
  '/api/health',
  '/api/health/live',
  '/api/health/ready',
  '/api/metrics',
  '/api-docs',
  '/api-docs/',
  '/favicon.ico'
];

/**
 * Patrones de rutas excluidas (regex)
 */
const excludedPatterns = [
  /^\/api-docs/,     // Swagger docs
  /^\/api\/health/,  // Health endpoints
  /\.ico$/,          // Favicons
  /\.png$/,          // Images
  /\.jpg$/,
  /\.css$/,          // Static assets
  /\.js$/
];

/**
 * Verificar si una IP está whitelisted
 * @param {string} ip - IP a verificar
 * @returns {boolean}
 */
const isWhitelistedIP = (ip) => {
  if (!ip) return false;

  const whitelist = getWhitelistedIPs();

  // Normalizar IP (remover prefijo IPv6-mapped si existe)
  const normalizedIP = ip.replace(/^::ffff:/, '');

  return whitelist.includes(ip) || whitelist.includes(normalizedIP);
};

/**
 * Verificar si una API key está whitelisted
 * @param {string} apiKey - API key a verificar
 * @returns {boolean}
 */
const isWhitelistedAPIKey = (apiKey) => {
  if (!apiKey) return false;

  const whitelist = getWhitelistedAPIKeys();
  return whitelist.includes(apiKey);
};

/**
 * Verificar si una ruta está excluida
 * @param {string} path - Path de la request
 * @returns {boolean}
 */
const isExcludedPath = (path) => {
  if (!path) return false;

  // Verificar paths exactos
  if (excludedPaths.includes(path)) return true;

  // Verificar patrones regex
  return excludedPatterns.some(pattern => pattern.test(path));
};

/**
 * Verificar si request debe ser excluida de rate limiting
 * @param {Request} req - Express request object
 * @returns {boolean}
 */
const shouldSkipRateLimit = (req) => {
  // Verificar IP whitelist
  const clientIP = req.ip || req.connection?.remoteAddress;
  if (isWhitelistedIP(clientIP)) {
    return true;
  }

  // Verificar API key en headers
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  if (apiKey && isWhitelistedAPIKey(apiKey)) {
    return true;
  }

  // Verificar path excluido
  if (isExcludedPath(req.path)) {
    return true;
  }

  return false;
};

/**
 * Obtener información de whitelist para debugging
 * @returns {Object}
 */
const getWhitelistInfo = () => {
  return {
    ips: getWhitelistedIPs(),
    apiKeysCount: getWhitelistedAPIKeys().length,
    excludedPaths,
    excludedPatternsCount: excludedPatterns.length
  };
};

module.exports = {
  getWhitelistedIPs,
  getWhitelistedAPIKeys,
  excludedPaths,
  excludedPatterns,
  isWhitelistedIP,
  isWhitelistedAPIKey,
  isExcludedPath,
  shouldSkipRateLimit,
  getWhitelistInfo
};
