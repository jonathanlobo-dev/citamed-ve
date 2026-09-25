/**
 * test-waiting-room-flow.js
 * CITAMED.VE - Bloque C (C1)
 *
 * Prueba E2E automatizada del flujo completo de Sala de Espera y Consulta:
 * 1. Registro de Doctor, Paciente 1 y Paciente 2 (para prueba de seguridad D2).
 * 2. Creación de cita para hoy en Caracas con status='pending'.
 * 3. Verificación de regla D6: check-in rechazado con 400 si la cita está pending.
 * 4. Médico confirma la cita -> status pasa a 'confirmed'.
 * 5. Verificación de regla D2: Paciente 2 recibe 403 al intentar consultar o entrar a la cita del Paciente 1.
 * 6. Paciente 1 realiza check-in -> status pasa a 'checked_in'.
 * 7. Paciente 1 conecta WebSocket a /waiting-room y se suscribe al canal 'wr:your-turn'.
 * 8. Médico llama al siguiente -> Paciente 1 recibe 'wr:your-turn' dentro de 5 segundos.
 * 9. Médico finaliza la consulta con doctorNotes y diagnosis.
 * 10. Verificación de regla D7: Cita completada con status='completed', doctorNotes y diagnosis registrados.
 */

const axios = require('axios');
const { io } = require('socket.io-client');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';
const SOCKET_BASE = API_BASE.replace(/\/api\/?$/, '');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logStep(step, title) {
  console.log(`\n${colors.cyan}${colors.bold}[PASO ${step}]${colors.reset} ${title}`);
}

function pass(msg) {
  console.log(`  ${colors.green}${colors.bold}[PASS]${colors.reset} ${msg}`);
}

function fail(msg, err) {
  console.error(`  ${colors.red}${colors.bold}[FAIL]${colors.reset} ${msg}`);
  if (err) {
    if (err.response) {
      console.error(`         Status: ${err.response.status}`);
      console.error(`         Data:`, JSON.stringify(err.response.data));
    } else {
      console.error(`         Error: ${err.message || err}`);
    }
  }
}

function getTodayCaracas() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
}

