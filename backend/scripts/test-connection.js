require('dotenv').config();
const { Sequelize } = require('sequelize');

async function testConnection() {
  try {
    console.log('🧪 Probando conexión a PostgreSQL...');
    console.log('📋 Configuración:');
    console.log('   Host:', process.env.DB_HOST);
    console.log('   Port:', process.env.DB_PORT);
    console.log('   Database:', process.env.DB_NAME);
    console.log('   User:', process.env.DB_USER);

    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: console.log
      }
    );

    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL exitosa!');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔧 Solución:');
    console.log('   1. Verifica que PostgreSQL esté corriendo');
    console.log('   2. Revisa las credenciales en .env');
    console.log('   3. Asegúrate de que la base de datos exista');
    process.exit(1);
  }
}

testConnection();