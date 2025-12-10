const { sequelize, User, PatientProfile, DoctorProfile } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conectado a la base de datos\n');

    const users = await User.findAll({
      order: [['createdAt', 'DESC']]
    });

    if (users.length === 0) {
      console.log('⚠️  No hay usuarios registrados en la base de datos\n');
      console.log('💡 SUGERENCIA: Crea usuarios de prueba usando el formulario de registro:\n');
      console.log('   http://localhost:5173/registro\n');
    } else {
      console.log('📋 USUARIOS REGISTRADOS EN CITAMED.VE\n');
      console.log('='.repeat(80));

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        console.log(`\n[${i + 1}] ROL: ${user.role.toUpperCase()}`);
        console.log('   📧 Email: ' + user.email);
        console.log('   🔑 Password: (la que usaste al registrarte)');

        // Obtener perfil según el rol
        if (user.role === 'doctor') {
          const profile = await DoctorProfile.findOne({ where: { userId: user.id } });
          if (profile) {
            console.log('   👤 Nombre: ' + profile.name);
            console.log('   🏥 Especialidad: ' + (profile.specialty || 'N/A'));
            console.log('   📋 Matrícula: ' + (profile.licenseNumber || 'N/A'));
          }
        } else if (user.role === 'patient') {
          const profile = await PatientProfile.findOne({ where: { userId: user.id } });
          if (profile) {
            console.log('   👤 Nombre: ' + profile.name);
            console.log('   🩸 Tipo de Sangre: ' + (profile.bloodType || 'N/A'));
          }
        } else if (user.role === 'provider') {
          // Consulta directa a la tabla
          const [results] = await sequelize.query(
            'SELECT * FROM "ProviderProfiles" WHERE "userId" = :userId',
            { replacements: { userId: user.id } }
          );
          if (results.length > 0) {
            const profile = results[0];
            console.log('   👤 Nombre: ' + (profile.name || 'N/A'));
            console.log('   🏢 Empresa: ' + (profile.companyName || 'N/A'));
            console.log('   📦 Tipo: ' + (profile.providerType || 'N/A'));
          }
        }

        console.log('   📅 Registrado: ' + user.createdAt.toLocaleString('es-VE'));
        console.log('   ' + '-'.repeat(75));
      }

      console.log(`\n✅ Total de usuarios: ${users.length}\n`);
      console.log('📝 INSTRUCCIONES PARA INGRESAR:\n');
      console.log('   1. Ve a: http://localhost:5173/login');
      console.log('   2. Ingresa el EMAIL del usuario que deseas probar');
      console.log('   3. Ingresa la CONTRASEÑA que usaste al registrarte');
      console.log('   4. El sistema te redirigirá automáticamente al dashboard según tu rol\n');
      console.log('🎯 DASHBOARDS POR ROL:\n');
      console.log('   • Paciente → /dashboard');
      console.log('   • Médico → /medico/dashboard');
      console.log('   • Proveedor → /proveedor/dashboard\n');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
