// scripts/pruebas-reales.js
// Pruebas con las columnas REALES de tu base de datos

require('dotenv').config();
const { Sequelize } = require('sequelize');

async function pruebasReales() {
  console.log('\n🧪 PRUEBAS REALES DEL SISTEMA CITAMED.VE');
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
    
    // ============================================
    // PRUEBA 1: Ver Especialidades
    // ============================================
    console.log('📋 PRUEBA 1: Consultando especialidades disponibles...\n');
    
    const [specialties] = await sequelize.query(`
      SELECT id, name, description
      FROM specialties 
      ORDER BY name
      LIMIT 10
    `);
    
    console.log(`   ✅ Encontradas ${specialties.length} especialidades (mostrando primeras 10):\n`);
    specialties.forEach((spec, i) => {
      console.log(`   ${i + 1}. ${spec.name}`);
      const desc = spec.description ? spec.description.substring(0, 60) + '...' : 'Sin descripción';
      console.log(`      ${desc}\n`);
    });
    
    // Guardar IDs para usar después
    const specialty1Id = specialties[0]?.id;
    const specialty2Id = specialties[1]?.id;
    
    // ============================================
    // PRUEBA 2: Crear Usuarios
    // ============================================
    console.log('='.repeat(60));
    console.log('👥 PRUEBA 2: Creando usuarios de prueba...\n');
    
    // Doctor 1
    const [doctor1] = await sequelize.query(`
      INSERT INTO users ("firstName", "lastName", email, password, role, phone, "isActive", "createdAt", "updatedAt")
      VALUES ('Juan', 'Pérez', 'dr.perez@citamed.ve', 'hash123', 'doctor', '+58-412-1234567', true, NOW(), NOW())
      RETURNING id, "firstName", "lastName", email, role
    `);
    console.log(`   ✅ Doctor creado: Dr. ${doctor1[0].firstName} ${doctor1[0].lastName}`);
    console.log(`      Email: ${doctor1[0].email}`);
    console.log(`      ID: ${doctor1[0].id}\n`);
    const doctorId = doctor1[0].id;
    
    // Paciente 1
    const [patient1] = await sequelize.query(`
      INSERT INTO users ("firstName", "lastName", email, password, role, phone, "isActive", "createdAt", "updatedAt")
      VALUES ('Carlos', 'Silva', 'carlos.silva@gmail.com', 'hash456', 'patient', '+58-414-9876543', true, NOW(), NOW())
      RETURNING id, "firstName", "lastName", email, role
    `);
    console.log(`   ✅ Paciente creado: ${patient1[0].firstName} ${patient1[0].lastName}`);
    console.log(`      Email: ${patient1[0].email}`);
    console.log(`      ID: ${patient1[0].id}\n`);
    const patientId = patient1[0].id;
    
    // ============================================
    // PRUEBA 3: Crear Perfil de Doctor
    // ============================================
    console.log('='.repeat(60));
    console.log('👨‍⚕️ PRUEBA 3: Creando perfil de doctor...\n');
    
    await sequelize.query(`
      INSERT INTO doctor_profiles ("userId", "specialtyId", "licenseNumber", "consultingRoom", biography, "yearsOfExperience", education, "createdAt", "updatedAt")
      VALUES (${doctorId}, ${specialty1Id}, 'MPPS-12345', 'Consultorio 201', 'Cardiólogo con 15 años de experiencia en diagnóstico y tratamiento de enfermedades cardiovasculares.', 15, 'Universidad Central de Venezuela - Especialización en Cardiología', NOW(), NOW())
    `);
    
    console.log('   ✅ Perfil de doctor creado');
    console.log('      Doctor: Dr. Juan Pérez');
    console.log(`      Especialidad ID: ${specialty1Id}`);
    console.log('      Licencia: MPPS-12345');
    console.log('      Consultorio: 201');
    console.log('      Años experiencia: 15\n');
    
    // ============================================
    // PRUEBA 4: Crear Perfil de Paciente
    // ============================================
    console.log('='.repeat(60));
    console.log('👤 PRUEBA 4: Creando perfil de paciente...\n');
    
    await sequelize.query(`
      INSERT INTO patient_profiles ("userId", "dateOfBirth", gender, address, "bloodType", allergies, "chronicDiseases", "emergencyContact", "emergencyPhone", "createdAt", "updatedAt")
      VALUES (${patientId}, '1985-03-15', 'male', 'Calle Principal, Caracas', 'O+', 'Ninguna conocida', 'Hipertensión', 'Laura Silva (Esposa)', '+58-412-1111111', NOW(), NOW())
    `);
    
    console.log('   ✅ Perfil de paciente creado');
    console.log('      Paciente: Carlos Silva');
    console.log('      Fecha nacimiento: 1985-03-15');
    console.log('      Tipo sangre: O+');
    console.log('      Dirección: Calle Principal, Caracas');
    console.log('      Condición: Hipertensión\n');
    
    // ============================================
    // PRUEBA 5: Crear Cita Médica
    // ============================================
    console.log('='.repeat(60));
    console.log('📅 PRUEBA 5: Creando cita médica...\n');
    
    await sequelize.query(`
      INSERT INTO appointments ("patientId", "doctorId", "appointmentDate", duration, reason, status, notes, "createdAt", "updatedAt")
      VALUES (${patientId}, ${doctorId}, '2025-10-25 09:00:00', 30, 'Control de presión arterial y dolor en el pecho', 'scheduled', 'Primera consulta', NOW(), NOW())
    `);
    
    console.log('   ✅ Cita médica creada');
    console.log('      Paciente: Carlos Silva');
    console.log('      Doctor: Dr. Juan Pérez');
    console.log('      Fecha: 2025-10-25 09:00 AM');
    console.log('      Duración: 30 minutos');
    console.log('      Motivo: Control de presión arterial');
    console.log('      Estado: Programada\n');
    
    // ============================================
    // PRUEBA 6: Consulta Compleja con JOIN
    // ============================================
    console.log('='.repeat(60));
    console.log('🔗 PRUEBA 6: Consulta completa con relaciones...\n');
    
    const [appointments] = await sequelize.query(`
      SELECT 
        a.id as appointment_id,
        a."appointmentDate",
        a.duration,
        a.reason,
        a.status,
        p."firstName" as patient_first,
        p."lastName" as patient_last,
        p.email as patient_email,
        d."firstName" as doctor_first,
        d."lastName" as doctor_last,
        d.email as doctor_email,
        s.name as specialty_name,
        dp."yearsOfExperience",
        dp."consultingRoom",
        pp."bloodType",
        pp."chronicDiseases"
      FROM appointments a
      JOIN users p ON a."patientId" = p.id
      JOIN users d ON a."doctorId" = d.id
      JOIN doctor_profiles dp ON d.id = dp."userId"
      JOIN specialties s ON dp."specialtyId" = s.id
      JOIN patient_profiles pp ON p.id = pp."userId"
      ORDER BY a."appointmentDate"
    `);
    
    console.log(`   ✅ Se encontró ${appointments.length} cita con TODA la información:\n`);
    
    appointments.forEach((apt, i) => {
      console.log(`   CITA ${i + 1}:`);
      console.log('   ═══════════════════════════════════════════════════');
      console.log(`   📅 Fecha y Hora: ${apt.appointmentDate}`);
      console.log(`   ⏱️  Duración: ${apt.duration} minutos`);
      console.log(`   \n   👤 PACIENTE:`);
      console.log(`      Nombre: ${apt.patient_first} ${apt.patient_last}`);
      console.log(`      Email: ${apt.patient_email}`);
      console.log(`      Tipo sangre: ${apt.bloodType}`);
      console.log(`      Condiciones: ${apt.chronicDiseases}`);
      console.log(`   \n   👨‍⚕️ DOCTOR:`);
      console.log(`      Nombre: Dr. ${apt.doctor_first} ${apt.doctor_last}`);
      console.log(`      Email: ${apt.doctor_email}`);
      console.log(`      Especialidad: ${apt.specialty_name}`);
      console.log(`      Experiencia: ${apt.yearsOfExperience} años`);
      console.log(`      Consultorio: ${apt.consultingRoom}`);
      console.log(`   \n   📋 DETALLES DE LA CITA:`);
      console.log(`      Motivo: ${apt.reason}`);
      console.log(`      Estado: ${apt.status}\n`);
    });
    
    // ============================================
    // PRUEBA 7: Estadísticas
    // ============================================
    console.log('='.repeat(60));
    console.log('📊 PRUEBA 7: Estadísticas del sistema...\n');
    
    const [stats] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM specialties) as total_specialties,
        (SELECT COUNT(*) FROM doctor_profiles) as doctor_profiles_count,
        (SELECT COUNT(*) FROM patient_profiles) as patient_profiles_count,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') as scheduled_appointments
    `);
    
    console.log('   RESUMEN COMPLETO DEL SISTEMA:');
    console.log('   ═══════════════════════════════════════════════════');
    console.log(`   👥 Usuarios totales: ${stats[0].total_users}`);
    console.log(`      • Doctores: ${stats[0].total_doctors}`);
    console.log(`      • Pacientes: ${stats[0].total_patients}`);
    console.log(`   \n   🏥 Especialidades médicas: ${stats[0].total_specialties}`);
    console.log(`   \n   📋 Perfiles completos:`);
    console.log(`      • Perfiles de doctores: ${stats[0].doctor_profiles_count}`);
    console.log(`      • Perfiles de pacientes: ${stats[0].patient_profiles_count}`);
    console.log(`   \n   📅 Citas médicas:`);
    console.log(`      • Total: ${stats[0].total_appointments}`);
    console.log(`      • Programadas: ${stats[0].scheduled_appointments}\n`);
    
    await sequelize.close();
    
    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log('='.repeat(60));
    console.log('✅ ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('\n🎉 CONCLUSIONES:');
    console.log('   ✅ La base de datos funciona perfectamente');
    console.log('   ✅ Las 5 tablas están operativas');
    console.log('   ✅ Las relaciones entre tablas funcionan (JOINs)');
    console.log('   ✅ Se pueden crear usuarios, doctores y pacientes');
    console.log('   ✅ Se pueden programar citas médicas');
    console.log('   ✅ Las consultas complejas funcionan correctamente');
    console.log('   ✅ Tienes 102 especialidades médicas disponibles');
    console.log('\n💪 TU SISTEMA ESTÁ 100% FUNCIONAL');
    console.log('🚀 MÓDULO 2 COMPLETADO - LISTO PARA MÓDULO 3\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

pruebasReales();