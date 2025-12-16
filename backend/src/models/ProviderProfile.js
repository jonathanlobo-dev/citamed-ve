// models/ProviderProfile.js
// CITAMED.VE - M01.3 Registro Multi-Paso
// Perfil de proveedores (farmacias, laboratorios, insumos médicos, servicios)

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
    // INFORMACIÓN DE LA EMPRESA
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
      comment: 'Registro de Información Fiscal (RIF)'
    },
    legalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Razón social'
    },
    commercialPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Teléfono comercial'
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
      comment: 'Descripción de servicios ofrecidos'
    },
    mainProducts: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Productos principales'
    },

    // ========================================
    // UBICACIÓN
    // ========================================
    mainAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Dirección principal'
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
      comment: 'Tiene múltiples sedes'
    },
    locationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: 'Cantidad de sedes'
    },

    // ========================================
    // VERIFICACIÓN Y ESTADO
    // ========================================
    verificationStatus: {
      type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected', 'suspended'),
      defaultValue: 'pending',
      comment: 'Estado de verificación'
    },
    verificationDocuments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de documentos de verificación'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas del proceso de verificación'
    },

    // ========================================
    // PERFIL PÚBLICO
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
      comment: 'Horarios de atención {monday: {start, end}}'
    },
    is24Hours: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Servicio 24 horas'
    },

    // ========================================
    // ESTADÍSTICAS
    // ========================================
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      },
      comment: 'Calificación promedio'
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de órdenes procesadas'
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
      comment: 'Tasa de comisión (%)'
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
      { fields: ['userId'], unique: true },
      { fields: ['rif'], unique: true },
      { fields: ['providerType'] },
      { fields: ['city', 'state'] },
      { fields: ['verificationStatus'] },
      { fields: ['isMarketplaceEnabled'] },
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  ProviderProfile.prototype.getDisplayName = function() {
    return this.companyName;
  };

  ProviderProfile.prototype.getProviderTypeLabel = function() {
    const labels = {
      'pharmacy': 'Farmacia',
      'laboratory': 'Laboratorio Clínico',
      'supplies': 'Insumos Médicos',
      'services': 'Servicios de Salud',
      'clinic': 'Clínica',
      'hospital': 'Hospital',
      'diagnostic_center': 'Centro de Diagnóstico',
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

    // Campos requeridos valen más
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

    // Actualizar última actividad
    instance.lastActiveDate = new Date();
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
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
