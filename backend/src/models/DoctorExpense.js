/**
 * DoctorExpense Model - CITAMED.VE
 * Egresos del consultorio del médico (alquiler, insumos, nómina...) para los reportes de rentabilidad
 */

const { DataTypes } = require('sequelize');

const asNumber = (field) => ({
  get() {
    const v = this.getDataValue(field);
    return v === null ? null : Number(v);
  }
});

module.exports = (sequelize) => {
  const DoctorExpense = sequelize.define('DoctorExpense', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: { model: 'users', key: 'id' }
    },
    description: { type: DataTypes.STRING(150), allowNull: false },
    category: { type: DataTypes.STRING(30), allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, ...asNumber('amount') },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    exchangeRate: { type: DataTypes.DECIMAL(14, 4), allowNull: true, field: 'exchange_rate', ...asNumber('exchangeRate') },
    amountUsd: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'amount_usd', ...asNumber('amountUsd') },
    method: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'efectivo' },
    expenseDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'expense_date' },
    notes: { type: DataTypes.STRING(300), allowNull: true },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      references: { model: 'users', key: 'id' }
    }
  }, {
    tableName: 'doctor_expenses',
    underscored: true,
    timestamps: true
  });

  return DoctorExpense;
};
