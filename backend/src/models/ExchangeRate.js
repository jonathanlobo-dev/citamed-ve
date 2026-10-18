/**
 * ExchangeRate Model - CITAMED.VE
 * M05 / Semana 8 - Historial de la tasa oficial BCV
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExchangeRate = sequelize.define('ExchangeRate', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    currencyPair: { type: DataTypes.STRING(10), allowNull: false, field: 'currency_pair' },
    rate: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
      get() {
        const v = this.getDataValue('rate');
        return v === null ? null : Number(v);
      }
    },
    source: { type: DataTypes.STRING(30), allowNull: false },
    isManual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_manual' },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: { model: 'users', key: 'id' }
    },
    rawPayload: { type: DataTypes.JSONB, allowNull: true, field: 'raw_payload' },
    checkedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'checked_at' }
  }, {
    tableName: 'exchange_rates',
    underscored: true,
    timestamps: true,
    updatedAt: false
  });

  return ExchangeRate;
};
