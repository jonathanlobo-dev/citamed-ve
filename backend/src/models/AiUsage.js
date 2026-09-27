/**
 * AiUsage Model - CITAMED.VE
 * M03 / Semana 7 - Registro de uso de inteligencia artificial
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AiUsage = sequelize.define('AiUsage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'appointment_id',
      references: {
        model: 'appointments',
        key: 'id'
      }
    },
    mode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    provider: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    success: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    latencyMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'latency_ms'
    },
    inputChars: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'input_chars'
    },
    audioSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'audio_seconds'
    },
    errorCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'error_code'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    }
  }, {
    tableName: 'ai_usage',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return AiUsage;
};
