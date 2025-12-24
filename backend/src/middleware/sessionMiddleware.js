// src/middleware/sessionMiddleware.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Middleware para validación y tracking de sesiones

const sessionService = require('../services/sessionService');
const { logger } = require('../config/logger');

// Configuración
const STRICT_VALIDATION = process.env.SESSION_STRICT_VALIDATION === 'true';
const ACTIVITY_UPDATE_INTERVAL = 60000; // 1 minuto entre actualizaciones

// Cache simple para evitar updates muy frecuentes
const activityCache = new Map();

/**
 * Extrae el token del header Authorization
 */
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware para validar que la sesión existe y está activa
 * Usar DESPUÉS de authenticateToken
 * Solo valida si SESSION_STRICT_VALIDATION está habilitado
 */
const validateActiveSession = async (req, res, next) => {
  // Si no está habilitada la validación estricta, continuar
  if (!STRICT_VALIDATION) {
    return next();
  }

  try {
    const token = extractToken(req);

    if (!token) {
      // authenticateToken ya debería haber validado esto
      return next();
    }

    const validation = await sessionService.validateSession(token);

    if (!validation.valid) {
      let message = 'Sesión inválida';

      switch (validation.reason) {
        case 'session_revoked':
          message = 'Tu sesión fue cerrada remotamente. Por favor, inicia sesión nuevamente.';
          break;
        case 'session_expired':
          message = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          break;
        case 'session_not_found':
          message = 'Sesión no encontrada. Por favor, inicia sesión nuevamente.';
          break;
      }

      logger.warn('Sesión inválida detectada', {
        userId: req.user?.id,
        reason: validation.reason,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        error: message,
        code: 'SESSION_INVALID',
        reason: validation.reason
      });
    }

    // Adjuntar información de sesión al request
    req.session = validation.session;
    next();
  } catch (error) {
    logger.error('Error validando sesión:', error);
    // En caso de error, dejar pasar para no bloquear
    next();
  }
};

/**
 * Middleware para actualizar la última actividad de la sesión
 * Usar DESPUÉS de authenticateToken
 */
const trackSession = async (req, res, next) => {
  // Continuar inmediatamente, actualizar en background
  next();

  try {
    const token = extractToken(req);

    if (!token || !req.user?.id) {
      return;
    }

    // Throttle: solo actualizar cada ACTIVITY_UPDATE_INTERVAL
    const cacheKey = `activity_${req.user.id}`;
    const lastUpdate = activityCache.get(cacheKey);
    const now = Date.now();

    if (lastUpdate && (now - lastUpdate) < ACTIVITY_UPDATE_INTERVAL) {
      return;
    }

    // Actualizar cache
    activityCache.set(cacheKey, now);

    // Actualizar actividad en background (no bloquea la respuesta)
    sessionService.updateSessionActivity(token).catch(err => {
      logger.error('Error actualizando actividad de sesión:', err);
    });

    // Limpiar cache viejo periódicamente
    if (activityCache.size > 10000) {
      const keysToDelete = [];
      activityCache.forEach((time, key) => {
        if (now - time > ACTIVITY_UPDATE_INTERVAL * 10) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => activityCache.delete(key));
    }
  } catch (error) {
    logger.error('Error en trackSession:', error);
  }
};

/**
 * Middleware combinado: valida y trackea sesión
 * Conveniente para aplicar ambos en una sola línea
 */
const sessionGuard = [validateActiveSession, trackSession];

/**
 * Middleware para endpoints críticos que requieren validación estricta
 * siempre (ignora configuración SESSION_STRICT_VALIDATION)
 */
const requireValidSession = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    const validation = await sessionService.validateSession(token);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida o expirada',
        code: 'SESSION_INVALID',
        reason: validation.reason
      });
    }

    req.session = validation.session;
    next();
  } catch (error) {
    logger.error('Error en requireValidSession:', error);
    res.status(500).json({
      success: false,
      error: 'Error validando sesión'
    });
  }
};

/**
 * Middleware para detectar y alertar sesiones sospechosas
 * Útil para endpoints sensibles
 */
const detectSuspiciousActivity = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return next();
    }

    const suspicious = await sessionService.detectSuspiciousSessions(req.user.id);

    if (suspicious.length > 0) {
      // Adjuntar al request para que el controller pueda actuar
      req.suspiciousSessions = suspicious;

      logger.warn('Sesiones sospechosas detectadas', {
        userId: req.user.id,
        count: suspicious.length
      });
    }

    next();
  } catch (error) {
    logger.error('Error detectando actividad sospechosa:', error);
    next();
  }
};

module.exports = {
  validateActiveSession,
  trackSession,
  sessionGuard,
  requireValidSession,
  detectSuspiciousActivity
};
