// src/controllers/sessionController.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Controller para endpoints de gestión de sesiones

const sessionService = require('../services/sessionService');
const { logger } = require('../config/logger');

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

const sessionController = {
  /**
   * GET /sessions/active
   * Obtiene todas las sesiones activas del usuario
   */
  async getActiveSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = extractToken(req);

      const sessions = await sessionService.getActiveSessions(userId, currentToken);

      res.json({
        success: true,
        sessions,
        count: sessions.length
      });
    } catch (error) {
      logger.error('Error obteniendo sesiones activas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener sesiones activas'
      });
    }
  },

  /**
   * DELETE /sessions/:sessionId
   * Revoca una sesión específica
   */
  async revokeSession(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      // Verificar que no sea la sesión actual
      const currentToken = extractToken(req);
      const sessions = await sessionService.getActiveSessions(userId, currentToken);
      const sessionToRevoke = sessions.find(s => s.id === sessionId);

      if (sessionToRevoke && sessionToRevoke.isCurrent) {
        return res.status(400).json({
          success: false,
          error: 'No puedes cerrar tu sesión actual desde aquí. Usa el botón de cerrar sesión.'
        });
      }

      const result = await sessionService.revokeSession(userId, sessionId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      logger.error('Error revocando sesión:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cerrar sesión'
      });
    }
  },

  /**
   * DELETE /sessions/revoke-all
   * Revoca todas las sesiones excepto la actual
   */
  async revokeAllSessions(req, res) {
    try {
      const userId = req.user.id;
      const currentToken = extractToken(req);

      if (!currentToken) {
        return res.status(400).json({
          success: false,
          error: 'Token no encontrado'
        });
      }

      const result = await sessionService.revokeAllSessions(userId, currentToken);

      res.json(result);
    } catch (error) {
      logger.error('Error revocando todas las sesiones:', error);
      res.status(500).json({
        success: false,
        error: 'Error al cerrar sesiones'
      });
    }
  },

  /**
   * GET /sessions/login-history
   * Obtiene el historial de logins del usuario
   */
  async getLoginHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = Math.max(parseInt(req.query.offset) || 0, 0);

      const result = await sessionService.getLoginHistory(userId, limit, offset);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error('Error obteniendo historial de login:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener historial'
      });
    }
  },

  /**
   * GET /sessions/suspicious
   * Detecta y retorna sesiones sospechosas
   */
  async detectSuspicious(req, res) {
    try {
      const userId = req.user.id;

      const suspicious = await sessionService.detectSuspiciousSessions(userId);

      res.json({
        success: true,
        suspiciousSessions: suspicious,
        count: suspicious.length,
        message: suspicious.length > 0
          ? 'Se detectaron sesiones desde ubicaciones inusuales. Si no las reconoces, ciérralas.'
          : 'No se detectaron sesiones sospechosas'
      });
    } catch (error) {
      logger.error('Error detectando sesiones sospechosas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al detectar sesiones'
      });
    }
  },

  /**
   * GET /sessions/stats
   * Estadísticas de login del usuario
   */
  async getLoginStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await sessionService.getLoginStats(userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Error al obtener estadísticas'
      });
    }
  }
};

module.exports = sessionController;
