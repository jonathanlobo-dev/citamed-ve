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
    // SISTEMA DE CALIFICACIÓN
    // ========================================
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      },
      comment: 'Calificación promedio (0-5 estrellas)'
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de reseñas recibidas'
    },
    totalAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de citas realizadas'
    },
    totalPatients: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de pacientes atendidos'
    },

    // ========================================
    // VERIFICACIÓN Y ESTADO
    // ========================================
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Cuenta verificada por CITAMED'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verificationDocuments: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de documentos de verificación subidos'
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
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================
  
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

  return DoctorProfile;
};