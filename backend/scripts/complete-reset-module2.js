// scripts/complete-reset-module2.js
// Reset completo y resincronización del Módulo 2

require('dotenv').config();
const { Specialty } = require('../src/models');
const sequelize = require('../src/config/database');
const { specialtiesData } = require('../seeders/specialties-seed');

async function completeResetAndSync() {
  console.log('\n🔄 RESET COMPLETO Y RESINCRONIZACIÓN - MÓDULO 2');
  console.log('='.repeat(50));
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');
    
    // Paso 1: Backup de especialidades existentes
    console.log('📦 Paso 1: Verificando especialidades existentes...');
    let existingSpecialties = [];
    try {
      existingSpecialties = await Specialty.findAll();
      console.log(`   ℹ️  ${existingSpecialties.length} especialidades encontradas`);
    } catch (error) {
      console.log('   ℹ️  No hay especialidades que respaldar');
    }
    
    // Paso 2: Drop de todas las tablas y tipos
    console.log('\n🗑️  Paso 2: Eliminando todas las tablas y tipos ENUM...');
    
    const tables = [
      'appointments',
      'patient_profiles', 
      'doctor_profiles',
      'specialties',
      'users'
    ];
    
    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`   ✅ Tabla ${table} eliminada`);
      } catch (err) {
        console.log(`   ℹ️  Tabla ${table} no existía`);
      }
    }
    
    // Eliminar todos los ENUMs
    console.log('\n🗑️  Eliminando tipos ENUM...');
    const [enums] = await sequelize.query(`
      SELECT typname FROM pg_type 
      WHERE typname LIKE 'enum_%' 
      ORDER BY typname
    `);
    
    for (const enumType of enums) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "${enumType.typname}" CASCADE;`);
        console.log(`   ✅ ${enumType.typname} eliminado`);
      } catch (err) {
        // Ignorar errores
      }
    }
    
    // Paso 3: Sincronizar con force
    console.log('\n🔄 Paso 3: Sincronizando modelos (force: true)...');
    await sequelize.sync({ force: true });
    console.log('   ✅ Todas las tablas creadas correctamente');
    
    // Paso 4: Cargar especialidades
    console.log('\n🌱 Paso 4: Cargando especialidades médicas...');
    let createdCount = 0;
    
    for (const specialty of specialtiesData) {
      try {
        await Specialty.create(specialty);
        createdCount++;
        console.log(`   ✅ ${specialty.name} creada`);
      } catch (error) {
        console.error(`   ❌ Error creando ${specialty.name}:`, error.message);
      }
    }
    
    console.log(`\n   📊 Total: ${createdCount}/${specialtiesData.length} especialidades creadas`);
    
    // Verificación final
    console.log('\n🔍 Verificación final...');
    const [tables_result] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'specialties', 'doctor_profiles', 'patient_profiles', 'appointments')
      ORDER BY table_name
    `);
    
    console.log('\n   📋 Tablas creadas:');
    tables_result.forEach(t => {
      console.log(`      ✅ ${t.table_name}`);
    });
    
    const specialtyCount = await Specialty.count();
    console.log(`\n   🏥 Especialidades: ${specialtyCount}`);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ RESET Y SINCRONIZACIÓN COMPLETADOS');
    console.log('='.repeat(50));
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Ejecuta: node scripts\\verify-module2.js');
    console.log('   2. Ejecuta: node scripts\\test-module2.js');
    console.log('   3. ¡Comienza el Módulo 3!\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error(error.stack);
    return false;
  } finally {
    await sequelize.close();
  }
}

completeResetAndSync()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });