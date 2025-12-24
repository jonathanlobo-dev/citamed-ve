// src/controllers/identityVerificationController.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Controller para verificación de email y teléfono

const verificationService = require('../services/verificationService');
const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Obtiene IP del cliente considerando proxies
 * @param {Object} req - Express request
 * @returns {string} IP del cliente
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

/**
 * Controller de Verificación de Identidad
 */
const identityVerificationController = {
  // ============================================================
  // ENVIAR VERIFICACIÓN DE EMAIL
  // ============================================================
  /**
   * POST /api/verification/send-email
   * Envía código de verificación por email
   */
  sendEmailVerification: async (req, res) => {
    try {
      // Validar errores de express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { userId } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await verificationService.sendEmailVerification(userId, {
        ipAddress,
        userAgent,
        purpose: 'registration'
      });

      if (!result.success) {
        const statusCode = result.code === 'ALREADY_VERIFIED' ? 409 :
                          result.code === 'COOLDOWN_ACTIVE' ? 429 :
                          result.code === 'RATE_LIMITED' ? 429 :
                          result.code === 'USER_NOT_FOUND' ? 404 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          secondsRemaining: result.secondsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        expiresAt: result.expiresAt
      });
    } catch (error) {
      logger.error('Error en sendEmailVerification controller', {
        error: error.message,
        userId: req.body?.userId
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // VERIFICAR EMAIL
  // ============================================================
  /**
   * POST /api/verification/verify-email
   * Verifica el código de email
   */
  verifyEmail: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { token, code } = req.body;
      const ipAddress = getClientIP(req);

      const result = await verificationService.verifyEmail(token, code, ipAddress);

      if (!result.success) {
        const statusCode = result.code === 'INVALID_TOKEN' ? 404 :
                          result.code === 'TOKEN_EXPIRED' ? 410 :
                          result.code === 'MAX_ATTEMPTS' ? 429 :
                          result.code === 'INVALID_CODE' ? 400 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          attemptsRemaining: result.attemptsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } catch (error) {
      logger.error('Error en verifyEmail controller', {
        error: error.message,
        token: req.body?.token
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // REENVIAR VERIFICACIÓN DE EMAIL
  // ============================================================
  /**
   * POST /api/verification/resend-email
   * Reenvía el código de verificación por email
   */
  resendEmailVerification: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { userId } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await verificationService.resendEmailVerification(userId, {
        ipAddress,
        userAgent
      });

      if (!result.success) {
        const statusCode = result.code === 'COOLDOWN_ACTIVE' ? 429 :
                          result.code === 'RATE_LIMITED' ? 429 :
                          result.code === 'ALREADY_VERIFIED' ? 409 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          secondsRemaining: result.secondsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        expiresAt: result.expiresAt
      });
    } catch (error) {
      logger.error('Error en resendEmailVerification controller', {
        error: error.message,
        userId: req.body?.userId
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // ENVIAR VERIFICACIÓN DE TELÉFONO (SMS)
  // ============================================================
  /**
   * POST /api/verification/send-phone
   * Envía código de verificación por SMS
   */
  sendPhoneVerification: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { userId, phoneNumber } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await verificationService.sendPhoneVerification(userId, phoneNumber, {
        ipAddress,
        userAgent,
        purpose: 'registration'
      });

      if (!result.success) {
        const statusCode = result.code === 'INVALID_PHONE' ? 400 :
                          result.code === 'COOLDOWN_ACTIVE' ? 429 :
                          result.code === 'RATE_LIMITED' ? 429 :
                          result.code === 'USER_NOT_FOUND' ? 404 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          secondsRemaining: result.secondsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        expiresAt: result.expiresAt,
        expiresInMinutes: result.expiresInMinutes
      });
    } catch (error) {
      logger.error('Error en sendPhoneVerification controller', {
        error: error.message,
        userId: req.body?.userId
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // VERIFICAR TELÉFONO
  // ============================================================
  /**
   * POST /api/verification/verify-phone
   * Verifica el código de teléfono (SMS)
   */
  verifyPhone: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { token, code } = req.body;
      const ipAddress = getClientIP(req);

      const result = await verificationService.verifyPhone(token, code, ipAddress);

      if (!result.success) {
        const statusCode = result.code === 'INVALID_TOKEN' ? 404 :
                          result.code === 'TOKEN_EXPIRED' ? 410 :
                          result.code === 'MAX_ATTEMPTS' ? 429 :
                          result.code === 'INVALID_CODE' ? 400 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          attemptsRemaining: result.attemptsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        user: result.user
      });
    } catch (error) {
      logger.error('Error en verifyPhone controller', {
        error: error.message,
        token: req.body?.token
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // REENVIAR VERIFICACIÓN DE TELÉFONO
  // ============================================================
  /**
   * POST /api/verification/resend-phone
   * Reenvía el código de verificación por SMS
   */
  resendPhoneVerification: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array()
        });
      }

      const { userId, phoneNumber } = req.body;
      const ipAddress = getClientIP(req);
      const userAgent = req.headers['user-agent'];

      const result = await verificationService.resendPhoneVerification(userId, phoneNumber, {
        ipAddress,
        userAgent
      });

      if (!result.success) {
        const statusCode = result.code === 'COOLDOWN_ACTIVE' ? 429 :
                          result.code === 'RATE_LIMITED' ? 429 : 400;

        return res.status(statusCode).json({
          success: false,
          message: result.message,
          code: result.code,
          secondsRemaining: result.secondsRemaining
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        expiresAt: result.expiresAt
      });
    } catch (error) {
      logger.error('Error en resendPhoneVerification controller', {
        error: error.message,
        userId: req.body?.userId
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // OBTENER ESTADO DE VERIFICACIÓN
  // ============================================================
  /**
   * GET /api/verification/status/:userId
   * Obtiene el estado de verificación de un usuario
   */
  getStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      const status = await verificationService.getVerificationStatus(parseInt(userId));

      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error en getStatus controller', {
        error: error.message,
        userId: req.params?.userId
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  },

  // ============================================================
  // VERIFICAR TOKEN (para páginas de verificación)
  // ============================================================
  /**
   * GET /api/verification/check-token/:token
   * Verifica si un token es válido (sin verificar código)
   */
  checkToken: async (req, res) => {
    try {
      const { token } = req.params;
      const { VerificationToken } = require('../models');

      const verificationToken = await VerificationToken.findOne({
        where: {
          token,
          isActive: true,
          verifiedAt: null
        },
        attributes: ['type', 'expiresAt', 'attempts', 'maxAttempts', 'contactValue']
      });

      if (!verificationToken) {
        return res.status(404).json({
          success: false,
          message: 'Token inválido o ya utilizado',
          code: 'INVALID_TOKEN'
        });
      }

      if (verificationToken.isExpired()) {
        return res.status(410).json({
          success: false,
          message: 'El token ha expirado',
          code: 'TOKEN_EXPIRED'
        });
      }

      // Ocultar parte del contacto por privacidad
      const maskedContact = verificationToken.type === 'email'
        ? verificationToken.contactValue.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : verificationToken.contactValue.replace(/(\+\d{2}\d{3})(\d{4})(\d{3})/, '$1****$3');

      res.status(200).json({
        success: true,
        data: {
          type: verificationToken.type,
          contact: maskedContact,
          expiresAt: verificationToken.expiresAt,
          attemptsRemaining: verificationToken.maxAttempts - verificationToken.attempts,
          secondsUntilExpiry: verificationToken.getSecondsUntilExpiry()
        }
      });
    } catch (error) {
      logger.error('Error en checkToken controller', {
        error: error.message,
        token: req.params?.token
      });
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

module.exports = identityVerificationController;
