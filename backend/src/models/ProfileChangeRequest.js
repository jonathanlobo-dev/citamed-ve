/**
 * ProfileChangeRequest Model - CITAMED.VE
 * Solicitudes para cambiar datos que identifican a la persona (nombre, cédula, MPPS).
 * Las decide un administrador y queda registro de quién, cuándo y por qué.
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProfileChangeRequest = sequelize.define('ProfileChangeRequest', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: { model: 'users', key: 'id' }
    },
    field: { type: DataTypes.STRING(40), allowNull: false },
    currentValue: { type: DataTypes.STRING(255), allowNull: true, field: 'current_value' },
    requestedValue: { type: DataTypes.STRING(255), allowNull: false, field: 'requested_value' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'approved', 'rejected']] }
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      references: { model: 'users', key: 'id' }
    },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
    reviewNote: { type: DataTypes.TEXT, allowNull: true, field: 'review_note' }
  }, {
    tableName: 'profile_change_requests',
    underscored: true,
    timestamps: true
  });

  return ProfileChangeRequest;
};
