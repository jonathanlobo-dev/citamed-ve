/**
 * DoctorDocument Model - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Documentos de verificación subidos por médicos
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorDocument = sequelize.define('DoctorDocument', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id',
      references: {
        model: 'doctor_profiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    documentType: {
      type: DataTypes.ENUM(
        'medical_degree',
        'mpps_certificate',
        'professional_id',
        'national_id',
        'specialty_certificate',
        'other'
      ),
      allowNull: false,
      field: 'document_type',
      comment: 'Tipo de documento'
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name',
      comment: 'Nombre original del archivo'
    },
    fileUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'file_url',
      comment: 'URL del archivo almacenado'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'file_size',
      comment: 'Tamaño del archivo en bytes'
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'mime_type',
      comment: 'Tipo MIME del archivo'
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'uploaded_at',
      comment: 'Fecha de carga'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Estado del documento'
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reviewed_at',
      comment: 'Fecha de revisión'
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'reviewed_by',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin que revisó el documento'
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_notes',
      comment: 'Notas de la revisión'
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expiration_date',
      comment: 'Fecha de expiración del documento'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: 'Metadatos adicionales (OCR, etc.)'
    }
  }, {
    tableName: 'doctor_documents',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['doctor_profile_id', 'document_type'] },
      { fields: ['status'] },
      { fields: ['expiration_date'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INSTANCIA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifica si el documento está aprobado
   */
  DoctorDocument.prototype.isApproved = function() {
    return this.status === 'approved';
  };

  /**
   * Verifica si el documento está expirado
   */
  DoctorDocument.prototype.isExpired = function() {
    if (!this.expirationDate) return false;
    return new Date(this.expirationDate) < new Date();
  };

  /**
   * Obtiene la extensión del archivo
   */
  DoctorDocument.prototype.getFileExtension = function() {
    const parts = this.fileName.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  /**
   * Formatea el tamaño del archivo para display
   */
  DoctorDocument.prototype.getFormattedSize = function() {
    if (!this.fileSize) return 'Desconocido';

    const bytes = parseInt(this.fileSize);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  /**
   * Obtiene el nombre legible del tipo de documento
   */
  DoctorDocument.prototype.getDocumentTypeName = function() {
    const names = {
      medical_degree: 'Título Universitario',
      mpps_certificate: 'Certificado MPPS',
      professional_id: 'Cédula Profesional',
      national_id: 'Cédula de Identidad',
      specialty_certificate: 'Certificado de Especialidad',
      other: 'Otro Documento'
    };
    return names[this.documentType] || this.documentType;
  };

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene los tipos de documentos requeridos para verificación
   */
  DoctorDocument.getRequiredDocuments = function() {
    return [
      'medical_degree',
      'mpps_certificate',
      'national_id'
    ];
  };

  /**
   * Obtiene todos los tipos de documentos con descripciones
   */
  DoctorDocument.getAllDocumentTypes = function() {
    return [
      { type: 'medical_degree', name: 'Título Universitario', required: true, description: 'Título de médico emitido por universidad' },
      { type: 'mpps_certificate', name: 'Certificado MPPS', required: true, description: 'Certificado del Ministerio de Salud de Venezuela' },
      { type: 'national_id', name: 'Cédula de Identidad', required: true, description: 'Documento de identidad vigente' },
      { type: 'professional_id', name: 'Cédula Profesional', required: false, description: 'Cédula de colegio médico (opcional)' },
      { type: 'specialty_certificate', name: 'Certificado de Especialidad', required: false, description: 'Certificado de especialización (si aplica)' },
      { type: 'other', name: 'Otro Documento', required: false, description: 'Documentos adicionales de soporte' }
    ];
  };

  /**
   * Obtiene documentos de un doctor
   */
  DoctorDocument.getByDoctor = async function(doctorProfileId, includeRejected = false) {
    const where = { doctorProfileId };

    if (!includeRejected) {
      where.status = { [Op.ne]: 'rejected' };
    }

    return await this.findAll({
      where,
      order: [['uploadedAt', 'DESC']]
    });
  };

  /**
   * Verifica si el doctor tiene todos los documentos requeridos
   */
  DoctorDocument.checkCompleteness = async function(doctorProfileId) {
    const required = this.getRequiredDocuments();
    const documents = await this.findAll({
      where: {
        doctorProfileId,
        documentType: { [Op.in]: required },
        status: { [Op.ne]: 'rejected' }
      }
    });

    const uploaded = documents.map(d => d.documentType);
    const missing = required.filter(r => !uploaded.includes(r));
    const approved = documents.filter(d => d.status === 'approved').map(d => d.documentType);

    return {
      isComplete: missing.length === 0,
      total: required.length,
      uploaded: uploaded.length,
      approved: approved.length,
      missing,
      documents: documents.map(d => ({
        type: d.documentType,
        status: d.status,
        uploadedAt: d.uploadedAt
      }))
    };
  };

  /**
   * Verifica si todos los documentos requeridos están aprobados
   */
  DoctorDocument.areAllRequiredApproved = async function(doctorProfileId) {
    const required = this.getRequiredDocuments();
    const approvedDocs = await this.findAll({
      where: {
        doctorProfileId,
        documentType: { [Op.in]: required },
        status: 'approved'
      }
    });

    const approvedTypes = approvedDocs.map(d => d.documentType);
    return required.every(r => approvedTypes.includes(r));
  };

  /**
   * Obtiene documentos pendientes de revisión (para admins)
   */
  DoctorDocument.getPendingReview = async function(limit = 50) {
    return await this.findAll({
      where: { status: 'pending' },
      order: [['uploadedAt', 'ASC']],
      limit,
      include: [
        {
          model: sequelize.models.DoctorProfile,
          as: 'doctorProfile',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
  };

  /**
   * Marca documentos expirados
   */
  DoctorDocument.markExpiredDocuments = async function() {
    const today = new Date();
    return await this.update(
      { status: 'expired' },
      {
        where: {
          expirationDate: { [Op.lt]: today },
          status: { [Op.ne]: 'expired' }
        }
      }
    );
  };

  return DoctorDocument;
};
