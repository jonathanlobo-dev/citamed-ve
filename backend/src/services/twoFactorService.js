/**
 * Two-Factor Authentication Service - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Servicio de autenticación de dos factores usando TOTP (RFC 6238)
 * Compatible con Google Authenticator, Microsoft Authenticator, Authy
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { User, TwoFactorAttempt } = require('../models');
const { logger } = require('../config/logger');

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG = {
  encryptionKey: process.env.TWO_FACTOR_ENCRYPTION_KEY,
  issuer: process.env.TWO_FACTOR_ISSUER || 'CITAMED.VE',
  window: parseInt(process.env.TWO_FACTOR_WINDOW) || 2,
  backupCodeCount: 10,
  backupCodeLength: 8,
  algorithm: 'aes-256-cbc'
};

// Validar que la key de encriptación esté configurada
if (!CONFIG.encryptionKey || CONFIG.encryptionKey.length !== 64) {
  logger.warn('TWO_FACTOR_ENCRYPTION_KEY not properly configured. 2FA will not work in production.');
}

// ============================================================
// ENCRYPTION FUNCTIONS
// ============================================================

/**
 * Encripta un texto usando AES-256-CBC
 * @param {string} text - Texto a encriptar
 * @returns {string} iv:encrypted en formato hex
 */
