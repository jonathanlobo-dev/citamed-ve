// backend/sync-db.js
const { sequelize } = require('./src/config/database');
const User = require('./src/models/User');
const DoctorProfile = require('./src/models/DoctorProfile');

async function syncDB() {
  try {
    await sequelize.sync({ force: false });
    console.log('✅ TABLAS CREADAS EN BASE DE DATOS');
    console.log('📊 Tablas creadas: Users, DoctorProfiles');
    console.log('🎯 Base de datos lista para pacientes y doctores');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    process.exit(1);
  }
}

syncDB();