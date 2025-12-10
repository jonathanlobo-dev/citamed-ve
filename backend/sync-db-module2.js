1// sync-db-module2.js
// MÓDULO 2 - CITAMED.VE
// Script de sincronización completa de base de datos

require('dotenv').config();
const db = require('./models');
const { seedSpecialties } = require('./src/seeders/specialties-seed');

async function syncDatabase() {
  console.log('🚀 CITAMED.VE - MÓDULO 2: SINCRONIZACIÓN DE BASE DE DATOS');
  console.log('========================================\n');

  try {
    // ========================================
    // PASO 1: VERIFICAR CONEXIÓN
    // ========================================
    console.log('📡 Verificando conexión a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa a PostgreSQL\n');

    // ========================================
    // PASO 2: SINCRONIZAR MODELOS
    // ========================================
    console.log('🔄 Sincronizando modelos con la base de datos...');
    console.log('   Esto puede tardar un momento...\n');

    // Sincronizar en orden para respetar las dependencias
    await db.User.sync({ alter: true });
    console.log('  ✅ Tabla Users sincronizada');

    await db.Specialty.sync({ alter: true });
    console.log('  ✅ Tabla Specialties sincronizada');

    await db.DoctorProfile.sync({ alter: true });
    console.log('  ✅ Tabla DoctorProfiles sincronizada');

    await db.PatientProfile.sync({ alter: true });
    console.log('  ✅ Tabla PatientProfiles sincronizada');

    await db.Appointment.sync({ alter: true });
    console.log('  ✅ Tabla Appointments sincronizada\n');

    // ========================================
    // PASO 3: CARGAR ESPECIALIDADES
    // ========================================
    console.log('🌱 Cargando especialidades médicas...\n');
    const seedResult = await seedSpecialties(db.Specialty);
    
    // ========================================
    // PASO 4: VERIFICAR DATOS
    // ========================================
    console.log('\n📊 Verificando datos en la base de datos...');
    
    const userCount = await db.User.count();
    const doctorCount = await db.DoctorProfile.count();
    const patientCount = await db.PatientProfile.count();
    const specialtyCount = await db.Specialty.count();
    const appointmentCount = await db.Appointment.count();

    console.log(`  👥 Usuarios registrados: ${userCount}`);
    console.log(`  👨‍⚕️  Perfiles de doctores: ${doctorCount}`);
    console.log(`  🤒 Perfiles de pacientes: ${patientCount}`);
    console.log(`  🏥 Especialidades médicas: ${specialtyCount}`);
    console.log(`  📅 Citas registradas: ${appointmentCount}`);

    // ========================================
    // PASO 5: RESUMEN FINAL
    // ========================================
    console.log('\n========================================');
    console.log('✅ MÓDULO 2 SINCRONIZADO EXITOSAMENTE');
    console.log('========================================');
    console.log('\n📋 Modelos disponibles:');
    console.log('  - User (usuarios base)');
    console.log('  - DoctorProfile (perfiles médicos extendidos)');
    console.log('  - PatientProfile (perfiles de pacientes)');
    console.log('  - Specialty (especialidades médicas)');
    console.log('  - Appointment (citas médicas)');
    
    console.log('\n🎯 Próximos pasos:');
    console.log('  1. Crear controladores para gestionar perfiles');
    console.log('  2. Implementar sistema de búsqueda de doctores');
    console.log('  3. Desarrollar sistema de citas básico');
    console.log('  4. Crear rutas API para el directorio médico\n');

  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    console.error('\n🔍 Detalles del error:');
    console.error(error.message);
    
    if (error.original) {
      console.error('\n🗄️  Error de PostgreSQL:');
      console.error(error.original.message);
    }
    
    process.exit(1);
  } finally {
    await db.sequelize.close();
    console.log('👋 Conexión cerrada\n');
  }
}

// Ejecutar sincronización
syncDatabase();