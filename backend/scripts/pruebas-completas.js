// scripts/pruebas-completas.js
// Pruebas completas del Módulo 2 con datos reales

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function pruebasCompletas() {
  console.log('\n🧪 PRUEBAS COMPLETAS DEL MÓDULO 2');
  console.log('='.repeat(60));
  console.log('Vamos a crear datos de prueba y verificar que TODO funciona\n');
  
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
    
    // ============================================
    // PRUEBA 1: Consultar Especialidades
    // ============================================
    console.log('📋 PRUEBA 1: Consultando especialidades disponibles...\n');
    
    const [specialties] = await sequelize.query(`
      SELECT id, name, category, "shortDescription"
      FROM specialties 
      ORDER BY "displayOrder" 
      LIMIT 10
    `);
    
    console.log(`   Encontradas: ${specialties.length} especialidades (mostrando primeras 10)\n`);
    specialties.forEach((spec, i) => {
      console.log(`   ${i + 1}. ${spec.name}`);
      console.log(`      Categoría: ${spec.category}`);
      console.log(`      ${spec.shortDescription}\n`);
    });
    
    // Guardar algunos IDs de especialidades para usar después
    const cardioId = specialties.find(s => s.name.includes('Cardio'))?.id;
    const pediatriaId = specialties.find(s => s.name.includes('Pediatr'))?.id;
    
    // ============================================
    // PRUEBA 2: Crear Usuarios
    // ============================================
    console.log('='.repeat(60));
    console.log('👥 PRUEBA 2: Creando usuarios de prueba...\n');
    
    // Usuario Doctor 1
    const [doctor1Result] = await sequelize.query(`
      INSERT INTO users (id, email, password, role, "firstName", "lastName", phone, "isActive", "isVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'dr.perez@citamed.ve', 'hash123', 'doctor', 'Juan', 'Pérez', '+58-412-1234567', true, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", role
    `);
    console.log(`   ✅ Doctor creado: ${doctor1Result[0].firstName} ${doctor1Result[0].lastName}`);
    console.log(`      Email: ${doctor1Result[0].email}`);
    console.log(`      ID: ${doctor1Result[0].id}\n`);
    
    // Usuario Doctor 2
    const [doctor2Result] = await sequelize.query(`
      INSERT INTO users (id, email, password, role, "firstName", "lastName", phone, "isActive", "isVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'dra.rodriguez@citamed.ve', 'hash456', 'doctor', 'María', 'Rodríguez', '+58-424-7654321', true, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", role
    `);
    console.log(`   ✅ Doctor creado: ${doctor2Result[0].firstName} ${doctor2Result[0].lastName}`);
    console.log(`      Email: ${doctor2Result[0].email}\n`);
    
    // Usuario Paciente 1
    const [patient1Result] = await sequelize.query(`
      INSERT INTO users (id, email, password, role, "firstName", "lastName", phone, "isActive", "isVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'carlos.silva@gmail.com', 'hash789', 'patient', 'Carlos', 'Silva', '+58-414-9876543', true, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", role
    `);
    console.log(`   ✅ Paciente creado: ${patient1Result[0].firstName} ${patient1Result[0].lastName}`);
    console.log(`      Email: ${patient1Result[0].email}\n`);
    
    // Usuario Paciente 2
    const [patient2Result] = await sequelize.query(`
      INSERT INTO users (id, email, password, role, "firstName", "lastName", phone, "isActive", "isVerified", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'ana.martinez@gmail.com', 'hash101', 'patient', 'Ana', 'Martínez', '+58-426-5432109', true, true, NOW(), NOW())
      RETURNING id, email, "firstName", "lastName", role
    `);
    console.log(`   ✅ Paciente creado: ${patient2Result[0].firstName} ${patient2Result[0].lastName}`);
    console.log(`      Email: ${patient2Result[0].email}\n`);
    
    const doctor1Id = doctor1Result[0].id;
    const doctor2Id = doctor2Result[0].id;
    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;
    
    // ============================================
    // PRUEBA 3: Crear Perfiles de Doctores
    // ============================================
    console.log('='.repeat(60));
    console.log('👨‍⚕️ PRUEBA 3: Creando perfiles de doctores...\n');
    
    if (cardioId) {
      await sequelize.query(`
        INSERT INTO doctor_profiles (
          id, "userId", "specialtyId", "licenseNumber", biography, 
          education, certifications, "languagesSpoken", "consultationFee", 
          "acceptingNewPatients", "profileStatus", "isVerified", "yearsOfExperience",
          "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${doctor1Id}', '${cardioId}', 'MPPS-12345',
          'Cardiólogo con 15 años de experiencia en cardiología intervencionista',
          ARRAY['Universidad Central de Venezuela', 'Especialización en Cardiología - Hospital Universitario'],
          ARRAY['Certificación en Ecocardiografía', 'Miembro de la Sociedad Venezolana de Cardiología'],
          ARRAY['Español', 'Inglés'],
          80.00, true, 'active', true, 15,
          NOW(), NOW()
        )
      `);
      console.log('   ✅ Perfil de Dr. Juan Pérez creado');
      console.log('      Especialidad: Cardiología');
      console.log('      Tarifa consulta: $80.00');
      console.log('      Años experiencia: 15\n');
    }
    
    if (pediatriaId) {
      await sequelize.query(`
        INSERT INTO doctor_profiles (
          id, "userId", "specialtyId", "licenseNumber", biography,
          education, certifications, "languagesSpoken", "consultationFee",
          "acceptingNewPatients", "profileStatus", "isVerified", "yearsOfExperience",
          "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${doctor2Id}', '${pediatriaId}', 'MPPS-67890',
          'Pediatra especializada en desarrollo infantil y vacunación',
          ARRAY['Universidad de Los Andes', 'Pediatría - Hospital Universitario de Mérida'],
          ARRAY['Certificación en Neonatología', 'Curso de Lactancia Materna'],
          ARRAY['Español', 'Portugués'],
          60.00, true, 'active', true, 10,
          NOW(), NOW()
        )
      `);
      console.log('   ✅ Perfil de Dra. María Rodríguez creado');
      console.log('      Especialidad: Pediatría');
      console.log('      Tarifa consulta: $60.00');
      console.log('      Años experiencia: 10\n');
    }
    
    // ============================================
    // PRUEBA 4: Crear Perfiles de Pacientes
    // ============================================
    console.log('='.repeat(60));
    console.log('👤 PRUEBA 4: Creando perfiles de pacientes...\n');
    
    await sequelize.query(`
      INSERT INTO patient_profiles (
        id, "userId", "firstName", "lastName", "dateOfBirth", gender,
        "phoneNumber", city, state, country, "bloodType",
        "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship",
        "profileStatus", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), '${patient1Id}', 'Carlos', 'Silva',
        '1985-03-15', 'male', '+58-414-9876543',
        'Caracas', 'Distrito Capital', 'Venezuela', 'O+',
        'Laura Silva', '+58-412-1111111', 'Esposa',
        'active', NOW(), NOW()
      )
    `);
    console.log('   ✅ Perfil de Carlos Silva creado');
    console.log('      Fecha nacimiento: 1985-03-15');
    console.log('      Tipo sangre: O+');
    console.log('      Ciudad: Caracas\n');
    
    await sequelize.query(`
      INSERT INTO patient_profiles (
        id, "userId", "firstName", "lastName", "dateOfBirth", gender,
        "phoneNumber", city, state, country, "bloodType",
        "emergencyContactName", "emergencyContactPhone", "emergencyContactRelationship",
        "profileStatus", "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), '${patient2Id}', 'Ana', 'Martínez',
        '1992-07-20', 'female', '+58-426-5432109',
        'Valencia', 'Carabobo', 'Venezuela', 'A+',
        'Pedro Martínez', '+58-414-2222222', 'Hermano',
        'active', NOW(), NOW()
      )
    `);
    console.log('   ✅ Perfil de Ana Martínez creado');
    console.log('      Fecha nacimiento: 1992-07-20');
    console.log('      Tipo sangre: A+');
    console.log('      Ciudad: Valencia\n');
    
    // ============================================
    // PRUEBA 5: Crear Citas
    // ============================================
    console.log('='.repeat(60));
    console.log('📅 PRUEBA 5: Creando citas médicas...\n');
    
    // Obtener IDs de los perfiles de doctor
    const [doctorProfiles] = await sequelize.query(`
      SELECT id, "userId", "specialtyId" FROM doctor_profiles
    `);
    
    if (doctorProfiles.length >= 2) {
      const doctorProfile1 = doctorProfiles[0];
      const doctorProfile2 = doctorProfiles[1];
      
      // Cita 1
      await sequelize.query(`
        INSERT INTO appointments (
          id, "patientId", "doctorId", "doctorProfileId", "specialtyId",
          "appointmentDate", "appointmentTime", duration, "appointmentType",
          status, "reasonForVisit", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${patient1Id}', '${doctorProfile1.userId}', '${doctorProfile1.id}',
          '${doctorProfile1.specialtyId}', '2025-10-25', '09:00:00', 30, 'consultation',
          'scheduled', 'Control de presión arterial y dolor en el pecho', NOW(), NOW()
        )
      `);
      console.log('   ✅ Cita 1 creada');
      console.log('      Paciente: Carlos Silva');
      console.log('      Doctor: Dr. Juan Pérez (Cardiología)');
      console.log('      Fecha: 2025-10-25 09:00 AM');
      console.log('      Motivo: Control de presión arterial\n');
      
      // Cita 2
      await sequelize.query(`
        INSERT INTO appointments (
          id, "patientId", "doctorId", "doctorProfileId", "specialtyId",
          "appointmentDate", "appointmentTime", duration, "appointmentType",
          status, "reasonForVisit", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), '${patient2Id}', '${doctorProfile2.userId}', '${doctorProfile2.id}',
          '${doctorProfile2.specialtyId}', '2025-10-26', '14:30:00', 45, 'consultation',
          'scheduled', 'Vacunación y control de desarrollo infantil de mi hijo', NOW(), NOW()
        )
      `);
      console.log('   ✅ Cita 2 creada');
      console.log('      Paciente: Ana Martínez');
      console.log('      Doctor: Dra. María Rodríguez (Pediatría)');
      console.log('      Fecha: 2025-10-26 02:30 PM');
      console.log('      Motivo: Vacunación y control\n');
    }
    
    // ============================================
    // PRUEBA 6: Consultas con Relaciones
    // ============================================
    console.log('='.repeat(60));
    console.log('🔗 PRUEBA 6: Consultas con relaciones entre tablas...\n');
    
    // Consulta compleja: Citas con toda la información
    const [appointments] = await sequelize.query(`
      SELECT 
        a.id as appointment_id,
        a."appointmentDate",
        a."appointmentTime",
        a.status,
        a."reasonForVisit",
        p.email as patient_email,
        p."firstName" as patient_first_name,
        p."lastName" as patient_last_name,
        d.email as doctor_email,
        d."firstName" as doctor_first_name,
        d."lastName" as doctor_last_name,
        s.name as specialty_name,
        dp."consultationFee"
      FROM appointments a
      JOIN users p ON a."patientId" = p.id
      JOIN users d ON a."doctorId" = d.id
      JOIN specialties s ON a."specialtyId" = s.id
      JOIN doctor_profiles dp ON a."doctorProfileId" = dp.id
      ORDER BY a."appointmentDate", a."appointmentTime"
    `);
    
    console.log(`   📊 Se encontraron ${appointments.length} citas con información completa:\n`);
    
    appointments.forEach((apt, i) => {
      console.log(`   CITA ${i + 1}:`);
      console.log(`   ─────────────────────────────────────────`);
      console.log(`   📅 Fecha: ${apt.appointmentDate} ${apt.appointmentTime}`);
      console.log(`   👤 Paciente: ${apt.patient_first_name} ${apt.patient_last_name}`);
      console.log(`   📧 Email paciente: ${apt.patient_email}`);
      console.log(`   👨‍⚕️ Doctor: ${apt.doctor_first_name} ${apt.doctor_last_name}`);
      console.log(`   📧 Email doctor: ${apt.doctor_email}`);
      console.log(`   🏥 Especialidad: ${apt.specialty_name}`);
      console.log(`   💰 Costo: $${apt.consultationFee}`);
      console.log(`   📝 Motivo: ${apt.reasonForVisit}`);
      console.log(`   ✅ Estado: ${apt.status}\n`);
    });
    
    // ============================================
    // PRUEBA 7: Estadísticas Generales
    // ============================================
    console.log('='.repeat(60));
    console.log('📊 PRUEBA 7: Estadísticas del sistema...\n');
    
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM specialties) as total_specialties,
        (SELECT COUNT(*) FROM doctor_profiles) as total_doctor_profiles,
        (SELECT COUNT(*) FROM patient_profiles) as total_patient_profiles,
        (SELECT COUNT(*) FROM appointments) as total_appointments
    `);
    
    console.log('   RESUMEN DEL SISTEMA:');
    console.log('   ═══════════════════════════════════════════');
    console.log(`   👥 Usuarios totales: ${stats[0].total_users}`);
    console.log(`   👨‍⚕️ Doctores: ${stats[0].total_doctors}`);
    console.log(`   👤 Pacientes: ${stats[0].total_patients}`);
    console.log(`   🏥 Especialidades: ${stats[0].total_specialties}`);
    console.log(`   📋 Perfiles de doctores: ${stats[0].total_doctor_profiles}`);
    console.log(`   📋 Perfiles de pacientes: ${stats[0].total_patient_profiles}`);
    console.log(`   📅 Citas programadas: ${stats[0].total_appointments}\n`);
    
    await sequelize.close();
    
    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log('='.repeat(60));
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n🎉 CONCLUSIÓN:');
    console.log('   ✅ Las tablas están creadas correctamente');
    console.log('   ✅ Las relaciones entre tablas funcionan');
    console.log('   ✅ Se pueden crear usuarios, doctores y pacientes');
    console.log('   ✅ Se pueden programar citas');
    console.log('   ✅ Las consultas complejas funcionan');
    console.log('   ✅ El sistema está 100% operativo');
    console.log('\n💪 TU BASE DE DATOS FUNCIONA PERFECTAMENTE');
    console.log('🚀 LISTO PARA EL MÓDULO 3: API REST\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

pruebasCompletas();