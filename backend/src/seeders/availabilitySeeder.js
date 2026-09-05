// src/seeders/availabilitySeeder.js
// CITAMED.VE - M03 - Seeder de disponibilidad de demostración
// Crea el horario semanal del médico de prueba (Lun-Vie, 9-13 y 14-17, citas de 30 min)
// Uso: node src/seeders/availabilitySeeder.js

require('dotenv').config();

const { sequelize, User, DoctorProfile, DoctorAvailability } = require('../models');

const HORARIOS = [];
for (let dia = 1; dia <= 5; dia++) {
  // 1=Lunes ... 5=Viernes
  HORARIOS.push({
    dayOfWeek: dia,
    startTime: '09:00:00',
    endTime: '13:00:00',
    slotDuration: 30,
    locationName: 'Consultorio 502 - Centro Médico Caracas',
    consultationType: 'presencial',
  });
  HORARIOS.push({
    dayOfWeek: dia,
    startTime: '14:00:00',
    endTime: '17:00:00',
    slotDuration: 30,
    locationName: 'Consultorio 502 - Centro Médico Caracas',
    consultationType: 'presencial',
  });
}

async function seedAvailability() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a base de datos establecida');

    const doctor = await User.findOne({
      where: { email: 'doctor@citamed.ve' },
      include: [{ model: DoctorProfile, as: 'doctorProfile' }],
    });

    if (!doctor || !doctor.doctorProfile) {
      console.error('❌ No se encontró el doctor de prueba (doctor@citamed.ve). Ejecuta primero usersSeeder.js');
      process.exit(1);
    }

    const doctorProfileId = doctor.doctorProfile.id;
    console.log(`Médico: ${doctor.firstName} ${doctor.lastName} (perfil ID: ${doctorProfileId})`);

    const existentes = await DoctorAvailability.count({ where: { doctorProfileId, isActive: true } });
    if (existentes > 0) {
      console.log(`⏭️  El médico ya tiene ${existentes} horarios activos, saltando...`);
      process.exit(0);
    }

    await DoctorAvailability.setWeeklySchedule(doctorProfileId, HORARIOS);
    console.log(`✅ Disponibilidad creada: Lun-Vie 9:00-13:00 y 14:00-17:00 (${HORARIOS.length} bloques, citas de 30 min)`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeder de disponibilidad:', error.message);
    process.exit(1);
  }
}

seedAvailability();
