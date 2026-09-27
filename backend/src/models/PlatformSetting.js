/**
 * PlatformSetting Model - CITAMED.VE
 * M01 / Semana 7 - Configuración de la plataforma
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlatformSetting = sequelize.define('PlatformSetting', {
    key: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'updated_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'platform_settings',
    underscored: true,
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at'
  });

  return PlatformSetting;
};
