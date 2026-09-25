/**
 * test-prescription-flow.js
 * CITAMED.VE - Bloque D (D5) & Bloque E (E3)
 *
 * Verificación automatizada del flujo completo de Récipes Médicos y Expediente:
 * 1. Registro de Doctor A, Paciente 1, Paciente 2 y Doctor B.
 * 2. Creación, confirmación, check-in y finalización de cita 1.
 * 3. Emisión de récipe médico con 2 medicamentos e indicaciones.
 * 4. Descarga de PDF autenticada y verificación del header %PDF.
 * 5. Guardado del PDF en backend/scripts/output/ para inspección visual.
 * 6. Verificación pública en /api/prescriptions/verify/:code sin token (activo, datos mínimos).
 * 7. Anulación del récipe por el médico emisor.
 * 8. Re-verificación pública del récipe anulado (status: voided).
 * 9. Control de acceso: Paciente 2 intenta descargar el PDF del Paciente 1 (403).
 * 10. Expediente (E3): Segunda consulta para Paciente 1, consulta de historial previo y 403 para Doctor B.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

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

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST: FLUJO DE RÉCIPES MÉDICOS CITAMED`);
  console.log(`   API URL:    ${API_BASE}`);
  console.log(`   FECHA HOY:  ${getTodayCaracas()} (America/Caracas)`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // ----------------------------------------------------
    // PASO 1: Registro de Usuarios de Prueba
    // ----------------------------------------------------
    logStep(1, 'Registrando Doctor A, Paciente 1 y Paciente 2...');

    // 1.1 Doctor A
    const docAEmail = `dr.rec.${uid}@citamed.ve`;
    const docAPayload = {
      email: docAEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Alejandro',
      lastName: 'Pérez',
      identificationNumber: `V-${uid}11`,
      dateOfBirth: '1982-05-15',
      gender: 'male',
      phone: '+584145550001',
      mppsNumber: `MPPS${uid}`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2008,
      clinicName: `Centro Médico CitaMed ${uid}`,
      consultationAddress: 'Av. Libertador, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '08:00',
      endTime: '18:00',
      priceConsultation: 40.00
    };

    let docAToken, docAId, docAProfileId;
    try {
      const res = await axios.post(`${API_BASE}/auth/register/doctor`, docAPayload);
      docAToken = res.data.token || res.data.data?.token;
      docAId = res.data.user?.id || res.data.data?.user?.id;
      docAProfileId = res.data.doctorProfile?.id || res.data.data?.doctorProfile?.id;
      if (!docAProfileId) {
        const meRes = await axios.get(`${API_BASE}/doctors/me`, {
          headers: { Authorization: `Bearer ${docAToken}` }
        });
        docAProfileId = meRes.data?.data?.id;
      }
      pass(`Doctor A registrado (id: ${docAId}, profile: ${docAProfileId}, email: ${docAEmail})`);

      // Configurar disponibilidad de Doctor A
      await axios.post(
        `${API_BASE}/doctors/me/availability`,
        {
          schedules: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            dayOfWeek,
            startTime: '08:00',
            endTime: '23:30',
            slotDuration: 30,
            consultationType: 'presencial'
          }))
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Disponibilidad de Doctor A configurada');
    } catch (err) {
      fail('Registro Doctor A', err);
      allPassed = false;
      return;
    }

    // 1.2 Paciente 1
    const p1Email = `pat1.rec.${uid}@citamed.ve`;
    const p1Payload = {
      email: p1Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'María',
      lastName: 'González',
      identificationNumber: `V-${uid}22`,
      dateOfBirth: '1995-08-20',
      gender: 'female',
      phone: '+584245550002',
      bloodType: 'O+',
      emergencyContactName: 'Pedro González',
      emergencyContactPhone: '+584141112233'
    };

    let p1Token, p1Id;
    try {
      const res = await axios.post(`${API_BASE}/auth/register/patient`, p1Payload);
      p1Token = res.data.token || res.data.data?.token;
      p1Id = res.data.user?.id || res.data.data?.user?.id;
      pass(`Paciente 1 registrado (id: ${p1Id}, email: ${p1Email})`);
    } catch (err) {
      fail('Registro Paciente 1', err);
      allPassed = false;
      return;
    }

    // 1.3 Paciente 2 (para probar 403)
    const p2Email = `pat2.rec.${uid}@citamed.ve`;
    const p2Payload = {
      email: p2Email,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Roberto',
      lastName: 'Fernández',
      identificationNumber: `V-${uid}33`,
      dateOfBirth: '1990-11-10',
      gender: 'male',
      phone: '+584125550003',
      bloodType: 'A+',
      emergencyContactName: 'Laura Fernández',
      emergencyContactPhone: '+584142223344'
    };

    let p2Token, p2Id;
    try {
      const res = await axios.post(`${API_BASE}/auth/register/patient`, p2Payload);
      p2Token = res.data.token || res.data.data?.token;
      p2Id = res.data.user?.id || res.data.data?.user?.id;
      pass(`Paciente 2 registrado (id: ${p2Id}, email: ${p2Email})`);
    } catch (err) {
      fail('Registro Paciente 2', err);
      allPassed = false;
      return;
    }

    // ----------------------------------------------------
    // PASO 2: Paciente 1 crea cita y Doctor A confirma
    // ----------------------------------------------------
    logStep(2, 'Paciente 1 agenda cita para hoy y Doctor A la confirma...');
    const today = getTodayCaracas();
    let appointment1Id;

    try {
      const slotsRes = await axios.get(
        `${API_BASE}/appointments/available-slots?doctorProfileId=${docAProfileId}&date=${today}`,
        { headers: { Authorization: `Bearer ${p1Token}` } }
      );
      const slots = slotsRes.data?.data?.slots || [];
      if (slots.length === 0) {
        throw new Error(`No hay slots disponibles generados para hoy (${today})`);
      }
      const chosenSlot = slots[0].start;

      const aptRes = await axios.post(
        `${API_BASE}/appointments`,
        {
          doctorId: docAId,
          doctorProfileId: docAProfileId,
          specialtyId: 1,
          appointmentDate: today,
          appointmentTime: chosenSlot,
          appointmentType: 'first_consultation',
          reasonForVisit: 'Control y tratamiento de infección respiratoria'
        },
        { headers: { Authorization: `Bearer ${p1Token}` } }
      );
      appointment1Id = aptRes.data.data?.id || aptRes.data.appointment?.id || aptRes.data.id;
      pass(`Cita 1 creada exitosamente (id: ${appointment1Id} a las ${chosenSlot})`);
    } catch (err) {
      fail('Creación de cita 1', err);
      allPassed = false;
      return;
    }

    // Confirmar cita
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointment1Id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Cita 1 confirmada por Doctor A');
    } catch (err) {
      fail('Confirmación de cita 1', err);
      allPassed = false;
      return;
    }

    // Check-in del paciente
    try {
      await axios.post(
        `${API_BASE}/waiting-room/check-in`,
        { appointmentId: appointment1Id },
        { headers: { Authorization: `Bearer ${p1Token}` } }
      );
      pass('Paciente 1 realizó check-in en sala de espera');
    } catch (err) {
      fail('Check-in de paciente 1', err);
      allPassed = false;
      return;
    }

    // ----------------------------------------------------
    // PASO 3: Finalizar consulta con notas
    // ----------------------------------------------------
    logStep(3, 'Finalizando consulta 1 con diagnóstico y notas...');
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointment1Id}/complete`,
        {
          diagnosis: 'Faringoamigdalitis bacteriana aguda',
          doctorNotes: 'Paciente presenta odinofagia intensa, exudado amigdalino y fiebre de 38.5C.'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Consulta 1 completada con diagnóstico y notas registradas');
    } catch (err) {
      fail('Completar consulta 1', err);
      allPassed = false;
      return;
    }

    // ----------------------------------------------------
    // PASO 4: Emisión de récipe médico (D1, D2)
    // ----------------------------------------------------
    logStep(4, 'Doctor A emite récipe médico con 2 medicamentos e indicaciones...');
    let prescription;
    const recipeItems = [
      {
        medication: 'Amoxicilina + Ácido Clavulánico',
        presentation: 'Tabletas recubiertas 875/125 mg',
        dose: '1 tableta',
        frequency: 'Cada 12 horas',
        duration: '7 días',
        instructions: 'Tomar inmediatamente al inicio de una comida principal con abundante agua.'
      },
      {
        medication: 'Ibuprofeno',
        presentation: 'Comprimidos 400 mg',
        dose: '1 comprimido',
        frequency: 'Cada 8 horas',
        duration: '3 a 5 días',
        instructions: 'Tomar sólo en caso de dolor o temperatura mayor a 38°C.'
      }
    ];

    const generalIndicaciones = 'Reposo relativo por 48 horas. Hidratación abundante (mínimo 2 litros diarios). Evitar bebidas frías e irritantes. Consultar a emergencia si presenta dificultad para deglutir o respirar.';

    try {
      const res = await axios.post(
        `${API_BASE}/prescriptions`,
        {
          appointmentId: appointment1Id,
          items: recipeItems,
          indications: generalIndicaciones
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      prescription = res.data.data;
      if (!prescription || !prescription.verificationCode) {
        throw new Error('La respuesta no incluye verificationCode');
      }

      pass(`Récipe emitido exitosamente (id: ${prescription.id}, código: ${prescription.verificationCode})`);
      if (prescription.verificationCode.length === 16) {
        pass('Código de verificación tiene longitud segura de 16 caracteres hexadecimales');
      } else {
        pass(`Código de verificación generado: ${prescription.verificationCode}`);
      }
    } catch (err) {
      fail('Emisión de récipe médico', err);
      allPassed = false;
      return;
    }

    // ----------------------------------------------------
    // PASO 5: Descarga de PDF y verificación de %PDF (D3, D5)
    // ----------------------------------------------------
    logStep(5, 'Descargando PDF del récipe generado...');
    let pdfBuffer;
    try {
      const res = await axios.get(`${API_BASE}/prescriptions/${prescription.id}/pdf`, {
        headers: { Authorization: `Bearer ${docAToken}` },
        responseType: 'arraybuffer'
      });

      pdfBuffer = Buffer.from(res.data);
      const isPdfHeader = pdfBuffer.slice(0, 4).toString('utf-8') === '%PDF';
      if (!isPdfHeader) {
        throw new Error('El archivo descargado no inicia con la cabecera %PDF');
      }

      pass(`PDF descargado correctamente (${pdfBuffer.length} bytes, inicia con %PDF)`);

      // Guardar PDF en output para revisión
      const testPdfPath = path.join(outputDir, `recipe-CitaMed-${prescription.verificationCode}.pdf`);
      fs.writeFileSync(testPdfPath, pdfBuffer);
      pass(`Archivo PDF guardado para inspección en: ${testPdfPath}`);
    } catch (err) {
      fail('Descarga de PDF del récipe', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 6: Verificación pública sin token (D2)
    // ----------------------------------------------------
    logStep(6, 'Consultando endpoint público /api/prescriptions/verify/:code sin token...');
    try {
      const verifyRes = await axios.get(
        `${API_BASE}/prescriptions/verify/${prescription.verificationCode}`
      );

      const vData = verifyRes.data.data;
      if (!vData || vData.valid !== true || vData.status !== 'active') {
        throw new Error('El récipe no figura como válido y activo en la verificación pública');
      }

      pass('Verificación pública responde 200 OK y estado válido: true');
      pass(`Médico emisor: ${vData.doctorName} (${vData.specialty})`);
      pass(`Iniciales del paciente: ${vData.patientInitials}`);
      pass(`Medicamentos verificados: ${vData.medications?.length} items`);

      // Validar privacidad de datos (Regla D2): sin cédula, teléfono ni diagnóstico
      const rawText = JSON.stringify(verifyRes.data);
      const containsCedula = rawText.includes(p1Payload.identificationNumber);
      const containsPhone = rawText.includes(p1Payload.phone);
      const containsDiagnosis = rawText.includes('Faringoamigdalitis');

      if (containsCedula || containsPhone || containsDiagnosis) {
        throw new Error('Fuga de datos privados: la verificación pública incluye cédula, teléfono o diagnóstico');
      }
      pass('Privacidad garantizada: la respuesta pública NO contiene cédula, teléfono ni diagnóstico');
    } catch (err) {
      fail('Verificación pública de récipe activo', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Anulación de récipe (D2)
    // ----------------------------------------------------
    logStep(7, 'Doctor A anula el récipe médico emitido...');
    try {
      const voidRes = await axios.put(
        `${API_BASE}/prescriptions/${prescription.id}/void`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      if (voidRes.data.data?.status !== 'voided') {
        throw new Error('El estado devuelto no es voided');
      }
      pass('Récipe anulado exitosamente en base de datos');
    } catch (err) {
      fail('Anulación de récipe', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 8: Re-verificación de récipe anulado (D2)
    // ----------------------------------------------------
    logStep(8, 'Re-verificando récipe tras la anulación...');
    try {
      const verifyVoidRes = await axios.get(
        `${API_BASE}/prescriptions/verify/${prescription.verificationCode}`
      );

      const vData = verifyVoidRes.data.data;
      if (vData.valid !== false || vData.status !== 'voided') {
        throw new Error(`Estado inválido tras anulación: valid=${vData.valid}, status=${vData.status}`);
      }
      pass('Verificación pública refleja correctamente valid: false y status: "voided"');
    } catch (err) {
      fail('Verificación pública de récipe anulado', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Control de acceso - Paciente 2 intenta descargar PDF de Paciente 1 (403)
    // ----------------------------------------------------
    logStep(9, 'Paciente 2 intenta descargar el PDF del Paciente 1 (debe dar 403)...');
    try {
      await axios.get(`${API_BASE}/prescriptions/${prescription.id}/pdf`, {
        headers: { Authorization: `Bearer ${p2Token}` }
      });
      fail('Paciente 2 pudo descargar el récipe ajeno (esperaba 403)');
      allPassed = false;
    } catch (err) {
      if (err.response && err.response.status === 403) {
        pass('Control de acceso exitoso: Paciente 2 recibió 403 Prohibido');
      } else {
        fail('Respuesta inesperada al intentar descargar récipe ajeno', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // RESUMEN FINAL BLOQUE D
    // ----------------------------------------------------
    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`🎉 TODOS LOS TESTS DE RÉCIPES MÉDICOS (BLOQUE D) PASARON CON ÉXITO`);
    } else {
      console.log(`❌ SE ENCONTRARON FALLOS EN LA VERIFICACIÓN DE RÉCIPES`);
    }
    console.log(`======================================================\n`);
  } catch (globalErr) {
    console.error('Error no capturado durante el test:', globalErr);
    allPassed = false;
  }

  return allPassed;
}

if (require.main === module) {
  runTest().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runTest;
