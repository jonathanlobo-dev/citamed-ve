// Quick script to drop and recreate profile tables with correct schema
const { sequelize } = require('./src/models/index');

async function fixSchema() {
  try {
    console.log('🔧 Recreating profile tables...');

    await sequelize.query('DROP TABLE IF EXISTS patient_profiles CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS doctor_profiles CASCADE');

    console.log('✅ Old tables dropped');
    console.log('🔨 Creating new tables with Sequelize sync...');

    const { DoctorProfile, PatientProfile } = sequelize.models;
    await DoctorProfile.sync({ force: true });
    await PatientProfile.sync({ force: true });

    console.log('✅ Profile tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixSchema();