function encryptSecret(text) {
  if (!CONFIG.encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const key = Buffer.from(CONFIG.encryptionKey, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(CONFIG.algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 * @param {string} encryptedText - Texto en formato iv:encrypted
 * @returns {string} Texto original
 */
function decryptSecret(encryptedText) {
  if (!CONFIG.encryptionKey) {
    throw new Error('Encryption key not configured');
  }

  const [ivHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !encrypted) {
    throw new Error('Invalid encrypted format');
  }

  const key = Buffer.from(CONFIG.encryptionKey, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(CONFIG.algorithm, key, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hashea un backup code con SHA256
 * @param {string} code - Código a hashear
 * @returns {string} Hash en hex
 */
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Genera un backup code aleatorio
 * @returns {string} Código de 8 caracteres hex
 */
function generateBackupCode() {
  return crypto.randomBytes(CONFIG.backupCodeLength / 2).toString('hex').toUpperCase();
}

// ============================================================
// 2FA SERVICE FUNCTIONS
// ============================================================

const twoFactorService = {
  /**
   * Genera un nuevo secret TOTP y código QR para un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} { secret, qrCode, manualEntryKey }
   */
  async generateTwoFactorSecret(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA ya está activado. Desactívalo primero para configurar uno nuevo.');
    }

    // Generar secret con speakeasy
    const secret = speakeasy.generateSecret({
      name: `${CONFIG.issuer} (${user.email})`,
      issuer: CONFIG.issuer,
      length: 32
    });

    // Generar código QR como data URL
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    logger.info('2FA secret generated', { userId, email: user.email });

    return {
      secret: secret.base32,
      qrCode,
      manualEntryKey: secret.base32,
      otpauthUrl: secret.otpauth_url
    };
  },

  /**
   * Activa 2FA para un usuario después de verificar el primer código
   * @param {number} userId - ID del usuario
   * @param {string} secret - Secret en base32
   * @param {string} token - Código de 6 dígitos de la app
   * @returns {Promise<Object>} { success, backupCodes }
   */
  async enableTwoFactor(userId, secret, token) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new Error('2FA ya está activado');
    }

    // Verificar el código TOTP
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: CONFIG.window
    });

    if (!verified) {
      logger.warn('2FA enable failed - invalid code', { userId });
      throw new Error('Código inválido. Verifica que la hora de tu dispositivo esté sincronizada.');
    }

    // Generar backup codes
    const backupCodes = [];
    const hashedBackupCodes = [];

    for (let i = 0; i < CONFIG.backupCodeCount; i++) {
      const code = generateBackupCode();
      backupCodes.push(code);
      hashedBackupCodes.push(hashBackupCode(code));
    }

    // Encriptar secret y guardar
    const encryptedSecret = encryptSecret(secret);

    await user.update({
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      twoFactorActivatedAt: new Date()
    });

    logger.info('2FA enabled successfully', { userId, email: user.email });

    // Retornar backup codes (solo se muestran una vez)
    return {
      success: true,
      backupCodes,
      message: 'Autenticación de dos factores activada correctamente'
    };
  },

  /**
   * Verifica un token TOTP o backup code
   * @param {number} userId - ID del usuario
   * @param {string} token - Código de 6 dígitos o backup code de 8 caracteres
   * @param {string} [ipAddress] - IP del intento
   * @param {string} [userAgent] - User agent del intento
   * @returns {Promise<Object>} { success, method }
   */
  async verifyTwoFactorToken(userId, token, ipAddress = null, userAgent = null) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new Error('2FA no está activado para este usuario');
    }

    let success = false;
    let method = 'totp';

    // Normalizar token (remover espacios y guiones)
    const cleanToken = token.replace(/[\s-]/g, '');

    // Intentar verificar como TOTP (6 dígitos)
    if (cleanToken.length === 6 && /^\d+$/.test(cleanToken)) {
      try {
        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        success = speakeasy.totp.verify({
          secret: decryptedSecret,
          encoding: 'base32',
          token: cleanToken,
          window: CONFIG.window
        });
      } catch (error) {
        logger.error('Error verifying TOTP', { userId, error: error.message });
        success = false;
      }
    }

    // Si TOTP falló, intentar como backup code (8 caracteres)
    if (!success && cleanToken.length === 8) {
      const tokenHash = hashBackupCode(cleanToken.toUpperCase());
      const backupCodes = JSON.parse(user.twoFactorBackupCodes || '[]');
      const codeIndex = backupCodes.indexOf(tokenHash);

      if (codeIndex !== -1) {
        // Backup code válido - eliminarlo de la lista
        backupCodes.splice(codeIndex, 1);
        await user.update({
          twoFactorBackupCodes: JSON.stringify(backupCodes)
        });

        success = true;
        method = 'backup_code';

        logger.info('Backup code used', {
          userId,
          remainingCodes: backupCodes.length
        });
      }
    }

    // Registrar intento
    await TwoFactorAttempt.logAttempt({
      userId,
      success,
      method,
      ipAddress,
      userAgent
    });

    if (success) {
      logger.info('2FA verification successful', { userId, method });
    } else {
      logger.warn('2FA verification failed', { userId, ipAddress });
    }

    return { success, method };
  },

  /**
   * Desactiva 2FA para un usuario
   * @param {number} userId - ID del usuario
   * @param {string} password - Contraseña actual para confirmar
   * @returns {Promise<Object>} { success }
   */
  async disableTwoFactor(userId, password) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA no está activado');
    }

    // Verificar contraseña
    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      logger.warn('2FA disable failed - invalid password', { userId });
      throw new Error('Contraseña incorrecta');
    }

    // Limpiar campos 2FA
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
      twoFactorActivatedAt: null
    });

    logger.info('2FA disabled', { userId, email: user.email });

    return {
      success: true,
      message: 'Autenticación de dos factores desactivada'
    };
  },

  /**
   * Regenera los backup codes de un usuario
   * @param {number} userId - ID del usuario
   * @param {string} password - Contraseña actual para confirmar
   * @returns {Promise<Object>} { success, backupCodes }
   */
  async regenerateBackupCodes(userId, password) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.twoFactorEnabled) {
      throw new Error('2FA no está activado');
    }

    // Verificar contraseña
    const passwordValid = await user.comparePassword(password);
    if (!passwordValid) {
      logger.warn('Backup codes regeneration failed - invalid password', { userId });
      throw new Error('Contraseña incorrecta');
    }

    // Generar nuevos backup codes
    const backupCodes = [];
    const hashedBackupCodes = [];

    for (let i = 0; i < CONFIG.backupCodeCount; i++) {
      const code = generateBackupCode();
      backupCodes.push(code);
      hashedBackupCodes.push(hashBackupCode(code));
    }

    await user.update({
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes)
    });

    logger.info('Backup codes regenerated', { userId });

    return {
      success: true,
      backupCodes,
      message: 'Códigos de respaldo regenerados. Guárdalos en un lugar seguro.'
    };
  },

  /**
   * Verifica si un usuario tiene 2FA activado
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} { enabled, activatedAt }
   */
  async getTwoFactorStatus(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'twoFactorEnabled', 'twoFactorActivatedAt', 'twoFactorBackupCodes']
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const backupCodes = user.twoFactorBackupCodes
      ? JSON.parse(user.twoFactorBackupCodes)
      : [];

    return {
      enabled: user.twoFactorEnabled,
      activatedAt: user.twoFactorActivatedAt,
      backupCodesRemaining: backupCodes.length
    };
  },

  /**
   * Obtiene historial de intentos 2FA de un usuario
   * @param {number} userId - ID del usuario
   * @param {number} limit - Número máximo de registros
   * @returns {Promise<Array>} Lista de intentos
   */
  async getAttemptHistory(userId, limit = 10) {
    return await TwoFactorAttempt.findAll({
      where: { userId },
      order: [['attemptedAt', 'DESC']],
      limit,
      attributes: ['id', 'success', 'method', 'ipAddress', 'attemptedAt']
    });
  }
};

module.exports = twoFactorService;
