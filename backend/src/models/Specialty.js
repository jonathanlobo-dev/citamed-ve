// models/Specialty.js
// MÓDULO 2 - CITAMED.VE
// Modelo de especialidades médicas

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Specialty = sequelize.define('Specialty', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    // ========================================
    // INFORMACIÓN BÁSICA
    // ========================================
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      comment: 'Nombre de la especialidad médica'
    },
    nameEnglish: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: 'Nombre en inglés'
    },
    slug: {
      type: DataTypes.STRING(150),
      allowNull: true,  // ✅ CAMBIADO: nullable para permitir migración
      unique: false,    // ✅ CAMBIADO: no unique por ahora (muchos serán null)
      comment: 'Slug para URLs amigables (ej: cardiologia, pediatria)'
    },
    category: {
      type: DataTypes.ENUM(
        'medicina_general',
        'medicina_interna',
        'cirugia',
        'pediatria',
        'ginecologia',
        'especialidad_clinica',
        'especialidad_quirurgica',
        'diagnostico',
        'otro'
      ),
      defaultValue: 'especialidad_clinica',
      comment: 'Categoría general de la especialidad'
    },

    // ========================================
    // DESCRIPCIÓN
    // ========================================
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada de la especialidad'
    },
    shortDescription: {
      type: DataTypes.STRING(300),
      allowNull: true,
      comment: 'Descripción breve para listados'
    },

    // ========================================
    // SUB-ESPECIALIDADES
    // ========================================
    subSpecialties: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Sub-especialidades relacionadas'
    },

    // ========================================
    // CONDICIONES TRATADAS
    // ========================================
    commonConditions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Condiciones comunes que trata esta especialidad'
    },
    commonProcedures: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Procedimientos comunes realizados'
    },

    // ========================================
    // ICONOGRAFÍA Y PRESENTACIÓN
    // ========================================
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nombre del icono (para UI)'
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Color hexadecimal para la especialidad (#FF5733)'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL de imagen representativa'
    },

    // ========================================
    // ESTADÍSTICAS
    // ========================================
    totalDoctors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de doctores registrados en esta especialidad'
    },
    totalAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de citas realizadas en esta especialidad'
    },
    averageConsultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Tarifa promedio de consulta en esta especialidad'
    },

    // ========================================
    // CONFIGURACIÓN
    // ========================================
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Especialidad activa en la plataforma'
    },
    requiresVerification: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Requiere verificación especial de certificación'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Orden de visualización (menor = primero)'
    },

    // ========================================
    // KEYWORDS PARA BÚSQUEDA
    // ========================================
    searchKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Keywords para mejorar búsqueda'
    },
    relatedSpecialties: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'IDs de especialidades relacionadas'
    },

    // ========================================
    // INFORMACIÓN ADICIONAL
    // ========================================
    yearsOfTrainingRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Años de formación requeridos típicamente'
    },
    certificationInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Información sobre certificaciones requeridas'
    },

  }, {
    tableName: 'specialties',
    timestamps: true,
    indexes: [
      // ✅ SIMPLIFICADO: solo índices simples sin slug por ahora
      { fields: ['category'] },
      { fields: ['isActive'] },
      { fields: ['displayOrder'] },
      { fields: ['name'] },
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  Specialty.prototype.generateSlug = function() {
    if (this.name) {
      this.slug = this.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    return this.slug;
  };

  Specialty.prototype.updateStatistics = async function() {
    const DoctorProfile = sequelize.models.DoctorProfile;
    const Appointment = sequelize.models.Appointment;

    // Contar doctores
    this.totalDoctors = await DoctorProfile.count({
      where: { specialtyId: this.id, profileStatus: 'active' }
    });

    // Contar citas (si existe el modelo)
    if (Appointment) {
      this.totalAppointments = await Appointment.count({
        include: [{
          model: DoctorProfile,
          where: { specialtyId: this.id }
        }]
      });
    }

    // Calcular tarifa promedio
    const doctors = await DoctorProfile.findAll({
      where: {
        specialtyId: this.id,
        profileStatus: 'active'
      },
      attributes: ['consultationFee']
    });

    if (doctors.length > 0) {
      const sum = doctors.reduce((acc, doc) => acc + parseFloat(doc.consultationFee || 0), 0);
      this.averageConsultationFee = (sum / doctors.length).toFixed(2);
    }

    await this.save();
    return this;
  };

  // ========================================
  // HOOKS
  // ========================================

  Specialty.beforeCreate(async (instance) => {
    if (!instance.slug && instance.name) {
      instance.generateSlug();
    }
  });

  Specialty.beforeUpdate(async (instance) => {
    if (instance.changed('name') && !instance.slug) {
      instance.generateSlug();
    }
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  Specialty.getActiveSpecialties = async function() {
    return await this.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    });
  };

  Specialty.getPopularSpecialties = async function(limit = 10) {
    return await this.findAll({
      where: { isActive: true },
      order: [['totalAppointments', 'DESC']],
      limit
    });
  };

  Specialty.searchByName = async function(searchTerm) {
    const { Op } = require('sequelize');
    return await this.findAll({
      where: {
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { nameEnglish: { [Op.iLike]: `%${searchTerm}%` } },
          { searchKeywords: { [Op.contains]: [searchTerm.toLowerCase()] } }
        ]
      },
      order: [['name', 'ASC']]
    });
  };

  return Specialty;
};