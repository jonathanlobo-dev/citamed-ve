/**
 * MedicalDocument Model - CITAMED.VE
 * M03 / Semana 6 - Documentos Médicos de la Historia Clínica
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MedicalDocument = sequelize.define('MedicalDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [['lab_order', 'rest_note', 'certificate', 'medical_report', 'attachment']]
      },
      comment: 'Tipo de documento médico: lab_order, rest_note, certificate, medical_report, attachment'
    },
    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'appointment_id',
      references: {
        model: 'appointments',
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
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'RESTRICT'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200]
      },
      comment: 'Título o nombre del documento'
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Contenido estructurado según el tipo de documento'
    },
    verificationCode: {
      type: DataTypes.STRING(16),
      allowNull: true,
      unique: true,
      field: 'verification_code',
      comment: 'Código de verificación pública (16 hex mayúsculas, NULL en adjuntos)'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'voided', 'deleted']]
      },
      comment: 'active | voided | deleted'
    },
    storagePath: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'storage_path',
      comment: 'Ruta en Supabase Storage (solo adjuntos)'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
      comment: 'Tipo MIME del archivo (solo adjuntos)'
    },
    sizeBytes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'size_bytes',
      comment: 'Tamaño en bytes (solo adjuntos)'
    }
  }, {
    tableName: 'medical_documents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['patient_id'] },
      { fields: ['appointment_id'] },
      { fields: ['doctor_id'] }
    ]
  });

  return MedicalDocument;
};
