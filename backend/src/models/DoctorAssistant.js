/**
 * DoctorAssistant Model - CITAMED.VE
 * Semana 9 / Bloque A - Vínculos entre médicos y asistentes con permisos delegados
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorAssistant = sequelize.define('DoctorAssistant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    assistantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'assistant_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'active', 'revoked']]
      },
      comment: 'pending | active | revoked'
    },
    canAgenda: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_agenda',
      comment: 'Permiso para ver y gestionar agenda, citas y sala de espera'
    },
    canPayments: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'can_payments',
      comment: 'Permiso para consultar, validar y registrar cobros'
    },
    canVoidReceipts: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'can_void_receipts',
      comment: 'Permiso para anular recibos de cobro ya aprobados'
    },
    invitedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'invited_at'
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'accepted_at'
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'revoked_at'
    }
  }, {
    tableName: 'doctor_assistants',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_id'] },
      { fields: ['assistant_id'] },
      {
        unique: true,
        fields: ['doctor_id', 'assistant_id'],
        where: {
          status: { [sequelize.Sequelize.Op.ne]: 'revoked' }
        }
      }
    ]
  });

  return DoctorAssistant;
};
