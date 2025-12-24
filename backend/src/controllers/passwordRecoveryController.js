/**
 * Password Recovery Controller - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Controlador de recuperación de contraseña:
 * - Solicitar reset
 * - Verificar token/código
 * - Cambiar contraseña
 */

const passwordRecoveryService = require('../services/passwordRecoveryService');
const { logger } = require('../config/logger');

/**
 * Obtiene IP del cliente
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.ip;
}

const passwordRecoveryController = {
  /**
   * POST /password-recovery/request
   * Solicita recuperación de contraseña
   */
  async requestReset(req, res) {
    try {
      const { email } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await passwordRecoveryService.requestPasswordReset(
        email,
        ipAddress,
        userAgent
      );

      // Siempre retornar 200 para no revelar si email existe
      res.json({
        success: true,
        message: result.message,
        // Solo en modo desarrollo
        ...(result.devCode && { devCode: result.devCode, devToken: result.devToken })
      });

    } catch (error) {
      logger.error('Error en requestReset controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud. Por favor intenta más tarde.'
      });
    }
  },

  /**
   * GET /password-recovery/verify-token
   * Verifica si un token es válido
   */
  async verifyToken(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: 'Token requerido'
        });
      }

      const result = await passwordRecoveryService.verifyResetToken(token);

      res.json({
        success: true,
        valid: result.valid,
        ...(result.valid ? { email: result.email } : { reason: result.reason })
      });

    } catch (error) {
      logger.error('Error en verifyToken controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        valid: false,
        message: 'Error al verificar token'
      });
    }
  },

  /**
   * POST /password-recovery/verify-code
   * Verifica código de 6 dígitos
   */
  async verifyCode(req, res) {
    try {
      const { email, code } = req.body;

      const result = await passwordRecoveryService.verifyResetCode(email, code);

      if (result.valid) {
        res.json({
          success: true,
          valid: true,
          token: result.token,
          email: result.email
        });
      } else {
        res.status(400).json({
          success: false,
          valid: false,
          message: result.reason,
          attemptsRemaining: result.attemptsRemaining
        });
      }

    } catch (error) {
      logger.error('Error en verifyCode controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        valid: false,
        message: 'Error al verificar código'
      });
    }
  },

  /**
   * POST /password-recovery/reset
   * Cambia la contraseña
   */
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await passwordRecoveryService.resetPassword(
        token,
        newPassword,
        ipAddress,
        userAgent
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      logger.error('Error en resetPassword controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña. Por favor intenta más tarde.'
      });
    }
  },

  /**
   * POST /password-recovery/validate-password
   * Valida fortaleza de contraseña (para frontend)
   */
  async validatePassword(req, res) {
    try {
      const { password } = req.body;

      const result = passwordRecoveryService.validatePasswordStrength(password);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al validar contraseña'
      });
    }
  }
};

module.exports = passwordRecoveryController;
