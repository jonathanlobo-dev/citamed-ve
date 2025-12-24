// src/models/VerificationToken.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Modelo de tokens de verificación enterprise-grade

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const VerificationToken = sequelize.define('VerificationToken', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    // Relación con usuario
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },

    // Token UUID para URL (seguro, público)
    token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },

    // Código hasheado (seguro, privado)
    codeHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'code_hash'
    },

    // Tipo y propósito
    type: {
      type: DataTypes.ENUM('email', 'phone'),
      allowNull: false
    },
    purpose: {
      type: DataTypes.ENUM('registration', 'password_reset', 'email_change', 'phone_change'),
      allowNull: false,
      defaultValue: 'registration'
    },
    contactValue: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contact_value'
    },

    // Control de intentos
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      field: 'max_attempts'
    },
    resendCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'resend_count'
    },
    maxResends: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      field: 'max_resends'
    },

    // Expiración y estado
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    lastAttemptAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_attempt_at'
    },
    lastResendAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_resend_at'
    },

    // Seguridad y tracking
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    verifiedIpAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'verified_ip_address'
    },

    // Estado activo
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    invalidatedReason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'invalidated_reason'
    }
  }, {
    tableName: 'verification_tokens',
    timestamps: true,
    underscored: true,

    // Scopes predefinidos para queries comunes
    scopes: {
      active: {
        where: {
          isActive: true,
          verifiedAt: null
        }
      },
      pending: {
        where: {
          isActive: true,
          verifiedAt: null
        }
      },
      byType(type) {
        return {
          where: { type }
        };
      },
      notExpired: {
        where: {
          expiresAt: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      }
    }
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Genera código de 6 dígitos criptográficamente seguro
   */
  VerificationToken.generateCode = function() {
    // Usar crypto para generar número aleatorio seguro
    const buffer = crypto.randomBytes(4);
    const number = buffer.readUInt32BE(0) % 1000000;
    return number.toString().padStart(6, '0');
  };

  /**
   * Genera token UUID v4
   */
  VerificationToken.generateToken = function() {
    return crypto.randomUUID();
  };

  /**
   * Hash del código con bcrypt (costo bajo para códigos temporales)
   */
  VerificationToken.hashCode = async function(code) {
    const salt = await bcrypt.genSalt(4); // Costo bajo, código expira pronto
    return await bcrypt.hash(code, salt);
  };

  /**
   * Crea token de verificación completo
   * @param {Object} params
   * @param {number} params.userId - ID del usuario
   * @param {string} params.type - 'email' | 'phone'
   * @param {string} params.contactValue - Email o teléfono
   * @param {string} params.purpose - Propósito de verificación
   * @param {number} params.expiryMinutes - Minutos hasta expiración
   * @param {string} params.ipAddress - IP del cliente
   * @param {string} params.userAgent - User agent del navegador
   * @returns {Object} { token, code, verificationToken }
   */
  VerificationToken.createVerification = async function({
    userId,
    type,
    contactValue,
    purpose = 'registration',
    expiryMinutes = type === 'email' ? 1440 : 15, // 24h email, 15min phone
    ipAddress = null,
    userAgent = null
  }) {
    // Invalidar tokens anteriores del mismo tipo para este usuario
    await this.update(
      {
        isActive: false,
        invalidatedReason: 'replaced'
      },
      {
        where: {
          userId,
          type,
          isActive: true,
          verifiedAt: null
        }
      }
    );

    // Generar nuevo token y código
    const token = this.generateToken();
    const code = this.generateCode();
    const codeHash = await this.hashCode(code);

    // Calcular expiración
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Crear registro
    const verificationToken = await this.create({
      userId,
      token,
      codeHash,
      type,
      purpose,
      contactValue,
      expiresAt,
      ipAddress,
      userAgent,
      maxAttempts: type === 'email' ? 5 : 3,
      maxResends: 3
    });

    // Retornar código en texto plano (solo esta vez, para enviar)
    return {
      token,
      code,
      verificationToken
    };
  };

  /**
   * Verifica un código
   * @param {string} token - Token UUID de la URL
   * @param {string} code - Código ingresado por usuario
   * @param {string} ipAddress - IP de verificación
   * @returns {Object} { success, message, verificationToken }
   */
  VerificationToken.verifyCode = async function(token, code, ipAddress = null) {
    // Buscar token activo
    const verificationToken = await this.findOne({
      where: {
        token,
        isActive: true,
        verifiedAt: null
      }
    });

    if (!verificationToken) {
      return {
        success: false,
        message: 'Token inválido o ya utilizado',
        code: 'INVALID_TOKEN'
      };
    }

    // Verificar expiración
    if (new Date() > verificationToken.expiresAt) {
      await verificationToken.update({
        isActive: false,
        invalidatedReason: 'expired'
      });
      return {
        success: false,
        message: 'El código ha expirado. Solicita uno nuevo.',
        code: 'TOKEN_EXPIRED'
      };
    }

    // Verificar máximo de intentos
    if (verificationToken.attempts >= verificationToken.maxAttempts) {
      await verificationToken.update({
        isActive: false,
        invalidatedReason: 'max_attempts'
      });
      return {
        success: false,
        message: 'Demasiados intentos fallidos. Solicita un nuevo código.',
        code: 'MAX_ATTEMPTS'
      };
    }

    // Verificar código con bcrypt
    const isValid = await bcrypt.compare(code, verificationToken.codeHash);

    if (!isValid) {
      // Incrementar intentos
      await verificationToken.update({
        attempts: verificationToken.attempts + 1,
        lastAttemptAt: new Date()
      });

      const remaining = verificationToken.maxAttempts - verificationToken.attempts - 1;
      return {
        success: false,
        message: `Código incorrecto. ${remaining} intento(s) restante(s).`,
        code: 'INVALID_CODE',
        attemptsRemaining: remaining
      };
    }

    // Código válido - marcar como verificado
    await verificationToken.update({
      verifiedAt: new Date(),
      verifiedIpAddress: ipAddress,
      isActive: false,
      invalidatedReason: 'used'
    });

    return {
      success: true,
      message: 'Verificación exitosa',
      code: 'SUCCESS',
      verificationToken
    };
  };

  /**
   * Verifica si puede reenviar código (respeta cooldown)
   * @param {number} userId
   * @param {string} type
   * @param {number} cooldownSeconds
   * @returns {Object} { canResend, secondsRemaining, resendCount }
   */
  VerificationToken.canResend = async function(userId, type, cooldownSeconds = 60) {
    const lastToken = await this.findOne({
      where: {
        userId,
        type
      },
      order: [['createdAt', 'DESC']]
    });

    if (!lastToken) {
      return { canResend: true, secondsRemaining: 0, resendCount: 0 };
    }

    // Verificar cooldown desde último reenvío o creación
    const lastTime = lastToken.lastResendAt || lastToken.createdAt;
    const elapsed = Math.floor((Date.now() - new Date(lastTime).getTime()) / 1000);
    const remaining = Math.max(0, cooldownSeconds - elapsed);

    // Verificar límite de reenvíos en la última hora
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentTokens = await this.count({
      where: {
        userId,
        type,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: oneHourAgo
        }
      }
    });

    if (recentTokens >= 3) {
      return {
        canResend: false,
        secondsRemaining: 0,
        resendCount: recentTokens,
        message: 'Límite de reenvíos alcanzado. Intenta en 1 hora.'
      };
    }

    return {
      canResend: remaining === 0,
      secondsRemaining: remaining,
      resendCount: lastToken.resendCount || 0
    };
  };

  /**
   * Limpia tokens expirados (para cron job)
   * @param {number} daysOld - Eliminar tokens más viejos que X días
   * @returns {number} Cantidad de tokens eliminados
   */
  VerificationToken.cleanExpired = async function(daysOld = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await this.destroy({
      where: {
        [sequelize.Sequelize.Op.or]: [
          // Expirados hace más de X días
          {
            expiresAt: {
              [sequelize.Sequelize.Op.lt]: cutoff
            }
          },
          // Verificados hace más de X días
          {
            verifiedAt: {
              [sequelize.Sequelize.Op.lt]: cutoff
            }
          }
        ]
      }
    });

    return result;
  };

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Verifica si el token ha expirado
   */
  VerificationToken.prototype.isExpired = function() {
    return new Date() > this.expiresAt;
  };

  /**
   * Verifica si tiene intentos restantes
   */
  VerificationToken.prototype.hasAttemptsRemaining = function() {
    return this.attempts < this.maxAttempts;
  };

  /**
   * Tiempo restante hasta expiración en segundos
   */
  VerificationToken.prototype.getSecondsUntilExpiry = function() {
    const now = new Date();
    const expiry = new Date(this.expiresAt);
    return Math.max(0, Math.floor((expiry - now) / 1000));
  };

  /**
   * Invalida el token manualmente
   */
  VerificationToken.prototype.invalidate = async function(reason = 'manual') {
    return await this.update({
      isActive: false,
      invalidatedReason: reason
    });
  };

  /**
   * Registra reenvío
   */
  VerificationToken.prototype.recordResend = async function() {
    return await this.update({
      resendCount: this.resendCount + 1,
      lastResendAt: new Date()
    });
  };

  return VerificationToken;
};
