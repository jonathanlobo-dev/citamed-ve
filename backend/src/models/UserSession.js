// src/models/UserSession.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Modelo de sesiones activas de usuario

const { DataTypes, Op } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Relación con usuario
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },

    // Hash del token JWT (nunca guardar JWT completo)
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'token_hash'
    },

    // Información del dispositivo
    deviceType: {
      type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
      defaultValue: 'unknown',
      field: 'device_type'
    },
    deviceName: {
      type: DataTypes.STRING(150),
      allowNull: true,
      field: 'device_name'
    },
    browser: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    os: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    // Información de red
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },

    // Control de tiempo
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_activity'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },

    // Estado
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    },
    revokedReason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'revoked_reason'
    }
  }, {
    tableName: 'user_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['token_hash'], unique: true },
      { fields: ['expires_at'] },
      { fields: ['user_id', 'is_active'] }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Genera hash SHA256 del token
   */
  UserSession.hashToken = function(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  };

  /**
   * Crea una nueva sesión
   */
  UserSession.createSession = async function({
    userId,
    token,
    deviceInfo,
    ipAddress,
    userAgent,
    expiresInDays = 7
  }) {
    const tokenHash = this.hashToken(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return await this.create({
      userId,
      tokenHash,
      deviceType: deviceInfo?.deviceType || 'unknown',
      deviceName: deviceInfo?.deviceName || null,
      browser: deviceInfo?.browser || null,
      os: deviceInfo?.os || null,
      ipAddress,
      location: deviceInfo?.location || null,
      userAgent,
      expiresAt,
      lastActivity: new Date()
    });
  };

  /**
   * Encuentra sesiones activas de un usuario
   */
  UserSession.findActiveByUserId = async function(userId) {
    return await this.findAll({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      order: [['lastActivity', 'DESC']]
    });
  };

  /**
   * Encuentra sesión por hash de token
   */
  UserSession.findByToken = async function(token) {
    const tokenHash = this.hashToken(token);
    return await this.findOne({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });
  };

  /**
   * Revoca una sesión específica
   */
  UserSession.revokeSession = async function(sessionId, reason = 'manual') {
    const session = await this.findByPk(sessionId);
    if (!session) return null;

    await session.update({
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason
    });

    return session;
  };

  /**
   * Revoca todas las sesiones de un usuario excepto una
   */
  UserSession.revokeAllUserSessions = async function(userId, exceptTokenHash = null) {
    const whereClause = {
      userId,
      isActive: true
    };

    if (exceptTokenHash) {
      whereClause.tokenHash = {
        [Op.ne]: exceptTokenHash
      };
    }

    const [affectedCount] = await this.update(
      {
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'revoke_all'
      },
      { where: whereClause }
    );

    return { revokedCount: affectedCount };
  };

  /**
   * Actualiza última actividad de sesión
   */
  UserSession.updateLastActivity = async function(token) {
    const tokenHash = this.hashToken(token);
    const [affectedCount] = await this.update(
      { lastActivity: new Date() },
      {
        where: {
          tokenHash,
          isActive: true
        }
      }
    );
    return affectedCount > 0;
  };

  /**
   * Limpia sesiones expiradas
   */
  UserSession.cleanExpiredSessions = async function() {
    const result = await this.destroy({
      where: {
        [Op.or]: [
          // Sesiones expiradas
          {
            expiresAt: {
              [Op.lt]: new Date()
            }
          },
          // Sesiones revocadas hace más de 30 días
          {
            isActive: false,
            revokedAt: {
              [Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      }
    });

    return { deletedCount: result };
  };

  /**
   * Cuenta sesiones activas de un usuario
   */
  UserSession.countActiveSessions = async function(userId) {
    return await this.count({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });
  };

  /**
   * Aplica límite de sesiones simultáneas
   */
  UserSession.enforceSessionLimit = async function(userId, maxSessions = 5) {
    const activeSessions = await this.findAll({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      order: [['lastActivity', 'ASC']] // Las más antiguas primero
    });

    if (activeSessions.length <= maxSessions) {
      return { revoked: 0, kept: activeSessions.length };
    }

    // Revocar las sesiones más antiguas
    const toRevoke = activeSessions.slice(0, activeSessions.length - maxSessions);

    for (const session of toRevoke) {
      await session.update({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'session_limit'
      });
    }

    return {
      revoked: toRevoke.length,
      kept: maxSessions
    };
  };

  /**
   * Detecta sesiones sospechosas (IPs o ubicaciones inusuales)
   */
  UserSession.detectSuspiciousSessions = async function(userId, knownIPs = []) {
    const activeSessions = await this.findActiveByUserId(userId);

    // Si no hay IPs conocidas, todas son potencialmente nuevas
    if (knownIPs.length === 0) {
      return [];
    }

    return activeSessions.filter(session => {
      return session.ipAddress && !knownIPs.includes(session.ipAddress);
    });
  };

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Verifica si la sesión ha expirado
   */
  UserSession.prototype.isExpired = function() {
    return new Date() > new Date(this.expiresAt);
  };

  /**
   * Verifica si la sesión está activa y válida
   */
  UserSession.prototype.isValid = function() {
    return this.isActive && !this.isExpired();
  };

  /**
   * Tiempo desde última actividad en minutos
   */
  UserSession.prototype.getInactiveMinutes = function() {
    const now = new Date();
    const lastActivity = new Date(this.lastActivity);
    return Math.floor((now - lastActivity) / (1000 * 60));
  };

  /**
   * Revoca esta sesión
   */
  UserSession.prototype.revoke = async function(reason = 'manual') {
    return await this.update({
      isActive: false,
      revokedAt: new Date(),
      revokedReason: reason
    });
  };

  return UserSession;
};
