/**
 * Password Recovery Service - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Servicio de recuperación de contraseña:
 * - Generación de tokens seguros
 * - Verificación de tokens/códigos
 * - Reset de contraseña con validación
 * - Rate limiting y auditoría
 */

const bcrypt = require('bcryptjs');
const { User, VerificationToken } = require('../models');
const emailService = require('./emailService');
const { logger } = require('../config/logger');
const { Op } = require('sequelize');

// Configuración
const CONFIG = {
  expiryHours: parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS) || 1,
  maxAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS) || 5,
  maxRequestsPerHour: parseInt(process.env.PASSWORD_RESET_MAX_REQUESTS_PER_HOUR) || 3,
  minPasswordLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
  bcryptRounds: 10,
  devMode: process.env.VERIFICATION_DEV_MODE === 'true'
};

// Regex para validación de contraseña fuerte
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

const passwordRecoveryService = {
  /**
   * Solicita recuperación de contraseña
   * @param {string} email - Email del usuario
   * @param {string} ipAddress - IP del cliente
   * @param {string} userAgent - User agent del navegador
   * @returns {Object} { success, message }
   */
  async requestPasswordReset(email, ipAddress = null, userAgent = null) {
    try {
      // Normalizar email
      const normalizedEmail = email.toLowerCase().trim();

      // Buscar usuario (sin revelar si existe)
      const user = await User.findOne({
        where: { email: normalizedEmail }
      });

      // Si no existe el usuario, retornar éxito igual (seguridad)
      if (!user) {
        logger.info('Password reset solicitado para email inexistente', {
          email: normalizedEmail,
          ipAddress
        });
        // Retornar mismo mensaje para no revelar existencia
        return {
          success: true,
          message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña'
        };
      }

      // Verificar rate limit: máximo X solicitudes por hora
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentRequests = await VerificationToken.count({
        where: {
          userId: user.id,
          purpose: 'password_reset',
          createdAt: { [Op.gte]: oneHourAgo }
        }
      });

      if (recentRequests >= CONFIG.maxRequestsPerHour) {
        logger.warn('Rate limit de password reset excedido', {
          userId: user.id,
          email: normalizedEmail,
          requests: recentRequests
        });
        return {
          success: false,
          message: 'Demasiadas solicitudes. Por favor espera 1 hora antes de intentar nuevamente.'
        };
      }

      // Invalidar tokens anteriores de password_reset
      await VerificationToken.update(
        {
          isActive: false,
          invalidatedReason: 'replaced'
        },
        {
          where: {
            userId: user.id,
            purpose: 'password_reset',
            isActive: true,
            verifiedAt: null
          }
        }
      );

      // Crear nuevo token
      const { token, code, verificationToken } = await VerificationToken.createVerification({
        userId: user.id,
        type: 'email',
        contactValue: normalizedEmail,
        purpose: 'password_reset',
        expiryMinutes: CONFIG.expiryHours * 60,
        ipAddress,
        userAgent
      });

      // Enviar email
      const emailResult = await emailService.sendPasswordResetEmail({
        to: normalizedEmail,
        code,
        userName: user.name || user.firstName,
        token,
        expiryMinutes: CONFIG.expiryHours * 60
      });

      if (!emailResult.success && !CONFIG.devMode) {
        logger.error('Error enviando email de password reset', {
          userId: user.id,
          error: emailResult.error
        });
        return {
          success: false,
          message: 'Error al enviar email. Por favor intenta más tarde.'
        };
      }

      logger.info('Password reset email enviado', {
        userId: user.id,
        email: normalizedEmail,
        tokenId: verificationToken.id,
        devMode: CONFIG.devMode
      });

      return {
        success: true,
        message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña',
        // Solo en modo desarrollo, devolver código
        ...(CONFIG.devMode && { devCode: code, devToken: token })
      };

    } catch (error) {
      logger.error('Error en requestPasswordReset', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Verifica token de reset (desde URL)
   * @param {string} token - Token UUID
   * @returns {Object} { valid, userId, reason }
   */
  async verifyResetToken(token) {
    try {
      const verificationToken = await VerificationToken.findOne({
        where: {
          token,
          purpose: 'password_reset',
          isActive: true,
          verifiedAt: null
        }
      });

      if (!verificationToken) {
        return {
          valid: false,
          reason: 'Token inválido o ya utilizado'
        };
      }

      // Verificar expiración
      if (new Date() > verificationToken.expiresAt) {
        await verificationToken.update({
          isActive: false,
          invalidatedReason: 'expired'
        });
        return {
          valid: false,
          reason: 'El enlace ha expirado. Solicita uno nuevo.'
        };
      }

      // Verificar máximo de intentos
      if (verificationToken.attempts >= verificationToken.maxAttempts) {
        await verificationToken.update({
          isActive: false,
          invalidatedReason: 'max_attempts'
        });
        return {
          valid: false,
          reason: 'Demasiados intentos. Solicita un nuevo enlace.'
        };
      }

      return {
        valid: true,
        userId: verificationToken.userId,
        email: verificationToken.contactValue
      };

    } catch (error) {
      logger.error('Error en verifyResetToken', {
        token,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Verifica código de 6 dígitos
   * @param {string} email - Email del usuario
   * @param {string} code - Código de 6 dígitos
   * @returns {Object} { valid, userId, token, reason }
   */
  async verifyResetCode(email, code) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // Buscar usuario
      const user = await User.findOne({
        where: { email: normalizedEmail }
      });

      if (!user) {
        return {
          valid: false,
          reason: 'Código inválido'
        };
      }

      // Buscar token activo para este usuario
      const verificationToken = await VerificationToken.findOne({
        where: {
          userId: user.id,
          purpose: 'password_reset',
          isActive: true,
          verifiedAt: null
        },
        order: [['createdAt', 'DESC']]
      });

      if (!verificationToken) {
        return {
          valid: false,
          reason: 'No hay solicitud de recuperación activa'
        };
      }

      // Verificar expiración
      if (new Date() > verificationToken.expiresAt) {
        await verificationToken.update({
          isActive: false,
          invalidatedReason: 'expired'
        });
        return {
          valid: false,
          reason: 'El código ha expirado. Solicita uno nuevo.'
        };
      }

      // Verificar máximo de intentos
      if (verificationToken.attempts >= verificationToken.maxAttempts) {
        await verificationToken.update({
          isActive: false,
          invalidatedReason: 'max_attempts'
        });
        return {
          valid: false,
          reason: 'Demasiados intentos. Solicita un nuevo código.'
        };
      }

      // Verificar código
      const isValid = await bcrypt.compare(code, verificationToken.codeHash);

      if (!isValid) {
        // Incrementar intentos
        await verificationToken.update({
          attempts: verificationToken.attempts + 1,
          lastAttemptAt: new Date()
        });

        const remaining = verificationToken.maxAttempts - verificationToken.attempts - 1;
        return {
          valid: false,
          reason: `Código incorrecto. ${remaining} intento(s) restante(s).`,
          attemptsRemaining: remaining
        };
      }

      // Código válido - NO marcar como usado todavía (se usa en resetPassword)
      logger.info('Código de reset verificado', {
        userId: user.id,
        tokenId: verificationToken.id
      });

      return {
        valid: true,
        userId: user.id,
        token: verificationToken.token,
        email: normalizedEmail
      };

    } catch (error) {
      logger.error('Error en verifyResetCode', {
        email,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Resetea la contraseña
   * @param {string} token - Token de verificación
   * @param {string} newPassword - Nueva contraseña
   * @param {string} ipAddress - IP del cliente
   * @param {string} userAgent - User agent
   * @returns {Object} { success, message }
   */
  async resetPassword(token, newPassword, ipAddress = null, userAgent = null) {
    try {
      // Verificar token
      const tokenResult = await this.verifyResetToken(token);

      if (!tokenResult.valid) {
        return {
          success: false,
          message: tokenResult.reason
        };
      }

      // Validar fortaleza de contraseña
      const passwordValidation = this.validatePasswordStrength(newPassword);
      if (!passwordValidation.valid) {
        return {
          success: false,
          message: passwordValidation.message
        };
      }

      // Obtener usuario
      const user = await User.findByPk(tokenResult.userId);
      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Verificar que no sea igual a la anterior
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return {
          success: false,
          message: 'La nueva contraseña no puede ser igual a la anterior'
        };
      }

      // Hashear nueva contraseña
      const salt = await bcrypt.genSalt(CONFIG.bcryptRounds);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Actualizar contraseña
      await user.update({
        password: hashedPassword
      });

      // Marcar token como usado
      const verificationToken = await VerificationToken.findOne({
        where: { token }
      });

      if (verificationToken) {
        await verificationToken.update({
          verifiedAt: new Date(),
          verifiedIpAddress: ipAddress,
          isActive: false,
          invalidatedReason: 'used'
        });
      }

      // Enviar email de confirmación
      await emailService.sendPasswordChangedConfirmation({
        to: user.email,
        userName: user.name || user.firstName,
        ipAddress,
        timestamp: new Date().toISOString()
      });

      logger.info('Password reseteado exitosamente', {
        userId: user.id,
        email: user.email,
        ipAddress
      });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente'
      };

    } catch (error) {
      logger.error('Error en resetPassword', {
        token,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  /**
   * Valida fortaleza de contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} { valid, message, strength }
   */
  validatePasswordStrength(password) {
    const errors = [];

    if (!password || password.length < CONFIG.minPasswordLength) {
      errors.push(`Mínimo ${CONFIG.minPasswordLength} caracteres`);
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Debe incluir al menos una letra minúscula');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Debe incluir al menos una letra mayúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('Debe incluir al menos un número');
    }

    // Calcular fortaleza
    let strength = 'weak';
    if (errors.length === 0) {
      if (password.length >= 12 && /[@$!%*?&]/.test(password)) {
        strength = 'strong';
      } else if (password.length >= 10) {
        strength = 'medium';
      } else {
        strength = 'medium';
      }
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join('. ') : 'Contraseña válida',
      strength,
      requirements: {
        minLength: password && password.length >= CONFIG.minPasswordLength,
        hasLowercase: /[a-z]/.test(password),
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[@$!%*?&]/.test(password)
      }
    };
  },

  /**
   * Obtiene intentos recientes de reset
   * @param {string} email - Email del usuario
   * @returns {Object} { count, canRetry, retryAfter }
   */
  async getResetAttempts(email) {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({
        where: { email: normalizedEmail }
      });

      if (!user) {
        return { count: 0, canRetry: true, retryAfter: 0 };
      }

      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const recentRequests = await VerificationToken.count({
        where: {
          userId: user.id,
          purpose: 'password_reset',
          createdAt: { [Op.gte]: oneHourAgo }
        }
      });

      const canRetry = recentRequests < CONFIG.maxRequestsPerHour;

      // Calcular tiempo de espera
      let retryAfter = 0;
      if (!canRetry) {
        const oldestRequest = await VerificationToken.findOne({
          where: {
            userId: user.id,
            purpose: 'password_reset',
            createdAt: { [Op.gte]: oneHourAgo }
          },
          order: [['createdAt', 'ASC']]
        });

        if (oldestRequest) {
          const oldestTime = new Date(oldestRequest.createdAt);
          oldestTime.setHours(oldestTime.getHours() + 1);
          retryAfter = Math.max(0, Math.floor((oldestTime - new Date()) / 1000));
        }
      }

      return {
        count: recentRequests,
        canRetry,
        retryAfter,
        maxRequests: CONFIG.maxRequestsPerHour
      };

    } catch (error) {
      logger.error('Error en getResetAttempts', {
        email,
        error: error.message
      });
      return { count: 0, canRetry: true, retryAfter: 0 };
    }
  }
};

module.exports = passwordRecoveryService;
