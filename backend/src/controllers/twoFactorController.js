/**
 * Two-Factor Authentication Controller - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Controlador para endpoints de 2FA
 */

const twoFactorService = require('../services/twoFactorService');
const { logger } = require('../config/logger');

/**
 * Extrae IP del request (proxy-aware)
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.ip ||
         'unknown';
}

const twoFactorController = {
  /**
   * Genera secret y QR para configurar 2FA
   * POST /api/2fa/generate
   */
  async generateSecret(req, res) {
    try {
      const userId = req.user.id;
      const result = await twoFactorService.generateTwoFactorSecret(userId);

      res.json({
        success: true,
        data: {
          qrCode: result.qrCode,
          manualEntryKey: result.manualEntryKey,
          secret: result.secret
        },
        message: 'Escanea el código QR con tu app authenticator'
      });
    } catch (error) {
      logger.error('Error generating 2FA secret', { error: error.message, userId: req.user?.id });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Activa 2FA después de verificar primer código
   * POST /api/2fa/enable
   */
  async enable(req, res) {
    try {
      const userId = req.user.id;
      const { secret, token } = req.body;

      const result = await twoFactorService.enableTwoFactor(userId, secret, token);

      res.json({
        success: true,
        data: {
          backupCodes: result.backupCodes
        },
        message: result.message
      });
    } catch (error) {
      logger.error('Error enabling 2FA', { error: error.message, userId: req.user?.id });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Verifica código 2FA (durante login)
   * POST /api/2fa/verify
   */
  async verify(req, res) {
    try {
      const { userId, token } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'] || null;

      const result = await twoFactorService.verifyTwoFactorToken(
        userId,
        token,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({
          success: true,
          data: { method: result.method },
          message: 'Código verificado correctamente'
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Código inválido'
        });
      }
    } catch (error) {
      logger.error('Error verifying 2FA', { error: error.message, userId: req.body?.userId });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Desactiva 2FA (requiere contraseña)
   * POST /api/2fa/disable
   */
  async disable(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      const result = await twoFactorService.disableTwoFactor(userId, password);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Error disabling 2FA', { error: error.message, userId: req.user?.id });

      const statusCode = error.message === 'Contraseña incorrecta' ? 401 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Regenera códigos de respaldo (requiere contraseña)
   * POST /api/2fa/regenerate-backup-codes
   */
  async regenerateBackupCodes(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      const result = await twoFactorService.regenerateBackupCodes(userId, password);

      res.json({
        success: true,
        data: {
          backupCodes: result.backupCodes
        },
        message: result.message
      });
    } catch (error) {
      logger.error('Error regenerating backup codes', { error: error.message, userId: req.user?.id });

      const statusCode = error.message === 'Contraseña incorrecta' ? 401 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Obtiene estado de 2FA del usuario
   * GET /api/2fa/status
   */
  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await twoFactorService.getTwoFactorStatus(userId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting 2FA status', { error: error.message, userId: req.user?.id });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * Obtiene historial de intentos 2FA
   * GET /api/2fa/history
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;

      const history = await twoFactorService.getAttemptHistory(userId, limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error getting 2FA history', { error: error.message, userId: req.user?.id });
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

module.exports = twoFactorController;
