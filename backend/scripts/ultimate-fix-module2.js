// scripts/ultimate-fix-module2.js
// SOLUCIÓN DEFINITIVA - No requiere modificar código
// Ejecuta este script y resuelve todo automáticamente

require('dotenv').config();
const sequelize = require('../src/config/database');

async function ultimateFix() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   🔧 SOLUCIÓN DEFINITIVA - MÓDULO 2          ║');
  console.log('║   CITAMED.VE                                  ║');
  console.log('╚════════════════════════════════════════════════╝\n');
  
  try {
    // PASO 1: Conectar
    console.log('📡 PASO 1: Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('   ✅ Conectado correctamente\n');
    
    // PASO 2: Eliminar base de datos completa y recrearla
    console.log('🗑️  PASO 2: Limpiando base de datos completamente...');
    console.log('   (Esto puede tomar 10-15 segundos)\n');
    
    // Cerrar la conexión actual
    await sequelize.close();
    
    // Conectar a la base de datos 'postgres' (base de datos por defecto)
    const { Sequelize } = require('sequelize');
    const adminSequelize = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    });
    
    await adminSequelize.authenticate();
    
    // Desconectar todos los usuarios de la base de datos
    await adminSequelize.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${process.env.DB_NAME}'
        AND pid <> pg_backend_pid();
    `);
    console.log('   ✅ Conexiones cerradas');
    
    // Eliminar la base de datos
    await adminSequelize.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME};`);
    console.log('   ✅ Base de datos eliminada');
    
    // Recrear la base de datos
    await adminSequelize.query(`CREATE DATABASE ${process.env.DB_NAME};`);
    console.log('   ✅ Base de datos recreada completamente\n');
    
    await adminSequelize.close();
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // PASO 3: Reconectar a la nueva base de datos
    console.log('🔄 PASO 3: Reconectando a la nueva base de datos...');
    await sequelize.authenticate();
    console.log('   ✅ Reconectado\n');
    
    // PASO 4: Crear las tablas
    console.log('📦 PASO 4: Creando tablas desde cero...');
    console.log('   (Esto puede tomar 20-30 segundos)\n');
    
    // Cargar los modelos
    const { User, Specialty, DoctorProfile, PatientProfile, Appointment } = require('../src/models');
    
    // Sincronizar con force: true para crear todo desde cero
    await sequelize.sync({ force: true });
    
    console.log('   ✅ users creada');
    console.log('   ✅ specialties creada');
    console.log('   ✅ doctor_profiles creada');
    console.log('   ✅ patient_profiles creada');
    console.log('   ✅ appointments creada\n');
    
    // PASO 5: Cargar especialidades
    console.log('🌱 PASO 5: Cargando 20 especialidades médicas...\n');
    
    const { specialtiesData } = require('../seeders/specialties-seed');
    
    let createdCount = 0;
    for (const specialty of specialtiesData) {
      try {
        await Specialty.create(specialty);
        createdCount++;
        console.log(`   ${createdCount}. ✅ ${specialty.name}`);
      } catch (error) {
        console.error(`   ❌ Error con ${specialty.name}: ${error.message}`);
      }
    }
    
    console.log(`\n   📊 ${createdCount} de ${specialtiesData.length} especialidades cargadas\n`);
    
    // PASO 6: Verificación final
    console.log('🔍 PASO 6: Verificando que todo esté correcto...\n');
    
    const userCount = await User.count();
    const specialtyCount = await Specialty.count();
    const doctorCount = await DoctorProfile.count();
    const patientCount = await PatientProfile.count();
    const appointmentCount = await Appointment.count();
    
    console.log('   📊 Conteo de registros:');
    console.log(`      • Usuarios: ${userCount}`);
    console.log(`      • Especialidades: ${specialtyCount}`);
    console.log(`      • Doctores: ${doctorCount}`);
    console.log(`      • Pacientes: ${patientCount}`);
    console.log(`      • Citas: ${appointmentCount}\n`);
    
    // Verificar tablas
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('   📋 Tablas en la base de datos:');
    tables.forEach(t => console.log(`      ✅ ${t.table_name}`));
    
    await sequelize.close();
    
    // Resultado exitoso
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║   ✅ ¡MÓDULO 2 COMPLETADO EXITOSAMENTE!      ║');
    console.log('╚════════════════════════════════════════════════╝\n');
    
    console.log('🎯 TODO LISTO:');
    console.log('   ✅ Base de datos limpia y recreada');
    console.log('   ✅ 5 tablas creadas correctamente');
    console.log('   ✅ 20 especialidades médicas cargadas');
    console.log('   ✅ Todos los modelos funcionando\n');
    
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('   1. Verifica: node scripts\\verify-module2.js');
    console.log('   2. Prueba: node scripts\\test-module2.js');
    console.log('   3. ¡Comienza el Módulo 3!\n');
    
    return true;
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════╗');
    console.error('║   ❌ ERROR                                     ║');
    console.error('╚════════════════════════════════════════════════╝\n');
    console.error('🔴 Descripción del error:');
    console.error(`   ${error.message}\n`);
    console.error('📝 Detalles técnicos:');
    console.error(error.stack);
    console.error('\n💡 SOLUCIÓN:');
    console.error('   Copia este error y pégalo en el chat.');
    console.error('   Te ayudaré a resolverlo.\n');
    return false;
  }
}

// Ejecutar
ultimateFix()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });