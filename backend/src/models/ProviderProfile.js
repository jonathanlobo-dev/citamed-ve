// models/ProviderProfile.js
// CITAMED.VE - M01.3 Registro Multi-Paso
// Perfil de proveedores (farmacias, laboratorios, insumos mÃ©dicos, servicios)

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProviderProfile = sequelize.define('ProviderProfile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    // ========================================
    // INFORMACIÃ“N DE LA EMPRESA
    // ========================================
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nombre comercial de la empresa'
    },
    rif: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Registro de InformaciÃ³n Fiscal (RIF)'
    },
    legalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'RazÃ³n social'
    },
    commercialPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'TelÃ©fono comercial'
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email de contacto comercial'
    },
    legalRepresentative: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nombre del representante legal'
    },

    // ========================================
    // TIPO Y SERVICIOS
    // ========================================
    providerType: {
      type: DataTypes.ENUM('pharmacy', 'laboratory', 'supplies', 'services', 'clinic', 'hospital', 'diagnostic_center', 'other'),
      allowNull: false,
      comment: 'Tipo de proveedor'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'DescripciÃ³n de servicios ofrecidos'
    },
    mainProducts: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Productos principales'
    },

    // ========================================
    // UBICACIÃ“N
    // ========================================
    mainAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'DirecciÃ³n principal'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    coordinates: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Coordenadas GPS {lat, lng}'
    },

    // ========================================
    // COBERTURA
    // ========================================
    coverageZones: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Zonas de cobertura/delivery'
    },
    hasMultipleLocations: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Tiene mÃºltiples sedes'
    },
    locationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Cantidad de sedes'
    },

    // ========================================
    // VERIFICACIÃ“N Y ESTADO
    // ========================================
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected', 'suspended'),
      defaultValue: 'pending',
      comment: 'Estado de verificaciÃ³n'
    },
    verificationDocuments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de documentos de verificaciÃ³n'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas del proceso de verificaciÃ³n'
    },

    // ========================================
    // PERFIL PÃšBLICO
    // ========================================
    profilePhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Logo o foto de la empresa'
    },
    websiteUrl: {
      type: DataTypes.STRING(300),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    socialMediaLinks: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Redes sociales {facebook, instagram, twitter}'
    },

    // ========================================
    // HORARIOS
    // ========================================
    workingHours: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Horarios de atenciÃ³n {monday: {start, end}}'
    },
    is24Hours: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Servicio 24 horas'
    },

    // ========================================
    // ESTADÃSTICAS
    // ========================================
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      },
      comment: 'CalificaciÃ³n promedio'
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de Ã³rdenes procesadas'
    },

    // ========================================
    // MARKETPLACE
    // ========================================
    isMarketplaceEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Habilitado para MARKETMED'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 7.00,
      comment: 'Tasa de comisiÃ³n (%)'
    },
    acceptsFinancing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Acepta CITAMED PAGA'
    },

    // ========================================
    // METADATOS
    // ========================================
    profileCompleteness: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Porcentaje de completitud (0-100)'
    },
    lastActiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

  }, {
    tableName: 'provider_profiles',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['user_id'], unique: true },
      { fields: ['rif'], unique: true },
      { fields: ['provider_type'] },
      { fields: ['city', 'state'] },
      { fields: ['verification_status'] },
      { fields: ['is_marketplace_enabled'] },
    ]
  });

  // ========================================
  // MÃ‰TODOS DE INSTANCIA
  // ========================================

  ProviderProfile.prototype.getDisplayName = function() {
    return this.companyName;
  };

  ProviderProfile.prototype.getProviderTypeLabel = function() {
    const labels = {
      'pharmacy': 'Farmacia',
      'laboratory': 'Laboratorio ClÃ­nico',
      'supplies': 'Insumos MÃ©dicos',
      'services': 'Servicios de Salud',
      'clinic': 'ClÃ­nica',
      'hospital': 'Hospital',
      'diagnostic_center': 'Centro de DiagnÃ³stico',
      'other': 'Otro'
    };
    return labels[this.providerType] || 'Proveedor';
  };

  ProviderProfile.prototype.calculateProfileCompleteness = function() {
    const requiredFields = [
      'companyName', 'rif', 'legalName', 'providerType',
      'mainAddress', 'city', 'state', 'commercialPhone'
    ];

    const optionalFields = [
      'description', 'mainProducts', 'profilePhoto', 'websiteUrl',
      'workingHours', 'coverageZones', 'legalRepresentative'
    ];

    let completeness = 0;

    // Campos requeridos valen mÃ¡s
    requiredFields.forEach(field => {
      if (this[field]) completeness += 2;
    });

    // Campos opcionales
    optionalFields.forEach(field => {
      if (this[field] && (typeof this[field] === 'object' ? Object.keys(this[field]).length > 0 : true)) {
        completeness += 1;
      }
    });

    const maxScore = requiredFields.length * 2 + optionalFields.length;
    const percentage = Math.min(100, Math.round((completeness / maxScore) * 100));
    return percentage;
  };

  ProviderProfile.prototype.isApproved = function() {
    return this.verificationStatus === 'approved';
  };

  ProviderProfile.prototype.isPending = function() {
    return this.verificationStatus === 'pending' || this.verificationStatus === 'in_review';
  };

  // ========================================
  // HOOKS
  // ========================================

  ProviderProfile.beforeSave(async (instance) => {
    // Calcular completitud del perfil
    instance.profileCompleteness = instance.calculateProfileCompleteness();

    // Actualizar Ãºltima actividad
    instance.lastActiveDate = new Date();
  });

  // ========================================
  // MÃ‰TODOS ESTÃTICOS
  // ========================================

  ProviderProfile.findByType = async function(providerType, city = null) {
    const where = {
      verificationStatus: 'approved',
      providerType
    };

    if (city) {
      where.city = city;
    }

    return await this.findAll({
      where,
      order: [['averageRating', 'DESC']],
      limit: 20
    });
  };

  ProviderProfile.findMarketplaceProviders = async function() {
    return await this.findAll({
      where: {
        verificationStatus: 'approved',
        isMarketplaceEnabled: true
      },
      order: [['averageRating', 'DESC']]
    });
  };

  return ProviderProfile;
};
