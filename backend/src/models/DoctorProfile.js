// models/DoctorProfile.js
// MÓDULO 2 - CITAMED.VE
// Perfil médico expandido con campos profesionales completos

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorProfile = sequelize.define('DoctorProfile', {
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
    // INFORMACIÓN PROFESIONAL BÁSICA
    // ========================================
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    profilePhoto: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL de la foto de perfil'
    },
    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'specialties',
        key: 'id'
      }
    },
    subSpecialty: {
      type: DataTypes.STRING(150),
      allowNull: true,
      comment: 'Sub-especialidad o área de enfoque específica'
    },

    // ========================================
    // CREDENCIALES Y CERTIFICACIONES
    // ========================================
    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Número de matrícula profesional'
    },
    mppsNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
      field: 'mpps_number',
      comment: 'Número MPPS - Ministerio del Poder Popular para la Salud (Venezuela)'
    },
    medicalSchool: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Universidad de egreso'
    },
    graduationYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1950,
        max: new Date().getFullYear()
      }
    },
    certifications: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Array de certificaciones y diplomas adicionales'
    },
    membershipOrganizations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Sociedades médicas y colegios profesionales'
    },

    // ========================================
    // EXPERIENCIA PROFESIONAL
    // ========================================
    experienceYears: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Años de experiencia profesional'
    },
    hospitalAffiliations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Hospitales y clínicas donde trabaja'
    },
    previousPositions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Historial de posiciones previas [{hospital, position, years}]'
    },

    // ========================================
    // INFORMACIÓN DE CONSULTA
    // ========================================
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Tarifa de consulta en USD'
    },
    followUpFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Tarifa de consulta de seguimiento'
    },
    acceptsInsurance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Acepta seguros médicos'
    },
    insuranceProviders: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Seguros aceptados'
    },
    consultationDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: 'Duración de consulta en minutos'
    },
    priceTeleconsultation: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'price_teleconsultation',
      comment: 'Precio de teleconsulta en USD'
    },
    priceHomeVisit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'price_home_visit',
      comment: 'Precio de visita a domicilio en USD'
    },
    acceptedInsurances: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'accepted_insurances',
      comment: 'Lista de seguros médicos aceptados (texto libre)'
    },

    // ========================================
    // HORARIOS SIMPLIFICADOS
    // ========================================
    availableDays: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'available_days',
      comment: 'Días disponibles [monday, tuesday, wednesday, ...]'
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'start_time',
      comment: 'Hora de inicio de atención'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'end_time',
      comment: 'Hora de fin de atención'
    },

    // ========================================
    // UBICACIÓN Y CONTACTO
    // ========================================
    clinicName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nombre del consultorio/clínica principal'
    },
    clinicAddress: {
      type: DataTypes.STRING(300),
      allowNull: true,
      comment: 'Dirección completa del consultorio'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Venezuela',
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
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    alternatePhoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    whatsappNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Número de WhatsApp para contacto directo'
    },

    // ========================================
    // DISPONIBILIDAD Y HORARIOS
    // ========================================
    workingHours: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Horarios de trabajo por día {monday: {start, end, available}}'
    },
    availableForEmergencies: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Disponible para emergencias'
    },
    telemedicineEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Ofrece consultas de telemedicina'
    },
    homeVisitsEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Ofrece visitas a domicilio'
    },

    // ========================================
    // PERFIL PÚBLICO
    // ========================================
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Biografía profesional para perfil público'
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['Español'],
      comment: 'Idiomas que habla'
    },
    treatmentApproaches: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Enfoques de tratamiento o filosofías médicas'
    },
    specialConditions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Condiciones o enfermedades que trata especialmente'
    },

    // ========================================
    // SISTEMA DE CALIFICACIÓN Y REPUTACIÓN
    // M02 Sub-Partida 3.4
    // ========================================
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      field: 'average_rating',
      validate: {
        min: 0,
        max: 5
      },
      comment: 'Calificación promedio (0-5 estrellas)'
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_reviews',
      comment: 'Total de reseñas recibidas'
    },
    totalAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_appointments',
      comment: 'Total de citas realizadas'
    },
    totalPatients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de pacientes atendidos'
    },
    reputationLevel: {
      type: DataTypes.ENUM('new', 'bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'new',
      field: 'reputation_level',
      comment: 'Nivel de reputación del médico'
    },
    levelUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'level_updated_at',
      comment: 'Fecha del último cambio de nivel'
    },
    ratingBreakdown: {
      type: DataTypes.JSONB,
      defaultValue: {
        overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        punctuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        treatment: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        clarity: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        facilities: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      field: 'rating_breakdown',
      comment: 'Desglose de calificaciones por dimensión'
    },

    // ========================================
    // VERIFICACIÓN Y ESTADO - KYC M02.3.3
    // ========================================
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Cuenta verificada por CITAMED'
    },
    verificationStatus: {
      type: DataTypes.ENUM('unverified', 'pending', 'approved', 'rejected', 'documents_incomplete'),
      defaultValue: 'unverified',
      field: 'verification_status',
      comment: 'Estado de verificación KYC'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verification_requested_at',
      comment: 'Fecha de solicitud de verificación'
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
      comment: 'Fecha de aprobación de verificación'
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin que aprobó la verificación'
    },
    verificationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'verification_notes',
      comment: 'Notas de la verificación (uso interno)'
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'rejection_reason',
      comment: 'Razón de rechazo de verificación'
    },
    verificationDocuments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de documentos de verificación subidos (legacy)'
    },
    profileStatus: {
      type: DataTypes.ENUM('incomplete', 'pending_review', 'active', 'suspended', 'inactive'),
      defaultValue: 'incomplete',
      comment: 'Estado del perfil médico'
    },
    acceptingNewPatients: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Aceptando nuevos pacientes'
    },

    // ========================================
    // INFORMACIÓN ADICIONAL
    // ========================================
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
      comment: 'Redes sociales {facebook, instagram, linkedin, twitter}'
    },
    publicationsPapers: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Publicaciones científicas y papers'
    },
    awardsRecognitions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Premios y reconocimientos profesionales'
    },

    // ========================================
    // METADATOS
    // ========================================
    lastActiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última vez que el doctor estuvo activo en la plataforma'
    },
    profileCompleteness: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Porcentaje de completitud del perfil (0-100%)'
    },
    searchKeywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Keywords para búsqueda optimizada'
    },

  }, {
    tableName: 'doctor_profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['specialtyId'] },
      { fields: ['licenseNumber'] },
      { fields: ['city', 'state'] },
      { fields: ['averageRating'] },
      { fields: ['profileStatus'] },
      { fields: ['acceptingNewPatients'] },
      { fields: ['isVerified'] },
      { fields: ['verificationStatus'] },
      { fields: ['verifiedAt'] },
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Verifica si el doctor puede solicitar verificación KYC
   */
  DoctorProfile.prototype.canRequestVerification = function() {
    return ['unverified', 'rejected', 'documents_incomplete'].includes(this.verificationStatus);
  };

  /**
   * Verifica si el doctor está en proceso de verificación
   */
  DoctorProfile.prototype.isVerificationPending = function() {
    return this.verificationStatus === 'pending';
  };

  /**
   * Verifica si el doctor está verificado KYC
   */
  DoctorProfile.prototype.isKYCVerified = function() {
    return this.verificationStatus === 'approved' && this.isVerified === true;
  };

  /**
   * Obtiene el estado de verificación legible
   */
  DoctorProfile.prototype.getVerificationStatusName = function() {
    const names = {
      unverified: 'Sin Verificar',
      pending: 'En Revisión',
      approved: 'Verificado',
      rejected: 'Rechazado',
      documents_incomplete: 'Documentos Incompletos'
    };
    return names[this.verificationStatus] || this.verificationStatus;
  };
  
  DoctorProfile.prototype.getFullName = function() {
    return `Dr. ${this.firstName} ${this.lastName}`;
  };

  DoctorProfile.prototype.calculateProfileCompleteness = function() {
    const requiredFields = [
      'firstName', 'lastName', 'specialtyId', 'licenseNumber',
      'experienceYears', 'consultationFee', 'city', 'phoneNumber', 'bio'
    ];
    
    const optionalFields = [
      'profilePhoto', 'medicalSchool', 'certifications', 'workingHours',
      'telemedicineEnabled', 'languages'
    ];

    let completeness = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Campos requeridos valen más
    requiredFields.forEach(field => {
      if (this[field]) completeness += 2;
    });

    // Campos opcionales
    optionalFields.forEach(field => {
      if (this[field] && this[field].length > 0) completeness += 1;
    });

    const percentage = Math.min(100, Math.round((completeness / (requiredFields.length * 2 + optionalFields.length)) * 100));
    return percentage;
  };

  DoctorProfile.prototype.updateSearchKeywords = function() {
    const keywords = [];
    
    if (this.firstName) keywords.push(this.firstName.toLowerCase());
    if (this.lastName) keywords.push(this.lastName.toLowerCase());
    if (this.city) keywords.push(this.city.toLowerCase());
    if (this.subSpecialty) keywords.push(this.subSpecialty.toLowerCase());
    if (this.specialConditions) keywords.push(...this.specialConditions.map(c => c.toLowerCase()));
    
    this.searchKeywords = [...new Set(keywords)]; // Eliminar duplicados
    return this.searchKeywords;
  };

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  DoctorProfile.findAvailableDoctors = async function(specialtyId, city) {
    return await this.findAll({
      where: {
        profileStatus: 'active',
        acceptingNewPatients: true,
        isVerified: true,
        ...(specialtyId && { specialtyId }),
        ...(city && { city })
      },
      order: [['averageRating', 'DESC']],
      limit: 20
    });
  };

  // ========================================
  // MÉTODOS DE REPUTACIÓN - M02 Sub-Partida 3.4
  // ========================================

  /**
   * Configuración de niveles de reputación
   */
  const REPUTATION_LEVELS = {
    new: {
      name: 'Nuevo',
      minAppointments: 0,
      maxAppointments: 50,
      minRating: 0,
      stars: 1,
      icon: '⭐',
      color: '#9CA3AF',
      benefits: []
    },
    bronze: {
      name: 'Bronce',
      minAppointments: 51,
      maxAppointments: 200,
      minRating: 4.0,
      stars: 2,
      icon: '⭐⭐',
      color: '#CD7F32',
      benefits: ['Aparece en resultados de búsqueda']
    },
    silver: {
      name: 'Plata',
      minAppointments: 201,
      maxAppointments: 500,
      minRating: 4.3,
      stars: 3,
      icon: '⭐⭐⭐',
      color: '#C0C0C0',
      benefits: ['Destacado en búsquedas', 'Badge de confianza']
    },
    gold: {
      name: 'Oro',
      minAppointments: 501,
      maxAppointments: 1000,
      minRating: 4.5,
      stars: 4,
      icon: '⭐⭐⭐⭐',
      color: '#FFD700',
      benefits: ['Prioridad en búsquedas', 'Comisión reducida 8%', 'Badge de excelencia']
    },
    platinum: {
      name: 'TOP CITAMED',
      minAppointments: 1001,
      maxAppointments: Infinity,
      minRating: 4.7,
      stars: 5,
      icon: '⭐⭐⭐⭐⭐',
      color: '#8B5CF6',
      benefits: ['Destacado en búsquedas', 'Comisión preferencial 5%', 'Acceso a premios exclusivos', 'Badge TOP CITAMED']
    }
  };

  /**
   * Obtiene el badge de reputación del doctor
   */
  DoctorProfile.prototype.getReputationBadge = function() {
    const level = REPUTATION_LEVELS[this.reputationLevel] || REPUTATION_LEVELS.new;
    return {
      level: this.reputationLevel,
      name: level.name,
      stars: level.stars,
      icon: level.icon,
      color: level.color,
      benefits: level.benefits,
      rating: parseFloat(this.averageRating) || 0,
      totalReviews: this.totalReviews || 0,
      totalAppointments: this.totalAppointments || 0
    };
  };

  /**
   * Verifica si el doctor puede subir de nivel
   */
  DoctorProfile.prototype.canLevelUp = function() {
    const levels = ['new', 'bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = levels.indexOf(this.reputationLevel);

    if (currentIndex >= levels.length - 1) return false; // Ya es platinum

    const nextLevel = levels[currentIndex + 1];
    const requirements = REPUTATION_LEVELS[nextLevel];

    return this.totalAppointments >= requirements.minAppointments &&
           parseFloat(this.averageRating) >= requirements.minRating;
  };

  /**
   * Calcula el progreso hacia el siguiente nivel
   */
  DoctorProfile.prototype.calculateNextLevel = function() {
    const levels = ['new', 'bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = levels.indexOf(this.reputationLevel);
    const currentLevel = REPUTATION_LEVELS[this.reputationLevel];

    // Ya es platinum
    if (currentIndex >= levels.length - 1) {
      return {
        currentLevel: this.reputationLevel,
        currentLevelName: currentLevel.name,
        nextLevel: null,
        isMaxLevel: true,
        progress: {
          appointments: { current: this.totalAppointments, required: null, progress: 100 },
          rating: { current: parseFloat(this.averageRating), required: null, meetsRequirement: true }
        },
        missing: []
      };
    }

    const nextLevel = levels[currentIndex + 1];
    const requirements = REPUTATION_LEVELS[nextLevel];
    const currentAppointments = this.totalAppointments || 0;
    const currentRating = parseFloat(this.averageRating) || 0;

    const appointmentProgress = Math.min(100, Math.round((currentAppointments / requirements.minAppointments) * 100));
    const meetsRating = currentRating >= requirements.minRating;

    const missing = [];
    if (currentAppointments < requirements.minAppointments) {
      missing.push(`Necesitas ${requirements.minAppointments - currentAppointments} citas más`);
    }
    if (!meetsRating) {
      missing.push(`Necesitas rating >= ${requirements.minRating} (actual: ${currentRating.toFixed(2)})`);
    }

    return {
      currentLevel: this.reputationLevel,
      currentLevelName: currentLevel.name,
      nextLevel: nextLevel,
      nextLevelName: requirements.name,
      isMaxLevel: false,
      progress: {
        appointments: {
          current: currentAppointments,
          required: requirements.minAppointments,
          progress: appointmentProgress
        },
        rating: {
          current: currentRating,
          required: requirements.minRating,
          meetsRequirement: meetsRating
        }
      },
      missing,
      canLevelUp: missing.length === 0
    };
  };

  /**
   * Determina el nivel basado en citas y rating
   */
  DoctorProfile.calculateLevel = function(totalAppointments, averageRating) {
    const rating = parseFloat(averageRating) || 0;
    const appointments = totalAppointments || 0;

    if (appointments >= 1001 && rating >= 4.7) return 'platinum';
    if (appointments >= 501 && rating >= 4.5) return 'gold';
    if (appointments >= 201 && rating >= 4.3) return 'silver';
    if (appointments >= 51 && rating >= 4.0) return 'bronze';
    return 'new';
  };

  /**
   * Obtiene requisitos para un nivel específico
   */
  DoctorProfile.getLevelRequirements = function(level) {
    return REPUTATION_LEVELS[level] || null;
  };

  /**
   * Obtiene todos los niveles con sus requisitos
   */
  DoctorProfile.getAllLevelRequirements = function() {
    return REPUTATION_LEVELS;
  };

  /**
   * Obtiene los mejores doctores por rating
   */
  DoctorProfile.getTopRatedDoctors = async function(limit = 10, filters = {}) {
    const { Op } = require('sequelize');
    const where = {
      profileStatus: 'active',
      isVerified: true,
      totalReviews: { [Op.gte]: 5 } // Mínimo 5 reviews para aparecer
    };

    if (filters.specialtyId) where.specialtyId = filters.specialtyId;
    if (filters.city) where.city = filters.city;
    if (filters.reputationLevel) where.reputationLevel = filters.reputationLevel;

    return await this.findAll({
      where,
      order: [
        ['averageRating', 'DESC'],
        ['totalReviews', 'DESC']
      ],
      limit
    });
  };

  /**
   * Obtiene doctores por nivel de reputación
   */
  DoctorProfile.getByReputationLevel = async function(level, filters = {}, pagination = {}) {
    const { page = 1, limit = 20 } = pagination;
    const where = {
      reputationLevel: level,
      profileStatus: 'active',
      isVerified: true
    };

    if (filters.specialtyId) where.specialtyId = filters.specialtyId;
    if (filters.city) where.city = filters.city;

    const { count, rows } = await this.findAndCountAll({
      where,
      order: [['averageRating', 'DESC']],
      limit,
      offset: (page - 1) * limit
    });

    return {
      doctors: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  };

  return DoctorProfile;
};