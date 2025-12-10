// scripts/ver-estructura.js
// Ver la estructura real de las tablas

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function verEstructura() {
  console.log('\n🔍 VERIFICANDO ESTRUCTURA REAL DE LAS TABLAS');
  console.log('='.repeat(60));
  
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
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');
    
    const tables = ['users', 'specialties', 'doctor_profiles', 'patient_profiles', 'appointments'];
    
    for (const table of tables) {
      console.log(`\n📋 TABLA: ${table}`);
      console.log('─'.repeat(60));
      
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = '${table}'
        ORDER BY ordinal_position
      `);
      
      console.log(`   Total columnas: ${columns.length}\n`);
      
      columns.forEach((col, i) => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   ${i + 1}. ${col.column_name}`);
        console.log(`      Tipo: ${col.data_type} ${nullable}`);
        if (col.column_default) {
          console.log(`      Default: ${col.column_default.substring(0, 50)}...`);
        }
      });
      
      // Contar registros
      const [count] = await sequelize.query(`SELECT COUNT(*) as c FROM "${table}"`);
      console.log(`\n   📊 Registros actuales: ${count[0].c}`);
    }
    
    // Mostrar un registro de ejemplo de specialties
    console.log('\n\n📋 EJEMPLO: Un registro de specialties');
    console.log('─'.repeat(60));
    const [example] = await sequelize.query(`SELECT * FROM specialties LIMIT 1`);
    
    if (example.length > 0) {
      Object.entries(example[0]).forEach(([key, value]) => {
        const displayValue = value ? String(value).substring(0, 50) : 'null';
        console.log(`   ${key}: ${displayValue}${String(value).length > 50 ? '...' : ''}`);
      });
    }
    
    await sequelize.close();
    
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ ESTRUCTURA VERIFICADA');
    console.log('='.repeat(60));
    console.log('\nAhora sabemos exactamente qué columnas tenemos.');
    console.log('Puedo crear un script de pruebas que use los nombres correctos.\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

verEstructura();