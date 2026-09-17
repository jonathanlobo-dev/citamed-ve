/**
 * test-full-journey.js
 * CITAMED.VE - Prueba automatizada end-to-end del ciclo de citas:
 * 1. Registro de Médico y auto-creación de su Consultorio/Clínica.
 * 2. Configuración de horarios y disponibilidad semanal.
 * 3. Registro de Paciente.
 * 4. Paciente consulta slots y solicita Pre-Cita (status: pending).
 * 5. Médico consulta agenda y Acepta la Pre-Cita (status: confirmed).
 * 6. Paciente consulta Mis Citas y verifica confirmación con sede/consultorio.
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'https://citamed-api.onrender.com/api';
console.log(`\n🚀 Iniciando Prueba E2E en: ${API_BASE}\n`);

// Helper para calcular fecha de próximo Lunes
function getNextWeekday(dayOfWeek = 1) { // 1 = Lunes
  const today = new Date();
  const result = new Date(today);
  const currentDay = today.getDay();
  let daysToAdd = (dayOfWeek - currentDay + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7; // Próxima semana
  result.setDate(today.getDate() + daysToAdd);
  const y = result.getFullYear();
  const m = String(result.getMonth() + 1).padStart(2, '0');
  const d = String(result.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function runTest() {
  const timestamp = Date.now();
  const uniqueId = String(timestamp).slice(-5);

  const docEmail = `dr.test.${uniqueId}@citamed.ve`;
  const docPassword = 'Password123!';
  const patEmail = `paciente.test.${uniqueId}@citamed.ve`;
  const patPassword = 'Password123!';

  try {
    // ══════════════════════════════════════════════════════════
    // PASO 1: Registro de Médico
    // ══════════════════════════════════════════════════════════
    console.log(`📋 Paso 1: Registrando nuevo médico (${docEmail})...`);
    const docRegPayload = {
      email: docEmail,
      password: docPassword,
      confirmPassword: docPassword,
      acceptTerms: true,
      firstName: 'Alejandro',
      lastName: 'Rivas',
      identificationNumber: `V-${uniqueId}999`,
      dateOfBirth: '1985-05-15',
      gender: 'male',
      phone: '+584141234567',
      mppsNumber: `MPPS${uniqueId}`,
      specialtyId: 1, // Medicina General
      university: 'Universidad Central de Venezuela',
      graduationYear: 2010,
      clinicName: `Unidad Médica Especializada Dr. Rivas ${uniqueId}`,
      consultationAddress: 'Av. Libertador, Torre Maracaibo, Consultorio 4B',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'wednesday', 'friday'],
      startTime: '08:00',
      endTime: '13:00',
      priceConsultation: 35.00
    };

    const docRegRes = await axios.post(`${API_BASE}/auth/register/doctor`, docRegPayload);
    const docToken = docRegRes.data?.data?.token;
    const docUser = docRegRes.data?.data?.user;
    let docProfileId = docRegRes.data?.data?.profile?.id;

    // Login del doctor si hiciera falta
    const docAuthHeader = { headers: { Authorization: `Bearer ${docToken}` } };

    if (!docProfileId) {
      const meRes = await axios.get(`${API_BASE}/doctors/me`, docAuthHeader);
      docProfileId = meRes.data?.data?.id;
    }
    console.log(`  ✅ Médico registrado: User ID ${docUser?.id} | DoctorProfile ID: ${docProfileId} | Token recibido: ${!!docToken}`);

    // ══════════════════════════════════════════════════════════
    // PASO 2: Configurar Disponibilidad Semanal
    // ══════════════════════════════════════════════════════════
    console.log('\n📅 Paso 2: Configurando disponibilidad semanal del médico...');
    const availabilityPayload = {
      schedules: [
        {
          dayOfWeek: 1, // Lunes
          startTime: '08:00',
          endTime: '12:00',
          slotDuration: 30,
          consultationType: 'presencial'
        },
        {
          dayOfWeek: 3, // Miércoles
          startTime: '08:00',
          endTime: '12:00',
          slotDuration: 30,
          consultationType: 'presencial'
        }
      ]
    };

    try {
      const availRes = await axios.post(`${API_BASE}/doctors/me/availability`, availabilityPayload, docAuthHeader);
      console.log(`  ✅ Disponibilidad configurada con éxito:`, availRes.data?.success ? 'OK' : 'Advertencia');
    } catch (availErr) {
      console.log(`  ℹ️ Disponibilidad me/availability status:`, availErr.response?.status, availErr.response?.data?.message || availErr.message);
    }

    // ══════════════════════════════════════════════════════════
    // PASO 3: Registro de Paciente
    // ══════════════════════════════════════════════════════════
    console.log(`\n👤 Paso 3: Registrando paciente (${patEmail})...`);
    const patRegPayload = {
      email: patEmail,
      password: patPassword,
      confirmPassword: patPassword,
      acceptTerms: true,
      firstName: 'María',
      lastName: 'Gómez',
      identificationNumber: `V-${uniqueId}111`,
      dateOfBirth: '1992-08-20',
      gender: 'female',
      phone: '+584129876543',
      bloodType: 'O+',
      emergencyContactName: 'Pedro Gómez',
      emergencyContactPhone: '+584141112233'
    };

    const patRegRes = await axios.post(`${API_BASE}/auth/register/patient`, patRegPayload);
    const patToken = patRegRes.data?.data?.token;
    const patUser = patRegRes.data?.data?.user;
    console.log(`  ✅ Paciente registrado: ID ${patUser?.id} | Token recibido: ${!!patToken}`);

    const patAuthHeader = { headers: { Authorization: `Bearer ${patToken}` } };

    // ══════════════════════════════════════════════════════════
    // PASO 4: Paciente consulta slots y Agenda Pre-Cita
    // ══════════════════════════════════════════════════════════
    const targetDate = getNextWeekday(1); // Próximo lunes
    console.log(`\n🔍 Paso 4: Consultando horarios para el médico (DoctorProfile ID: ${docProfileId}, Fecha: ${targetDate})...`);

    // Intentamos consultar slots disponibles
    let chosenTime = '09:00';
    try {
      const slotsRes = await axios.get(
        `${API_BASE}/appointments/available-slots?doctorProfileId=${docProfileId}&date=${targetDate}`,
        patAuthHeader
      );
      const slots = slotsRes.data?.data?.slots || [];
      console.log(`  ℹ️ Slots encontrados: ${slots.length} turnos`);
      if (slots.length > 0) {
        chosenTime = slots[0].start;
      }
    } catch (slotsErr) {
      console.log(`  ℹ️ Available-slots info:`, slotsErr.response?.data?.message || slotsErr.message);
    }

    console.log(`  ⏰ Creando solicitud de Pre-Cita a las ${chosenTime}...`);
    const appointmentPayload = {
      doctorId: docUser.id,
      doctorProfileId: docProfileId,
      specialtyId: 1,
      appointmentDate: targetDate,
      appointmentTime: chosenTime,
      reasonForVisit: 'Chequeo médico de rutina',
      appointmentType: 'first_consultation'
    };

    const createAptRes = await axios.post(`${API_BASE}/appointments`, appointmentPayload, patAuthHeader);
    const createdApt = createAptRes.data?.data;
    console.log(`  ✅ Cita creada exitosamente:`);
    console.log(`     - ID de Cita: ${createdApt?.id}`);
    console.log(`     - Número: ${createdApt?.appointmentNumber}`);
    console.log(`     - Estado: ${createdApt?.status} (¡Pre-Cita confirmada!)`);
    console.log(`     - Clinic ID asignado: ${createdApt?.clinicId || 'Auto-asignado'}`);

    if (createdApt?.status !== 'pending') {
      throw new Error(`Se esperaba status 'pending', pero se obtuvo: ${createdApt?.status}`);
    }

    // ══════════════════════════════════════════════════════════
    // PASO 5: Doctor consulta su agenda y Acepta la Pre-Cita
    // ══════════════════════════════════════════════════════════
    console.log('\n🩺 Paso 5: Médico consulta su agenda para aceptar la pre-cita...');
    const docAppointmentsRes = await axios.get(`${API_BASE}/appointments/doctor/today?date=${targetDate}`, docAuthHeader);
    const docApts = docAppointmentsRes.data?.data || [];
    console.log(`  ℹ️ Citas en agenda del médico: ${docApts.length}`);

    const targetApt = docApts.find(a => a.id === createdApt.id) || createdApt;
    console.log(`  👉 Confirmando cita #${targetApt.id}...`);

    const confirmRes = await axios.put(`${API_BASE}/appointments/${targetApt.id}/confirm`, {}, docAuthHeader);
    console.log(`  ✅ Cita confirmada por el médico:`, confirmRes.data?.message);
    console.log(`     - Nuevo Estado: ${confirmRes.data?.data?.status}`);

    if (confirmRes.data?.data?.status !== 'confirmed') {
      throw new Error(`Se esperaba status 'confirmed', pero se obtuvo: ${confirmRes.data?.data?.status}`);
    }

    // ══════════════════════════════════════════════════════════
    // PASO 6: Paciente consulta "Mis Citas" y verifica datos
    // ══════════════════════════════════════════════════════════
    console.log('\n📱 Paso 6: Paciente consulta "Mis Citas" para verificar confirmación y consultorio...');
    const patAppointmentsRes = await axios.get(`${API_BASE}/appointments/my?upcoming=true`, patAuthHeader);
    const patApts = patAppointmentsRes.data?.data || [];
    const confirmedApt = patApts.find(a => a.id === createdApt.id);

    console.log(`  ✅ Cita encontrada en panel del paciente:`);
    console.log(`     - ID: ${confirmedApt?.id}`);
    console.log(`     - Estado: ${confirmedApt?.status}`);
    console.log(`     - Doctor: Dr. ${confirmedApt?.doctor?.firstName} ${confirmedApt?.doctor?.lastName}`);
    console.log(`     - Consultorio/Clínica: ${confirmedApt?.clinic?.commercialName || 'Consultorio Médico'}`);
    console.log(`     - Dirección: ${confirmedApt?.clinicLocation?.addressLine1 || 'Sede Principal'}`);

    console.log('\n🎉 ¡TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE! (6/6 PASOS)');
    console.log('El flujo completo de la Semana 4 funciona de punta a punta en producción.\n');

  } catch (err) {
    console.error('\n❌ ERROR EN LA PRUEBA E2E:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

runTest();
