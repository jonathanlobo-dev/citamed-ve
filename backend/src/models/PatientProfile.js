// models/PatientProfile.js
// MÓDULO 2 - CITAMED.VE
// Perfil de paciente expandido con historial médico

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PatientProfile = sequelize.define('PatientProfile', {
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
    // INFORMACIÓN PERSONAL
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
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de nacimiento'
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true,
    },
    identificationType: {
      type: DataTypes.ENUM('CI', 'passport', 'other'),
      allowNull: true,
      comment: 'Tipo de documento de identidad'
    },
    identificationNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Número de documento de identidad'
    },

    // ========================================
    // CONTACTO Y UBICACIÓN
    // ========================================
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
    },
    address: {
      type: DataTypes.STRING(300),
      allowNull: true,
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

    // ========================================
    // CONTACTO DE EMERGENCIA
    // ========================================
    emergencyContactName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nombre del contacto de emergencia'
    },
    emergencyContactRelationship: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Relación con el contacto de emergencia'
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Teléfono del contacto de emergencia'
    },

    // ========================================
    // INFORMACIÓN DE SALUD BÁSICA
    // ========================================
    bloodType: {
      type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'),
      defaultValue: 'unknown',
      comment: 'Tipo de sangre'
    },
    height: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Altura en centímetros'
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Peso en kilogramos'
    },
    bmi: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      comment: 'Índice de masa corporal (calculado automáticamente)'
    },

    // ========================================
    // HISTORIAL MÉDICO
    // ========================================
    chronicConditions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Condiciones crónicas (diabetes, hipertensión, etc.)'
    },
    allergies: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Alergias a medicamentos, alimentos, etc.'
    },
    currentMedications: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Medicamentos actuales [{name, dosage, frequency, startDate}]'
    },
    previousSurgeries: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Cirugías previas [{surgery, date, hospital, notes}]'
    },
    familyMedicalHistory: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Historial médico familiar {mother: [], father: [], siblings: []}'
    },
    immunizations: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Vacunas aplicadas [{vaccine, date, booster}]'
    },

    // ========================================
    // ESTILO DE VIDA
    // ========================================
    smokingStatus: {
      type: DataTypes.ENUM('never', 'former', 'current', 'unknown'),
      defaultValue: 'unknown',
      comment: 'Estado de fumador'
    },
    alcoholConsumption: {
      type: DataTypes.ENUM('never', 'occasional', 'moderate', 'heavy', 'unknown'),
      defaultValue: 'unknown',
      comment: 'Consumo de alcohol'
    },
    exerciseFrequency: {
      type: DataTypes.ENUM('sedentary', 'light', 'moderate', 'active', 'very_active', 'unknown'),
      defaultValue: 'unknown',
      comment: 'Frecuencia de ejercicio'
    },
    dietType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Tipo de dieta (vegetariana, vegana, etc.)'
    },

    // ========================================
    // SEGURO MÉDICO
    // ========================================
    hasInsurance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Tiene seguro médico'
    },
    insuranceProvider: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Proveedor de seguro'
    },
    insurancePolicyNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Número de póliza'
    },
    insuranceExpiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha de vencimiento del seguro'
    },

    // ========================================
    // PREFERENCIAS MÉDICAS
    // ========================================
    preferredLanguage: {
      type: DataTypes.STRING(50),
      defaultValue: 'Español',
      comment: 'Idioma preferido para atención'
    },
    preferredCommunicationMethod: {
      type: DataTypes.ENUM('phone', 'email', 'whatsapp', 'sms'),
      defaultValue: 'whatsapp',
      comment: 'Método de comunicación preferido'
    },
    preferredDoctorGender: {
      type: DataTypes.ENUM('male', 'female', 'no_preference'),
      defaultValue: 'no_preference',
      comment: 'Preferencia de género del médico'
    },
    willingToTravel: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Dispuesto a viajar para consultas'
    },
    maxTravelDistance: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Distancia máxima dispuesto a viajar (en km)'
    },

    // ========================================
    // HISTORIAL DE CITAS
    // ========================================
    totalAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total de citas realizadas'
    },
    completedAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Citas completadas'
    },
    canceledAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Citas canceladas'
    },
    noShowAppointments: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Citas no asistidas sin aviso'
    },
    lastAppointmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de la última cita'
    },

    // ========================================
    // DOCUMENTOS MÉDICOS
    // ========================================
    medicalRecords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de archivos de historias médicas subidas'
    },
    labResults: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de resultados de laboratorio'
    },
    prescriptions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de recetas médicas'
    },
    imagingResults: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'URLs de resultados de imagenología (rayos X, resonancias, etc.)'
    },

    // ========================================
    // NOTAS Y OBSERVACIONES
    // ========================================
    medicalNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas médicas importantes del paciente'
    },
    specialNeeds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Necesidades especiales (discapacidad, asistencia, etc.)'
    },

    // ========================================
    // ESTADO Y VERIFICACIÓN
    // ========================================
    profileStatus: {
      type: DataTypes.ENUM('incomplete', 'active', 'suspended', 'inactive'),
      defaultValue: 'incomplete',
      comment: 'Estado del perfil'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Identidad verificada'
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true,
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

    // ========================================
    // METADATOS
    // ========================================
    lastActiveDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Última actividad en la plataforma'
    },
    consentForDataSharing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Consentimiento para compartir datos médicos con doctores'
    },
    consentForResearch: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Consentimiento para uso de datos en investigación (anónimo)'
    },

  }, {
    tableName: 'patient_profiles',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['city', 'state'] },
      { fields: ['profileStatus'] },
      { fields: ['isVerified'] },
      { fields: ['bloodType'] },
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  PatientProfile.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  PatientProfile.prototype.getAge = function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  PatientProfile.prototype.calculateBMI = function() {
    if (!this.height || !this.weight) return null;
    
    const heightInMeters = this.height / 100;
    const bmi = this.weight / (heightInMeters * heightInMeters);
    this.bmi = parseFloat(bmi.toFixed(2));
    
    return this.bmi;
  };

  PatientProfile.prototype.getBMICategory = function() {
    if (!this.bmi) this.calculateBMI();
    if (!this.bmi) return 'unknown';

    if (this.bmi < 18.5) return 'underweight';
    if (this.bmi < 25) return 'normal';
    if (this.bmi < 30) return 'overweight';
    return 'obese';
  };

  PatientProfile.prototype.calculateProfileCompleteness = function() {
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'phoneNumber',
      'city', 'gender', 'bloodType'
    ];
    
    const optionalFields = [
      'profilePhoto', 'address', 'emergencyContactName', 'emergencyContactPhone',
      'chronicConditions', 'allergies', 'height', 'weight'
    ];

    let completeness = 0;
    const totalFields = requiredFields.length + optionalFields.length;

    // Campos requeridos valen más
    requiredFields.forEach(field => {
      if (this[field] && this[field] !== 'unknown') completeness += 2;
    });

    // Campos opcionales
    optionalFields.forEach(field => {
      if (this[field] && (Array.isArray(this[field]) ? this[field].length > 0 : true)) {
        completeness += 1;
      }
    });

    const percentage = Math.min(100, Math.round((completeness / (requiredFields.length * 2 + optionalFields.length)) * 100));
    return percentage;
  };

  PatientProfile.prototype.hasHighRiskConditions = function() {
    const highRiskConditions = [
      'diabetes', 'heart disease', 'hypertension', 'cancer',
      'kidney disease', 'liver disease', 'respiratory disease'
    ];
    
    return this.chronicConditions.some(condition => 
      highRiskConditions.some(risk => 
        condition.toLowerCase().includes(risk.toLowerCase())
      )
    );
  };

  PatientProfile.prototype.getMedicalSummary = function() {
    return {
      basicInfo: {
        name: this.getFullName(),
        age: this.getAge(),
        gender: this.gender,
        bloodType: this.bloodType,
      },
      healthMetrics: {
        height: this.height,
        weight: this.weight,
        bmi: this.bmi,
        bmiCategory: this.getBMICategory(),
      },
      conditions: {
        chronic: this.chronicConditions,
        allergies: this.allergies,
        hasHighRisk: this.hasHighRiskConditions(),
      },
      medications: this.currentMedications,
      lifestyle: {
        smoking: this.smokingStatus,
        alcohol: this.alcoholConsumption,
        exercise: this.exerciseFrequency,
      }
    };
  };

  // ========================================
  // HOOKS
  // ========================================

  PatientProfile.beforeSave(async (instance) => {
    // Calcular BMI automáticamente si hay altura y peso
    if (instance.height && instance.weight) {
      instance.calculateBMI();
    }

    // Actualizar completeness del perfil
    instance.profileCompleteness = instance.calculateProfileCompleteness();

    // Actualizar última actividad
    instance.lastActiveDate = new Date();
  });

  return PatientProfile;
};