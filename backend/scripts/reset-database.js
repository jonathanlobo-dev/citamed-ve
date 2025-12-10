// scripts/reset-database.js
// Script para limpiar la base de datos y empezar de cero

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function resetDatabase() {
  console.log('🔄 RESET DE BASE DE DATOS - CITAMED.VE');
  console.log('=========================================\n');
  console.log('⚠️  ADVERTENCIA: Este script eliminará todas las tablas');
  console.log('⚠️  Asegúrate de tener backup si hay datos importantes\n');

  const sequelize = new Sequelize(
    process.env.DB_NAME || 'citamed_development',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    console.log('📡 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    console.log('🗑️  Eliminando tablas en orden...');
    
    // Eliminar tablas en orden inverso de dependencias
    const tablesToDrop = [
      'appointments',
      'doctor_profiles',
      'patient_profiles',
      'specialties',
      'users'
    ];

    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        console.log(`  ✅ Tabla ${table} eliminada`);
      } catch (error) {
        console.log(`  ⚠️  Tabla ${table} no existía`);
      }
    }

    console.log('\n🗑️  Eliminando tipos ENUM...');
    
    const enumsToCheck = [
      'enum_users_role',
      'enum_users_gender',
      'enum_specialties_category',
      'enum_doctor_profiles_profile_status',
      'enum_patient_profiles_gender',
      'enum_patient_profiles_blood_type',
      'enum_patient_profiles_profile_status',
      'enum_appointments_appointment_type',
      'enum_appointments_status',
      'enum_appointments_payment_status'
    ];

    for (const enumType of enumsToCheck) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "public"."${enumType}" CASCADE;`);
        console.log(`  ✅ ENUM ${enumType} eliminado`);
      } catch (error) {
        // Ignorar si no existe
      }
    }

    console.log('\n=========================================');
    console.log('✅ BASE DE DATOS LIMPIA');
    console.log('=========================================\n');
    console.log('🚀 Ahora puedes ejecutar:');
    console.log('   node scripts/sync-db-module2.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

resetDatabase();