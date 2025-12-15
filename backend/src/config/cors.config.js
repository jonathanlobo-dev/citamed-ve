/**
 * CORS Configuration - CITAMED.VE
 *
 * Cross-Origin Resource Sharing configuration:
 * - Whitelist de orígenes permitidos
 * - Diferente configuración dev/production
 * - Credentials habilitado para cookies/JWT
 */

// Determinar entorno
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Orígenes permitidos según entorno
 */
const getAllowedOrigins = () => {
  // En producción, solo dominios específicos
  if (isProduction) {
    const prodOrigins = process.env.ALLOWED_ORIGINS || 'https://citamed.ve';
    return prodOrigins.split(',').map(origin => origin.trim());
  }

  // En desarrollo, localhost y variantes
  const devOrigins = process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
  return devOrigins.split(',').map(origin => origin.trim());
};

/**
 * Función para verificar origen
 * @param {string} origin - Origen del request
 * @param {Function} callback - Callback (error, allow)
 */
const originVerifier = (origin, callback) => {
  const allowedOrigins = getAllowedOrigins();

  // Permitir requests sin origin (Postman, curl, mobile apps)
  if (!origin) {
    return callback(null, true);
  }

  // Verificar si el origen está en la whitelist
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // En desarrollo, también permitir cualquier localhost
  if (!isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    console.log(`[CORS] Allowing development origin: ${origin}`);
    return callback(null, true);
  }

  // Origen no permitido
  console.warn(`[CORS] Blocked origin: ${origin}`);
  callback(new Error(`Origin ${origin} not allowed by CORS policy`));
};

/**
 * Configuración principal de CORS
 */
const corsOptions = {
  // Verificación de origen
  origin: originVerifier,

  // Permitir credentials (cookies, authorization headers)
  credentials: true,

  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers permitidos en requests
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Auth-Token',
    'X-API-Key'
  ],

  // Headers expuestos en responses
  exposedHeaders: [
    'Content-Length',
    'X-Request-Id',
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset'
  ],

  // Preflight cache (OPTIONS requests)
  maxAge: 86400, // 24 horas

  // Status para OPTIONS exitoso
  optionsSuccessStatus: 200,

  // Preflight continue
  preflightContinue: false
};

/**
 * Configuración más estricta para endpoints sensibles
 */
const strictCorsOptions = {
  ...corsOptions,
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();

    // NO permitir requests sin origin en endpoints sensibles
    if (!origin) {
      return callback(new Error('Origin required for this endpoint'));
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by strict CORS policy'));
  }
};

/**
 * Obtener lista de orígenes permitidos (para debugging)
 */
const getOriginsList = () => ({
  allowed: getAllowedOrigins(),
  environment: isProduction ? 'production' : 'development'
});

module.exports = {
  corsOptions,
  strictCorsOptions,
  getAllowedOrigins,
  getOriginsList
};
