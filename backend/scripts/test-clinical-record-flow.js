/**
 * test-clinical-record-flow.js - CITAMED.VE
 * M03 / Semana 6 - Verificación del flujo de Historia Clínica y Espacio Clínico (A8)
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

function omit(msg) {
  console.log(`  ${colors.yellow}${colors.bold}[OMITIDO]${colors.reset} ${msg}`);
}

function getTodayCaracas() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
}

function hasKeyRecursive(obj, targetKey) {
  if (!obj || typeof obj !== 'object') return false;
  if (Object.prototype.hasOwnProperty.call(obj, targetKey)) return true;
  for (const val of Object.values(obj)) {
    if (hasKeyRecursive(val, targetKey)) return true;
  }
  return false;
}

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST: HISTORIA CLÍNICA Y ESPACIO CLÍNICO`);
  console.log(`   API URL:    ${API_BASE}`);
  console.log(`   FECHA HOY:  ${getTodayCaracas()} (America/Caracas)`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);
  const createdEmails = [];

  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // ----------------------------------------------------
    // PASO 1: Registro de Médico A, Médico B y Paciente
    // ----------------------------------------------------
    logStep(1, 'Registrando Médico A, Médico B y Paciente (con cita para hoy)...');

    // 1.1 Médico A
    const docAEmail = `e2e.s6.docA.${uid}@citamed.ve`;
    createdEmails.push(docAEmail);
    const docAPayload = {
      email: docAEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Alejandro',
      lastName: 'Rivas',
      identificationNumber: `V-${uid}11`,
      dateOfBirth: '1980-04-12',
      gender: 'male',
      phone: '+584145551001',
      mppsNumber: `MPPS${uid}`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2005,
      clinicName: `Consultorio Médico CitaMed ${uid}`,
      consultationAddress: 'Av. Francisco de Miranda, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '00:00',
      endTime: '23:59',
      priceConsultation: 50.00
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
      pass(`Médico A registrado (id: ${docAId}, email: ${docAEmail})`);

      // Configurar disponibilidad todos los días de 00:00 a 23:59
      await axios.post(
        `${API_BASE}/doctors/me/availability`,
        {
          schedules: [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => ({
            dayOfWeek,
            startTime: '00:00',
            endTime: '23:59',
            slotDuration: 30,
            consultationType: 'presencial'
          }))
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Disponibilidad de Médico A configurada (00:00 - 23:59)');
    } catch (err) {
      fail('Registro de Médico A', err);
      allPassed = false;
      return;
    }

    // 1.2 Médico B
    const docBEmail = `e2e.s6.docB.${uid}@citamed.ve`;
    createdEmails.push(docBEmail);
    const docBPayload = {
      email: docBEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Beatriz',
      lastName: 'Mendoza',
      identificationNumber: `V-${uid}22`,
      dateOfBirth: '1985-09-18',
      gender: 'female',
      phone: '+584145552002',
      mppsNumber: `MPPSB${uid}`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2010,
      clinicName: `Consultorio Dra. Mendoza ${uid}`,
      consultationAddress: 'Chacao, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '08:00',
      endTime: '18:00',
      priceConsultation: 50.00
    };

    let docBToken, docBId;
    try {
      const res = await axios.post(`${API_BASE}/auth/register/doctor`, docBPayload);
      docBToken = res.data.token || res.data.data?.token;
      docBId = res.data.user?.id || res.data.data?.user?.id;
      pass(`Médico B registrado (id: ${docBId}, email: ${docBEmail})`);
    } catch (err) {
      fail('Registro de Médico B', err);
      allPassed = false;
      return;
    }

    // 1.3 Paciente
    const patEmail = `e2e.s6.pat.${uid}@citamed.ve`;
    createdEmails.push(patEmail);
    const patPayload = {
      email: patEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Carlos',
      lastName: 'Silva',
      identificationNumber: `V-${uid}33`,
      dateOfBirth: '1992-06-15',
      gender: 'male',
      phone: '+584125553003',
      bloodType: 'O+',
      emergencyContactName: 'Pedro Silva',
      emergencyContactPhone: '+584141112233'
    };

    let patToken, patId;
    try {
      const res = await axios.post(`${API_BASE}/auth/register/patient`, patPayload);
      patToken = res.data.token || res.data.data?.token;
      patId = res.data.user?.id || res.data.data?.user?.id;
      pass(`Paciente registrado (id: ${patId}, email: ${patEmail})`);
    } catch (err) {
      fail('Registro de Paciente', err);
      allPassed = false;
      return;
    }

    // 1.4 Paciente agenda cita con Médico A para hoy
    const today = getTodayCaracas();
    let appointmentId;
    try {
      const aptRes = await axios.post(
        `${API_BASE}/appointments`,
        {
          doctorId: docAId,
          doctorProfileId: docAProfileId,
          appointmentDate: today,
          appointmentTime: '10:00',
          reasonForVisit: 'Evaluación general y chequeo preventivo'
        },
        { headers: { Authorization: `Bearer ${patToken}` } }
      );
      appointmentId = aptRes.data?.data?.id || aptRes.data?.id;
      pass(`Cita agendada para hoy (id: ${appointmentId})`);
    } catch (err) {
      fail('Agendamiento de cita para hoy', err);
      allPassed = false;
      return;
    }

    // 1.5 Médico A confirma la cita
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Médico A confirmó la cita');
    } catch (err) {
      fail('Confirmación de cita', err);
      allPassed = false;
      return;
    }

    // 1.6 Médico A ejecuta PUT /start dos veces (idempotente)
    try {
      const startRes1 = await axios.put(
        `${API_BASE}/appointments/${appointmentId}/start`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const startRes2 = await axios.put(
        `${API_BASE}/appointments/${appointmentId}/start`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const status1 = startRes1.data?.data?.status || startRes1.data?.status;
      const status2 = startRes2.data?.data?.status || startRes2.data?.status;

      if (status1 === 'in_progress' && status2 === 'in_progress') {
        pass('PUT /start ejecutado dos veces con éxito (idempotente, status: in_progress)');
      } else {
        throw new Error(`Estados inesperados: ${status1}, ${status2}`);
      }
    } catch (err) {
      fail('PUT /start idempotente', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 2: Dos PUT /clinical-note; el segundo sobrescribe
    // ----------------------------------------------------
    logStep(2, 'Guardado de borrador (PUT /clinical-note) y sobrescritura...');

    try {
      // Borrador 1
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/clinical-note`,
        {
          soapNote: {
            subjective: 'Borrador 1: Paciente refiere cefalea leve',
            assessment: 'Cefalea tensional inicial'
          },
          vitalSigns: { systolic: 120, diastolic: 80, temperature: 36.5 },
          doctorNotes: 'Notas privadas versión 1'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      // Borrador 2 (sobrescribe)
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/clinical-note`,
        {
          soapNote: {
            subjective: 'Borrador 2: Paciente refiere cefalea moderada y fatiga',
            assessment: 'Cefalea y fatiga en estudio'
          },
          vitalSigns: { systolic: 124, diastolic: 82, temperature: 36.7 },
          doctorNotes: 'Notas privadas versión 2 (definitiva borrador)'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      // Verificar lectura de la cita
      const readRes = await axios.get(
        `${API_BASE}/appointments/${appointmentId}`,
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const aptData = readRes.data?.data || readRes.data;
      if (
        aptData.soapNote?.subjective?.includes('Borrador 2') &&
        aptData.vitalSigns?.systolic === 124 &&
        aptData.doctorNotes === 'Notas privadas versión 2 (definitiva borrador)'
      ) {
        pass('Borrador sobrescrito correctamente y verificado');
      } else {
        throw new Error(`Los datos de la cita no coinciden con el segundo borrador: ${JSON.stringify(aptData.soapNote)}`);
      }
    } catch (err) {
      fail('Sobrescritura de borrador', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 3: Validaciones de nota clínica (400 y 403)
    // ----------------------------------------------------
    logStep(3, 'Validando rangos imposibles (temperatura 60 -> 400) y control de acceso (Médico B -> 403)...');

    // 3.1 Temperatura fuera de rango (60°C) -> 400
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/clinical-note`,
        {
          vitalSigns: { temperature: 60 }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      fail('Temperatura 60 debió responder 400 pero respondió 200');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 400) {
        pass('Temperatura 60 fue rechazada con 400');
      } else {
        fail('Respuesta inesperada para temperatura 60', err);
        allPassed = false;
      }
    }

    // 3.2 Médico B intenta modificar nota de la cita de A -> 403
    try {
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/clinical-note`,
        {
          soapNote: { assessment: 'Intrusión de Médico B' }
        },
        { headers: { Authorization: `Bearer ${docBToken}` } }
      );
      fail('Médico B sobre cita ajena debió responder 403 pero respondió 200');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass('Médico B fue rechazado con 403 al intentar editar nota ajena');
      } else {
        fail('Respuesta inesperada para Médico B', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 4: Completar consulta con datos clínicos
    // ----------------------------------------------------
    logStep(4, 'Completando consulta (PUT /complete) con SOAP, signos vitales e IMC...');

    try {
      const completeRes = await axios.put(
        `${API_BASE}/appointments/${appointmentId}/complete`,
        {
          soapNote: {
            subjective: 'Paciente refiere mejoría clínica notable',
            objective: 'Normotenso, auscultación cardiopulmonar normal',
            assessment: 'Rinofaringitis aguda en fase resolutiva',
            plan: 'Completar esquema de hidratación y reposo'
          },
          vitalSigns: {
            weightKg: 70,
            heightCm: 175,
            systolic: 120,
            diastolic: 80,
            temperature: 36.6,
            heartRate: 72
          },
          physicalExam: {
            general: { status: 'normal', findings: 'Buen estado general' },
            respiratory: { status: 'normal', findings: 'Murmullo vesicular presente sin agregados' }
          }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const compApt = completeRes.data?.data || completeRes.data;
      if (compApt.status !== 'completed') {
        throw new Error(`Estado no es completed: ${compApt.status}`);
      }

      if (compApt.diagnosis !== 'Rinofaringitis aguda en fase resolutiva') {
        throw new Error(`Diagnosis no se tomó de soapNote.assessment: ${compApt.diagnosis}`);
      }

      if (!compApt.vitalSigns?.bmi || Math.abs(compApt.vitalSigns.bmi - 22.9) > 0.2) {
        throw new Error(`IMC no calculado correctamente: ${compApt.vitalSigns?.bmi}`);
      }

      pass(`Consulta completada exitosamente (status: completed, diagnosis: "${compApt.diagnosis}", IMC: ${compApt.vitalSigns.bmi})`);

      // Intento posterior de PUT /clinical-note sobre cita completada -> 409
      try {
        await axios.put(
          `${API_BASE}/appointments/${appointmentId}/clinical-note`,
          {
            soapNote: { assessment: 'Intento post-cierre' }
          },
          { headers: { Authorization: `Bearer ${docAToken}` } }
        );
        fail('Edición de consulta completada debió responder 409');
        allPassed = false;
      } catch (postCloseErr) {
        if (postCloseErr.response?.status === 409) {
          pass('PUT /clinical-note sobre consulta completada respondió 409 (bloqueada contra edición)');
        } else {
          fail('Respuesta inesperada para cita completada', postCloseErr);
          allPassed = false;
        }
      }
    } catch (err) {
      fail('Completar consulta', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: Emisión de Documentos Médicos, Descarga PDF, Verificación y Anulación
    // ----------------------------------------------------
    logStep(5, 'Emisión de 4 documentos médicos, descarga de PDFs, verificación pública y anulación...');

    let labOrderCode, restNoteId, restNoteCode, certCode, reportCode;

    try {
      // 5.1 Orden de Exámenes
      const labRes = await axios.post(
        `${API_BASE}/medical-documents`,
        {
          appointmentId,
          type: 'lab_order',
          content: {
            exams: [{ category: 'Laboratorio', name: 'Hematología completa' }, { category: 'Laboratorio', name: 'Glicemia en ayunas' }],
            clinicalIndication: 'Control post-tratamiento',
            presumptiveDiagnosis: 'Evaluación general'
          }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const labDoc = labRes.data.data;
      labOrderCode = labDoc.verificationCode;
      pass(`Orden de Exámenes emitida (código: ${labOrderCode})`);

      // Descarga PDF Orden
      const labPdfRes = await axios.get(`${API_BASE}/medical-documents/${labDoc.id}/pdf`, {
        headers: { Authorization: `Bearer ${docAToken}` },
        responseType: 'arraybuffer'
      });
      const labBuffer = Buffer.from(labPdfRes.data);
      if (labBuffer.subarray(0, 4).toString() === '%PDF') {
        fs.writeFileSync(path.join(outputDir, 'lab_order.pdf'), labBuffer);
        pass('PDF de Orden de Exámenes verificado (%PDF) y guardado en output/lab_order.pdf');
      } else {
        throw new Error('Cabecera %PDF no encontrada en lab_order');
      }

      // 5.2 Reposo Médico (includeDiagnosis: false)
      const restRes = await axios.post(
        `${API_BASE}/medical-documents`,
        {
          appointmentId,
          type: 'rest_note',
          content: {
            days: 3,
            includeDiagnosis: false,
            observations: 'Reposo en cama e hidratación abundante'
          }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const restDoc = restRes.data.data;
      restNoteId = restDoc.id;
      restNoteCode = restDoc.verificationCode;
      pass(`Reposo Médico emitido (id: ${restNoteId}, código: ${restNoteCode})`);

      // Descarga PDF Reposo
      const restPdfRes = await axios.get(`${API_BASE}/medical-documents/${restNoteId}/pdf`, {
        headers: { Authorization: `Bearer ${docAToken}` },
        responseType: 'arraybuffer'
      });
      const restBuffer = Buffer.from(restPdfRes.data);
      if (restBuffer.subarray(0, 4).toString() === '%PDF') {
        fs.writeFileSync(path.join(outputDir, 'rest_note.pdf'), restBuffer);
        pass('PDF de Reposo Médico verificado (%PDF) y guardado en output/rest_note.pdf');
      } else {
        throw new Error('Cabecera %PDF no encontrada en rest_note');
      }

      // 5.3 Constancia Médica
      const certRes = await axios.post(
        `${API_BASE}/medical-documents`,
        {
          appointmentId,
          type: 'certificate',
          content: {
            reason: 'Asistencia a consulta médica de rutina',
            attendedFrom: '10:00',
            attendedTo: '10:45',
            observations: 'Paciente atendido en nuestras instalaciones'
          }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const certDoc = certRes.data.data;
      certCode = certDoc.verificationCode;
      pass(`Constancia Médica emitida (código: ${certCode})`);

      // Descarga PDF Constancia
      const certPdfRes = await axios.get(`${API_BASE}/medical-documents/${certDoc.id}/pdf`, {
        headers: { Authorization: `Bearer ${docAToken}` },
        responseType: 'arraybuffer'
      });
      const certBuffer = Buffer.from(certPdfRes.data);
      if (certBuffer.subarray(0, 4).toString() === '%PDF') {
        fs.writeFileSync(path.join(outputDir, 'certificate.pdf'), certBuffer);
        pass('PDF de Constancia Médica verificado (%PDF) y guardado en output/certificate.pdf');
      } else {
        throw new Error('Cabecera %PDF no encontrada en certificate');
      }

      // 5.4 Informe Médico
      const reportRes = await axios.post(
        `${API_BASE}/medical-documents`,
        {
          appointmentId,
          type: 'medical_report',
          content: {
            body: 'Paciente masculino de 32 años quien acude a consulta médica por presentar cuadro respiratorio alto, evidenciándose mejoría clínica notable al momento de la evaluación. Se indica plan de seguimiento oportuno.'
          }
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const reportDoc = reportRes.data.data;
      reportCode = reportDoc.verificationCode;
      pass(`Informe Médico emitido (código: ${reportCode})`);

      // Descarga PDF Informe
      const reportPdfRes = await axios.get(`${API_BASE}/medical-documents/${reportDoc.id}/pdf`, {
        headers: { Authorization: `Bearer ${docAToken}` },
        responseType: 'arraybuffer'
      });
      const reportBuffer = Buffer.from(reportPdfRes.data);
      if (reportBuffer.subarray(0, 4).toString() === '%PDF') {
        fs.writeFileSync(path.join(outputDir, 'medical_report.pdf'), reportBuffer);
        pass('PDF de Informe Médico verificado (%PDF) y guardado en output/medical_report.pdf');
      } else {
        throw new Error('Cabecera %PDF no encontrada en medical_report');
      }

      // 5.5 Verificación pública de cada documento sin token (regla de privacidad 4: sin cédula ni teléfono)
      const verifyCodes = [labOrderCode, restNoteCode, certCode, reportCode];
      for (const code of verifyCodes) {
        const vRes = await axios.get(`${API_BASE}/medical-documents/verify/${code}`);
        const vData = vRes.data?.data;
        if (!vData || !vData.valid) {
          throw new Error(`Verificación fallida para código ${code}`);
        }
        if (vData.identificationNumber || vData.phone || JSON.stringify(vData).includes('V-')) {
          throw new Error(`La verificación de ${code} expone datos sensibles privados`);
        }
      }
      pass('Verificación pública sin token exitosa para los 4 documentos (datos mínimos comprobados)');

      // 5.6 Anular el reposo médico
      await axios.put(
        `${API_BASE}/medical-documents/${restNoteId}/void`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const voidVerifyRes = await axios.get(`${API_BASE}/medical-documents/verify/${restNoteCode}`);
      const voidData = voidVerifyRes.data?.data;
      if (voidData?.status === 'voided' && voidData?.valid === false) {
        pass(`Reposo Médico anulado exitosamente y verificación reporta status 'voided'`);
      } else {
        throw new Error(`Estado de verificación no reportó voided: ${JSON.stringify(voidData)}`);
      }

      // 5.7 Emitir récipe y comprobar verificación unificada en /api/medical-documents/verify/:recipeCode
      const recRes = await axios.post(
        `${API_BASE}/prescriptions`,
        {
          appointmentId,
          items: [{ medication: 'Amoxicilina', dose: '500mg', frequency: 'Cada 8h', duration: '5 días' }]
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      const recipeCode = recRes.data.data?.verificationCode;

      const unifiedRes = await axios.get(`${API_BASE}/medical-documents/verify/${recipeCode}`);
      if (unifiedRes.data?.data?.type === 'prescription' && unifiedRes.data?.data?.valid === true) {
        pass(`Verificación unificada comprobada: código de récipe responde type 'prescription'`);
      } else {
        throw new Error(`Verificación unificada falló: ${JSON.stringify(unifiedRes.data)}`);
      }
    } catch (err) {
      fail('Emisión, verificación o anulación de documentos', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 6: El paciente pide /api/patients/me/record
    // ----------------------------------------------------
    logStep(6, 'Verificando historia clínica del paciente (/api/patients/me/record) y exclusión total de doctorNotes...');

    try {
      const recRes = await axios.get(
        `${API_BASE}/patients/me/record`,
        { headers: { Authorization: `Bearer ${patToken}` } }
      );

      const record = recRes.data?.data || recRes.data;

      if (!record.consultations || record.consultations.length === 0) {
        throw new Error('No se encontraron consultas en la historia del paciente');
      }

      if (!record.documents || record.documents.length === 0) {
        throw new Error('No se encontraron documentos en la historia del paciente');
      }

      // Búsqueda recursiva estricta de doctorNotes
      if (hasKeyRecursive(record, 'doctorNotes')) {
        throw new Error('VIOLACIÓN DE PRIVACIDAD: Se encontró la clave doctorNotes en la respuesta para el paciente');
      }

      pass('El paciente ve su consulta y documentos, y doctorNotes está 100% ausente');
    } catch (err) {
      fail('Historia clínica del paciente', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Ficha del paciente para los médicos (403 para B, datos completos para A)
    // ----------------------------------------------------
    logStep(7, 'Verificando acceso a ficha del paciente (/api/doctor/patients/:patientId/record)...');

    // 7.1 Médico B pide ficha de un paciente con el que nunca tuvo cita -> 403
    try {
      await axios.get(
        `${API_BASE}/doctor/patients/${patId}/record`,
        { headers: { Authorization: `Bearer ${docBToken}` } }
      );
      fail('Médico B debió recibir 403 por no tener citas con el paciente');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass('Médico B recibió 403 al solicitar expediente de paciente sin citas previas');
      } else {
        fail('Respuesta inesperada para Médico B', err);
        allPassed = false;
      }
    }

    // 7.2 Médico A pide la ficha -> 200, incluye consultas, documentos y vitalsSeries
    try {
      const docARecordRes = await axios.get(
        `${API_BASE}/doctor/patients/${patId}/record`,
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const docARecord = docARecordRes.data?.data || docARecordRes.data;
      if (!docARecord.consultations || docARecord.consultations.length === 0) {
        throw new Error('Médico A no visualizó sus consultas con el paciente');
      }

      if (!docARecord.documents || docARecord.documents.length === 0) {
        throw new Error('Médico A no visualizó sus documentos emitidos');
      }

      const hasVitalsWeight = Array.isArray(docARecord.vitalsSeries) && docARecord.vitalsSeries.some(v => v.weightKg === 70);
      if (!hasVitalsWeight) {
        throw new Error(`vitalsSeries no contiene el registro de peso (70 kg): ${JSON.stringify(docARecord.vitalsSeries)}`);
      }

      pass('Médico A obtuvo la ficha completa con consultas, documentos y serie de signos vitales (peso 70 kg)');

      // Probar además agregar alergia y condición desde la vista de médico
      await axios.post(
        `${API_BASE}/doctor/patients/${patId}/allergies`,
        {
          allergen: 'Penicilina',
          allergyType: 'medication',
          severity: 'severe',
          reaction: 'Urticaria generalizada'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Médico A registró alergia al paciente exitosamente');

      await axios.post(
        `${API_BASE}/doctor/patients/${patId}/conditions`,
        {
          condition: 'Hipertensión arterial estadio 1',
          status: 'active',
          severity: 'mild',
          notes: 'En control con dieta y ejercicio'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Médico A registró condición médica al paciente exitosamente');
    } catch (err) {
      fail('Ficha del paciente para Médico A', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 8: Archivos adjuntos privados (Supabase Storage)
    // ----------------------------------------------------
    logStep(8, 'Verificando archivos adjuntos privados (Supabase Storage)...');

    try {
      const dummyPdfBuffer = Buffer.from('%PDF-1.4 dummy clinical attachment test content');
      const form = new FormData();
      form.append('file', new Blob([dummyPdfBuffer], { type: 'application/pdf' }), 'resultado_lab.pdf');
      form.append('title', 'Resultado de Hematología Externa');
      form.append('category', 'Laboratorio');

      let uploadRes;
      try {
        uploadRes = await axios.post(
          `${API_BASE}/medical-documents/attachments`,
          form,
          { headers: { Authorization: `Bearer ${patToken}` } }
        );
      } catch (uploadErr) {
        if (uploadErr.response?.status === 503) {
          omit('Supabase Storage no está configurado en este entorno (503 esperado)');
          uploadRes = null;
        } else {
          throw uploadErr;
        }
      }

      if (uploadRes) {
        const attachmentId = uploadRes.data?.data?.id;
        pass(`Archivo adjunto subido exitosamente por el paciente (id: ${attachmentId})`);

        // Médico A pide URL firmada
        const signedResA = await axios.get(
          `${API_BASE}/medical-documents/${attachmentId}/file`,
          { headers: { Authorization: `Bearer ${docAToken}` } }
        );
        if (signedResA.data?.url) {
          pass('Médico A obtuvo la URL firmada del archivo');
        } else {
          throw new Error('URL firmada no devuelta');
        }

        // Médico B pide URL firmada -> 403
        try {
          await axios.get(
            `${API_BASE}/medical-documents/${attachmentId}/file`,
            { headers: { Authorization: `Bearer ${docBToken}` } }
          );
          fail('Médico B debió recibir 403 para archivo adjunto');
          allPassed = false;
        } catch (bErr) {
          if (bErr.response?.status === 403) {
            pass('Médico B recibió 403 al intentar acceder al archivo adjunto');
          } else {
            fail('Error inesperado para Médico B', bErr);
            allPassed = false;
          }
        }

        // Paciente elimina su archivo
        await axios.delete(
          `${API_BASE}/medical-documents/${attachmentId}/file`,
          { headers: { Authorization: `Bearer ${patToken}` } }
        );
        pass('Paciente eliminó el archivo adjunto correctamente');

        // Confirmar que ya no figura en su historia
        const checkRecRes = await axios.get(
          `${API_BASE}/patients/me/record`,
          { headers: { Authorization: `Bearer ${patToken}` } }
        );
        const hasDeleted = (checkRecRes.data?.data?.attachments || []).some(a => a.id === attachmentId);
        if (!hasDeleted) {
          pass('Archivo eliminado ya no figura en la historia del paciente');
        } else {
          throw new Error('El archivo eliminado aún figura en la historia');
        }
      }
    } catch (err) {
      fail('Flujo de archivos adjuntos', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Resumen de usuarios creados
    // ----------------------------------------------------
    logStep(9, 'Correos de prueba creados en esta ejecución:');
    createdEmails.forEach(email => console.log(`   - ${email}`));

    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`🎉 ${colors.green}${colors.bold}TODOS LOS PASOS DEL BLOQUE A PASARON EXITOSAMENTE!${colors.reset}`);
    } else {
      console.log(`❌ ${colors.red}${colors.bold}ALGUNOS PASOS FALLARON.${colors.reset}`);
    }
    console.log(`======================================================\n`);

  } catch (globalErr) {
    console.error('Error no capturado en la ejecución:', globalErr);
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;
