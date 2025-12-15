/**
 * Helmet.js Security Configuration - CITAMED.VE
 *
 * Security headers para proteger contra:
 * - XSS attacks (Content-Security-Policy)
 * - Clickjacking (X-Frame-Options)
 * - MIME sniffing (X-Content-Type-Options)
 * - Man-in-the-middle (Strict-Transport-Security)
 */

const helmet = require('helmet');

// Determinar entorno
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy directives
 * Más permisivo en desarrollo, estricto en producción
 */
const cspDirectives = {
  defaultSrc: ["'self'"],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Necesario para algunos frameworks CSS
    'https://fonts.googleapis.com'
  ],
  scriptSrc: [
    "'self'",
    ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
  ],
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'blob:'
  ],
  connectSrc: [
    "'self'",
    ...(isDevelopment
      ? ['http://localhost:*', 'ws://localhost:*']
      : ['https://citamed.ve', 'wss://citamed.ve']
    )
  ],
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: isProduction ? [] : null
};

// Remover directivas null
Object.keys(cspDirectives).forEach(key => {
  if (cspDirectives[key] === null) {
    delete cspDirectives[key];
  }
});

/**
 * Configuración de Helmet
 */
const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: cspDirectives,
    reportOnly: isDevelopment // Solo reportar en dev, no bloquear
  },

  // Prevenir clickjacking
  frameguard: {
    action: 'deny'
  },

  // Prevenir MIME sniffing
  noSniff: true,

  // XSS Protection (legacy browsers)
  xssFilter: true,

  // HSTS - Strict Transport Security
  hsts: isProduction ? {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true
  } : false,

  // No revelar que usamos Express
  hidePoweredBy: true,

  // Prevenir caching de contenido sensible
  noCache: false, // Manejamos caching manualmente

  // IE no-open
  ieNoOpen: true,

  // DNS Prefetch Control
  dnsPrefetchControl: {
    allow: false
  },

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Cross-Origin Embedder Policy - deshabilitado para permitir recursos externos
  crossOriginEmbedderPolicy: false,

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'same-site'
  },

  // Origin-Agent-Cluster
  originAgentCluster: true,

  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  }
});

/**
 * Headers de seguridad adicionales personalizados
 * Usar como middleware separado si es necesario
 */
const additionalSecurityHeaders = (req, res, next) => {
  // Permissions Policy (Feature Policy successor)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=()'
  );

  // Cache Control para contenido sensible
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/profiles')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Middleware combinado de Helmet + headers adicionales
 */
const securityHeaders = [helmetConfig, additionalSecurityHeaders];

module.exports = {
  helmetConfig,
  additionalSecurityHeaders,
  securityHeaders,
  cspDirectives
};
