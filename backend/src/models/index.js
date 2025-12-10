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

  const AppointmentModel = require('./Appointment');
  db.Appointment = AppointmentModel(sequelize);
  console.log('  ✅ Appointment cargado');

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

  console.log('✅ Asociaciones establecidas correctamente\n');
} catch (error) {
  console.error('❌ Error estableciendo asociaciones:', error.message);
  throw error;
}

module.exports = db;