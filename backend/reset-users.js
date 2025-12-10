// Script para resetear usuarios de prueba y comenzar limpio
const { sequelize } = require('./src/models/index');

async function resetUsers() {
  try {
    console.log('🧹 Limpiando base de datos de usuarios de prueba...');

    // Eliminar todos los registros de perfiles y usuarios
    await sequelize.query('DELETE FROM doctor_profiles');
    await sequelize.query('DELETE FROM patient_profiles');
    await sequelize.query('DELETE FROM users');

    // Reiniciar secuencias de autoincremento
    await sequelize.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await sequelize.query('ALTER SEQUENCE doctor_profiles_id_seq RESTART WITH 1');
    await sequelize.query('ALTER SEQUENCE patient_profiles_id_seq RESTART WITH 1');

    console.log('✅ Base de datos limpia - listo para comenzar de cero');
    console.log('');
    console.log('📊 Estadísticas:');
    console.log('   - Usuarios: 0');
    console.log('   - Perfiles de médicos: 0');
    console.log('   - Perfiles de pacientes: 0');
    console.log('');
    console.log('✅ Puedes registrar nuevos usuarios desde http://localhost:5173/registro');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error reseteando usuarios:', error);
    process.exit(1);
  }
}

resetUsers();
