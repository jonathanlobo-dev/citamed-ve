require('dotenv').config();
/**
 * Users Seeder - CITAMED.VE
 *
 * Crea usuarios de prueba para desarrollo y testing
 *
 * Uso: node src/seeders/usersSeeder.js
 */

const bcrypt = require('bcryptjs');
const { sequelize, User, PatientProfile, DoctorProfile, ProviderProfile, Specialty } = require('../models');

// Usuarios de prueba
const testUsers = [
  {
    email: 'admin@citamed.ve',
    password: 'Admin123!',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
    status: 'active',
    emailVerified: true
  },
  {
    email: 'paciente@citamed.ve',
    password: 'Paciente123!',
    firstName: 'Juan',
    lastName: 'PÃ©rez',
    role: 'patient',
    status: 'active',
    emailVerified: true,
    profile: {
      firstName: 'Juan',
      lastName: 'PÃ©rez',
      identificationNumber: 'V-12345678',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      phone: '04121234567',
      bloodType: 'O+',
      allergies: [],
      chronicConditions: [],
      emergencyContactName: 'MarÃ­a PÃ©rez',
      emergencyContactPhone: '04141234567'
    }
  },
  {
    email: 'doctor@citamed.ve',
    password: 'Doctor123!',
    firstName: 'MarÃ­a',
    lastName: 'GonzÃ¡lez',
    role: 'doctor',
    status: 'active',
    emailVerified: true,
    profile: {
      firstName: 'María',
      lastName: 'González',
      identificationNumber: 'V-87654321',
      licenseNumber: 'MPPS-88888',
      phone: '04241234567',
      mppsNumber: 'MPPS-88888',
      colegioDoctorNumber: 'CMD-54321',
      university: 'Universidad Central de Venezuela',
      graduationYear: 2010,
      yearsOfExperience: 14,
      consultationAddress: 'Centro Médico Caracas, Piso 5, Consultorio 502',
      city: 'Caracas',
      state: 'Distrito Capital',
      consultationFee: 50.00,
      followUpFee: 30.00,
      acceptsInsurance: true,
      biography: 'Médico especialista con más de 14 años de experiencia.',
      profileStatus: 'active',
      isVerified: true,
      verificationStatus: 'approved',
      acceptingNewPatients: true
    }
  },
  {
    email: 'proveedor@citamed.ve',
    password: 'Proveedor123!',
    firstName: 'Carlos',
    lastName: 'RodrÃ­guez',
    role: 'provider',
    status: 'active',
    emailVerified: true,
    profile: {
      companyName: 'Farmacia Central',
      rif: 'J-12345678-9',
      legalName: 'Farmacia Central C.A.',
      providerType: 'pharmacy',
      commercialPhone: '02121234567',
      contactEmail: 'contacto@farmaciacentral.ve',
      mainAddress: 'Av. Principal, Centro Comercial Plaza',
      city: 'Caracas',
      state: 'Distrito Capital',
      description: 'Farmacia con mÃ¡s de 20 aÃ±os de experiencia'
    }
  }
];

async function seedUsers() {
  console.log('ðŸŒ± Iniciando seeder de usuarios...\n');

  try {
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('âœ… ConexiÃ³n a base de datos establecida\n');

    // Obtener una especialidad para el doctor
    let specialty = await Specialty.findOne({ where: { isActive: true } });
    if (!specialty) {
      console.log('âš ï¸ No hay especialidades, creando una de prueba...');
      specialty = await Specialty.create({
        name: 'Medicina General',
        description: 'AtenciÃ³n mÃ©dica primaria',
        isActive: true
      });
    }

    for (const userData of testUsers) {
      console.log(`ðŸ“ Procesando: ${userData.email}`);

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        console.log(`   â­ï¸  Usuario ya existe, saltando...\n`);
        continue;
      }


      // Crear usuario
      const user = await User.create({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        status: userData.status,
        emailVerified: userData.emailVerified
      });

      console.log(`   âœ… Usuario creado (ID: ${user.id})`);

      // Crear perfil segÃºn el rol
      if (userData.role === 'patient' && userData.profile) {
        await PatientProfile.create({
          userId: user.id,
          ...userData.profile
        });
        console.log(`   âœ… Perfil de paciente creado`);
      }

      if (userData.role === 'doctor' && userData.profile) {
        await DoctorProfile.create({
          userId: user.id,
          specialtyId: specialty.id,
          ...userData.profile
        });
        console.log(`   âœ… Perfil de doctor creado`);
      }

      if (userData.role === 'provider' && userData.profile) {
        await ProviderProfile.create({
          userId: user.id,
          ...userData.profile
        });
        console.log(`   âœ… Perfil de proveedor creado`);
      }

      console.log(`   ðŸ”‘ Credenciales: ${userData.email} / ${userData.password}\n`);
    }

    console.log('â•'.repeat(50));
    console.log('âœ… SEEDER COMPLETADO\n');
    console.log('USUARIOS DE PRUEBA:');
    console.log('â”€'.repeat(50));
    console.log('ðŸ‘¤ Admin:     admin@citamed.ve     / Admin123!');
    console.log('ðŸ‘¤ Paciente:  paciente@citamed.ve  / Paciente123!');
    console.log('ðŸ‘¤ Doctor:    doctor@citamed.ve    / Doctor123!');
    console.log('ðŸ‘¤ Proveedor: proveedor@citamed.ve / Proveedor123!');
    console.log('â•'.repeat(50));

  } catch (error) {
    console.error('âŒ Error en seeder:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Ejecutar
seedUsers();
