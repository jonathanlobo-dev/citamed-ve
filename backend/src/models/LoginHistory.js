// src/models/LoginHistory.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Modelo de historial de inicios de sesión

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const LoginHistory = sequelize.define('LoginHistory', {
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

    // Resultado del intento
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    failureReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'failure_reason'
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

    // Timestamp del intento
    loginAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'login_at'
    },

    // Método de autenticación
    authMethod: {
      type: DataTypes.ENUM('password', '2fa', 'social', 'magic_link'),
      defaultValue: 'password',
      field: 'auth_method'
    }
  }, {
    tableName: 'login_history',
    timestamps: false, // Solo usamos loginAt
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['login_at'] },
      { fields: ['user_id', 'login_at'] },
      { fields: ['ip_address'] },
      { fields: ['success'] }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Registra un intento de login
   */
  LoginHistory.recordLogin = async function({
    userId,
    success,
    deviceInfo,
    ipAddress,
    userAgent,
    failureReason = null,
    authMethod = 'password'
  }) {
    return await this.create({
      userId,
      success,
      failureReason,
      deviceType: deviceInfo?.deviceType || 'unknown',
      deviceName: deviceInfo?.deviceName || null,
      browser: deviceInfo?.browser || null,
      os: deviceInfo?.os || null,
      ipAddress,
      location: deviceInfo?.location || null,
      userAgent,
      loginAt: new Date(),
      authMethod
    });
  };

  /**
   * Obtiene historial de login de un usuario
   */
  LoginHistory.getUserLoginHistory = async function(userId, limit = 20, offset = 0) {
    const { rows, count } = await this.findAndCountAll({
      where: { userId },
      order: [['loginAt', 'DESC']],
      limit,
      offset
    });

    return {
      history: rows,
      total: count,
      hasMore: offset + rows.length < count
    };
  };

  /**
   * Obtiene intentos fallidos recientes
   */
  LoginHistory.getRecentFailedAttempts = async function(userId, hours = 1) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return await this.count({
      where: {
        userId,
        success: false,
        loginAt: {
          [Op.gte]: since
        }
      }
    });
  };

  /**
   * Obtiene IPs conocidas del usuario (últimos 30 días)
   */
  LoginHistory.getKnownIPs = async function(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await this.findAll({
      where: {
        userId,
        success: true,
        ipAddress: {
          [Op.ne]: null
        },
        loginAt: {
          [Op.gte]: since
        }
      },
      attributes: ['ipAddress'],
      group: ['ipAddress']
    });

    return records.map(r => r.ipAddress);
  };

  /**
   * Detecta si es un nuevo dispositivo/IP
   */
  LoginHistory.isNewDevice = async function(userId, ipAddress, userAgent) {
    const exists = await this.findOne({
      where: {
        userId,
        ipAddress,
        success: true
      }
    });

    return !exists;
  };

  /**
   * Estadísticas de login del usuario
   */
  LoginHistory.getUserStats = async function(userId, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalSuccess, totalFailed, uniqueIPs] = await Promise.all([
      this.count({
        where: { userId, success: true, loginAt: { [Op.gte]: since } }
      }),
      this.count({
        where: { userId, success: false, loginAt: { [Op.gte]: since } }
      }),
      this.count({
        where: { userId, success: true, loginAt: { [Op.gte]: since } },
        distinct: true,
        col: 'ipAddress'
      })
    ]);

    return {
      successfulLogins: totalSuccess,
      failedAttempts: totalFailed,
      uniqueLocations: uniqueIPs,
      period: `${days} days`
    };
  };

  /**
   * Limpia registros antiguos
   */
  LoginHistory.cleanOldRecords = async function(daysToKeep = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);

    const result = await this.destroy({
      where: {
        loginAt: {
          [Op.lt]: cutoff
        }
      }
    });

    return { deletedCount: result };
  };

  /**
   * Obtiene último login exitoso
   */
  LoginHistory.getLastSuccessfulLogin = async function(userId) {
    return await this.findOne({
      where: {
        userId,
        success: true
      },
      order: [['loginAt', 'DESC']]
    });
  };

  return LoginHistory;
};
