// src/models/index.js
// MÓDULO 2 - CITAMED.VE
// Índice de modelos con asociaciones

const { Sequelize } = require('sequelize');

// ✅ NO cargar dotenv aquí - ya se carga en server.js
console.log('🔍 Verificando configuración de base de datos...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'citamed_development',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',  // ✅ CORREGIDO: DB_PASSWORD (no DB_PASS)
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Cargar modelos de forma manual y explícita
try {
  console.log('📦 Cargando modelos...');

  const UserModel = require('./User');
  db.User = UserModel(sequelize);
  console.log('  ✅ User cargado');

  const SpecialtyModel = require('./Specialty');
  db.Specialty = SpecialtyModel(sequelize);
  console.log('  ✅ Specialty cargado');

  const DoctorProfileModel = require('./DoctorProfile');
  db.DoctorProfile = DoctorProfileModel(sequelize);
  console.log('  ✅ DoctorProfile cargado');

  const PatientProfileModel = require('./PatientProfile');
  db.PatientProfile = PatientProfileModel(sequelize);
  console.log('  ✅ PatientProfile cargado');

  const ProviderProfileModel = require('./ProviderProfile');
  db.ProviderProfile = ProviderProfileModel(sequelize);
  console.log('  ✅ ProviderProfile cargado');

  const AppointmentModel = require('./Appointment');
  db.Appointment = AppointmentModel(sequelize);
  console.log('  ✅ Appointment cargado');

  const VerificationTokenModel = require('./VerificationToken');
  db.VerificationToken = VerificationTokenModel(sequelize);
  console.log('  ✅ VerificationToken cargado');

  const TwoFactorAttemptModel = require('./TwoFactorAttempt');
  db.TwoFactorAttempt = TwoFactorAttemptModel(sequelize);
  console.log('  ✅ TwoFactorAttempt cargado');

  const UserSessionModel = require('./UserSession');
  db.UserSession = UserSessionModel(sequelize);
  console.log('  ✅ UserSession cargado');

  const LoginHistoryModel = require('./LoginHistory');
  db.LoginHistory = LoginHistoryModel(sequelize);
  console.log('  ✅ LoginHistory cargado');

  const PermissionModel = require('./Permission');
  db.Permission = PermissionModel(sequelize);
  console.log('  ✅ Permission cargado');

  const RolePermissionModel = require('./RolePermission');
  db.RolePermission = RolePermissionModel(sequelize);
  console.log('  ✅ RolePermission cargado');

  const AuditLogModel = require('./AuditLog');
  db.AuditLog = AuditLogModel(sequelize);
  console.log('  ✅ AuditLog cargado');

  // M02 Sub-Partida 3.1 - Perfil Médico Completo
  const DoctorSpecialtyModel = require('./DoctorSpecialty');
  db.DoctorSpecialty = DoctorSpecialtyModel(sequelize);
  console.log('  ✅ DoctorSpecialty cargado');

  const DoctorEducationModel = require('./DoctorEducation');
  db.DoctorEducation = DoctorEducationModel(sequelize);
  console.log('  ✅ DoctorEducation cargado');

  const DoctorExperienceModel = require('./DoctorExperience');
  db.DoctorExperience = DoctorExperienceModel(sequelize);
  console.log('  ✅ DoctorExperience cargado');

  const DoctorAvailabilityModel = require('./DoctorAvailability');
  db.DoctorAvailability = DoctorAvailabilityModel(sequelize);
  console.log('  ✅ DoctorAvailability cargado');

  // M02 Sub-Partida 3.2 - Perfil Paciente Completo
  const PatientMedicalHistoryModel = require('./PatientMedicalHistory');
  db.PatientMedicalHistory = PatientMedicalHistoryModel(sequelize);
  console.log('  ✅ PatientMedicalHistory cargado');

  const PatientAllergyModel = require('./PatientAllergy');
  db.PatientAllergy = PatientAllergyModel(sequelize);
  console.log('  ✅ PatientAllergy cargado');

  const PatientMedicationModel = require('./PatientMedication');
  db.PatientMedication = PatientMedicationModel(sequelize);
  console.log('  ✅ PatientMedication cargado');

  // M02 Sub-Partida 3.3 - Verificación KYC Médicos
  const DoctorDocumentModel = require('./DoctorDocument');
  db.DoctorDocument = DoctorDocumentModel(sequelize);
  console.log('  ✅ DoctorDocument cargado');

  const VerificationRequestModel = require('./VerificationRequest');
  db.VerificationRequest = VerificationRequestModel(sequelize);
  console.log('  ✅ VerificationRequest cargado');

  // M02 Sub-Partida 3.4 - Sistema de Reputación con Estrellas
  const ReviewModel = require('./Review');
  db.Review = ReviewModel(sequelize);
  console.log('  ✅ Review cargado');

  const ReviewHelpfulVoteModel = require('./ReviewHelpfulVote');
  db.ReviewHelpfulVote = ReviewHelpfulVoteModel(sequelize);
  console.log('  ✅ ReviewHelpfulVote cargado');

  // M02 Sub-Partida 3.6 - Sistema de Clínicas y Organizaciones
  const ClinicModel = require('./Clinic');
  db.Clinic = ClinicModel(sequelize);
  console.log('  ✅ Clinic cargado');

  const ClinicLocationModel = require('./ClinicLocation');
  db.ClinicLocation = ClinicLocationModel(sequelize);
  console.log('  ✅ ClinicLocation cargado');

  const ClinicServiceModel = require('./ClinicService');
  db.ClinicService = ClinicServiceModel(sequelize);
  console.log('  ✅ ClinicService cargado');

  const ClinicDoctorModel = require('./ClinicDoctor');
  db.ClinicDoctor = ClinicDoctorModel(sequelize);
  console.log('  ✅ ClinicDoctor cargado');

  const ClinicImageModel = require('./ClinicImage');
  db.ClinicImage = ClinicImageModel(sequelize);
  console.log('  ✅ ClinicImage cargado');

  // M03 - Agendamiento Inteligente + Sala de Espera Virtual
  const WaitingQueueModel = require('./WaitingQueue');
  db.WaitingQueue = WaitingQueueModel(sequelize);
  console.log('  ✅ WaitingQueue cargado');

  const AvailabilityOverrideModel = require('./AvailabilityOverride');
  db.AvailabilityOverride = AvailabilityOverrideModel(sequelize);
  console.log('  ✅ AvailabilityOverride cargado');

  console.log('✅ Todos los modelos cargados exitosamente\n');
} catch (error) {
  console.error('❌ Error cargando modelos:', error.message);
  console.error('Stack:', error.stack);
  throw error;
}

// Establecer asociaciones
try {
  console.log('🔗 Estableciendo asociaciones...');

  // USER <-> DOCTOR PROFILE (1:1)
  db.User.hasOne(db.DoctorProfile, {
    foreignKey: 'userId',
    as: 'doctorProfile',
    onDelete: 'CASCADE'
  });
  db.DoctorProfile.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> DoctorProfile');

  // USER <-> PATIENT PROFILE (1:1)
  db.User.hasOne(db.PatientProfile, {
    foreignKey: 'userId',
    as: 'patientProfile',
    onDelete: 'CASCADE'
  });
  db.PatientProfile.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> PatientProfile');

  // USER <-> PROVIDER PROFILE (1:1)
  db.User.hasOne(db.ProviderProfile, {
    foreignKey: 'userId',
    as: 'providerProfile',
    onDelete: 'CASCADE'
  });
  db.ProviderProfile.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> ProviderProfile');

  // SPECIALTY <-> DOCTOR PROFILE (1:N)
  db.Specialty.hasMany(db.DoctorProfile, {
    foreignKey: 'specialtyId',
    as: 'doctors'
  });
  db.DoctorProfile.belongsTo(db.Specialty, {
    foreignKey: 'specialtyId',
    as: 'specialty'
  });
  console.log('  ✅ Specialty <-> DoctorProfile');

  // APPOINTMENT <-> USER (PATIENT) (N:1)
  db.Appointment.belongsTo(db.User, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  db.User.hasMany(db.Appointment, {
    foreignKey: 'patientId',
    as: 'patientAppointments'
  });
  console.log('  ✅ Appointment <-> User (Patient)');

  // APPOINTMENT <-> USER (DOCTOR) (N:1)
  db.Appointment.belongsTo(db.User, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });
  db.User.hasMany(db.Appointment, {
    foreignKey: 'doctorId',
    as: 'doctorAppointments'
  });
  console.log('  ✅ Appointment <-> User (Doctor)');

  // APPOINTMENT <-> DOCTOR PROFILE (N:1)
  db.Appointment.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  db.DoctorProfile.hasMany(db.Appointment, {
    foreignKey: 'doctorProfileId',
    as: 'appointments'
  });
  console.log('  ✅ Appointment <-> DoctorProfile');

  // APPOINTMENT <-> SPECIALTY (N:1)
  db.Appointment.belongsTo(db.Specialty, {
    foreignKey: 'specialtyId',
    as: 'specialty'
  });
  db.Specialty.hasMany(db.Appointment, {
    foreignKey: 'specialtyId',
    as: 'appointments'
  });
  console.log('  ✅ Appointment <-> Specialty');

  // USER <-> VERIFICATION TOKEN (1:N) - Sub-Partida 2.3
  db.User.hasMany(db.VerificationToken, {
    foreignKey: 'userId',
    as: 'verificationTokens',
    onDelete: 'CASCADE'
  });
  db.VerificationToken.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> VerificationToken');

  // USER <-> TWO FACTOR ATTEMPT (1:N) - Sub-Partida 2.4.1
  db.User.hasMany(db.TwoFactorAttempt, {
    foreignKey: 'userId',
    as: 'twoFactorAttempts',
    onDelete: 'CASCADE'
  });
  db.TwoFactorAttempt.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> TwoFactorAttempt');

  // USER <-> USER SESSION (1:N) - Sub-Partida 2.4.3
  db.User.hasMany(db.UserSession, {
    foreignKey: 'userId',
    as: 'sessions',
    onDelete: 'CASCADE'
  });
  db.UserSession.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> UserSession');

  // USER <-> LOGIN HISTORY (1:N) - Sub-Partida 2.4.3
  db.User.hasMany(db.LoginHistory, {
    foreignKey: 'userId',
    as: 'loginHistory',
    onDelete: 'CASCADE'
  });
  db.LoginHistory.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> LoginHistory');

  // PERMISSION <-> ROLE_PERMISSION (1:N) - Sub-Partida 2.5.1
  db.Permission.hasMany(db.RolePermission, {
    foreignKey: 'permissionId',
    as: 'rolePermissions',
    onDelete: 'CASCADE'
  });
  db.RolePermission.belongsTo(db.Permission, {
    foreignKey: 'permissionId',
    as: 'permission'
  });
  console.log('  ✅ Permission <-> RolePermission');

  // USER <-> AUDIT_LOG (1:N) - Sub-Partida 2.5.2
  db.User.hasMany(db.AuditLog, {
    foreignKey: 'userId',
    as: 'auditLogs'
  });
  db.AuditLog.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  console.log('  ✅ User <-> AuditLog');

  // ═══════════════════════════════════════════════════════════════
  // M02 Sub-Partida 3.1 - Perfil Médico Completo
  // ═══════════════════════════════════════════════════════════════

  // DOCTOR_PROFILE <-> DOCTOR_SPECIALTY <-> SPECIALTY (Many-to-Many)
  db.DoctorProfile.hasMany(db.DoctorSpecialty, {
    foreignKey: 'doctorProfileId',
    as: 'doctorSpecialties',
    onDelete: 'CASCADE'
  });
  db.DoctorSpecialty.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  db.DoctorSpecialty.belongsTo(db.Specialty, {
    foreignKey: 'specialtyId',
    as: 'specialty'
  });
  db.Specialty.hasMany(db.DoctorSpecialty, {
    foreignKey: 'specialtyId',
    as: 'doctorSpecialties'
  });
  console.log('  ✅ DoctorProfile <-> DoctorSpecialty <-> Specialty');

  // DOCTOR_PROFILE <-> DOCTOR_EDUCATION (1:N)
  db.DoctorProfile.hasMany(db.DoctorEducation, {
    foreignKey: 'doctorProfileId',
    as: 'education',
    onDelete: 'CASCADE'
  });
  db.DoctorEducation.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  console.log('  ✅ DoctorProfile <-> DoctorEducation');

  // DOCTOR_PROFILE <-> DOCTOR_EXPERIENCE (1:N)
  db.DoctorProfile.hasMany(db.DoctorExperience, {
    foreignKey: 'doctorProfileId',
    as: 'experience',
    onDelete: 'CASCADE'
  });
  db.DoctorExperience.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  console.log('  ✅ DoctorProfile <-> DoctorExperience');

  // DOCTOR_PROFILE <-> DOCTOR_AVAILABILITY (1:N)
  db.DoctorProfile.hasMany(db.DoctorAvailability, {
    foreignKey: 'doctorProfileId',
    as: 'availability',
    onDelete: 'CASCADE'
  });
  db.DoctorAvailability.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  console.log('  ✅ DoctorProfile <-> DoctorAvailability');

  // ═══════════════════════════════════════════════════════════════
  // M02 Sub-Partida 3.2 - Perfil Paciente Completo
  // ═══════════════════════════════════════════════════════════════

  // PATIENT_PROFILE <-> PATIENT_MEDICAL_HISTORY (1:N)
  db.PatientProfile.hasMany(db.PatientMedicalHistory, {
    foreignKey: 'patientProfileId',
    as: 'medicalHistory',
    onDelete: 'CASCADE'
  });
  db.PatientMedicalHistory.belongsTo(db.PatientProfile, {
    foreignKey: 'patientProfileId',
    as: 'patientProfile'
  });
  console.log('  ✅ PatientProfile <-> PatientMedicalHistory');

  // PATIENT_PROFILE <-> PATIENT_ALLERGY (1:N)
  db.PatientProfile.hasMany(db.PatientAllergy, {
    foreignKey: 'patientProfileId',
    as: 'patientAllergies',
    onDelete: 'CASCADE'
  });
  db.PatientAllergy.belongsTo(db.PatientProfile, {
    foreignKey: 'patientProfileId',
    as: 'patientProfile'
  });
  console.log('  ✅ PatientProfile <-> PatientAllergy');

  // PATIENT_PROFILE <-> PATIENT_MEDICATION (1:N)
  db.PatientProfile.hasMany(db.PatientMedication, {
    foreignKey: 'patientProfileId',
    as: 'medications',
    onDelete: 'CASCADE'
  });
  db.PatientMedication.belongsTo(db.PatientProfile, {
    foreignKey: 'patientProfileId',
    as: 'patientProfile'
  });
  console.log('  ✅ PatientProfile <-> PatientMedication');

  // ═══════════════════════════════════════════════════════════════
  // M02 Sub-Partida 3.3 - Verificación KYC Médicos
  // ═══════════════════════════════════════════════════════════════

  // DOCTOR_PROFILE <-> DOCTOR_DOCUMENT (1:N)
  db.DoctorProfile.hasMany(db.DoctorDocument, {
    foreignKey: 'doctorProfileId',
    as: 'documents',
    onDelete: 'CASCADE'
  });
  db.DoctorDocument.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  console.log('  ✅ DoctorProfile <-> DoctorDocument');

  // DOCTOR_DOCUMENT <-> USER (reviewedBy) (N:1)
  db.DoctorDocument.belongsTo(db.User, {
    foreignKey: 'reviewedBy',
    as: 'reviewer'
  });
  console.log('  ✅ DoctorDocument <-> User (reviewer)');

  // DOCTOR_PROFILE <-> VERIFICATION_REQUEST (1:N)
  db.DoctorProfile.hasMany(db.VerificationRequest, {
    foreignKey: 'doctorProfileId',
    as: 'verificationRequests',
    onDelete: 'CASCADE'
  });
  db.VerificationRequest.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  console.log('  ✅ DoctorProfile <-> VerificationRequest');

  // VERIFICATION_REQUEST <-> USER (assignedTo) (N:1)
  db.VerificationRequest.belongsTo(db.User, {
    foreignKey: 'assignedTo',
    as: 'assignedAdmin'
  });
  console.log('  ✅ VerificationRequest <-> User (assignedAdmin)');

  // DOCTOR_PROFILE <-> USER (verifiedBy) (N:1)
  db.DoctorProfile.belongsTo(db.User, {
    foreignKey: 'verifiedBy',
    as: 'verifier'
  });
  console.log('  ✅ DoctorProfile <-> User (verifier)');

  // ═══════════════════════════════════════════════════════════════
  // M02 Sub-Partida 3.4 - Sistema de Reputación con Estrellas
  // ═══════════════════════════════════════════════════════════════

  // DOCTOR_PROFILE <-> REVIEW (1:N)
  db.DoctorProfile.hasMany(db.Review, {
    foreignKey: 'doctorProfileId',
    as: 'reviews',
    onDelete: 'CASCADE'
  });
  db.Review.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctor'
  });
  console.log('  ✅ DoctorProfile <-> Review');

  // USER (PATIENT) <-> REVIEW (1:N)
  db.User.hasMany(db.Review, {
    foreignKey: 'patientId',
    as: 'reviewsGiven',
    onDelete: 'CASCADE'
  });
  db.Review.belongsTo(db.User, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  console.log('  ✅ User (Patient) <-> Review');

  // APPOINTMENT <-> REVIEW (1:1)
  db.Appointment.hasOne(db.Review, {
    foreignKey: 'appointmentId',
    as: 'review'
  });
  db.Review.belongsTo(db.Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment'
  });
  console.log('  ✅ Appointment <-> Review');

  // REVIEW <-> REVIEW_HELPFUL_VOTE (1:N)
  db.Review.hasMany(db.ReviewHelpfulVote, {
    foreignKey: 'reviewId',
    as: 'helpfulVotes',
    onDelete: 'CASCADE'
  });
  db.ReviewHelpfulVote.belongsTo(db.Review, {
    foreignKey: 'reviewId',
    as: 'review'
  });
  console.log('  ✅ Review <-> ReviewHelpfulVote');

  // USER <-> REVIEW_HELPFUL_VOTE (1:N)
  db.User.hasMany(db.ReviewHelpfulVote, {
    foreignKey: 'userId',
    as: 'reviewVotes',
    onDelete: 'CASCADE'
  });
  db.ReviewHelpfulVote.belongsTo(db.User, {
    foreignKey: 'userId',
    as: 'voter'
  });
  console.log('  ✅ User <-> ReviewHelpfulVote');

  // ═══════════════════════════════════════════════════════════════
  // M02 Sub-Partida 3.6 - Sistema de Clínicas y Organizaciones
  // ═══════════════════════════════════════════════════════════════

  // CLINIC <-> USER (adminUserId) (N:1)
  db.Clinic.belongsTo(db.User, {
    foreignKey: 'adminUserId',
    as: 'admin'
  });
  db.User.hasMany(db.Clinic, {
    foreignKey: 'adminUserId',
    as: 'managedClinics'
  });
  console.log('  ✅ Clinic <-> User (admin)');

  // CLINIC <-> USER (verifiedBy) (N:1)
  db.Clinic.belongsTo(db.User, {
    foreignKey: 'verifiedBy',
    as: 'verifier'
  });
  console.log('  ✅ Clinic <-> User (verifier)');

  // CLINIC <-> CLINIC_LOCATION (1:N)
  db.Clinic.hasMany(db.ClinicLocation, {
    foreignKey: 'clinicId',
    as: 'locations',
    onDelete: 'CASCADE'
  });
  db.ClinicLocation.belongsTo(db.Clinic, {
    foreignKey: 'clinicId',
    as: 'clinic'
  });
  console.log('  ✅ Clinic <-> ClinicLocation');

  // CLINIC <-> CLINIC_SERVICE (1:N)
  db.Clinic.hasMany(db.ClinicService, {
    foreignKey: 'clinicId',
    as: 'services',
    onDelete: 'CASCADE'
  });
  db.ClinicService.belongsTo(db.Clinic, {
    foreignKey: 'clinicId',
    as: 'clinic'
  });
  console.log('  ✅ Clinic <-> ClinicService');

  // CLINIC_LOCATION <-> CLINIC_SERVICE (1:N)
  db.ClinicLocation.hasMany(db.ClinicService, {
    foreignKey: 'locationId',
    as: 'services',
    onDelete: 'CASCADE'
  });
  db.ClinicService.belongsTo(db.ClinicLocation, {
    foreignKey: 'locationId',
    as: 'location'
  });
  console.log('  ✅ ClinicLocation <-> ClinicService');

  // CLINIC <-> CLINIC_DOCTOR (1:N)
  db.Clinic.hasMany(db.ClinicDoctor, {
    foreignKey: 'clinicId',
    as: 'clinicDoctors',
    onDelete: 'CASCADE'
  });
  db.ClinicDoctor.belongsTo(db.Clinic, {
    foreignKey: 'clinicId',
    as: 'clinic'
  });
  console.log('  ✅ Clinic <-> ClinicDoctor');

  // CLINIC_LOCATION <-> CLINIC_DOCTOR (1:N)
  db.ClinicLocation.hasMany(db.ClinicDoctor, {
    foreignKey: 'locationId',
    as: 'doctors',
    onDelete: 'CASCADE'
  });
  db.ClinicDoctor.belongsTo(db.ClinicLocation, {
    foreignKey: 'locationId',
    as: 'location'
  });
  console.log('  ✅ ClinicLocation <-> ClinicDoctor');

  // USER (Doctor) <-> CLINIC_DOCTOR (1:N)
  db.User.hasMany(db.ClinicDoctor, {
    foreignKey: 'doctorId',
    as: 'clinicAssignments',
    onDelete: 'CASCADE'
  });
  db.ClinicDoctor.belongsTo(db.User, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });
  console.log('  ✅ User (Doctor) <-> ClinicDoctor');

  // CLINIC <-> CLINIC_IMAGE (1:N)
  db.Clinic.hasMany(db.ClinicImage, {
    foreignKey: 'clinicId',
    as: 'images',
    onDelete: 'CASCADE'
  });
  db.ClinicImage.belongsTo(db.Clinic, {
    foreignKey: 'clinicId',
    as: 'clinic'
  });
  console.log('  ✅ Clinic <-> ClinicImage');

  // CLINIC_LOCATION <-> CLINIC_IMAGE (1:N)
  db.ClinicLocation.hasMany(db.ClinicImage, {
    foreignKey: 'locationId',
    as: 'images',
    onDelete: 'CASCADE'
  });
  db.ClinicImage.belongsTo(db.ClinicLocation, {
    foreignKey: 'locationId',
    as: 'location'
  });
  console.log('  ✅ ClinicLocation <-> ClinicImage');

  // ═══════════════════════════════════════════════════════════════
  // M03 - Agendamiento Inteligente + Sala de Espera Virtual
  // ═══════════════════════════════════════════════════════════════

  // WAITING_QUEUE <-> APPOINTMENT (1:1)
  db.WaitingQueue.belongsTo(db.Appointment, {
    foreignKey: 'appointmentId',
    as: 'appointment'
  });
  db.Appointment.hasOne(db.WaitingQueue, {
    foreignKey: 'appointmentId',
    as: 'queueEntry'
  });
  console.log('  ✅ WaitingQueue <-> Appointment');

  // WAITING_QUEUE <-> USER (Doctor) (N:1)
  db.WaitingQueue.belongsTo(db.User, {
    foreignKey: 'doctorId',
    as: 'doctor'
  });
  db.User.hasMany(db.WaitingQueue, {
    foreignKey: 'doctorId',
    as: 'doctorQueueEntries'
  });
  console.log('  ✅ WaitingQueue <-> User (Doctor)');

  // WAITING_QUEUE <-> USER (Patient) (N:1)
  db.WaitingQueue.belongsTo(db.User, {
    foreignKey: 'patientId',
    as: 'patient'
  });
  db.User.hasMany(db.WaitingQueue, {
    foreignKey: 'patientId',
    as: 'patientQueueEntries'
  });
  console.log('  ✅ WaitingQueue <-> User (Patient)');

  // AVAILABILITY_OVERRIDE <-> DOCTOR_PROFILE (N:1)
  db.AvailabilityOverride.belongsTo(db.DoctorProfile, {
    foreignKey: 'doctorProfileId',
    as: 'doctorProfile'
  });
  db.DoctorProfile.hasMany(db.AvailabilityOverride, {
    foreignKey: 'doctorProfileId',
    as: 'availabilityOverrides',
    onDelete: 'CASCADE'
  });
  console.log('  ✅ AvailabilityOverride <-> DoctorProfile');

  console.log('✅ Asociaciones establecidas correctamente\n');
} catch (error) {
  console.error('❌ Error estableciendo asociaciones:', error.message);
  throw error;
}

module.exports = db;