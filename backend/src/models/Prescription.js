/**
 * Prescription Model - CITAMED.VE
 * M03 / Semana 5 - Récipe Médico en PDF con QR verificable
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prescription = sequelize.define('Prescription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'appointment_id',
      references: {
        model: 'appointments',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'Array de medicamentos [{ medication, presentation, dose, frequency, duration, instructions }]'
    },
    indications: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Indicaciones generales del récipe'
    },
    verificationCode: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      field: 'verification_code',
      comment: 'Código aleatorio único de verificación pública'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'voided']]
      },
      comment: 'active | voided'
    }
  }, {
    tableName: 'prescriptions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['appointment_id'] },
      { fields: ['doctor_id'] },
      { fields: ['patient_id'] }
    ]
  });

  return Prescription;
};
