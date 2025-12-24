/**
 * Clinic Model - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas
 *
 * Modelo para organizaciones médicas (hospitales, clínicas, laboratorios, etc.)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Clinic = sequelize.define('Clinic', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    legalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'legal_name',
      comment: 'Razón social de la organización'
    },
    commercialName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'commercial_name',
      comment: 'Nombre comercial'
    },
    taxId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'tax_id',
      comment: 'RIF en Venezuela'
    },
    organizationType: {
      type: DataTypes.ENUM(
        'hospital',
        'clinica_privada',
        'centro_diagnostico',
        'laboratorio',
        'centro_especializado',
        'consultorio_multiple'
      ),
      allowNull: false,
      field: 'organization_type'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    website: {
      type: DataTypes.STRING(255)
    },
    adminUserId: {
      type: DataTypes.INTEGER,
      field: 'admin_user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    mission: {
      type: DataTypes.TEXT
    },
    vision: {
      type: DataTypes.TEXT
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      field: 'logo_url'
    },
    coverImageUrl: {
      type: DataTypes.STRING(500),
      field: 'cover_image_url'
    },
    primaryColor: {
      type: DataTypes.STRING(7),
      field: 'primary_color',
      comment: 'Color principal para branding (hex)'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    verificationDate: {
      type: DataTypes.DATE,
      field: 'verification_date'
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      field: 'verified_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    totalLocations: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_locations'
    },
    totalDoctors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_doctors'
    },
    totalServices: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_services'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'clinics',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['admin_user_id'] },
      { fields: ['is_verified', 'is_active'] },
      { fields: ['organization_type'] }
    ]
  });

  // Método para obtener el tipo de organización en español
  Clinic.prototype.getOrganizationTypeLabel = function() {
    const labels = {
      'hospital': 'Hospital',
      'clinica_privada': 'Clínica Privada',
      'centro_diagnostico': 'Centro de Diagnóstico',
      'laboratorio': 'Laboratorio',
      'centro_especializado': 'Centro Especializado',
      'consultorio_multiple': 'Consultorio Múltiple'
    };
    return labels[this.organizationType] || this.organizationType;
  };

  return Clinic;
};
