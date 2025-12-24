// src/services/verificationService.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Servicio de verificación enterprise-grade

const { VerificationToken, User } = require('../models');
const emailService = require('./emailService');
const smsService = require('./smsService');
const { logger } = require('../config/logger');

/**
 * Configuración de verificación
 * Puede ser sobrescrita por variables de entorno
 */
const CONFIG = {
  email: {
    expiryMinutes: parseInt(process.env.VERIFICATION_EMAIL_EXPIRY_MINUTES) || 1440, // 24 horas
    maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS) || 5,
    cooldownSeconds: parseInt(process.env.VERIFICATION_COOLDOWN_SECONDS_EMAIL) || 60,
    maxResendsPerHour: parseInt(process.env.VERIFICATION_MAX_RESENDS_PER_HOUR) || 3
  },
  phone: {
    expiryMinutes: parseInt(process.env.VERIFICATION_PHONE_EXPIRY_MINUTES) || 15,
    maxAttempts: parseInt(process.env.VERIFICATION_MAX_ATTEMPTS_PHONE) || 3,
    cooldownSeconds: parseInt(process.env.VERIFICATION_COOLDOWN_SECONDS_PHONE) || 120,
    maxResendsPerHour: parseInt(process.env.VERIFICATION_MAX_RESENDS_PER_HOUR) || 3
  },
  devMode: process.env.VERIFICATION_DEV_MODE === 'true',
  devCode: process.env.VERIFICATION_DEV_CODE || '123456'
};

/**
 * Servicio de Verificación de Identidad
 */
