/**
 * Input Sanitization Middleware - CITAMED.VE
 *
 * Protección contra:
 * - NoSQL Injection (express-mongo-sanitize)
 * - XSS Attacks (sanitización manual - xss-clean deprecated)
 * - HTTP Parameter Pollution (hpp)
 */

const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

/**
 * Sanitizar strings contra XSS
 * Reemplaza xss-clean que está deprecated
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
// No se codifican entidades HTML al guardar: el texto se almacena tal cual y React lo escapa al mostrarlo.
// Codificar en la entrada corrompía datos legítimos ("875/125 mg" -> "875&#x2F;125 mg").
const sanitizeXSS = (str) => {
  if (typeof str !== 'string') return str;

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<\/?[a-zA-Z!][^>]*>/g, '')
    .replace(/javascript:/gi, '');
};

const PASSWORD_KEYS = new Set(['password', 'confirmPassword', 'currentPassword', 'newPassword', 'oldPassword']);

/**
 * Sanitizar objeto recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} - Objeto sanitizado
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeXSS(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeXSS(key);
      sanitized[sanitizedKey] = PASSWORD_KEYS.has(key) ? value : sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Middleware de sanitización XSS
 * Sanitiza body, query y params
 */
const xssSanitizer = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('[Sanitizer] XSS sanitization error:', error.message);
    next();
  }
};

/**
 * Middleware de NoSQL Injection protection
 */
const noSqlSanitizer = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`[Sanitizer] NoSQL injection attempt blocked in ${req.path}, key: ${key}`);
  }
});

/**
 * Middleware de HTTP Parameter Pollution protection
 * Whitelist de parámetros que pueden repetirse
 */
const hppProtection = hpp({
  whitelist: [
    'specialty',
    'city',
    'tags',
    'languages',
    'sort',
    'fields'
  ]
});

/**
 * Middleware para validar Content-Type
 * Previene ataques con content-types maliciosos
 */
const contentTypeValidator = (req, res, next) => {
  // Solo validar requests con body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'] || '';

    // Permitir JSON, form-urlencoded, multipart
    const allowedTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data'
    ];

    const isAllowed = allowedTypes.some(type => contentType.includes(type));

    if (req.body && Object.keys(req.body).length > 0 && !isAllowed) {
      console.warn(`[Sanitizer] Invalid Content-Type: ${contentType} from ${req.ip}`);
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Content-Type must be application/json or multipart/form-data'
      });
    }
  }

  next();
};

/**
 * Middleware para limitar tamaño de payload
 * Previene DoS por payloads grandes
 */
const payloadSizeValidator = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const maxSize = parseInt(process.env.MAX_PAYLOAD_SIZE || '10485760', 10); // 10MB default

  if (contentLength > maxSize) {
    console.warn(`[Sanitizer] Payload too large: ${contentLength} bytes from ${req.ip}`);
    return res.status(413).json({
      error: 'Payload Too Large',
      message: `Request body must be smaller than ${maxSize / 1024 / 1024}MB`
    });
  }

  next();
};

/**
 * Stack completo de sanitización
 * Aplicar en orden específico
 */
const sanitizerStack = [
  contentTypeValidator,
  payloadSizeValidator,
  noSqlSanitizer,
  xssSanitizer,
  hppProtection
];

module.exports = {
  sanitizerStack,
  xssSanitizer,
  noSqlSanitizer,
  hppProtection,
  contentTypeValidator,
  payloadSizeValidator,
  sanitizeXSS,
  sanitizeObject
};
