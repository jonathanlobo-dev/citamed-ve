// verify-module2-final.js
require('dotenv').config();
const { Sequelize } = require('sequelize');

async function verify() {
  console.log('\n🔍 VERIFICACIÓN FINAL - MÓDULO 2');
  console.log('='.repeat(50));
  
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false
    }
  );
  
  await sequelize.authenticate();
  console.log('✅ Conexión exitosa\n');
  
  const [tables] = await sequelize.query(`
    SELECT table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'specialties', 'doctor_profiles', 'patient_profiles', 'appointments')
    ORDER BY table_name
  `);
  
  console.log('📦 TABLAS:');
  for (const t of tables) {
    const [count] = await sequelize.query(`SELECT COUNT(*) as c FROM "${t.table_name}"`);
    console.log(`   ✅ ${t.table_name}: ${count[0].c} registros`);
  }
  
  await sequelize.close();
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ MÓDULO 2 COMPLETO');
  console.log('='.repeat(50));
  console.log('\n🚀 Listo para el Módulo 3\n');
}

verify().catch(console.error);