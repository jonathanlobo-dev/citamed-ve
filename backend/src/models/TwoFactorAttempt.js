/**
 * TwoFactorAttempt Model - CITAMED.VE
 * M01 Sub-Partida 2.4.1 Two-Factor Authentication
 *
 * Registro de intentos de verificación 2FA para auditoría
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TwoFactorAttempt = sequelize.define('TwoFactorAttempt', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    method: {
      type: DataTypes.ENUM('totp', 'backup_code'),
      allowNull: false,
      defaultValue: 'totp',
      comment: 'Method used for verification'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IPv4 or IPv6 address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attemptedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'two_factor_attempts',
    timestamps: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['attemptedAt'] },
      { fields: ['userId', 'success'] }
    ]
  });

  // ============================================================
  // STATIC METHODS
  // ============================================================

  /**
   * Registrar un intento de 2FA
   * @param {Object} data - Datos del intento
   * @returns {Promise<TwoFactorAttempt>}
   */
  TwoFactorAttempt.logAttempt = async function({ userId, success, method = 'totp', ipAddress, userAgent }) {
    return await this.create({
      userId,
      success,
      method,
      ipAddress,
      userAgent,
      attemptedAt: new Date()
    });
  };

  /**
   * Contar intentos fallidos recientes
   * @param {number} userId - ID del usuario
   * @param {number} windowMinutes - Ventana de tiempo en minutos
   * @returns {Promise<number>}
   */
  TwoFactorAttempt.countRecentFailures = async function(userId, windowMinutes = 15) {
    const { Op } = require('sequelize');
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    return await this.count({
      where: {
        userId,
        success: false,
        attemptedAt: { [Op.gte]: windowStart }
      }
    });
  };

  /**
   * Obtener último intento exitoso
   * @param {number} userId - ID del usuario
   * @returns {Promise<TwoFactorAttempt|null>}
   */
  TwoFactorAttempt.getLastSuccess = async function(userId) {
    return await this.findOne({
      where: { userId, success: true },
      order: [['attemptedAt', 'DESC']]
    });
  };

  /**
   * Limpiar intentos antiguos (para cron job)
   * @param {number} daysToKeep - Días a mantener
   * @returns {Promise<number>} Registros eliminados
   */
  TwoFactorAttempt.cleanOldAttempts = async function(daysToKeep = 90) {
    const { Op } = require('sequelize');
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    return await this.destroy({
      where: {
        attemptedAt: { [Op.lt]: cutoffDate }
      }
    });
  };

  return TwoFactorAttempt;
};
