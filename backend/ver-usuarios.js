// ver-usuarios.js
require('dotenv').config();
const { User } = require('./src/models/index');

async function verUsuarios() {
  try {
    const usuarios = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log('\n========================================');
    console.log('👥 USUARIOS REGISTRADOS EN CITAMED.VE');
    console.log('========================================\n');
    
    console.table(usuarios.map(u => ({
      ID: u.id,
      Nombre: `${u.firstName} ${u.lastName}`,
      Email: u.email,
      Teléfono: u.phone,
      Rol: u.role,
      Activo: u.isActive ? '✅' : '❌',
      Registrado: u.createdAt.toLocaleDateString('es-VE')
    })));

    console.log(`\n📊 Total: ${usuarios.length} usuarios\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verUsuarios();
