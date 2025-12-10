// scripts/sync-db-module2.js
// MÓDULO 2 - CITAMED.VE
// Script de sincronización completa de base de datos - VERSIÓN CORREGIDA

require('dotenv').config();
const db = require('../src/models');
const { seedSpecialties } = require('../seeders/specialties-seed');

async function syncDatabase() {
  console.log('🚀 CITAMED.VE - MÓDULO 2: SINCRONIZACIÓN');
  console.log('========================================\n');

  try {
    // ========================================
    // PASO 1: VERIFICAR CONEXIÓN
    // ========================================
    console.log('📡 Verificando conexión a la base de datos...');
    await db.sequelize.authenticate();
    console.log('✅ Conexión exitosa a PostgreSQL\n');

    // ========================================
    // PASO 2: SINCRONIZAR MODELOS EN ORDEN
    // ========================================
    console.log('🔄 Sincronizando modelos con la base de datos...');
    console.log('   ⚠️  Importante: Respetando orden de dependencias\n');

    // ORDEN 1: Tablas sin dependencias (independientes)
    console.log('📦 Paso 1/3: Tablas independientes');
    
    await db.User.sync({ alter: true });
    console.log('  ✅ users');

    await db.Specialty.sync({ alter: true });
    console.log('  ✅ specialties');

    // ORDEN 2: Tablas que dependen de Users y Specialties
    console.log('\n📦 Paso 2/3: Perfiles (dependen de users y specialties)');
    
    await db.DoctorProfile.sync({ alter: true });
    console.log('  ✅ doctor_profiles');

    await db.PatientProfile.sync({ alter: true });
    console.log('  ✅ patient_profiles');

    // ORDEN 3: Tablas que dependen de todo lo anterior
    console.log('\n📦 Paso 3/3: Citas (dependen de todos los anteriores)');
    
    await db.Appointment.sync({ alter: true });
    console.log('  ✅ appointments');

    console.log('\n✅ Todas las tablas sincronizadas correctamente\n');

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
    // PASO 5: VERIFICAR RELACIONES
    // ========================================
    console.log('\n🔗 Verificando relaciones (foreign keys)...');
    
    const fkQuery = `
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    
    const [fkResults] = await db.sequelize.query(fkQuery);
    console.log(`  ✅ ${fkResults.length} relaciones configuradas correctamente`);

    // ========================================
    // PASO 6: RESUMEN FINAL
    // ========================================
    console.log('\n========================================');
    console.log('✅ MÓDULO 2 SINCRONIZADO EXITOSAMENTE');
    console.log('========================================');
    console.log('\n📋 Estado de la base de datos:');
    console.log(`  • 5 tablas creadas`);
    console.log(`  • ${specialtyCount} especialidades médicas`);
    console.log(`  • ${fkResults.length} relaciones (foreign keys)`);
    console.log(`  • ${userCount} usuarios en el sistema`);
    
    console.log('\n🎯 Próximos pasos:');
    console.log('  1. Crear usuarios de prueba (pacientes y doctores)');
    console.log('  2. Desarrollar controladores (doctorController, patientController)');
    console.log('  3. Implementar rutas API del directorio médico');
    console.log('  4. Crear sistema de búsqueda de doctores');
    console.log('  5. Desarrollar sistema de citas\n');

    console.log('🚀 ¡Listo para comenzar FASE 2: Controladores y API!\n');

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ ERROR CRÍTICO:', error.message);
    console.error('========================================');
    
    if (error.original) {
      console.error('\n🗄️  Error de PostgreSQL:');
      console.error('   Mensaje:', error.original.message);
      console.error('   Código:', error.original.code);
      
      if (error.sql) {
        console.error('\n📝 SQL que causó el error:');
        console.error(error.sql.substring(0, 200) + '...');
      }
    }
    
    console.error('\n💡 Sugerencias:');
    console.error('   1. Verifica que PostgreSQL esté corriendo');
    console.error('   2. Revisa las credenciales en .env');
    console.error('   3. Si persiste, ejecuta: node scripts/reset-database.js');
    console.error('   4. Luego vuelve a ejecutar este script\n');
    
    process.exit(1);
  } finally {
    await db.sequelize.close();
    console.log('👋 Conexión cerrada\n');
  }
}

// Ejecutar sincronización
syncDatabase();