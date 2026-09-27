/**
 * test-ai-flow.js - CITAMED.VE
 * M03 / Semana 7 - Prueba de punta a punta del Servicio de IA y Asistente Clínico (B4)
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { todayCaracas } = require('../src/utils/dateCaracas');
const { deidentify } = require('../src/services/ai/deidentify');
const { AiUsage, PlatformSetting } = require('../src/models');

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

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST: SERVICIO DE IA Y ASISTENTE CLÍNICO`);
  console.log(`   API URL: ${API_BASE}`);
  console.log(`   AI_ALLOW_MOCK: ${process.env.AI_ALLOW_MOCK}`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);

  let adminToken;
  let initialProvidersSetting = null;
  let initialTranscriptionSetting = null;
  let initialLimitsSetting = null;

  let docAToken, docAId, docAProfileId, docAEmail;
  let docBToken, docBId, docBEmail;
  let patToken, patId, patEmail;
  let appointmentId;

  try {
    // ----------------------------------------------------
    // INICIO DE SESIÓN DE ADMIN Y RESPALDO DE CONFIGURACIÓN
    // ----------------------------------------------------
    try {
      const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@citamed.ve',
        password: 'Admin123!'
      });
      adminToken = adminLoginRes.data.token || adminLoginRes.data.data?.token;
      if (!adminToken) throw new Error('Token de admin no obtenido');
    } catch (err) {
      fail('Inicio de sesión de admin falló', err);
      process.exit(1);
    }

    // Respaldar configuración actual de la BD para restaurar al final
    try {
      const [pSet, tSet, lSet] = await Promise.all([
        PlatformSetting.findByPk('ai_providers'),
        PlatformSetting.findByPk('ai_transcription'),
        PlatformSetting.findByPk('ai_limits')
      ]);
      initialProvidersSetting = pSet ? pSet.value : null;
      initialTranscriptionSetting = tSet ? tSet.value : null;
      initialLimitsSetting = lSet ? lSet.value : null;
    } catch (err) {
      console.warn('Advertencia al respaldar configuración inicial de BD:', err.message);
    }

    // ----------------------------------------------------
    // PASO 1: Admin guarda cadena mock y límites bajos (mensual: 3)
    // ----------------------------------------------------
    logStep(1, 'Admin guarda cadena mock [fail, echo] y límite de 3 acciones en PUT /api/admin/ai/config...');

    try {
      const configPayload = {
        providers: [
          { provider: 'mock', model: 'fail', apiKey: 'mock-key-fail', enabled: true },
          { provider: 'mock', model: 'echo', apiKey: 'mock-key-echo', enabled: true }
        ],
        transcription: [
          { provider: 'mock', model: 'echo', apiKey: 'mock-key-trans', enabled: true }
        ],
        limits: {
          enabled: true,
          monthlyActionsPerDoctor: 3,
          perMinutePerUser: 10
        }
      };

      const putRes = await axios.put(`${API_BASE}/admin/ai/config`, configPayload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (putRes.data.success) {
        pass('Configuración mock y límites guardados exitosamente');
      } else {
        fail('Respuesta inesperada al guardar configuración', putRes.data);
        allPassed = false;
      }
    } catch (err) {
      fail('Guardado de configuración de IA falló', err);
      allPassed = false;
      return;
    }

    // ----------------------------------------------------
    // PASO 2: GET /api/admin/ai/config no expone llaves ni apiKeyEnc
    // ----------------------------------------------------
    logStep(2, 'Verificando seguridad de GET /api/admin/ai/config (sin llaves ni apiKeyEnc expuestas)...');

    try {
      const getRes = await axios.get(`${API_BASE}/admin/ai/config`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const rawJsonString = JSON.stringify(getRes.data);

      if (rawJsonString.includes('apiKeyEnc')) {
        fail('Fuga de seguridad: la respuesta contiene el campo "apiKeyEnc"');
        allPassed = false;
      } else if (rawJsonString.includes('mock-key-fail') || rawJsonString.includes('mock-key-echo')) {
        fail('Fuga de seguridad: la respuesta contiene llaves de API en texto plano');
        allPassed = false;
      } else {
        pass('Ninguna respuesta contiene "apiKeyEnc" ni llaves en texto plano');
      }

      const providers = getRes.data.providers || [];
      const hasKeyCheck = providers.length > 0 && providers.every(p => p.hasKey === true && typeof p.keyPreview === 'string');

      if (hasKeyCheck) {
        pass('hasKey es true y keyPreview está presente para todos los proveedores configurados');
      } else {
        fail('hasKey o keyPreview no cumplen con la especificación requerida');
        allPassed = false;
      }
    } catch (err) {
      fail('GET /admin/ai/config falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // REGISTRO DE USUARIOS PARA PRUEBAS (Médico A, Médico B, Paciente)
    // ----------------------------------------------------
    console.log('\n  Registrando médicos y paciente para pruebas clínicas...');

    docAEmail = `e2e.s7.docA.${uid}@citamed.ve`;
    const docAPayload = {
      email: docAEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Alonso',
      lastName: 'Guzmán',
      identificationNumber: `V-${uid}01`,
      dateOfBirth: '1981-05-15',
      gender: 'male',
      phone: '+584149991101',
      mppsNumber: `MPPS${uid}1`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2006,
      clinicName: `Consultorio San Rafael ${uid}`,
      consultationAddress: 'Av. Libertador, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '00:00',
      endTime: '23:59',
      priceConsultation: 45.00
    };

    const docARes = await axios.post(`${API_BASE}/auth/register/doctor`, docAPayload);
    docAToken = docARes.data.token || docARes.data.data?.token;
    docAId = docARes.data.user?.id || docARes.data.data?.user?.id;
    docAProfileId = docARes.data.doctorProfile?.id || docARes.data.data?.doctorProfile?.id;
    if (!docAProfileId) {
      const meRes = await axios.get(`${API_BASE}/doctors/me`, {
        headers: { Authorization: `Bearer ${docAToken}` }
      });
      docAProfileId = meRes.data?.data?.id;
    }

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

    // Médico B
    docBEmail = `e2e.s7.docB.${uid}@citamed.ve`;
    const docBPayload = {
      email: docBEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Beatriz',
      lastName: 'Paredes',
      identificationNumber: `V-${uid}02`,
      dateOfBirth: '1985-08-20',
      gender: 'female',
      phone: '+584149991102',
      mppsNumber: `MPPS${uid}2`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2010,
      clinicName: `Centro Médico Los Palos Grandes ${uid}`,
      consultationAddress: 'Los Palos Grandes, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday'],
      startTime: '08:00',
      endTime: '12:00',
      priceConsultation: 50.00
    };
    const docBRes = await axios.post(`${API_BASE}/auth/register/doctor`, docBPayload);
    docBToken = docBRes.data.token || docBRes.data.data?.token;
    docBId = docBRes.data.user?.id || docBRes.data.data?.user?.id;

    // Paciente
    const patCedula = `V-15${uid}`;
    patEmail = `e2e.s7.pat.${uid}@citamed.ve`;
    const patPayload = {
      email: patEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Valeria',
      lastName: 'Mendoza',
      identificationNumber: patCedula,
      dateOfBirth: '1990-03-25',
      gender: 'female',
      phone: '+584129992203',
      bloodType: 'O+',
      emergencyContactName: 'Pedro Mendoza',
      emergencyContactPhone: '+584141112233'
    };
    const patRes = await axios.post(`${API_BASE}/auth/register/patient`, patPayload);
    patToken = patRes.data.token || patRes.data.data?.token;
    patId = patRes.data.user?.id || patRes.data.data?.user?.id;

    // Crear cita de hoy y confirmarla
    const today = todayCaracas();
    const slotsRes = await axios.get(
      `${API_BASE}/appointments/available-slots?doctorProfileId=${docAProfileId}&date=${today}`,
      { headers: { Authorization: `Bearer ${patToken}` } }
    );
    const chosenSlot = slotsRes.data?.data?.slots?.[0]?.start || '10:00';

    const aptRes = await axios.post(
      `${API_BASE}/appointments`,
      {
        doctorId: docAId,
        doctorProfileId: docAProfileId,
        specialtyId: 1,
        appointmentDate: today,
        appointmentTime: chosenSlot,
        type: 'presencial',
        reasonForVisit: 'Dolor de garganta y fiebre alta'
      },
      { headers: { Authorization: `Bearer ${patToken}` } }
    );
    appointmentId = aptRes.data.data?.id || aptRes.data.appointment?.id;

    // Confirmar cita por el médico
    await axios.put(
      `${API_BASE}/appointments/${appointmentId}/confirm`,
      {},
      { headers: { Authorization: `Bearer ${docAToken}` } }
    );
    pass(`Cita #${appointmentId} creada y confirmada para Médico A y Paciente`);

    // ----------------------------------------------------
    // PASO 3: POST /api/ai/soap sin consentimiento: 409 AI_CONSENT_REQUIRED
    // ----------------------------------------------------
    logStep(3, 'Médico A llama a POST /api/ai/soap sin consentimiento (esperado: 409 AI_CONSENT_REQUIRED)...');

    try {
      await axios.post(
        `${API_BASE}/ai/soap`,
        {
          appointmentId,
          text: 'Paciente refiere malestar general y dolor de garganta.'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      fail('El endpoint permitió ejecutar SOAP sin consentimiento del paciente (debió responder 409)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.code === 'AI_CONSENT_REQUIRED') {
        pass('Se rechazó la solicitud correctamente con 409 y código AI_CONSENT_REQUIRED');
      } else {
        fail('Respuesta inesperada al solicitar SOAP sin consentimiento', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 4: Consentimiento registrado, fallback de fail a echo y registro en ai_usage
    // ----------------------------------------------------
    logStep(4, 'Registrando consentimiento con PUT /api/appointments/:id/ai-consent y probando fallback en /api/ai/soap...');

    let soapProposal = null;
    let soapProvider = null;

    try {
      const consentRes = await axios.put(
        `${API_BASE}/appointments/${appointmentId}/ai-consent`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      if (consentRes.status === 200 && consentRes.data.success) {
        pass('Consentimiento registrado con éxito (200)');
      } else {
        fail('Fallo al registrar consentimiento', consentRes.data);
        allPassed = false;
      }

      // Consulta GET de la cita para comprobar que devuelve aiConsentAt
      const getAptRes = await axios.get(`${API_BASE}/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${docAToken}` }
      });
      const aptData = getAptRes.data.data;
      if (aptData && aptData.aiConsentAt) {
        pass(`GET de la cita devuelve aiConsentAt (${aptData.aiConsentAt})`);
      } else {
        fail('GET de la cita no devolvió aiConsentAt');
        allPassed = false;
      }

      // Llamar a /api/ai/soap
      const soapRes = await axios.post(
        `${API_BASE}/ai/soap`,
        {
          appointmentId,
          text: 'Paciente Valeria Mendoza acude por faringitis.'
        },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      if (soapRes.status === 200 && soapRes.data.success) {
        soapProposal = soapRes.data.proposal;
        soapProvider = soapRes.data.provider;
        pass(`POST /api/ai/soap respondió 200 con proveedor '${soapProvider}'`);
      } else {
        fail('POST /api/ai/soap falló', soapRes.data);
        allPassed = false;
      }

      // Verificar en ai_usage: una fila fallida y una exitosa
      const usageRows = await AiUsage.findAll({
        where: { appointmentId },
        order: [['id', 'ASC']]
      });

      const hasFail = usageRows.some(r => r.success === false && r.model === 'fail');
      const hasSuccess = usageRows.some(r => r.success === true && r.model === 'echo');

      if (hasFail && hasSuccess) {
        pass('ai_usage contiene la fila fallida (mock:fail) y la fila exitosa (mock:echo) demostrando salto automático');
      } else {
        fail(`ai_usage no registró adecuadamente las filas esperadas (encontradas: ${usageRows.length})`);
        allPassed = false;
      }
    } catch (err) {
      fail('Paso 4 falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: Propuesta contiene solo claves permitidas y valor fuera de rango en warnings
    // ----------------------------------------------------
    logStep(5, 'Validando estructura de la propuesta SOAP y detección de valores fuera de rango...');

    if (soapProposal) {
      const allowedKeys = ['subjective', 'objective', 'assessment', 'plan', 'vitalSigns', 'physicalExam', 'labOrders', 'warnings'];
      const proposalKeys = Object.keys(soapProposal);
      const invalidKeys = proposalKeys.filter(k => !allowedKeys.includes(k));

      if (invalidKeys.length === 0) {
        pass('La propuesta solo contiene las claves permitidas (se eliminaron campos no autorizados)');
      } else {
        fail(`La propuesta contiene claves no permitidas: ${invalidKeys.join(', ')}`);
        allPassed = false;
      }

      // El mock retorna temperature: 60 (fuera de rango 30-45). Debe estar en warnings y no en vitalSigns.
      const hasTempWarning = (soapProposal.warnings || []).some(w => w.includes('temperature') || w.includes('fuera de rango') || w.includes('60'));
      const tempInVitals = soapProposal.vitalSigns?.temperature;

      if (hasTempWarning && tempInVitals === undefined) {
        pass('El valor fuera de rango (temperatura 60) fue descartado de vitalSigns y agregado a warnings');
      } else {
        fail(`Valor fuera de rango no manejado correctamente: tempInVitals=${tempInVitals}, warnings=${JSON.stringify(soapProposal.warnings)}`);
        allPassed = false;
      }
    } else {
      fail('No hay propuesta SOAP para evaluar');
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 6: Prueba unitaria de deidentify()
    // ----------------------------------------------------
    logStep(6, 'Prueba unitaria de anonimización (deidentify) en el servidor...');

    const sampleClinicalText = 
      'Paciente Valeria Mendoza, titular de la cédula V-15.482.931 (también registrada como 15482931 o V15482931), ' +
      'número celular 0412-9992203 y correo valeria@test.com presenta odinofagia. Firmado por valeria mendoza.';

    const anonymized = deidentify(sampleClinicalText, {
      firstName: 'Valeria',
      lastName: 'Mendoza',
      identificationNumber: '15.482.931',
      phone: '0412-9992203',
      email: 'valeria@test.com'
    });

    const leakedWords = [];
    if (anonymized.toLowerCase().includes('valeria')) leakedWords.push('Valeria');
    if (anonymized.toLowerCase().includes('mendoza')) leakedWords.push('Mendoza');
    if (anonymized.includes('15.482.931')) leakedWords.push('15.482.931');
    if (anonymized.includes('15482931')) leakedWords.push('15482931');
    if (anonymized.includes('9992203')) leakedWords.push('9992203');
    if (anonymized.includes('valeria@test.com')) leakedWords.push('valeria@test.com');

    if (leakedWords.length === 0) {
      pass('deidentify() anonimizó nombre, apellido, cédula (con y sin formato), teléfono y correo');
      console.log(`         Resultado anonimizado: "${anonymized}"`);
    } else {
      fail(`Fuga detectada en anonimización: ${leakedWords.join(', ')}`);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Médico B intenta usar la cita de Médico A: 403
    // ----------------------------------------------------
    logStep(7, 'Médico B intenta usar la cita del Médico A en /api/ai/soap (esperado: 403)...');

    try {
      await axios.post(
        `${API_BASE}/ai/soap`,
        {
          appointmentId,
          text: 'Intento de procesamiento no autorizado'
        },
        { headers: { Authorization: `Bearer ${docBToken}` } }
      );
      fail('El sistema permitió a Médico B acceder a la cita de Médico A (debió responder 403)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass('Médico B recibió 403 al intentar acceder a la cita de Médico A');
      } else {
        fail('Respuesta inesperada para médico no dueño', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 8: Límite de cuota mensual (3 acciones): 4ta acción -> 402 AI_QUOTA_EXCEEDED
    // ----------------------------------------------------
    logStep(8, 'Alcanzando límite de cuota (3 acciones exitosas). Cuarta acción esperada: 402 AI_QUOTA_EXCEEDED...');

    try {
      // Uso #2 para Médico A
      await axios.post(
        `${API_BASE}/ai/soap`,
        { appointmentId, text: 'Segunda consulta para consumo de cuota' },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Acción #2 exitosa');

      // Uso #3 para Médico A (llega al límite de 3)
      await axios.post(
        `${API_BASE}/ai/improve`,
        { appointmentId, field: 'subjective', text: 'Tercera acción de prueba' },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass('Acción #3 exitosa (límite alcanzado)');

      // Uso #4 para Médico A (debe ser rechazado con 402)
      try {
        await axios.post(
          `${API_BASE}/ai/improve`,
          { appointmentId, field: 'subjective', text: 'Cuarta acción no permitida' },
          { headers: { Authorization: `Bearer ${docAToken}` } }
        );
        fail('El sistema permitió exceder el límite mensual de acciones (debió responder 402)');
        allPassed = false;
      } catch (errQuota) {
        if (errQuota.response?.status === 402 && errQuota.response?.data?.code === 'AI_QUOTA_EXCEEDED') {
          pass('Cuarta acción rechazada correctamente con 402 AI_QUOTA_EXCEEDED');
        } else {
          fail('Respuesta inesperada al exceder cuota', errQuota);
          allPassed = false;
        }
      }
    } catch (err) {
      fail('Fallo en prueba de cuota mensual', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Cita completada: 409 INVALID_APPOINTMENT_STATUS
    // ----------------------------------------------------
    logStep(9, 'Completando cita y verificando bloqueo de IA en citas completadas (esperado: 409)...');

    try {
      // Completar la cita
      await axios.put(
        `${API_BASE}/appointments/${appointmentId}/complete`,
        { diagnosis: 'Faringitis aguda' },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      pass(`Cita #${appointmentId} marcada como completada`);

      try {
        await axios.post(
          `${API_BASE}/ai/soap`,
          { appointmentId, text: 'Texto en cita completada' },
          { headers: { Authorization: `Bearer ${docAToken}` } }
        );
        fail('El sistema permitió usar IA en una cita completada (debió responder 409)');
        allPassed = false;
      } catch (errComplete) {
        if (errComplete.response?.status === 409 && errComplete.response?.data?.code === 'INVALID_APPOINTMENT_STATUS') {
          pass('La solicitud en cita completada fue rechazada correctamente con 409 INVALID_APPOINTMENT_STATUS');
        } else {
          fail('Respuesta inesperada en cita completada', errComplete);
          allPassed = false;
        }
      }
    } catch (err) {
      fail('Paso 9 falló al completar la cita', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 10: Prueba con proveedores reales (si existen llaves en .env)
    // ----------------------------------------------------
    logStep(10, 'Verificando llaves de proveedores reales (GEMINI_API_KEY / GROQ_API_KEY)...');

    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasGroq = !!process.env.GROQ_API_KEY;

    if (hasGemini || hasGroq) {
      pass(`Llaves reales detectadas: Gemini=${hasGemini}, Groq=${hasGroq}. Ejecutando pruebas reales...`);

      // Restaurar límites altos para la prueba real
      await axios.put(
        `${API_BASE}/admin/ai/config`,
        {
          limits: { enabled: true, monthlyActionsPerDoctor: 500, perMinutePerUser: 10 }
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      // Crear nueva cita confirmada para Médico A
      const slotTime = '11:00';
      const realAptRes = await axios.post(
        `${API_BASE}/appointments`,
        {
          doctorId: docAId,
          doctorProfileId: docAProfileId,
          specialtyId: 1,
          appointmentDate: today,
          appointmentTime: slotTime,
          type: 'presencial',
          reasonForVisit: 'Prueba de IA en vivo'
        },
        { headers: { Authorization: `Bearer ${patToken}` } }
      );
      const realAptId = realAptRes.data.data?.id || realAptRes.data.appointment?.id;

      await axios.put(
        `${API_BASE}/appointments/${realAptId}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );
      await axios.put(
        `${API_BASE}/appointments/${realAptId}/ai-consent`,
        {},
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      // Prueba improve
      const dirtyText = 'pasiente con fievre de 39 grados desde ayer, tomar acetaminofen 500 mg cada 8 oras';
      const improveRes = await axios.post(
        `${API_BASE}/ai/improve`,
        { appointmentId: realAptId, field: 'plan', text: dirtyText },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const improved = improveRes.data?.text || '';
      console.log(`         Texto original: "${dirtyText}"`);
      console.log(`         Texto mejorado: "${improved}"`);

      if (improved.includes('39') && improved.includes('500 mg') && improved.includes('8')) {
        pass('Mejorar redacción preservó números y dosis exactos (39, 500 mg, 8)');
      } else {
        fail('Mejorar redacción alteró los números o dosis clínicas');
        allPassed = false;
      }

      // Prueba soap con dictado clínico
      const clinicalDictation = 
        'Paciente masculino de 42 años que refiere dolor faríngeo intenso desde hace 2 días, disfagia y fiebre de 38.8 grados. ' +
        'Al examen físico orofaringe congestiva con amígdalas grado 3 eritematosas y exudado purulento. Tensión 120/80 mmHg, ' +
        'frecuencia cardíaca 84 lpm, saturación 99%. Impresión: Amigdalitis bacteriana. Indico cultivo y reposo.';

      const realSoapRes = await axios.post(
        `${API_BASE}/ai/soap`,
        { appointmentId: realAptId, text: clinicalDictation },
        { headers: { Authorization: `Bearer ${docAToken}` } }
      );

      const realProposal = realSoapRes.data?.proposal;
      console.log('         Propuesta SOAP recibida en vivo:\n', JSON.stringify(realProposal, null, 2));

      if (realProposal && realProposal.assessment) {
        pass('Propuesta SOAP en vivo generada exitosamente con proveedor real');
      } else {
        fail('No se obtuvo propuesta SOAP válida con proveedor real');
        allPassed = false;
      }
    } else {
      pass('No hay GEMINI_API_KEY ni GROQ_API_KEY en .env local. Se omite llamada externa real (la cadena mock validó el flujo completo).');
    }

    // ----------------------------------------------------
    // RESUMEN FINAL
    // ----------------------------------------------------
    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`🎉 ${colors.green}${colors.bold}TODOS LOS PASOS DEL BLOQUE B (SERVICIO DE IA) PASARON EXITOSAMENTE!${colors.reset}`);
    } else {
      console.log(`❌ ${colors.red}${colors.bold}ALGUNOS PASOS DEL BLOQUE B FALLARON.${colors.reset}`);
    }
    console.log(`======================================================\n`);

    if (!allPassed) {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Error no capturado en la ejecución de test-ai-flow:', globalErr);
    process.exit(1);
  } finally {
    // Restaurar configuración original en platform_settings
    console.log('Restaurando configuración original de IA en platform_settings...');
    try {
      if (initialProvidersSetting !== null) {
        await PlatformSetting.upsert({ key: 'ai_providers', value: initialProvidersSetting, updated_at: new Date() });
      }
      if (initialTranscriptionSetting !== null) {
        await PlatformSetting.upsert({ key: 'ai_transcription', value: initialTranscriptionSetting, updated_at: new Date() });
      }
      if (initialLimitsSetting !== null) {
        await PlatformSetting.upsert({ key: 'ai_limits', value: initialLimitsSetting, updated_at: new Date() });
      }
      console.log('Configuración original de platform_settings restaurada.');
    } catch (cleanupErr) {
      console.warn('Advertencia restaurando configuración de BD:', cleanupErr.message);
    }
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;
