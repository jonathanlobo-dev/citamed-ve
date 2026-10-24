/**
 * test-assistants-flow.js - CITAMED.VE
 * Semana 9 / Bloque A (A7) - Verificación E2E de Asistentes del Médico
 *
 * Casos cubiertos:
 * 1. Médico invita a asistente por correo (POST /api/assistants/invite) -> pending, auditoría
 * 2. Asistente acepta invitación (POST /api/assistants/:id/accept) -> active, auditoría
 * 3. Asistente accede a agenda del médico (GET /api/appointments/doctor/today con X-Acting-Doctor)
 * 4. Asistente accede a sala de espera (GET /api/waiting-room/queue con X-Acting-Doctor)
 * 5. Asistente crea cita para paciente existente (POST /api/appointments con X-Acting-Doctor)
 * 6. Asistente valida/aprueba un pago (POST /api/payments/:id/approve con X-Acting-Doctor)
 *    -> reviewedBy = asistente.id, auditoría con metadata.onBehalfOfDoctorId
 * 7. Asistente intenta anular cobro SIN permiso (POST /api/payments/:id/void con X-Acting-Doctor) -> 403
 * 8. Médico enciende permiso canVoidReceipts (PUT /api/assistants/:id/permissions) -> auditoría
 * 9. Asistente anula cobro CON permiso (POST /api/payments/:id/void con X-Acting-Doctor)
 *    -> voided, reviewedBy = asistente.id, auditoría con metadata.onBehalfOfDoctorId
 * 10. Asistente intenta rutas clínicas -> 403 en CADA UNA (lista completa comprobada)
 * 11. Asistente de otro médico intenta actuar en nombre del médico -> 403
 * 12. X-Acting-Doctor falso / inexistente -> 403
 * 13. Falta cabecera X-Acting-Doctor -> 403
 * 14. Médico revoca vínculo (DELETE /api/assistants/:id) -> revoked, auditoría; posterior acceso -> 403
 * 15. Limpieza completa de registros en base de datos de Pruebas.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Bloqueo de seguridad: solo ejecutar en Pruebas
const dbUserSuffix = String(process.env.DB_USER || '').slice(-20);
console.log(`[Seguridad] Verificando sufijo de DB_USER: ...${dbUserSuffix}`);
if (!String(process.env.DB_USER || '').endsWith('bvdjfxihcohexgvtyhto')) {
  console.error('ABORTADO: test-assistants-flow.js solo corre contra la base de datos de Pruebas.');
  process.exit(1);
}

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/server');
const db = require('../src/models');
const { todayCaracas } = require('../src/utils/dateCaracas');

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
    if (err.status || err.statusCode) {
      console.error(`         Status: ${err.status || err.statusCode}`);
      console.error(`         Body:`, JSON.stringify(err.body || err.text));
    } else if (err.response) {
      console.error(`         Status: ${err.response.status}`);
      console.error(`         Body:`, JSON.stringify(err.response.body || err.response.text));
    } else {
      console.error(`         Error: ${err.message || JSON.stringify(err)}`);
    }
  }
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 TEST E2E: FLUJO DE ASISTENTES DEL MÉDICO (SEMANA 9)`);
  console.log(`   FECHA HOY: ${todayCaracas()} (America/Caracas)`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);

  // Entidades creadas para limpieza
  const createdAssistantLinkIds = [];
  const createdPaymentIds = [];
  const createdAppointmentIds = [];
  const createdUserIds = [];
  let docAProfile = null;

  try {
    // ----------------------------------------------------
    // SETUP: Crear usuarios y datos base
    // ----------------------------------------------------
    logStep(0, 'Preparando usuarios, perfiles y datos de prueba...');

    // Asegurar tasa de cambio
    let rate = await db.ExchangeRate.findOne({
      where: { currencyPair: 'USD/VES' },
      order: [['createdAt', 'DESC']]
    });
    if (!rate) {
      rate = await db.ExchangeRate.create({
        currencyPair: 'USD/VES',
        rate: 55.50,
        source: 'BCV',
        isManual: false,
        checkedAt: new Date()
      });
    }

    // Doctor A (titular)
    const doctorA = await db.User.create({
      email: `test.doc9.a.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'doctor',
      gender: 'masculino',
      firstName: 'Alejandro',
      lastName: 'Rivas',
      phone: '+584141112233',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(doctorA.id);

    docAProfile = await db.DoctorProfile.create({
      userId: doctorA.id,
      firstName: 'Alejandro',
      lastName: 'Rivas',
      licenseNumber: `LIC9-${uid}-A`,
      mppsNumber: `MPPS9-${uid}`,
      specialtyId: 1,
      paymentSettings: {
        pagoMovil: {
          enabled: true,
          phone: '+584141112233',
          bankCode: '0102',
          idDoc: 'V-12345678',
          accountHolder: 'Dr. Alejandro Rivas'
        },
        transferencia: {
          enabled: true,
          bankCode: '0102',
          accountNumber: '01020123450123456789',
          idDoc: 'V-12345678',
          accountHolder: 'Dr. Alejandro Rivas'
        },
        cashUsd: { enabled: true }
      }
    });

    // Configurar horarios de disponibilidad para Doctor A (días 0..6 de 08:00 a 18:00)
    for (let day = 0; day <= 6; day++) {
      await db.DoctorAvailability.create({
        doctorProfileId: docAProfile.id,
        dayOfWeek: day,
        startTime: '08:00:00',
        endTime: '18:00:00',
        slotDuration: 30,
        isActive: true,
        maxPatients: 20
      });
    }

    // Fecha futura para agendar cita (mañana)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // Doctor B (médico foráneo)
    const doctorB = await db.User.create({
      email: `test.doc9.b.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'doctor',
      gender: 'femenino',
      firstName: 'Beatriz',
      lastName: 'Mendoza',
      phone: '+584142223344',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(doctorB.id);

    await db.DoctorProfile.create({
      userId: doctorB.id,
      firstName: 'Beatriz',
      lastName: 'Mendoza',
      licenseNumber: `LIC9-${uid}-B`,
      mppsNumber: `MPPS9-B-${uid}`,
      specialtyId: 1
    });

    // Paciente de prueba
    const patient = await db.User.create({
      email: `test.pat9.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'patient',
      gender: 'masculino',
      firstName: 'Carlos',
      lastName: 'Pérez',
      phone: '+584123334455',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(patient.id);

    await db.PatientProfile.create({
      userId: patient.id,
      firstName: 'Carlos',
      lastName: 'Pérez'
    });

    // Asistente B (vinculada exclusivamente a Doctor B)
    const assistantB = await db.User.create({
      email: `test.asst9.b.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'assistant',
      gender: 'femenino',
      firstName: 'Bárbara',
      lastName: 'Méndez',
      phone: '+584125556677',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(assistantB.id);

    const linkB = await db.DoctorAssistant.create({
      doctorId: doctorB.id,
      assistantId: assistantB.id,
      status: 'active',
      canAgenda: true,
      canPayments: true,
      canVoidReceipts: false,
      invitedAt: new Date(),
      acceptedAt: new Date()
    });
    createdAssistantLinkIds.push(linkB.id);

    // Cita para validar cobros (Doctor A + Paciente, completada, tarifa 50 USD)
    const aptForPayment = await db.Appointment.create({
      patientId: patient.id,
      doctorId: doctorA.id,
      appointmentDate: todayCaracas(),
      appointmentTime: '09:00:00',
      reason: 'Consulta especializada',
      status: 'completed',
      type: 'presencial',
      consultationFee: 50.00,
      paymentStatus: 'pending'
    });
    createdAppointmentIds.push(aptForPayment.id);

    // Cobro reportado por paciente
    const reportedPayment = await db.Payment.create({
      appointmentId: aptForPayment.id,
      doctorId: doctorA.id,
      patientId: patient.id,
      amountUsd: 50.00,
      exchangeRate: 55.50,
      amountVes: 2775.00,
      method: 'pago_movil',
      reference: `PM9-${uid}`,
      payerBank: 'Banesco',
      payerNote: 'Pago móvil enviado',
      status: 'reported',
      reportedBy: patient.id,
      reportedAt: new Date()
    });
    createdPaymentIds.push(reportedPayment.id);

    pass('Datos base inicializados correctamente');

    const tokenDocA = makeToken(doctorA);
    const tokenDocB = makeToken(doctorB);
    const tokenAsstB = makeToken(assistantB);

    // ----------------------------------------------------
    // PASO 1: Doctor A invita a la asistente principal
    // ----------------------------------------------------
    logStep(1, 'Doctor A invita a asistente por correo (POST /api/assistants/invite)');
    const asstEmail = `test.asst9.a.${uid}@citamed.ve`;

    const resInvite = await request(app)
      .post('/api/assistants/invite')
      .set('Authorization', `Bearer ${tokenDocA}`)
      .send({
        email: asstEmail,
        firstName: 'María',
        lastName: 'Gómez',
        permissions: {
          canAgenda: true,
          canPayments: true,
          canVoidReceipts: false
        }
      });

    let assistantA = null;
    let linkAId = null;

    if (resInvite.status === 201 && resInvite.body.success) {
      linkAId = resInvite.body.data.id;
      createdAssistantLinkIds.push(linkAId);
      const asstUserId = resInvite.body.data.assistantId;
      createdUserIds.push(asstUserId);

      assistantA = await db.User.findByPk(asstUserId);

      // Verificar en BD
      const linkDb = await db.DoctorAssistant.findByPk(linkAId);
      if (linkDb && linkDb.status === 'pending' && linkDb.canAgenda === true && linkDb.canPayments === true && linkDb.canVoidReceipts === false) {
        pass(`Invitación creada en status 'pending' (Link ID: ${linkAId}, Asistente ID: ${asstUserId})`);
      } else {
        fail('El vínculo en BD no tiene los valores esperados', linkDb);
        allPassed = false;
      }

      // Verificar auditoría
      const auditInvite = await db.AuditLog.findOne({
        where: {
          action: 'assistant_invited',
          resource: 'doctor_assistant',
          resourceId: String(linkAId)
        }
      });
      if (auditInvite && auditInvite.userId === doctorA.id) {
        pass(`Auditoría registrada: assistant_invited (userId: ${doctorA.id})`);
      } else {
        fail('No se encontró registro de auditoría para assistant_invited');
        allPassed = false;
      }
    } else {
      fail('Invitación de asistente', resInvite);
      allPassed = false;
      throw new Error('Fallo crítico en paso 1, no se puede continuar');
    }

    const tokenAsstA = makeToken(assistantA);

    // ----------------------------------------------------
    // PASO 2: Asistente A acepta la invitación
    // ----------------------------------------------------
    logStep(2, 'Asistente A acepta invitación (POST /api/assistants/:id/accept)');
    const resAccept = await request(app)
      .post(`/api/assistants/${linkAId}/accept`)
      .set('Authorization', `Bearer ${tokenAsstA}`);

    if (resAccept.status === 200 && resAccept.body.success) {
      const linkDb = await db.DoctorAssistant.findByPk(linkAId);
      if (linkDb && linkDb.status === 'active' && linkDb.acceptedAt) {
        pass(`Invitación aceptada exitosamente, status: 'active'`);
      } else {
        fail('El vínculo en BD no cambió a status: active', linkDb);
        allPassed = false;
      }

      const auditAccept = await db.AuditLog.findOne({
        where: {
          action: 'assistant_accepted',
          resource: 'doctor_assistant',
          resourceId: String(linkAId)
        }
      });
      if (auditAccept && auditAccept.userId === assistantA.id) {
        pass(`Auditoría registrada: assistant_accepted (userId: ${assistantA.id})`);
      } else {
        fail('No se encontró registro de auditoría para assistant_accepted');
        allPassed = false;
      }
    } else {
      fail('Aceptación de invitación', resAccept);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 3: Asistente A consulta la agenda del médico
    // ----------------------------------------------------
    logStep(3, 'Asistente A consulta agenda del médico (GET /api/appointments/doctor/today)');
    const resAgenda = await request(app)
      .get('/api/appointments/doctor/today')
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id));

    if (resAgenda.status === 200 && resAgenda.body.success) {
      pass(`Agenda del Dr. Alejandro Rivas consultada exitosamente (total citas: ${resAgenda.body.data?.length || 0})`);
    } else {
      fail('Consulta de agenda por asistente', resAgenda);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 4: Asistente A consulta sala de espera
    // ----------------------------------------------------
    logStep(4, 'Asistente A consulta sala de espera (GET /api/waiting-room/queue)');
    const resQueue = await request(app)
      .get('/api/waiting-room/queue')
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id));

    if (resQueue.status === 200 && resQueue.body.success) {
      pass('Sala de espera consultada exitosamente en nombre del médico');
    } else {
      fail('Consulta de sala de espera por asistente', resQueue);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: Asistente A crea cita para paciente existente
    // ----------------------------------------------------
    logStep(5, 'Asistente A crea cita para paciente existente (POST /api/appointments)');
    const resCreateApt = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id))
      .send({
        patientId: patient.id,
        appointmentDate: futureDateStr,
        appointmentTime: '10:00',
        type: 'presencial',
        reason: 'Control agendado por asistente'
      });

    if (resCreateApt.status === 201 && resCreateApt.body.success) {
      const createdAptId = resCreateApt.body.data.id;
      createdAppointmentIds.push(createdAptId);
      const aptDb = await db.Appointment.findByPk(createdAptId);

      if (aptDb && aptDb.doctorId === doctorA.id && aptDb.patientId === patient.id) {
        pass(`Cita agendada exitosamente (ID: ${createdAptId}, Doctor: ${doctorA.id}, Paciente: ${patient.id})`);
      } else {
        fail('Cita agendada tiene doctorId o patientId incorrectos', aptDb);
        allPassed = false;
      }
    } else {
      fail('Creación de cita por asistente', resCreateApt);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 6: Asistente A valida/aprueba un pago
    // ----------------------------------------------------
    logStep(6, 'Asistente A aprueba pago (POST /api/payments/:id/approve) -> autor real en reviewedBy y auditoría');
    const resApprove = await request(app)
      .post(`/api/payments/${reportedPayment.id}/approve`)
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id));

    if (resApprove.status === 200 && resApprove.body.success) {
      const paymentDb = await db.Payment.findByPk(reportedPayment.id);
      if (paymentDb && paymentDb.status === 'approved' && paymentDb.reviewedBy === assistantA.id) {
        pass(`Cobro aprobado con reviewedBy = ${assistantA.id} (ID real de la asistente)`);
      } else {
        fail(`El cobro no tiene reviewedBy = ${assistantA.id}`, paymentDb);
        allPassed = false;
      }

      // Verificar auditoría
      const auditApprove = await db.AuditLog.findOne({
        where: {
          action: 'payment_approved',
          resource: 'payment',
          resourceId: String(reportedPayment.id)
        }
      });
      if (auditApprove && auditApprove.userId === assistantA.id && auditApprove.metadata?.onBehalfOfDoctorId === doctorA.id) {
        pass(`Auditoría de aprobación: userId = ${assistantA.id}, onBehalfOfDoctorId = ${doctorA.id}`);
      } else {
        fail('Auditoría no guardó a la asistente como autora o falta onBehalfOfDoctorId', auditApprove);
        allPassed = false;
      }
    } else {
      fail('Aprobación de pago por asistente', resApprove);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Asistente intenta anular cobro SIN permiso (espera 403)
    // ----------------------------------------------------
    logStep(7, 'Asistente A intenta anular cobro SIN permiso canVoidReceipts (espera 403)');
    const resVoidNoPerm = await request(app)
      .post(`/api/payments/${reportedPayment.id}/void`)
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id))
      .send({ reason: 'Intento no autorizado de anulación' });

    if (resVoidNoPerm.status === 403 && resVoidNoPerm.body.code === 'PERMISSION_DENIED') {
      pass(`Bloqueado con 403 PERMISSION_DENIED: ${resVoidNoPerm.body.message}`);
    } else {
      fail('Se esperaba 403 PERMISSION_DENIED al anular sin permiso', resVoidNoPerm);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 8: Médico enciende permiso canVoidReceipts
    // ----------------------------------------------------
    logStep(8, 'Médico concede permiso canVoidReceipts (PUT /api/assistants/:id/permissions)');
    const resPerm = await request(app)
      .put(`/api/assistants/${linkAId}/permissions`)
      .set('Authorization', `Bearer ${tokenDocA}`)
      .send({ canVoidReceipts: true });

    if (resPerm.status === 200 && resPerm.body.data?.canVoidReceipts === true) {
      pass(`Permiso canVoidReceipts encendido exitosamente`);

      const auditPerm = await db.AuditLog.findOne({
        where: {
          action: 'assistant_permissions_changed',
          resource: 'doctor_assistant',
          resourceId: String(linkAId)
        }
      });
      if (auditPerm && auditPerm.userId === doctorA.id) {
        pass(`Auditoría registrada: assistant_permissions_changed`);
      } else {
        fail('No se registró auditoría de cambio de permisos');
        allPassed = false;
      }
    } else {
      fail('Actualización de permisos', resPerm);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Asistente anula cobro CON permiso
    // ----------------------------------------------------
    logStep(9, 'Asistente A anula cobro CON permiso (POST /api/payments/:id/void)');
    const resVoidPerm = await request(app)
      .post(`/api/payments/${reportedPayment.id}/void`)
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', String(doctorA.id))
      .send({ reason: 'Anulación autorizada por error en monto' });

    if (resVoidPerm.status === 200 && resVoidPerm.body.success) {
      const paymentDb = await db.Payment.findByPk(reportedPayment.id);
      if (paymentDb && paymentDb.status === 'voided' && paymentDb.reviewedBy === assistantA.id) {
        pass(`Cobro anulado con reviewedBy = ${assistantA.id}`);
      } else {
        fail(`El cobro anulado no tiene reviewedBy = ${assistantA.id}`, paymentDb);
        allPassed = false;
      }

      const auditVoid = await db.AuditLog.findOne({
        where: {
          action: 'payment_voided',
          resource: 'payment',
          resourceId: String(reportedPayment.id)
        }
      });
      if (auditVoid && auditVoid.userId === assistantA.id && auditVoid.metadata?.onBehalfOfDoctorId === doctorA.id) {
        pass(`Auditoría de anulación: userId = ${assistantA.id}, onBehalfOfDoctorId = ${doctorA.id}`);
      } else {
        fail('Auditoría no guardó a la asistente como autora de la anulación', auditVoid);
        allPassed = false;
      }
    } else {
      fail('Anulación de pago por asistente', resVoidPerm);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 10: Asistente intenta acceder a RUTAS CLÍNICAS (espera 403 en CADA UNA)
    // ----------------------------------------------------
    logStep(10, 'Asistente intenta acceder a rutas clínicas (espera 403 en CADA UNA):');

    const clinicalRoutesToTest = [
      { method: 'post', path: '/api/appointments/walk-in', body: { patientId: patient.id, reasonForVisit: 'Prueba' } },
      { method: 'get', path: `/api/appointments/patient-history/${patient.id}` },
      { method: 'put', path: `/api/appointments/${aptForPayment.id}/start` },
      { method: 'put', path: `/api/appointments/${aptForPayment.id}/clinical-note`, body: { subjective: 'Nota' } },
      { method: 'put', path: `/api/appointments/${aptForPayment.id}/complete`, body: { notes: 'Fin' } },
      { method: 'put', path: `/api/appointments/${aptForPayment.id}/notes`, body: { doctorNotes: 'Notas' } },
      { method: 'put', path: `/api/appointments/${aptForPayment.id}/ai-consent`, body: { consentGiven: true } },
      { method: 'post', path: `/api/waiting-room/start-consultation/1` },
      { method: 'post', path: `/api/waiting-room/end-consultation/1` },
      { method: 'get', path: '/api/doctor/patients' },
      { method: 'get', path: `/api/doctor/patients/${patient.id}/record` },
      { method: 'post', path: '/api/prescriptions', body: { appointmentId: aptForPayment.id } },
      { method: 'post', path: '/api/medical-documents', body: { patientId: patient.id } },
      { method: 'post', path: '/api/ai/soap', body: { transcript: 'Paciente con fiebre' } },
      { method: 'post', path: '/api/ai/rx', body: { diagnosis: 'Infección respiratoria' } },
      { method: 'put', path: '/api/payments/settings', body: { settings: {} } }
    ];

    let allClinicalDenied = true;
    for (const route of clinicalRoutesToTest) {
      let reqSender = request(app)[route.method](route.path)
        .set('Authorization', `Bearer ${tokenAsstA}`)
        .set('X-Acting-Doctor', String(doctorA.id));

      if (route.body) {
        reqSender = reqSender.send(route.body);
      }

      const resClinical = await reqSender;
      if (resClinical.status === 403) {
        pass(`[403 FORBIDDEN] ${route.method.toUpperCase()} ${route.path}`);
      } else {
        fail(`Acceso indebido o código inesperado en ruta clínica: ${route.method.toUpperCase()} ${route.path} -> HTTP ${resClinical.status}`);
        allClinicalDenied = false;
        allPassed = false;
      }
    }

    if (allClinicalDenied) {
      pass(`Verificadas ${clinicalRoutesToTest.length} rutas clínicas: NINGUNA es accesible por la asistente`);
    }

    // ----------------------------------------------------
    // PASO 11: Asistente ajena intenta actuar en nombre de Doctor A
    // ----------------------------------------------------
    logStep(11, 'Asistente de otro médico (Doctor B) intenta actuar sobre Doctor A (espera 403)');
    const resForeignAsst = await request(app)
      .get('/api/appointments/doctor/today')
      .set('Authorization', `Bearer ${tokenAsstB}`)
      .set('X-Acting-Doctor', String(doctorA.id));

    if (resForeignAsst.status === 403 && resForeignAsst.body.code === 'NO_ACTIVE_LINK') {
      pass(`Bloqueado con 403 NO_ACTIVE_LINK: ${resForeignAsst.body.message}`);
    } else {
      fail('Se esperaba 403 NO_ACTIVE_LINK para asistente ajena', resForeignAsst);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 12: Asistente envía X-Acting-Doctor falso / inexistente
    // ----------------------------------------------------
    logStep(12, 'Asistente A envía X-Acting-Doctor con ID inexistente: 999999 (espera 403)');
    const resFakeDoc = await request(app)
      .get('/api/appointments/doctor/today')
      .set('Authorization', `Bearer ${tokenAsstA}`)
      .set('X-Acting-Doctor', '999999');

    if (resFakeDoc.status === 403) {
      pass(`Bloqueado con 403: ${resFakeDoc.body.message || resFakeDoc.body.code}`);
    } else {
      fail('Se esperaba 403 para médico inexistente', resFakeDoc);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 13: Asistente NO envía la cabecera X-Acting-Doctor
    // ----------------------------------------------------
    logStep(13, 'Asistente A omite cabecera X-Acting-Doctor (espera 403 ACTING_DOCTOR_REQUIRED)');
    const resMissingHeader = await request(app)
      .get('/api/appointments/doctor/today')
      .set('Authorization', `Bearer ${tokenAsstA}`);

    if (resMissingHeader.status === 403 && resMissingHeader.body.code === 'ACTING_DOCTOR_REQUIRED') {
      pass(`Bloqueado con 403 ACTING_DOCTOR_REQUIRED: ${resMissingHeader.body.message}`);
    } else {
      fail('Se esperaba 403 ACTING_DOCTOR_REQUIRED al omitir cabecera', resMissingHeader);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 14: Médico revoca vínculo con la asistente
    // ----------------------------------------------------
    logStep(14, 'Médico revoca vínculo (DELETE /api/assistants/:id) y verifica bloqueo posterior');
    const resRevoke = await request(app)
      .delete(`/api/assistants/${linkAId}`)
      .set('Authorization', `Bearer ${tokenDocA}`);

    if (resRevoke.status === 200 && resRevoke.body.success) {
      const linkDb = await db.DoctorAssistant.findByPk(linkAId);
      if (linkDb && linkDb.status === 'revoked' && linkDb.revokedAt) {
        pass(`Vínculo revocado exitosamente en BD (status: 'revoked')`);
      } else {
        fail('El vínculo en BD no tiene status: revoked', linkDb);
        allPassed = false;
      }

      const auditRevoke = await db.AuditLog.findOne({
        where: {
          action: 'assistant_revoked',
          resource: 'doctor_assistant',
          resourceId: String(linkAId)
        }
      });
      if (auditRevoke && auditRevoke.userId === doctorA.id) {
        pass(`Auditoría registrada: assistant_revoked (userId: ${doctorA.id})`);
      } else {
        fail('No se registró auditoría de revocación');
        allPassed = false;
      }

      // Probar que asistente ya no tiene acceso
      const resAfterRevoke = await request(app)
        .get('/api/appointments/doctor/today')
        .set('Authorization', `Bearer ${tokenAsstA}`)
        .set('X-Acting-Doctor', String(doctorA.id));

      if (resAfterRevoke.status === 403 && resAfterRevoke.body.code === 'NO_ACTIVE_LINK') {
        pass(`Acceso posterior denegado con 403 NO_ACTIVE_LINK tras revocación`);
      } else {
        fail('Se esperaba 403 NO_ACTIVE_LINK tras revocación del vínculo', resAfterRevoke);
        allPassed = false;
      }
    } else {
      fail('Revocación de asistente', resRevoke);
      allPassed = false;
    }

  } catch (err) {
    console.error('Error no capturado durante el test:', err);
    allPassed = false;
  } finally {
    // ----------------------------------------------------
    // PASO 15: Limpieza de registros creados en BD
    // ----------------------------------------------------
    logStep(15, 'Limpiando registros de prueba creados en base de datos...');
    try {
      if (createdAssistantLinkIds.length > 0) {
        await db.DoctorAssistant.destroy({ where: { id: createdAssistantLinkIds }, force: true });
        pass(`Eliminados ${createdAssistantLinkIds.length} vínculos de asistente de prueba`);
      }
      if (createdPaymentIds.length > 0) {
        await db.Payment.destroy({ where: { id: createdPaymentIds }, force: true });
        pass(`Eliminados ${createdPaymentIds.length} cobros de prueba`);
      }
      if (createdAppointmentIds.length > 0) {
        await db.Appointment.destroy({ where: { id: createdAppointmentIds }, force: true });
        pass(`Eliminadas ${createdAppointmentIds.length} citas de prueba`);
      }
      if (createdUserIds.length > 0) {
        if (docAProfile && docAProfile.id) {
          await db.DoctorAvailability.destroy({ where: { doctorProfileId: docAProfile.id } });
        }
        await db.DoctorProfile.destroy({ where: { userId: createdUserIds } });
        await db.PatientProfile.destroy({ where: { userId: createdUserIds } });
        await db.User.destroy({ where: { id: createdUserIds }, force: true });
        pass(`Eliminados ${createdUserIds.length} usuarios y perfiles de prueba`);
      }
      pass('Base de datos limpia, sin residuos de pruebas');
    } catch (cleanErr) {
      console.error('Error limpiando BD:', cleanErr.message);
    }

    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`🎉 ${colors.green}${colors.bold}TODAS LAS PRUEBAS DEL FLUJO DE ASISTENTES PASARON EXITOSAMENTE${colors.reset}`);
    } else {
      console.log(`❌ ${colors.red}${colors.bold}ALGUNAS PRUEBAS FALLARON${colors.reset}`);
    }
    console.log(`======================================================\n`);

    if (process.exitCode === undefined) {
      process.exitCode = allPassed ? 0 : 1;
    }
    process.exit(allPassed ? 0 : 1);
  }
}

run();
