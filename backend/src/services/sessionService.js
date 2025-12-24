// src/services/sessionService.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Servicio de gestión de sesiones

const { UserSession, LoginHistory } = require('../models');
const { getDeviceInfo, getLocationFromIP, formatLastActivity } = require('../utils/deviceDetector');
const { logger } = require('../config/logger');

// Límites configurables
const MAX_SESSIONS = parseInt(process.env.SESSION_MAX_SIMULTANEOUS) || 5;
const SESSION_EXPIRES_DAYS = parseInt(process.env.SESSION_EXPIRES_DAYS) || 7;

const sessionService = {
  /**
   * Crea una nueva sesión al hacer login
   * @param {number} userId - ID del usuario
   * @param {string} token - JWT token
   * @param {Object} req - Request object de Express
   * @returns {Object} Sesión creada
   */
  async createSession(userId, token, req) {
    try {
      const deviceInfo = getDeviceInfo(req);

      // Opcional: obtener ubicación desde IP
      if (process.env.SESSION_TRACK_LOCATION === 'true') {
        const location = await getLocationFromIP(deviceInfo.ipAddress);
        deviceInfo.location = location.formatted;
      }

      const session = await UserSession.createSession({
        userId,
        token,
        deviceInfo,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresInDays: SESSION_EXPIRES_DAYS
      });

      logger.info(`Nueva sesión creada para usuario ${userId}`, {
        sessionId: session.id,
        deviceType: deviceInfo.deviceType,
        ip: deviceInfo.ipAddress
      });

      return session;
    } catch (error) {
      logger.error('Error creando sesión:', error);
      throw error;
    }
  },

  /**
   * Obtiene todas las sesiones activas de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} currentToken - Token actual para marcar sesión actual
   * @returns {Array} Lista de sesiones con metadata
   */
  async getActiveSessions(userId, currentToken = null) {
    try {
      const sessions = await UserSession.findActiveByUserId(userId);
      const currentTokenHash = currentToken ? UserSession.hashToken(currentToken) : null;

      return sessions.map(session => ({
        id: session.id,
        deviceType: session.deviceType,
        deviceName: session.deviceName || 'Dispositivo desconocido',
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress,
        location: session.location || 'Ubicación desconocida',
        lastActivity: session.lastActivity,
        lastActivityFormatted: formatLastActivity(session.lastActivity),
        createdAt: session.createdAt,
        isCurrent: currentTokenHash && session.tokenHash === currentTokenHash,
        expiresAt: session.expiresAt
      }));
    } catch (error) {
      logger.error('Error obteniendo sesiones activas:', error);
      throw error;
    }
  },

  /**
   * Revoca una sesión específica
   * @param {number} userId - ID del usuario (para verificar propiedad)
   * @param {string} sessionId - ID de la sesión a revocar
   * @returns {Object} Resultado de la operación
   */
  async revokeSession(userId, sessionId) {
    try {
      const session = await UserSession.findByPk(sessionId);

      if (!session) {
        return { success: false, message: 'Sesión no encontrada' };
      }

      if (session.userId !== userId) {
        return { success: false, message: 'No autorizado' };
      }

      if (!session.isActive) {
        return { success: false, message: 'La sesión ya está cerrada' };
      }

      await session.revoke('user_revoked');

      logger.info(`Sesión ${sessionId} revocada por usuario ${userId}`);

      return {
        success: true,
        message: 'Sesión cerrada correctamente'
      };
    } catch (error) {
      logger.error('Error revocando sesión:', error);
      throw error;
    }
  },

  /**
   * Revoca todas las sesiones excepto la actual
   * @param {number} userId - ID del usuario
   * @param {string} currentToken - Token de la sesión actual a preservar
   * @returns {Object} Cantidad de sesiones revocadas
   */
  async revokeAllSessions(userId, currentToken) {
    try {
      const currentTokenHash = UserSession.hashToken(currentToken);
      const result = await UserSession.revokeAllUserSessions(userId, currentTokenHash);

      logger.info(`Usuario ${userId} revocó ${result.revokedCount} sesiones`);

      return {
        success: true,
        revokedCount: result.revokedCount,
        message: `${result.revokedCount} sesión(es) cerrada(s)`
      };
    } catch (error) {
      logger.error('Error revocando todas las sesiones:', error);
      throw error;
    }
  },

  /**
   * Actualiza la última actividad de una sesión
   * @param {string} token - JWT token
   * @returns {boolean} Éxito de la operación
   */
  async updateSessionActivity(token) {
    try {
      return await UserSession.updateLastActivity(token);
    } catch (error) {
      logger.error('Error actualizando actividad de sesión:', error);
      return false;
    }
  },

  /**
   * Valida que una sesión esté activa
   * @param {string} token - JWT token
   * @returns {Object} Resultado de validación
   */
  async validateSession(token) {
    try {
      const session = await UserSession.findByToken(token);

      if (!session) {
        return { valid: false, reason: 'session_not_found' };
      }

      if (!session.isActive) {
        return { valid: false, reason: 'session_revoked' };
      }

      if (session.isExpired()) {
        return { valid: false, reason: 'session_expired' };
      }

      return { valid: true, session };
    } catch (error) {
      logger.error('Error validando sesión:', error);
      return { valid: false, reason: 'error' };
    }
  },

  /**
   * Detecta sesiones sospechosas
   * @param {number} userId - ID del usuario
   * @returns {Array} Lista de sesiones sospechosas
   */
  async detectSuspiciousSessions(userId) {
    try {
      // Obtener IPs conocidas del historial
      const knownIPs = await LoginHistory.getKnownIPs(userId, 30);

      // Detectar sesiones con IPs desconocidas
      const suspicious = await UserSession.detectSuspiciousSessions(userId, knownIPs);

      return suspicious.map(session => ({
        id: session.id,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
        location: session.location,
        lastActivity: session.lastActivity,
        reason: 'Nueva IP detectada'
      }));
    } catch (error) {
      logger.error('Error detectando sesiones sospechosas:', error);
      return [];
    }
  },

  /**
   * Aplica límite de sesiones simultáneas
   * @param {number} userId - ID del usuario
   * @returns {Object} Resultado de la aplicación del límite
   */
  async enforceSessionLimit(userId) {
    try {
      const result = await UserSession.enforceSessionLimit(userId, MAX_SESSIONS);

      if (result.revoked > 0) {
        logger.info(`Límite de sesiones aplicado para usuario ${userId}: ${result.revoked} revocadas`);
      }

      return result;
    } catch (error) {
      logger.error('Error aplicando límite de sesiones:', error);
      return { revoked: 0, kept: 0 };
    }
  },

  /**
   * Limpia sesiones expiradas (para cron job)
   * @returns {Object} Cantidad de sesiones eliminadas
   */
  async cleanExpiredSessions() {
    try {
      const result = await UserSession.cleanExpiredSessions();

      if (result.deletedCount > 0) {
        logger.info(`Limpieza de sesiones: ${result.deletedCount} eliminadas`);
      }

      return result;
    } catch (error) {
      logger.error('Error limpiando sesiones expiradas:', error);
      return { deletedCount: 0 };
    }
  },

  /**
   * Registra un intento de login
   * @param {number} userId - ID del usuario
   * @param {boolean} success - Si el login fue exitoso
   * @param {Object} req - Request object
   * @param {string} failureReason - Razón del fallo (si aplica)
   * @param {string} authMethod - Método de autenticación
   * @returns {Object} Registro creado
   */
  async recordLoginAttempt(userId, success, req, failureReason = null, authMethod = 'password') {
    try {
      const deviceInfo = getDeviceInfo(req);

      // Opcional: obtener ubicación
      if (process.env.SESSION_TRACK_LOCATION === 'true') {
        const location = await getLocationFromIP(deviceInfo.ipAddress);
        deviceInfo.location = location.formatted;
      }

      const record = await LoginHistory.recordLogin({
        userId,
        success,
        deviceInfo,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        failureReason,
        authMethod
      });

      if (!success) {
        logger.warn(`Intento de login fallido para usuario ${userId}: ${failureReason}`, {
          ip: deviceInfo.ipAddress,
          device: deviceInfo.deviceName
        });
      }

      return record;
    } catch (error) {
      logger.error('Error registrando intento de login:', error);
      // No lanzar error para no interrumpir el flujo de login
      return null;
    }
  },

  /**
   * Obtiene historial de login de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de registros
   * @param {number} offset - Offset para paginación
   * @returns {Object} Historial paginado
   */
  async getLoginHistory(userId, limit = 20, offset = 0) {
    try {
      const result = await LoginHistory.getUserLoginHistory(userId, limit, offset);

      return {
        history: result.history.map(record => ({
          id: record.id,
          success: record.success,
          failureReason: record.failureReason,
          deviceType: record.deviceType,
          deviceName: record.deviceName || 'Dispositivo desconocido',
          browser: record.browser,
          os: record.os,
          ipAddress: record.ipAddress,
          location: record.location || 'Ubicación desconocida',
          loginAt: record.loginAt,
          loginAtFormatted: formatLastActivity(record.loginAt),
          authMethod: record.authMethod
        })),
        total: result.total,
        hasMore: result.hasMore
      };
    } catch (error) {
      logger.error('Error obteniendo historial de login:', error);
      throw error;
    }
  },

  /**
   * Verifica si un dispositivo es nuevo
   * @param {number} userId - ID del usuario
   * @param {Object} req - Request object
   * @returns {boolean} True si es un dispositivo nuevo
   */
  async isNewDevice(userId, req) {
    try {
      const deviceInfo = getDeviceInfo(req);
      return await LoginHistory.isNewDevice(userId, deviceInfo.ipAddress, deviceInfo.userAgent);
    } catch (error) {
      logger.error('Error verificando dispositivo nuevo:', error);
      return false;
    }
  },

  /**
   * Obtiene estadísticas de login del usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} Estadísticas
   */
  async getLoginStats(userId) {
    try {
      return await LoginHistory.getUserStats(userId);
    } catch (error) {
      logger.error('Error obteniendo estadísticas de login:', error);
      return {
        successfulLogins: 0,
        failedAttempts: 0,
        uniqueLocations: 0,
        period: '30 days'
      };
    }
  },

  /**
   * Cierra la sesión actual (logout)
   * @param {string} token - JWT token
   * @returns {Object} Resultado
   */
  async logout(token) {
    try {
      const session = await UserSession.findByToken(token);

      if (!session) {
        return { success: false, message: 'Sesión no encontrada' };
      }

      await session.revoke('logout');

      logger.info(`Usuario hizo logout de sesión ${session.id}`);

      return { success: true, message: 'Sesión cerrada correctamente' };
    } catch (error) {
      logger.error('Error en logout:', error);
      throw error;
    }
  }
};

module.exports = sessionService;
