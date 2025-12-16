'use strict';

/**
 * Migration: Create Provider Profiles Table
 * CITAMED.VE - M01.3 Registro Multi-Paso
 *
 * Tabla para perfiles de proveedores:
 * - Farmacias
 * - Laboratorios clínicos
 * - Proveedores de insumos médicos
 * - Servicios de salud
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('provider_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id'
      },

      // ========================================
      // INFORMACIÓN DE LA EMPRESA
      // ========================================
      companyName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'company_name',
        comment: 'Nombre comercial de la empresa'
      },
      rif: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Registro de Información Fiscal (RIF)'
      },
      legalName: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'legal_name',
        comment: 'Razón social'
      },
      commercialPhone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        field: 'commercial_phone',
        comment: 'Teléfono comercial'
      },
      contactEmail: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'contact_email',
        comment: 'Email de contacto comercial'
      },
      legalRepresentative: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'legal_representative',
        comment: 'Nombre del representante legal'
      },

      // ========================================
      // TIPO Y SERVICIOS
      // ========================================
      providerType: {
        type: Sequelize.ENUM('pharmacy', 'laboratory', 'supplies', 'services', 'clinic', 'hospital', 'diagnostic_center', 'other'),
        allowNull: false,
        field: 'provider_type',
        comment: 'Tipo de proveedor'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descripción de servicios ofrecidos'
      },
      mainProducts: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'main_products',
        comment: 'Productos principales'
      },

      // ========================================
      // UBICACIÓN
      // ========================================
      mainAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'main_address',
        comment: 'Dirección principal'
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Ciudad'
      },
      state: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Estado'
      },
      zipCode: {
        type: Sequelize.STRING(20),
        allowNull: true,
        field: 'zip_code',
        comment: 'Código postal'
      },
      coordinates: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Coordenadas GPS {lat, lng}'
      },

      // ========================================
      // COBERTURA
      // ========================================
      coverageZones: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'coverage_zones',
        comment: 'Zonas de cobertura/delivery'
      },
      hasMultipleLocations: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'has_multiple_locations',
        comment: 'Tiene múltiples sedes'
      },
      locationCount: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        field: 'location_count',
        comment: 'Cantidad de sedes'
      },

      // ========================================
      // VERIFICACIÓN Y ESTADO
      // ========================================
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'in_review', 'approved', 'rejected', 'suspended'),
        defaultValue: 'pending',
        field: 'verification_status',
        comment: 'Estado de verificación'
      },
      verificationDocuments: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        field: 'verification_documents',
        comment: 'URLs de documentos de verificación'
      },
      verificationDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'verification_date'
      },
      verificationNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'verification_notes',
        comment: 'Notas del proceso de verificación'
      },

      // ========================================
      // PERFIL PÚBLICO
      // ========================================
      profilePhoto: {
        type: Sequelize.STRING(500),
        allowNull: true,
        field: 'profile_photo',
        comment: 'Logo o foto de la empresa'
      },
      websiteUrl: {
        type: Sequelize.STRING(300),
        allowNull: true,
        field: 'website_url'
      },
      socialMediaLinks: {
        type: Sequelize.JSONB,
        defaultValue: {},
        field: 'social_media_links',
        comment: 'Redes sociales {facebook, instagram, twitter}'
      },

      // ========================================
      // HORARIOS
      // ========================================
      workingHours: {
        type: Sequelize.JSONB,
        defaultValue: {},
        field: 'working_hours',
        comment: 'Horarios de atención {monday: {start, end}}'
      },
      is24Hours: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_24_hours',
        comment: 'Servicio 24 horas'
      },

      // ========================================
      // ESTADÍSTICAS
      // ========================================
      averageRating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00,
        field: 'average_rating',
        comment: 'Calificación promedio'
      },
      totalReviews: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'total_reviews'
      },
      totalOrders: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'total_orders',
        comment: 'Total de órdenes procesadas'
      },

      // ========================================
      // MARKETPLACE
      // ========================================
      isMarketplaceEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'is_marketplace_enabled',
        comment: 'Habilitado para MARKETMED'
      },
      commissionRate: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 7.00,
        field: 'commission_rate',
        comment: 'Tasa de comisión (%)'
      },
      acceptsFinancing: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        field: 'accepts_financing',
        comment: 'Acepta CITAMED PAGA'
      },

      // ========================================
      // METADATOS
      // ========================================
      profileCompleteness: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'profile_completeness',
        comment: 'Porcentaje de completitud (0-100)'
      },
      lastActiveDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_active_date'
      },

      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    });

    // Crear índices
    await queryInterface.addIndex('provider_profiles', ['user_id'], {
      unique: true,
      name: 'provider_profiles_user_id_unique'
    });
    await queryInterface.addIndex('provider_profiles', ['rif'], {
      unique: true,
      name: 'provider_profiles_rif_unique'
    });
    await queryInterface.addIndex('provider_profiles', ['provider_type'], {
      name: 'provider_profiles_provider_type_idx'
    });
    await queryInterface.addIndex('provider_profiles', ['city', 'state'], {
      name: 'provider_profiles_location_idx'
    });
    await queryInterface.addIndex('provider_profiles', ['verification_status'], {
      name: 'provider_profiles_verification_status_idx'
    });
    await queryInterface.addIndex('provider_profiles', ['is_marketplace_enabled'], {
      name: 'provider_profiles_marketplace_idx'
    });

    console.log('✅ provider_profiles table created successfully');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('provider_profiles');
    console.log('✅ provider_profiles table dropped');
  }
};
