// scripts/fix-module2.js
// Script para corregir problemas de sincronización del Módulo 2

require('dotenv').config();
const sequelize = require('../src/config/database');

async function fixModule2() {
  console.log('\n🔧 CORRECCIÓN DEL MÓDULO 2 - CITAMED.VE');
  console.log('='.repeat(50));
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');
    
    console.log('🗑️  Eliminando tablas y ENUMs problemáticos...\n');
    
    // Eliminar tablas si existen
    await sequelize.query('DROP TABLE IF EXISTS appointments CASCADE;');
    console.log('   ✅ appointments eliminada');
    
    await sequelize.query('DROP TABLE IF EXISTS patient_profiles CASCADE;');
    console.log('   ✅ patient_profiles eliminada');
    
    // Eliminar ENUMs de patient_profiles
    const patientEnums = [
      'enum_patient_profiles_gender',
      'enum_patient_profiles_bloodType',
      'enum_patient_profiles_blood_type',
      'enum_patient_profiles_identificationType',
      'enum_patient_profiles_identification_type',
      'enum_patient_profiles_smokingStatus',
      'enum_patient_profiles_smoking_status',
      'enum_patient_profiles_alcoholConsumption',
      'enum_patient_profiles_alcohol_consumption',
      'enum_patient_profiles_exerciseFrequency',
      'enum_patient_profiles_exercise_frequency',
      'enum_patient_profiles_preferredCommunicationMethod',
      'enum_patient_profiles_preferred_communication_method',
      'enum_patient_profiles_preferredDoctorGender',
      'enum_patient_profiles_preferred_doctor_gender',
      'enum_patient_profiles_profileStatus',
      'enum_patient_profiles_profile_status'
    ];
    
    for (const enumType of patientEnums) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
        console.log(`   ✅ ${enumType} eliminado`);
      } catch (err) {
        // Ignorar si no existe
      }
    }
    
    // Eliminar ENUMs de appointments
    const appointmentEnums = [
      'enum_appointments_appointmentType',
      'enum_appointments_appointment_type',
      'enum_appointments_status',
      'enum_appointments_paymentStatus',
      'enum_appointments_payment_status'
    ];
    
    for (const enumType of appointmentEnums) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE;`);
        console.log(`   ✅ ${enumType} eliminado`);
      } catch (err) {
        // Ignorar si no existe
      }
    }
    
    console.log('\n✅ Limpieza completada');
    console.log('\n' + '='.repeat(50));
    console.log('🎯 SIGUIENTE PASO:');
    console.log('='.repeat(50));
    console.log('\nEjecuta ahora:');
    console.log('   node scripts\\sync-db-module2.js');
    console.log('\nEsto creará las tablas correctamente.');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixModule2();