async function runE2E() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST E2E: SALA DE ESPERA CITAMED`);
  console.log(`   API URL:    ${API_BASE}`);
  console.log(`   SOCKET URL: ${SOCKET_BASE}`);
  console.log(`   FECHA HOY:  ${getTodayCaracas()} (America/Caracas)`);
  console.log(`======================================================\n`);

  let allPassed = true;
  let socketPatient = null;
  const uid = String(Date.now()).slice(-6);

  try {
    // ----------------------------------------------------
    // PASO 1: Registro de Usuarios de Prueba
    // ----------------------------------------------------
    logStep(1, 'Registrando Doctor, Paciente 1 y Paciente 2...');
    
    // 1.1 Médico
    const docEmail = `dr.wr.${uid}@citamed.ve`;
    const docPayload = {
      email: docEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      identificationNumber: `V-${uid}01`,
      dateOfBirth: '1980-04-12',
      gender: 'male',
      phone: '+584141110001',
      mppsNumber: `MPPS${uid}`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2005,
      clinicName: `Consultorio E2E Dr. Mendoza ${uid}`,
      consultationAddress: 'Av. Casanova, Edif. Centro Médico, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '08:00',
      endTime: '18:00',
      priceConsultation: 30.00
    };

    const docRes = await axios.post(`${API_BASE}/auth/register/doctor`, docPayload);
    const docToken = docRes.data?.data?.token;
    const docUser = docRes.data?.data?.user;
    let docProfileId = docRes.data?.data?.profile?.id;

    if (!docProfileId) {
      const meRes = await axios.get(`${API_BASE}/doctors/me`, {
        headers: { Authorization: `Bearer ${docToken}` }
      });
      docProfileId = meRes.data?.data?.id;
    }
    pass(`Doctor registrado (ID: ${docUser.id}, Profile: ${docProfileId})`);

    // Configurar disponibilidad completa para todos los días
    const availPayload = {
      schedules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '08:00',
        endTime: '23:30',
        slotDuration: 30,
        consultationType: 'presencial'
      }))
    };
    await axios.post(`${API_BASE}/doctors/me/availability`, availPayload, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    pass(`Disponibilidad del médico configurada para hoy y toda la semana`);

    // 1.2 Paciente 1 (legítimo)
    const pat1Email = `paciente1.${uid}@citamed.ve`;
    const pat1Payload = {
      email: pat1Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Beatriz',
      lastName: 'Pérez',
      identificationNumber: `V-${uid}02`,
      dateOfBirth: '1995-07-22',
      gender: 'female',
      phone: '+584142220002',
      bloodType: 'O+',
      emergencyContactName: 'Pedro Pérez',
      emergencyContactPhone: '+584141112233'
    };
    const pat1Res = await axios.post(`${API_BASE}/auth/register/patient`, pat1Payload);
    const pat1Token = pat1Res.data?.data?.token;
    const pat1User = pat1Res.data?.data?.user;
    pass(`Paciente 1 registrado (ID: ${pat1User.id})`);

    // 1.3 Paciente 2 (usuario no autorizado para la cita)
    const pat2Email = `paciente2.${uid}@citamed.ve`;
    const pat2Payload = {
      email: pat2Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Marcos',
      lastName: 'Rojas',
      identificationNumber: `V-${uid}03`,
      dateOfBirth: '1990-11-05',
      gender: 'male',
      phone: '+584143330003',
      bloodType: 'A+',
      emergencyContactName: 'Ana Rojas',
      emergencyContactPhone: '+584149998877'
    };
    const pat2Res = await axios.post(`${API_BASE}/auth/register/patient`, pat2Payload);
    const pat2Token = pat2Res.data?.data?.token;
    const pat2User = pat2Res.data?.data?.user;
    pass(`Paciente 2 registrado (ID: ${pat2User.id})`);

    // ----------------------------------------------------
    // PASO 2: Paciente 1 crea cita para hoy con status pending
    // ----------------------------------------------------
    const todayCaracas = getTodayCaracas();
    logStep(2, `Consultando slots y creando cita para hoy (${todayCaracas}) en estado 'pending'...`);

    const slotsRes = await axios.get(
      `${API_BASE}/appointments/available-slots?doctorProfileId=${docProfileId}&date=${todayCaracas}`,
      { headers: { Authorization: `Bearer ${pat1Token}` } }
    );
    const slots = slotsRes.data?.data?.slots || [];
    if (slots.length === 0) {
      throw new Error(`No hay slots disponibles generados para hoy (${todayCaracas})`);
    }
    const chosenSlot = slots[0].start;

    const aptPayload = {
      doctorId: docUser.id,
      doctorProfileId: docProfileId,
      specialtyId: 1,
      appointmentDate: todayCaracas,
      appointmentTime: chosenSlot,
      reasonForVisit: 'Evaluación sala de espera E2E',
      appointmentType: 'first_consultation'
    };

    const aptRes = await axios.post(`${API_BASE}/appointments`, aptPayload, {
      headers: { Authorization: `Bearer ${pat1Token}` }
    });
    const appointment = aptRes.data?.data;
    if (appointment?.status === 'pending') {
      pass(`Cita creada con ID ${appointment.id} a las ${chosenSlot} con status='pending'`);
    } else {
      fail(`Cita no quedó en pending: status='${appointment?.status}'`);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 3: Verificar Regla D6 (check-in rechazado si pending)
    // ----------------------------------------------------
    logStep(3, 'Verificando regla D6: Intento de check-in con cita en pending...');
    try {
      await axios.post(
        `${API_BASE}/waiting-room/check-in`,
        { appointmentId: appointment.id },
        { headers: { Authorization: `Bearer ${pat1Token}` } }
      );
      fail('El check-in se permitió con cita en estado pending (debió fallar con 400)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 400) {
        pass(`Regla D6 confirmada: check-in rechazado con 400 (${err.response.data?.message})`);
      } else {
        fail(`Esperado status 400 pero se recibió ${err.response?.status}`, err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 4: Médico confirma la cita
    // ----------------------------------------------------
    logStep(4, 'Médico confirma la cita...');
    const confirmRes = await axios.put(
      `${API_BASE}/appointments/${appointment.id}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${docToken}` } }
    );
    const confirmedApt = confirmRes.data?.data;
    if (confirmedApt?.status === 'confirmed') {
      pass(`Cita confirmada por el médico: status='${confirmedApt.status}'`);
    } else {
      fail(`Estado inesperado tras confirmar: '${confirmedApt?.status}'`);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: Verificar Regla D2 (Paciente 2 recibe 403 en endpoint my-position)
    // ----------------------------------------------------
    logStep(5, 'Verificando regla D2: Paciente 2 intenta consultar posición de Paciente 1...');
    try {
      await axios.get(`${API_BASE}/waiting-room/my-position/${appointment.id}`, {
        headers: { Authorization: `Bearer ${pat2Token}` }
      });
      fail('Paciente 2 pudo consultar la posición de Paciente 1 (debió responder 403)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass(`Regla D2 confirmada: Paciente ajeno recibe 403 Forbidden`);
      } else {
        fail(`Esperado status 403 pero se recibió ${err.response?.status}`, err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 6: Paciente 1 realiza Check-In exitoso
    // ----------------------------------------------------
    logStep(6, 'Paciente 1 realiza check-in con cita confirmada...');
    const checkInRes = await axios.post(
      `${API_BASE}/waiting-room/check-in`,
      { appointmentId: appointment.id },
      { headers: { Authorization: `Bearer ${pat1Token}` } }
    );
    const queueEntry = checkInRes.data?.data?.queueEntry;
    if (queueEntry && ['waiting', 'checked_in'].includes(queueEntry.status)) {
      pass(`Check-in exitoso: QueueEntry ID ${queueEntry.id}, status='${queueEntry.status}', pos=#${queueEntry.position}`);
    } else {
      fail(`Check-in no devolvió entrada activa en cola:`, checkInRes.data);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7 & 8: WebSocket del paciente escucha wr:your-turn
    // ----------------------------------------------------
    logStep(7, 'Conectando WebSocket del Paciente 1 a /waiting-room...');
    
    const turnEventPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de 5000ms esperando evento wr:your-turn por WebSocket'));
      }, 5000);

      socketPatient = io(`${SOCKET_BASE}/waiting-room`, {
        auth: { token: pat1Token },
        transports: ['websocket', 'polling'],
        reconnection: false
      });

      socketPatient.on('connect', () => {
        pass(`WebSocket conectado al namespace /waiting-room (Socket ID: ${socketPatient.id})`);
        
        // Disparar call-next desde el médico
        logStep(8, 'Médico llama al siguiente paciente (POST /call-next)...');
        axios.post(
          `${API_BASE}/waiting-room/call-next`,
          {},
          { headers: { Authorization: `Bearer ${docToken}` } }
        ).then((callRes) => {
          pass(`Médico ejecutó call-next: ${callRes.data?.message || 'Llamado con éxito'}`);
        }).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      socketPatient.on('wr:your-turn', (payload) => {
        clearTimeout(timeout);
        pass(`Evento 'wr:your-turn' recibido en tiempo y forma: Paciente=${payload?.patientName || 'OK'}`);
        resolve(payload);
      });

      socketPatient.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(new Error(`Error de conexión WebSocket: ${err.message}`));
      });
    });

    try {
      await turnEventPromise;
    } catch (wsErr) {
      fail(`Fallo en entrega de evento WebSocket wr:your-turn:`, wsErr);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Médico inicia y finaliza la consulta con notas
    // ----------------------------------------------------
    logStep(9, 'Médico finaliza la consulta con doctorNotes y diagnosis...');

    // Primero iniciar consulta si está en llamado
    try {
      await axios.post(
        `${API_BASE}/waiting-room/start-consultation/${queueEntry.id}`,
        {},
        { headers: { Authorization: `Bearer ${docToken}` } }
      );
      pass(`Consulta iniciada para QueueEntry ${queueEntry.id}`);
    } catch (startErr) {
      // Si ya estaba en consulta o falla directo, continuar al end
      console.log(`  ℹ️ Start consultation info: ${startErr.response?.data?.message || startErr.message}`);
    }

    const notesPayload = {
      doctorNotes: 'Paciente evaluada satisfactoriamente en prueba E2E. Presión normal, signos estables.',
      diagnosis: 'Chequeo de rutina sin hallazgos patológicos'
    };

    const endRes = await axios.post(
      `${API_BASE}/waiting-room/end-consultation/${queueEntry.id}`,
      notesPayload,
      { headers: { Authorization: `Bearer ${docToken}` } }
    );
    pass(`Consulta finalizada via waiting-room/end-consultation`);

    // ----------------------------------------------------
    // PASO 10: Verificar Regla D7 (cita en BD con status completed y notas)
    // ----------------------------------------------------
    logStep(10, 'Verificando regla D7: Consultar estado final de la cita...');
    const finalAptRes = await axios.get(`${API_BASE}/appointments/${appointment.id}`, {
      headers: { Authorization: `Bearer ${docToken}` }
    });
    const finalApt = finalAptRes.data?.data;

    const statusOk = finalApt?.status === 'completed';
    const notesOk = finalApt?.doctorNotes === notesPayload.doctorNotes;
    const diagOk = finalApt?.diagnosis === notesPayload.diagnosis;

    if (statusOk && notesOk && diagOk) {
      pass(`Regla D7 confirmada:`);
      console.log(`     - status:      '${finalApt.status}' (OK)`);
      console.log(`     - diagnosis:   '${finalApt.diagnosis}' (OK)`);
      console.log(`     - doctorNotes: '${finalApt.doctorNotes}' (OK)`);
    } else {
      fail(`Inconsistencia en cita final: status='${finalApt?.status}', notes='${finalApt?.doctorNotes}', diagnosis='${finalApt?.diagnosis}'`);
      allPassed = false;
    }

  } catch (globalErr) {
    fail('Error inesperado durante la ejecución E2E:', globalErr);
    allPassed = false;
  } finally {
    if (socketPatient && socketPatient.connected) {
      socketPatient.disconnect();
    }

    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`${colors.green}${colors.bold}🎉 TODOS LOS TESTS E2E PASARON EXITOSAMENTE (10/10)${colors.reset}`);
      console.log(`======================================================\n`);
      process.exit(0);
    } else {
      console.log(`${colors.red}${colors.bold}❌ LA PRUEBA E2E FALLÓ EN UNO O MÁS PASOS${colors.reset}`);
      console.log(`======================================================\n`);
      process.exit(1);
    }
  }
}

runE2E();