const verificationService = {
  /**
   * Genera y envía verificación de email
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @param {string} options.ipAddress - IP del cliente
   * @param {string} options.userAgent - User agent del navegador
   * @param {string} options.purpose - Propósito (registration, password_reset, etc)
   * @returns {Object} { success, token, message }
   */
  async sendEmailVerification(userId, options = {}) {
    try {
      // Obtener usuario
      const user = await User.findByPk(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
      }

      // Verificar si ya está verificado
      if (user.emailVerified) {
        return { success: false, message: 'El email ya está verificado', code: 'ALREADY_VERIFIED' };
      }

      // Verificar cooldown
      const canResendCheck = await VerificationToken.canResend(
        userId,
        'email',
        CONFIG.email.cooldownSeconds
      );

      if (!canResendCheck.canResend) {
        if (canResendCheck.message) {
          return { success: false, message: canResendCheck.message, code: 'RATE_LIMITED' };
        }
        return {
          success: false,
          message: `Espera ${canResendCheck.secondsRemaining} segundos antes de reenviar`,
          code: 'COOLDOWN_ACTIVE',
          secondsRemaining: canResendCheck.secondsRemaining
        };
      }

      // Crear token de verificación
      const { token, code, verificationToken } = await VerificationToken.createVerification({
        userId,
        type: 'email',
        contactValue: user.email,
        purpose: options.purpose || 'registration',
        expiryMinutes: CONFIG.email.expiryMinutes,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      // En modo desarrollo, usar código fijo
      const codeToSend = CONFIG.devMode ? CONFIG.devCode : code;

      // Enviar email
      const emailResult = await emailService.sendVerificationEmail({
        to: user.email,
        code: codeToSend,
        userName: user.firstName || user.email.split('@')[0],
        token,
        expiryHours: Math.round(CONFIG.email.expiryMinutes / 60)
      });

      if (!emailResult.success) {
        // Invalidar token si falló el envío
        await verificationToken.invalidate('send_failed');
        logger.error('Error enviando email de verificación', {
          userId,
          email: user.email,
          error: emailResult.error
        });
        return {
          success: false,
          message: 'Error enviando email de verificación',
          code: 'SEND_FAILED'
        };
      }

      logger.info('Email de verificación enviado', {
        userId,
        email: user.email,
        tokenId: verificationToken.id,
        devMode: CONFIG.devMode
      });

      return {
        success: true,
        token,
        message: 'Email de verificación enviado',
        expiresAt: verificationToken.expiresAt
      };
    } catch (error) {
      logger.error('Error en sendEmailVerification', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Verifica el código de email
   * @param {string} token - Token UUID de la URL
   * @param {string} code - Código ingresado por usuario
   * @param {string} ipAddress - IP de verificación
   * @returns {Object} { success, message, user }
   */
  async verifyEmail(token, code, ipAddress = null) {
    try {
      // En modo desarrollo, aceptar código dev
      const codeToVerify = CONFIG.devMode && code === CONFIG.devCode ? code : code;

      // Verificar código
      const result = await VerificationToken.verifyCode(token, codeToVerify, ipAddress);

      if (!result.success) {
        logger.warn('Verificación de email fallida', {
          token,
          code: result.code,
          ipAddress
        });
        return result;
      }

      // Actualizar usuario
      const verificationToken = result.verificationToken;
      const user = await User.findByPk(verificationToken.userId);

      if (!user) {
        return { success: false, message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
      }

      await user.update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isVerified: true // También actualizar el campo general
      });

      logger.info('Email verificado exitosamente', {
        userId: user.id,
        email: user.email,
        ipAddress
      });

      return {
        success: true,
        message: 'Email verificado correctamente',
        code: 'SUCCESS',
        user: user.toJSON()
      };
    } catch (error) {
      logger.error('Error en verifyEmail', { token, error: error.message });
      throw error;
    }
  },

  /**
   * Reenvía código de verificación de email
   * @param {number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Object} { success, token, message }
   */
  async resendEmailVerification(userId, options = {}) {
    // Mismo flujo que sendEmailVerification
    return this.sendEmailVerification(userId, {
      ...options,
      purpose: 'registration'
    });
  },

  /**
   * Genera y envía verificación de teléfono (SMS)
   * @param {number} userId - ID del usuario
   * @param {string} phoneNumber - Número de teléfono
   * @param {Object} options - Opciones adicionales
   * @returns {Object} { success, token, message }
   */
  async sendPhoneVerification(userId, phoneNumber, options = {}) {
    try {
      // Obtener usuario
      const user = await User.findByPk(userId);
      if (!user) {
        return { success: false, message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
      }

      // Normalizar número de teléfono venezolano
      const normalizedPhone = this.normalizeVenezuelanPhone(phoneNumber);
      if (!normalizedPhone) {
        return {
          success: false,
          message: 'Formato de teléfono inválido. Use formato venezolano (+58XXX...)',
          code: 'INVALID_PHONE'
        };
      }

      // Verificar cooldown
      const canResendCheck = await VerificationToken.canResend(
        userId,
        'phone',
        CONFIG.phone.cooldownSeconds
      );

      if (!canResendCheck.canResend) {
        if (canResendCheck.message) {
          return { success: false, message: canResendCheck.message, code: 'RATE_LIMITED' };
        }
        return {
          success: false,
          message: `Espera ${canResendCheck.secondsRemaining} segundos antes de reenviar`,
          code: 'COOLDOWN_ACTIVE',
          secondsRemaining: canResendCheck.secondsRemaining
        };
      }

      // Crear token de verificación
      const { token, code, verificationToken } = await VerificationToken.createVerification({
        userId,
        type: 'phone',
        contactValue: normalizedPhone,
        purpose: options.purpose || 'registration',
        expiryMinutes: CONFIG.phone.expiryMinutes,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      });

      // En modo desarrollo, usar código fijo
      const codeToSend = CONFIG.devMode ? CONFIG.devCode : code;

      // Enviar SMS
      const smsResult = await smsService.sendVerificationSMS({
        to: normalizedPhone,
        code: codeToSend
      });

      if (!smsResult.success) {
        await verificationToken.invalidate('send_failed');
        logger.error('Error enviando SMS de verificación', {
          userId,
          phone: normalizedPhone,
          error: smsResult.error
        });
        return {
          success: false,
          message: 'Error enviando SMS de verificación',
          code: 'SEND_FAILED'
        };
      }

      logger.info('SMS de verificación enviado', {
        userId,
        phone: normalizedPhone,
        tokenId: verificationToken.id,
        devMode: CONFIG.devMode
      });

      return {
        success: true,
        token,
        message: 'SMS de verificación enviado',
        expiresAt: verificationToken.expiresAt,
        expiresInMinutes: CONFIG.phone.expiryMinutes
      };
    } catch (error) {
      logger.error('Error en sendPhoneVerification', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Verifica el código de teléfono (SMS)
   * @param {string} token - Token UUID
   * @param {string} code - Código ingresado
   * @param {string} ipAddress - IP de verificación
   * @returns {Object} { success, message, user }
   */
  async verifyPhone(token, code, ipAddress = null) {
    try {
      const codeToVerify = CONFIG.devMode && code === CONFIG.devCode ? code : code;

      const result = await VerificationToken.verifyCode(token, codeToVerify, ipAddress);

      if (!result.success) {
        logger.warn('Verificación de teléfono fallida', {
          token,
          code: result.code,
          ipAddress
        });
        return result;
      }

      const verificationToken = result.verificationToken;
      const user = await User.findByPk(verificationToken.userId);

      if (!user) {
        return { success: false, message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' };
      }

      // Actualizar teléfono verificado
      await user.update({
        phone: verificationToken.contactValue,
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      });

      logger.info('Teléfono verificado exitosamente', {
        userId: user.id,
        phone: verificationToken.contactValue,
        ipAddress
      });

      return {
        success: true,
        message: 'Teléfono verificado correctamente',
        code: 'SUCCESS',
        user: user.toJSON()
      };
    } catch (error) {
      logger.error('Error en verifyPhone', { token, error: error.message });
      throw error;
    }
  },

  /**
   * Reenvía código de verificación de teléfono
   * @param {number} userId - ID del usuario
   * @param {string} phoneNumber - Número de teléfono
   * @param {Object} options - Opciones adicionales
   * @returns {Object} { success, token, message }
   */
  async resendPhoneVerification(userId, phoneNumber, options = {}) {
    return this.sendPhoneVerification(userId, phoneNumber, options);
  },

  /**
   * Obtiene el estado de verificación de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Object} { emailVerified, phoneVerified, pendingVerifications }
   */
  async getVerificationStatus(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'phone', 'emailVerified', 'phoneVerified', 'emailVerifiedAt', 'phoneVerifiedAt']
    });

    if (!user) {
      return null;
    }

    // Obtener tokens pendientes
    const pendingTokens = await VerificationToken.findAll({
      where: {
        userId,
        isActive: true,
        verifiedAt: null
      },
      attributes: ['type', 'expiresAt', 'attempts', 'maxAttempts', 'createdAt']
    });

    return {
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerified: user.phoneVerified,
      phoneVerifiedAt: user.phoneVerifiedAt,
      pendingVerifications: pendingTokens.map(t => ({
        type: t.type,
        expiresAt: t.expiresAt,
        attemptsRemaining: t.maxAttempts - t.attempts,
        createdAt: t.createdAt
      }))
    };
  },

  /**
   * Normaliza número de teléfono venezolano
   * Acepta: 0414XXXXXXX, 414XXXXXXX, +58414XXXXXXX
   * Retorna: +58XXXXXXXXXX
   * @param {string} phone - Número de teléfono
   * @returns {string|null} Número normalizado o null si inválido
   */
  normalizeVenezuelanPhone(phone) {
    if (!phone) return null;

    // Limpiar caracteres no numéricos excepto +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Si empieza con +58, verificar longitud
    if (cleaned.startsWith('+58')) {
      if (cleaned.length === 13) {
        return cleaned;
      }
      return null;
    }

    // Si empieza con 58 (sin +)
    if (cleaned.startsWith('58')) {
      if (cleaned.length === 12) {
        return '+' + cleaned;
      }
      return null;
    }

    // Si empieza con 0 (formato local)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1); // Remover el 0
    }

    // Debe tener 10 dígitos (XXX XXX XXXX)
    if (cleaned.length === 10) {
      // Verificar que sea un código de operadora venezolana válido
      const validPrefixes = ['412', '414', '416', '424', '426', '212', '243', '244', '241', '251', '261', '271', '281', '291'];
      const prefix = cleaned.substring(0, 3);

      if (validPrefixes.includes(prefix)) {
        return '+58' + cleaned;
      }
    }

    return null;
  },

  /**
   * Limpia tokens expirados (para cron job)
   * @returns {number} Cantidad de tokens eliminados
   */
  async cleanExpiredTokens() {
    try {
      const deleted = await VerificationToken.cleanExpired(7);
      logger.info('Limpieza de tokens expirados', { deleted });
      return deleted;
    } catch (error) {
      logger.error('Error en cleanExpiredTokens', { error: error.message });
      throw error;
    }
  },

  /**
   * Invalida todos los tokens de un usuario (para logout o cambio de credenciales)
   * @param {number} userId - ID del usuario
   * @param {string} type - Tipo opcional ('email', 'phone', o null para todos)
   * @returns {number} Cantidad de tokens invalidados
   */
  async invalidateUserTokens(userId, type = null) {
    const where = {
      userId,
      isActive: true
    };

    if (type) {
      where.type = type;
    }

    const [updated] = await VerificationToken.update(
      {
        isActive: false,
        invalidatedReason: 'manual_invalidation'
      },
      { where }
    );

    logger.info('Tokens de usuario invalidados', { userId, type, count: updated });
    return updated;
  }
};

module.exports = verificationService;
