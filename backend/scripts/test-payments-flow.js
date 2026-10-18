/**
 * test-payments-flow.js - CITAMED.VE
 * Bloque A (A7) - Verificación E2E del backend de Cobros (Semana 8)
 *
 * Ejercita contra la base de datos de Pruebas:
 * 1. Reporte de pago por paciente
 * 2. Rechazo por médico con motivo
 * 3. Re-reporte por paciente con nueva referencia
 * 4. Aprobación por médico -> verifica generación de receiptNumber correlativo y cita paid
 * 5. Descarga del PDF del recibo (verifica que el buffer empiece con %PDF)
 * 6. Verificación pública del código (privacidad de datos sensibles)
 * 7. Intento de duplicar referencia con mismo banco y fecha -> 409 Conflict
 * 8. Idempotencia del reporte en cita pagada -> 400
 * 9. Control de acceso: paciente ajeno intenta pagar -> 403
 * 10. Control de acceso: médico ajeno intenta aprobar -> 403
 * 11. Cita cancelada no permite pago -> 400
 * 12. Cita con tarifa 0 no permite pago -> 400
 * 13. Anulación del recibo por médico con motivo -> voided y cita vuelve a unpaid
 * 14. Limpieza completa de registros creados en BD
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Esta prueba crea y borra usuarios, citas y cobros: nunca contra producción
if (!String(process.env.DB_USER || '').endsWith('bvdjfxihcohexgvtyhto')) {
  console.error('ABORTADO: test-payments-flow.js solo corre contra la base de Pruebas.');
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
    if (err.response) {
      console.error(`         Status: ${err.response.status}`);
      console.error(`         Body:`, JSON.stringify(err.response.body || err.response.text));
    } else {
      console.error(`         Error: ${err.message || err}`);
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
  console.log(`🚀 INICIANDO TEST: FLUJO DE COBROS CITAMED (SEMANA 8)`);
  console.log(`   FECHA HOY:  ${todayCaracas()} (America/Caracas)`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);

  // Entities to clean up
  const createdPaymentIds = [];
  const createdAppointmentIds = [];
  const createdUserIds = [];

  try {
    // ----------------------------------------------------
    // SETUP: Crear usuarios y citas en Pruebas
    // ----------------------------------------------------
    logStep(0, 'Preparando usuarios y citas de prueba en BD...');

    // Asegurar tasa de cambio activa
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

    // Médico A
    const doctorA = await db.User.create({
      email: `test.doc.a.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'doctor',
      gender: 'masculino',
      firstName: 'DoctorA',
      lastName: 'Prueba',
      phone: '+584141112233',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(doctorA.id);

    const docAProfile = await db.DoctorProfile.create({
      userId: doctorA.id,
      firstName: 'DoctorA',
      lastName: 'Prueba',
      licenseNumber: `LIC-${uid}-A`,
      mppsNumber: `MPPS-${uid}`,
      specialtyId: 1,
      paymentSettings: {
        pagoMovil: {
          enabled: true,
          phone: '+584141112233',
          bankCode: '0102',
          idDoc: 'V-12345678',
          accountHolder: 'Dr. A Prueba'
        },
        transferencia: {
          bankCode: '0102',
          accountNumber: '01020123450123456789',
          idDoc: 'V-12345678',
          accountHolder: 'Dr. A Prueba'
        },
        zelle: {
          email: 'dra@citamed.ve',
          accountHolder: 'Dr. A Prueba'
        },
        cashUsd: { enabled: true }
      }
    });

    // Médico B (médico ajeno)
    const doctorB = await db.User.create({
      email: `test.doc.b.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'doctor',
      gender: 'masculino',
      firstName: 'DoctorB',
      lastName: 'Ajeno',
      phone: '+584142223344',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(doctorB.id);

    await db.DoctorProfile.create({
      userId: doctorB.id,
      firstName: 'DoctorB',
      lastName: 'Ajeno',
      licenseNumber: `LIC-${uid}-B`,
      mppsNumber: `MPPS-B-${uid}`,
      specialtyId: 1
    });

    // Paciente 1
    const patient1 = await db.User.create({
      email: `test.pat.1.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'patient',
      gender: 'masculino',
      firstName: 'Paciente1',
      lastName: 'Prueba',
      phone: '+584123334455',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(patient1.id);

    await db.PatientProfile.create({
      userId: patient1.id,
      firstName: 'Paciente1',
      lastName: 'Prueba'
    });

    // Paciente 2 (paciente ajeno)
    const patient2 = await db.User.create({
      email: `test.pat.2.${uid}@citamed.ve`,
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      role: 'patient',
      gender: 'masculino',
      firstName: 'Paciente2',
      lastName: 'Ajeno',
      phone: '+584124445566',
      isActive: true,
      emailVerified: true
    });
    createdUserIds.push(patient2.id);

    await db.PatientProfile.create({
      userId: patient2.id,
      firstName: 'Paciente2',
      lastName: 'Ajeno'
    });

    // Cita normal (con Doctor A y Paciente 1, tarifa 40$)
    const aptNormal = await db.Appointment.create({
      patientId: patient1.id,
      doctorId: doctorA.id,
      appointmentDate: todayCaracas(),
      appointmentTime: '10:00:00',
      reason: 'Consulta general',
      status: 'completed',
      type: 'presencial',
      consultationFee: 40.00,
      paymentStatus: 'pending'
    });
    createdAppointmentIds.push(aptNormal.id);

    // Cita con tarifa 0
    const aptZero = await db.Appointment.create({
      patientId: patient1.id,
      doctorId: doctorA.id,
      appointmentDate: todayCaracas(),
      appointmentTime: '11:00:00',
      reason: 'Control sin costo',
      status: 'confirmed',
      type: 'presencial',
      consultationFee: 0.00,
      paymentStatus: 'pending'
    });
    createdAppointmentIds.push(aptZero.id);

    // Cita cancelada
    const aptCanceled = await db.Appointment.create({
      patientId: patient1.id,
      doctorId: doctorA.id,
      appointmentDate: todayCaracas(),
      appointmentTime: '12:00:00',
      reason: 'Cita cancelada',
      status: 'cancelled_patient',
      type: 'presencial',
      consultationFee: 40.00,
      paymentStatus: 'pending'
    });
    createdAppointmentIds.push(aptCanceled.id);

    const tokenDocA = makeToken(doctorA);
    const tokenDocB = makeToken(doctorB);
    const tokenPat1 = makeToken(patient1);
    const tokenPat2 = makeToken(patient2);

    pass('Usuarios y citas de prueba inicializados correctamente');

    // ----------------------------------------------------
    // PASO 1: Reporte de pago por paciente
    // ----------------------------------------------------
    logStep(1, 'Paciente 1 reporta pago por Pago Móvil...');
    let resReport = await request(app)
      .post(`/api/payments/appointments/${aptNormal.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}01`,
        originBank: '0134',
        paymentDate: todayCaracas(),
        originPhone: '+584123334455',
        notes: 'Pago desde Banesco'
      });

    if (resReport.status === 201 && resReport.body.success) {
      pass(`Pago reportado exitosamente (id: ${resReport.body.data.id}, status: ${resReport.body.data.status})`);
      createdPaymentIds.push(resReport.body.data.id);
      if (resReport.body.data.status !== 'reported') {
        throw new Error(`Se esperaba status reported, se obtuvo ${resReport.body.data.status}`);
      }
      pass('Pago en status reported verificado');
    } else {
      fail('Reporte de pago', resReport);
      allPassed = false;
    }

    const payment1Id = resReport.body.data.id;

    // ----------------------------------------------------
    // PASO 2: Rechazo por médico con motivo
    // ----------------------------------------------------
    logStep(2, 'Médico A rechaza el pago con motivo...');
    let resReject = await request(app)
      .post(`/api/payments/${payment1Id}/reject`)
      .set('Authorization', `Bearer ${tokenDocA}`)
      .send({
        rejectionReason: 'Referencia no aparece en la cuenta bancaria todavía'
      });

    if (resReject.status === 200 && resReject.body.success && resReject.body.data.status === 'rejected') {
      pass(`Pago rechazado exitosamente con motivo: "${resReject.body.data.reviewNote || resReject.body.data.rejectionReason}"`);
      const aptCheck = await db.Appointment.findByPk(aptNormal.id);
      if (aptCheck.paymentStatus !== 'pending') {
        throw new Error(`Cita debería permanecer en pending tras rechazo, es ${aptCheck.paymentStatus}`);
      }
      pass('Cita confirmada en estado pending tras rechazo');
    } else {
      fail('Rechazo de pago', resReject);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 3: Re-reporte por paciente con nueva referencia
    // ----------------------------------------------------
    logStep(3, 'Paciente 1 re-reporta el pago con nueva referencia...');
    let resReReport = await request(app)
      .post(`/api/payments/appointments/${aptNormal.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}02`,
        originBank: '0102',
        paymentDate: todayCaracas(),
        originPhone: '+584123334455',
        notes: 'Corregida referencia BDV'
      });

    if (resReReport.status === 201 && resReReport.body.success) {
      pass(`Pago re-reportado con éxito (id: ${resReReport.body.data.id})`);
      createdPaymentIds.push(resReReport.body.data.id);
    } else {
      fail('Re-reporte de pago', resReReport);
      allPassed = false;
    }

    const payment2Id = resReReport.body.data.id;

    // ----------------------------------------------------
    // PASO 4: Aprobación por médico
    // ----------------------------------------------------
    logStep(4, 'Médico A aprueba el pago...');
    let resApprove = await request(app)
      .post(`/api/payments/${payment2Id}/approve`)
      .set('Authorization', `Bearer ${tokenDocA}`)
      .send({});

    let verificationCode = null;
    let receiptNumber = null;

    if (resApprove.status === 200 && resApprove.body.success) {
      const p = resApprove.body.data;
      verificationCode = p.verificationCode;
      receiptNumber = p.receiptNumber;
      if (p.status !== 'approved' || !p.receiptNumber || !p.verificationCode) {
        throw new Error('Faltan campos receiptNumber o verificationCode tras aprobación');
      }
      pass(`Pago aprobado con recibo ${p.receiptNumber} y código ${p.verificationCode}`);

      const aptCheck = await db.Appointment.findByPk(aptNormal.id);
      if (aptCheck.paymentStatus !== 'paid') {
        throw new Error(`Cita debería estar en paid, es ${aptCheck.paymentStatus}`);
      }
      pass('Cita sincronizada a paid exitosamente');
    } else {
      fail('Aprobación de pago', resApprove);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: Descarga del PDF del recibo
    // ----------------------------------------------------
    logStep(5, 'Descarga del PDF del recibo...');
    let resPdf = await request(app)
      .get(`/api/payments/${payment2Id}/receipt`)
      .set('Authorization', `Bearer ${tokenPat1}`);

    if (resPdf.status === 200 && resPdf.header['content-type']?.includes('application/pdf')) {
      const buffer = resPdf.body;
      const headerStr = buffer.slice(0, 4).toString('ascii');
      if (headerStr === '%PDF') {
        pass(`PDF generado y descargado correctamente con header ${headerStr} (${buffer.length} bytes)`);
      } else {
        throw new Error(`El buffer descargado no empieza con %PDF: ${headerStr}`);
      }
    } else {
      fail('Descarga de recibo PDF', resPdf);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 6: Verificación pública del código y privacidad
    // ----------------------------------------------------
    logStep(6, 'Verificación pública del código en /api/medical-documents/verify/:code...');
    let resVerify = await request(app)
      .get(`/api/medical-documents/verify/${verificationCode}`);

    const v = resVerify.body.data || resVerify.body;
    if (resVerify.status === 200 && v.valid === true) {
      if (v.type !== 'payment_receipt') {
        throw new Error(`Se esperaba type payment_receipt, recibido ${v.type}`);
      }
      // Chequeo de privacidad estricto
      if (v.patient?.identificationNumber || v.patient?.phone || v.patient?.email || v.cedula || v.phone || v.reference) {
        throw new Error('FALLO DE PRIVACIDAD: La verificación pública expone datos sensibles');
      }
      pass(`Recibo verificado públicamente: ${v.title}, valid=${v.valid}, iniciales=${v.patientInitials}`);
      pass('Privacidad validada: Cédula, teléfono, cuenta bancaria y referencia completa NO están expuestos');
    } else {
      fail('Verificación pública de recibo', resVerify);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Intento de duplicar referencia con mismo banco y fecha -> 409
    // ----------------------------------------------------
    logStep(7, 'Intento de duplicar referencia con mismo banco y fecha (debe dar 409)...');
    // Creamos otra cita para paciente 1
    const aptDup = await db.Appointment.create({
      patientId: patient1.id,
      doctorId: doctorA.id,
      appointmentDate: todayCaracas(),
      appointmentTime: '14:00:00',
      reason: 'Segunda cita',
      status: 'completed',
      type: 'presencial',
      consultationFee: 30.00,
      paymentStatus: 'pending'
    });
    createdAppointmentIds.push(aptDup.id);

    let resDup = await request(app)
      .post(`/api/payments/appointments/${aptDup.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}02`, // Misma referencia ya aprobada
        originBank: '0102',     // Mismo banco
        paymentDate: todayCaracas(),
        originPhone: '+584123334455'
      });

    if (resDup.status === 409) {
      pass(`Rechazado correctamente con 409 Conflict: "${resDup.body.message || resDup.body.error}"`);
    } else {
      fail('Detección de referencia duplicada (se esperaba 409)', resDup);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 8: Idempotencia del reporte en cita pagada -> 400
    // ----------------------------------------------------
    logStep(8, 'Intento de reportar pago en cita que ya está pagada (debe dar 400)...');
    let resPaidRep = await request(app)
      .post(`/api/payments/appointments/${aptNormal.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}99`,
        originBank: '0102',
        paymentDate: todayCaracas()
      });

    if (resPaidRep.status === 400) {
      pass(`Rechazado correctamente con 400 Bad Request: "${resPaidRep.body.message || resPaidRep.body.error}"`);
    } else {
      fail('Reporte en cita ya pagada (se esperaba 400)', resPaidRep);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Control de acceso: paciente ajeno intenta pagar -> 403
    // ----------------------------------------------------
    logStep(9, 'Paciente 2 (ajeno) intenta reportar pago para cita del Paciente 1 (debe dar 403)...');
    let resCrossPat = await request(app)
      .post(`/api/payments/appointments/${aptDup.id}/report`)
      .set('Authorization', `Bearer ${tokenPat2}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}03`,
        originBank: '0102',
        paymentDate: todayCaracas()
      });

    if (resCrossPat.status === 403) {
      pass(`Rechazado correctamente con 403 Forbidden: "${resCrossPat.body.message || resCrossPat.body.error}"`);
    } else {
      fail('Control de acceso paciente ajeno (se esperaba 403)', resCrossPat);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 10: Control de acceso: médico ajeno intenta aprobar -> 403
    // ----------------------------------------------------
    logStep(10, 'Médico B (ajeno) intenta anular o aprobar pago del Médico A (debe dar 403)...');
    let resCrossDoc = await request(app)
      .post(`/api/payments/${payment2Id}/void`)
      .set('Authorization', `Bearer ${tokenDocB}`)
      .send({
        voidReason: 'Intento malicioso de otro médico'
      });

    if (resCrossDoc.status === 403) {
      pass(`Rechazado correctamente con 403 Forbidden: "${resCrossDoc.body.message || resCrossDoc.body.error}"`);
    } else {
      fail('Control de acceso médico ajeno (se esperaba 403)', resCrossDoc);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 11: Cita cancelada no permite pago -> 400
    // ----------------------------------------------------
    logStep(11, 'Intento de reportar pago en cita cancelada (debe dar 400)...');
    let resCancelRep = await request(app)
      .post(`/api/payments/appointments/${aptCanceled.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}04`,
        originBank: '0102',
        paymentDate: todayCaracas()
      });

    if (resCancelRep.status === 400) {
      pass(`Rechazado correctamente con 400 Bad Request: "${resCancelRep.body.message || resCancelRep.body.error}"`);
    } else {
      fail('Pago en cita cancelada (se esperaba 400)', resCancelRep);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 12: Cita con tarifa 0 no permite pago -> 400
    // ----------------------------------------------------
    logStep(12, 'Intento de reportar pago en cita con tarifa 0 (debe dar 400)...');
    let resZeroRep = await request(app)
      .post(`/api/payments/appointments/${aptZero.id}/report`)
      .set('Authorization', `Bearer ${tokenPat1}`)
      .send({
        method: 'pago_movil',
        reference: `PM${uid}05`,
        originBank: '0102',
        paymentDate: todayCaracas()
      });

    if (resZeroRep.status === 400) {
      pass(`Rechazado correctamente con 400 Bad Request: "${resZeroRep.body.message || resZeroRep.body.error}"`);
    } else {
      fail('Pago en cita con tarifa 0 (se esperaba 400)', resZeroRep);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 13: Anulación del recibo por médico con motivo
    // ----------------------------------------------------
    logStep(13, 'Médico A anula el recibo con motivo...');
    let resVoid = await request(app)
      .post(`/api/payments/${payment2Id}/void`)
      .set('Authorization', `Bearer ${tokenDocA}`)
      .send({
        voidReason: 'Error en la conciliación bancaria'
      });

    if (resVoid.status === 200 && resVoid.body.success && resVoid.body.data.status === 'voided') {
      pass(`Recibo anulado exitosamente: status=voided, voidReason="${resVoid.body.data.reviewNote || resVoid.body.data.voidReason}"`);
      const aptCheck = await db.Appointment.findByPk(aptNormal.id);
      if (aptCheck.paymentStatus !== 'pending') {
        throw new Error(`Cita debería volver a pending tras anulación, es ${aptCheck.paymentStatus}`);
      }
      pass('Cita devuelta a pending tras anulación del recibo');

      // Re-verificar público
      const resVerifyVoid = await request(app).get(`/api/medical-documents/verify/${verificationCode}`);
      const vVoid = resVerifyVoid.body.data || resVerifyVoid.body;
      if (vVoid.valid === false && vVoid.status === 'voided') {
        pass('Verificación pública del recibo anulado: valid=false y status=voided');
      } else {
        throw new Error('La verificación pública del recibo anulado no devolvió valid=false y status=voided');
      }
    } else {
      fail('Anulación de recibo', resVoid);
      allPassed = false;
    }

  } catch (err) {
    console.error('Error no capturado durante el test:', err);
    allPassed = false;
  } finally {
    // ----------------------------------------------------
    // PASO 14: Limpieza de registros de prueba
    // ----------------------------------------------------
    logStep(14, 'Limpiando registros de prueba creados en base de datos...');
    try {
      if (createdPaymentIds.length > 0) {
        await db.Payment.destroy({ where: { id: createdPaymentIds }, force: true });
        pass(`Eliminados ${createdPaymentIds.length} pagos de prueba`);
      }
      if (createdAppointmentIds.length > 0) {
        await db.Appointment.destroy({ where: { id: createdAppointmentIds }, force: true });
        pass(`Eliminadas ${createdAppointmentIds.length} citas de prueba`);
      }
      if (createdUserIds.length > 0) {
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
      console.log(`🎉 ${colors.green}${colors.bold}TODAS LAS PRUEBAS DEL FLUJO DE COBROS PASARON EXITOSAMENTE${colors.reset}`);
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
