/**
 * paymentService.js - CITAMED.VE
 * M05 / Semana 8 - Lógica de negocio para cobros, validación, tasas bloqueadas y recibos
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const exchangeRateService = require('./exchangeRateService');
const auditService = require('./auditService');
const { validatePaymentSettings } = require('../utils/paymentSettingsValidator');
const { todayCaracas } = require('../utils/dateCaracas');

const {
  Payment,
  Appointment,
  User,
  DoctorProfile,
  PatientProfile,
  Specialty,
  Clinic,
  ClinicLocation,
  sequelize
} = db;

function generateVerificationCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

const PAYMENT_METHOD_MAP = {
  pago_movil: 'transfer',
  transferencia: 'transfer',
  zelle: 'transfer',
  efectivo_usd: 'cash',
  efectivo_ves: 'cash'
};

/**
 * Obtiene los métodos de cobro configurados por el médico
 */
async function getSettings(doctorId) {
  const profile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!profile) {
    const err = new Error('Perfil médico no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return profile.paymentSettings || {};
}

/**
 * Actualiza los métodos de cobro del médico (solo el médico dueño o admin)
 */
async function updateSettings(doctorId, rawSettings, user) {
  if (user.role !== 'admin' && user.id !== Number(doctorId)) {
    const err = new Error('No autorizado para modificar los métodos de cobro de este médico');
    err.statusCode = 403;
    throw err;
  }

  const profile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  if (!profile) {
    const err = new Error('Perfil médico no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const cleanSettings = validatePaymentSettings(rawSettings);

  profile.paymentSettings = cleanSettings;
  await profile.save();

  // Registrar auditoría sin volcar cuentas completas
  await auditService.log({
    userId: user.id,
    action: 'doctor_payment_settings.updated',
    resource: 'doctor_profile',
    resourceId: String(profile.id),
    metadata: {
      doctorId: Number(doctorId),
      enabledMethods: {
        pagoMovil: cleanSettings.pagoMovil.enabled,
        transferencia: cleanSettings.transferencia.enabled,
        zelle: cleanSettings.zelle.enabled,
        efectivoUsd: cleanSettings.efectivoUsd.enabled,
        efectivoVes: cleanSettings.efectivoVes.enabled
      }
    }
  });

  return cleanSettings;
}

/**
 * Resumen de cobro de una cita: tarifa, tasa, montos, métodos habilitados y cobros existentes
 */
async function getAppointmentSummary(appointmentId, user) {
  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            attributes: ['id', 'consultationFee', 'paymentSettings', 'profilePhoto'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'phone', 'email']
      },
      {
        model: Payment,
        as: 'payments',
        order: [['createdAt', 'DESC']]
      }
    ]
  });

  if (!appointment) {
    const err = new Error('Cita no encontrada');
    err.statusCode = 404;
    throw err;
  }

  // Permisos: solo médico de la cita, paciente de la cita o admin
  const isDoctor = user.role === 'doctor' && appointment.doctorId === user.id;
  const isPatient = user.role === 'patient' && appointment.patientId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    const err = new Error('No tienes acceso a la información de pago de esta cita');
    err.statusCode = 403;
    throw err;
  }

  const feeUsd = Number(appointment.consultationFee || 0);

  // Obtener tasa oficial del día
  const rateData = await exchangeRateService.getCurrent('USD/VES');
  const currentRate = rateData ? Number(rateData.rate) : null;
  const amountVes = currentRate && feeUsd > 0
    ? Math.round(feeUsd * currentRate * 100) / 100
    : null;

  // Evaluar si es cobrable (Regla 4)
  let payable = true;
  let payableReason = null;

  if (!['in_progress', 'completed'].includes(appointment.status)) {
    payable = false;
    payableReason = 'La consulta debe estar en curso o finalizada para poder pagarse';
  } else if (feeUsd <= 0) {
    payable = false;
    payableReason = 'Consulta sin costo';
  } else if (appointment.paymentStatus === 'paid') {
    payable = false;
    payableReason = 'Esta consulta ya fue pagada';
  } else {
    // Si ya existe un cobro reported
    const hasReported = appointment.payments?.some((p) => p.status === 'reported');
    if (hasReported) {
      payable = false;
      payableReason = 'Ya existe un reporte de pago en revisión para esta consulta';
    }
  }

  // Métodos de cobro del médico (Regla 10: solo paciente de la cita, médico de la cita o admin)
  const docProfile = appointment.doctor?.doctorProfile || {};
  const settings = docProfile.paymentSettings || {};

  return {
    appointment: {
      id: appointment.id,
      appointmentNumber: appointment.appointmentNumber,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus,
      paymentMethod: appointment.paymentMethod,
      paymentDate: appointment.paymentDate,
      isWalkIn: appointment.isWalkIn,
      doctor: {
        id: appointment.doctor?.id,
        name: `Dr. ${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim(),
        specialty: docProfile.specialty?.name || 'Medicina General'
      },
      patient: {
        id: appointment.patient?.id,
        name: `${appointment.patient?.firstName || ''} ${appointment.patient?.lastName || ''}`.trim()
      }
    },
    pricing: {
      amountUsd: feeUsd,
      exchangeRate: currentRate,
      exchangeRateSource: rateData?.source || null,
      exchangeRateDate: rateData?.checkedAt || rateData?.fetchedAt || null,
      exchangeRateStale: Boolean(rateData?.stale),
      amountVes
    },
    payable,
    payableReason,
    paymentSettings: settings,
    payments: appointment.payments || []
  };
}

/**
 * Reporta un pago realizado (Paciente) - Reglas 1, 2, 4, 5, 6
 */
async function reportPayment(
  { appointmentId, method, reference, payerBank, payerNote, idempotencyKey },
  user
) {
  // Idempotencia: si ya existe con esa llave, devolverlo inmediatamente
  if (idempotencyKey) {
    const existing = await Payment.findOne({ where: { idempotencyKey } });
    if (existing) {
      return existing;
    }
  }

  const validMethods = ['pago_movil', 'transferencia', 'zelle', 'efectivo_usd', 'efectivo_ves'];
  if (!validMethods.includes(method)) {
    const err = new Error(`Método de pago no válido: ${method}`);
    err.statusCode = 400;
    throw err;
  }

  const isCash = method === 'efectivo_usd' || method === 'efectivo_ves';
  if (!isCash && (!reference || !String(reference).trim())) {
    const err = new Error('La referencia del pago es obligatoria');
    err.statusCode = 400;
    throw err;
  }

  const cleanReference = reference ? String(reference).trim().slice(0, 60) : null;

  return await sequelize.transaction(async (t) => {
    // Bloqueo SELECT ... FOR UPDATE sobre la cita
    const appointment = await Appointment.findByPk(appointmentId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!appointment) {
      const err = new Error('Cita no encontrada');
      err.statusCode = 404;
      throw err;
    }

    // Regla 3: El paciente solo reporta sobre sus propias citas
    if (user.role !== 'admin' && appointment.patientId !== user.id) {
      const err = new Error('No tienes permiso para reportar pagos en esta cita');
      err.statusCode = 403;
      throw err;
    }

    // Regla 4: Cuándo se puede cobrar
    if (!['in_progress', 'completed'].includes(appointment.status)) {
      const err = new Error('Solo se puede reportar pago de consultas en curso o finalizadas');
      err.statusCode = 400;
      throw err;
    }

    const amountUsd = Number(appointment.consultationFee || 0);
    if (amountUsd <= 0) {
      const err = new Error('Esta consulta no tiene tarifa asignada (es gratuita)');
      err.statusCode = 400;
      throw err;
    }

    // Regla 5: Un cobro vigente por cita
    const activePayment = await Payment.findOne({
      where: {
        appointmentId: appointment.id,
        status: { [Op.in]: ['reported', 'approved'] }
      },
      transaction: t
    });

    if (activePayment) {
      const err = new Error(
        activePayment.status === 'approved'
          ? 'Esta cita ya tiene un pago aprobado'
          : 'Ya existe un reporte de pago en revisión para esta cita'
      );
      err.statusCode = 400;
      throw err;
    }

    // Regla 6: Duplicados de referencia por médico y método
    if (cleanReference) {
      const duplicateRef = await Payment.findOne({
        where: {
          doctorId: appointment.doctorId,
          method,
          reference: cleanReference,
          status: { [Op.in]: ['reported', 'approved'] }
        },
        transaction: t
      });

      if (duplicateRef) {
        const err = new Error('Esta referencia ya fue reportada para este médico y método de pago');
        err.statusCode = 409;
        throw err;
      }
    }

    // Regla 1: Monto y tasa fijados por el servidor (bloqueados)
    const rateData = await exchangeRateService.getCurrent('USD/VES');
    if (!rateData || !rateData.rate || rateData.rate <= 0) {
      const err = new Error('La tasa oficial BCV no está disponible temporalmente. Intenta nuevamente en unos minutos.');
      err.statusCode = 503;
      throw err;
    }

    const exchangeRate = Number(rateData.rate);

    // Regla 2: Moneda según método
    let amountVes = null;
    if (['pago_movil', 'transferencia', 'efectivo_ves'].includes(method)) {
      amountVes = Math.round(amountUsd * exchangeRate * 100) / 100;
    }

    const payment = await Payment.create(
      {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        amountUsd,
        exchangeRate,
        amountVes,
        method,
        reference: cleanReference,
        payerBank: payerBank ? String(payerBank).trim().slice(0, 60) : null,
        payerNote: payerNote ? String(payerNote).trim().slice(0, 200) : null,
        status: 'reported',
        reportedBy: user.id,
        reportedAt: new Date(),
        idempotencyKey: idempotencyKey || null
      },
      { transaction: t }
    );

    // Auditoría
    await auditService.log({
      userId: user.id,
      action: 'payment_reported',
      resource: 'payment',
      resourceId: String(payment.id),
      metadata: {
        appointmentId: appointment.id,
        method,
        amountUsd
      }
    });

    return payment;
  });
}

/**
 * Registra un cobro directo en el consultorio (Médico)
 */
async function recordPayment(
  { appointmentId, method, reference, payerBank, payerNote, reviewNote },
  user
) {
  const validMethods = ['pago_movil', 'transferencia', 'zelle', 'efectivo_usd', 'efectivo_ves'];
  if (!validMethods.includes(method)) {
    const err = new Error(`Método de pago no válido: ${method}`);
    err.statusCode = 400;
    throw err;
  }

  const isCash = method === 'efectivo_usd' || method === 'efectivo_ves';
  if (!isCash && (!reference || !String(reference).trim())) {
    const err = new Error('La referencia del pago es obligatoria (salvo en efectivo)');
    err.statusCode = 400;
    throw err;
  }

  const cleanReference = reference ? String(reference).trim().slice(0, 60) : null;

  return await sequelize.transaction(async (t) => {
    const appointment = await Appointment.findByPk(appointmentId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!appointment) {
      const err = new Error('Cita no encontrada');
      err.statusCode = 404;
      throw err;
    }

    // Solo el médico de la cita o admin
    if (user.role !== 'admin' && appointment.doctorId !== user.id) {
      const err = new Error('No estás autorizado para registrar cobros en esta cita');
      err.statusCode = 403;
      throw err;
    }

    if (!['in_progress', 'completed'].includes(appointment.status)) {
      const err = new Error('Solo se puede registrar cobro en consultas en curso o finalizadas');
      err.statusCode = 400;
      throw err;
    }

    const amountUsd = Number(appointment.consultationFee || 0);
    if (amountUsd <= 0) {
      const err = new Error('Esta consulta no tiene tarifa asignada (es gratuita)');
      err.statusCode = 400;
      throw err;
    }

    const activePayment = await Payment.findOne({
      where: {
        appointmentId: appointment.id,
        status: { [Op.in]: ['reported', 'approved'] }
      },
      transaction: t
    });

    if (activePayment) {
      const err = new Error(
        activePayment.status === 'approved'
          ? 'Esta cita ya tiene un cobro aprobado'
          : 'Ya existe un reporte de pago en revisión; apruébalo o recházalo'
      );
      err.statusCode = 400;
      throw err;
    }

    if (cleanReference) {
      const duplicateRef = await Payment.findOne({
        where: {
          doctorId: appointment.doctorId,
          method,
          reference: cleanReference,
          status: { [Op.in]: ['reported', 'approved'] }
        },
        transaction: t
      });

      if (duplicateRef) {
        const err = new Error('Esta referencia ya fue registrada para este médico y método');
        err.statusCode = 409;
        throw err;
      }
    }

    // Tasa vigente bloqueada
    const rateData = await exchangeRateService.getCurrent('USD/VES');
    if (!rateData || !rateData.rate || rateData.rate <= 0) {
      const err = new Error('La tasa oficial BCV no está disponible temporalmente.');
      err.statusCode = 503;
      throw err;
    }

    const exchangeRate = Number(rateData.rate);
    let amountVes = null;
    if (['pago_movil', 'transferencia', 'efectivo_ves'].includes(method)) {
      amountVes = Math.round(amountUsd * exchangeRate * 100) / 100;
    }

    // Correlativo y código de verificación
    const receiptNumber = await Payment.nextReceiptNumber(t);
    const verificationCode = generateVerificationCode();

    const payment = await Payment.create(
      {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        amountUsd,
        exchangeRate,
        amountVes,
        method,
        reference: cleanReference,
        payerBank: payerBank ? String(payerBank).trim().slice(0, 60) : null,
        payerNote: payerNote ? String(payerNote).trim().slice(0, 200) : null,
        status: 'approved',
        reportedBy: user.id,
        reportedAt: new Date(),
        reviewedBy: user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote ? String(reviewNote).trim().slice(0, 300) : 'Cobro registrado directamente en consulta',
        receiptNumber,
        verificationCode
      },
      { transaction: t }
    );

    // Regla 8: Sincronía con la cita
    appointment.paymentStatus = 'paid';
    appointment.paymentDate = new Date();
    appointment.transactionId = cleanReference || receiptNumber;
    appointment.paymentMethod = PAYMENT_METHOD_MAP[method] || 'transfer';
    await appointment.save({ transaction: t });

    // Auditoría
    await auditService.log({
      userId: user.id,
      action: 'payment_recorded',
      resource: 'payment',
      resourceId: String(payment.id),
      metadata: {
        appointmentId: appointment.id,
        method,
        amountUsd,
        receiptNumber
      }
    });

    return payment;
  });
}

/**
 * Aprueba un pago reportado (Médico)
 */
async function approve(id, user) {
  return await sequelize.transaction(async (t) => {
    const payment = await Payment.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!payment) {
      const err = new Error('Cobro no encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.role !== 'admin' && payment.doctorId !== user.id) {
      const err = new Error('No estás autorizado para validar este cobro');
      err.statusCode = 403;
      throw err;
    }

    if (payment.status !== 'reported') {
      const err = new Error(`El cobro no está pendiente de validación (estado actual: ${payment.status})`);
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findByPk(payment.appointmentId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!appointment) {
      const err = new Error('Cita asociada no encontrada');
      err.statusCode = 404;
      throw err;
    }

    const receiptNumber = await Payment.nextReceiptNumber(t);
    const verificationCode = generateVerificationCode();

    payment.status = 'approved';
    payment.reviewedBy = user.id;
    payment.reviewedAt = new Date();
    payment.receiptNumber = receiptNumber;
    payment.verificationCode = verificationCode;
    await payment.save({ transaction: t });

    // Regla 8: Sincronía con la cita
    appointment.paymentStatus = 'paid';
    appointment.paymentDate = new Date();
    appointment.transactionId = payment.reference || receiptNumber;
    appointment.paymentMethod = PAYMENT_METHOD_MAP[payment.method] || 'transfer';
    await appointment.save({ transaction: t });

    // Auditoría
    await auditService.log({
      userId: user.id,
      action: 'payment_approved',
      resource: 'payment',
      resourceId: String(payment.id),
      metadata: {
        appointmentId: appointment.id,
        receiptNumber
      }
    });

    return payment;
  });
}

/**
 * Rechaza un pago reportado (Médico) con motivo obligatorio
 */
async function reject(id, reason, user) {
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 300) {
    const err = new Error('El motivo de rechazo es obligatorio (entre 5 y 300 caracteres)');
    err.statusCode = 400;
    throw err;
  }

  const cleanReason = reason.trim();

  return await sequelize.transaction(async (t) => {
    const payment = await Payment.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!payment) {
      const err = new Error('Cobro no encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.role !== 'admin' && payment.doctorId !== user.id) {
      const err = new Error('No estás autorizado para rechazar este cobro');
      err.statusCode = 403;
      throw err;
    }

    if (payment.status !== 'reported') {
      const err = new Error(`Solo se pueden rechazar cobros reportados (estado actual: ${payment.status})`);
      err.statusCode = 400;
      throw err;
    }

    payment.status = 'rejected';
    payment.reviewedBy = user.id;
    payment.reviewedAt = new Date();
    payment.reviewNote = cleanReason;
    await payment.save({ transaction: t });

    // Auditoría
    await auditService.log({
      userId: user.id,
      action: 'payment_rejected',
      resource: 'payment',
      resourceId: String(payment.id),
      metadata: {
        appointmentId: payment.appointmentId,
        reason: cleanReason
      }
    });

    return payment;
  });
}

/**
 * Anula un cobro aprobado (Médico) - Reglas 7 y 8
 */
async function voidPayment(id, reason, user) {
  if (!reason || typeof reason !== 'string' || reason.trim().length < 5 || reason.trim().length > 300) {
    const err = new Error('El motivo de anulación es obligatorio (entre 5 y 300 caracteres)');
    err.statusCode = 400;
    throw err;
  }

  const cleanReason = reason.trim();

  return await sequelize.transaction(async (t) => {
    const payment = await Payment.findByPk(id, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (!payment) {
      const err = new Error('Cobro no encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.role !== 'admin' && payment.doctorId !== user.id) {
      const err = new Error('Solo el médico puede anular este cobro');
      err.statusCode = 403;
      throw err;
    }

    if (payment.status !== 'approved') {
      const err = new Error(`Solo se pueden anular cobros aprobados (estado actual: ${payment.status})`);
      err.statusCode = 400;
      throw err;
    }

    const appointment = await Appointment.findByPk(payment.appointmentId, {
      lock: t.LOCK.UPDATE,
      transaction: t
    });

    if (appointment) {
      // Regla 8: Revertir cita a 'pending' y limpiar datos
      appointment.paymentStatus = 'pending';
      appointment.paymentDate = null;
      appointment.transactionId = null;
      appointment.paymentMethod = null;
      await appointment.save({ transaction: t });
    }

    payment.status = 'voided';
    payment.reviewedBy = user.id;
    payment.reviewedAt = new Date();
    payment.reviewNote = cleanReason;
    await payment.save({ transaction: t });

    // Auditoría
    await auditService.log({
      userId: user.id,
      action: 'payment_voided',
      resource: 'payment',
      resourceId: String(payment.id),
      metadata: {
        appointmentId: payment.appointmentId,
        reason: cleanReason
      }
    });

    return payment;
  });
}

/**
 * Listado de cobros pendientes de validación (Médico)
 */
async function listPending(user) {
  return await Payment.findAll({
    where: {
      doctorId: user.id,
      status: 'reported'
    },
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        include: [{ model: PatientProfile, as: 'patientProfile' }]
      },
      {
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'appointmentNumber', 'appointmentDate', 'appointmentTime', 'consultationFee']
      }
    ],
    order: [['reportedAt', 'ASC']]
  });
}

/**
 * Listado de consultas por cobrar (Médico): completadas o en curso con tarifa > 0,
 * sin cobro aprobado ni reporte en revisión.
 */
async function listReceivable(user) {
  // Citas del médico con tarifa > 0 y status in_progress o completed
  const appointments = await Appointment.findAll({
    where: {
      doctorId: user.id,
      status: { [Op.in]: ['in_progress', 'completed'] },
      consultationFee: { [Op.gt]: 0 },
      paymentStatus: { [Op.ne]: 'paid' }
    },
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        include: [{ model: PatientProfile, as: 'patientProfile' }]
      },
      {
        model: Payment,
        as: 'payments',
        where: { status: { [Op.in]: ['reported', 'approved'] } },
        required: false
      }
    ],
    order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
  });

  // Filtrar las que no tengan pagos activos (ni reported ni approved)
  const today = todayCaracas();
  const [tY, tM, tD] = today.split('-').map(Number);
  const todayDate = new Date(tY, tM - 1, tD);

  const receivable = appointments
    .filter((apt) => !apt.payments || apt.payments.length === 0)
    .map((apt) => {
      const aptDateStr = String(apt.appointmentDate).split('T')[0];
      const [y, m, d] = aptDateStr.split('-').map(Number);
      const diffMs = todayDate.getTime() - new Date(y, m - 1, d).getTime();
      const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: apt.id,
        appointmentNumber: apt.appointmentNumber,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        status: apt.status,
        consultationFee: Number(apt.consultationFee),
        daysElapsed,
        patient: {
          id: apt.patient?.id,
          firstName: apt.patient?.patientProfile?.firstName || apt.patient?.firstName,
          lastName: apt.patient?.patientProfile?.lastName || apt.patient?.lastName,
          phone: apt.patient?.phone,
          email: apt.patient?.email
        }
      };
    });

  const totalUsd = receivable.reduce((sum, item) => sum + item.consultationFee, 0);

  return {
    items: receivable,
    totalUsd: Math.round(totalUsd * 100) / 100,
    count: receivable.length
  };
}

/**
 * Historial de cobros del médico con filtros y paginación
 */
async function listHistory(user, { from, to, status, page = 1, limit = 20 } = {}) {
  const where = {
    doctorId: user.id
  };

  if (status && status !== 'all') {
    where.status = status;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = new Date(`${from}T00:00:00.000Z`);
    if (to) where.createdAt[Op.lte] = new Date(`${to}T23:59:59.999Z`);
  }

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  const { rows, count } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: PatientProfile, as: 'patientProfile' }]
      },
      {
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'appointmentNumber', 'appointmentDate']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset
  });

  // Totales de cobros aprobados dentro del filtro
  const approvedWhere = { ...where, status: 'approved' };
  const approvedPayments = await Payment.findAll({
    where: approvedWhere,
    attributes: ['amountUsd', 'amountVes']
  });

  const totalApprovedUsd = approvedPayments.reduce((acc, p) => acc + Number(p.amountUsd || 0), 0);
  const totalApprovedVes = approvedPayments.reduce((acc, p) => acc + Number(p.amountVes || 0), 0);

  return {
    items: rows,
    total: count,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(count / Number(limit)),
    totals: {
      approvedUsd: Math.round(totalApprovedUsd * 100) / 100,
      approvedVes: Math.round(totalApprovedVes * 100) / 100
    }
  };
}

/**
 * Pagos del paciente autenticado
 */
async function listMine(user) {
  return await Payment.findAll({
    where: {
      patientId: user.id
    },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            attributes: ['id'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: Appointment,
        as: 'appointment',
        attributes: ['id', 'appointmentNumber', 'appointmentDate', 'appointmentTime']
      }
    ],
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Obtiene un cobro con detalles para usuario autorizado
 */
async function getPaymentForUser(id, user) {
  const payment = await Payment.findByPk(id, {
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'gender', 'phone', 'email'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            attributes: ['firstName', 'lastName', 'mpps_number', 'licenseNumber', 'clinicName', 'clinicAddress', 'phoneNumber', 'whatsappNumber'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        include: [{ model: PatientProfile, as: 'patientProfile' }]
      },
      {
        model: Appointment,
        as: 'appointment',
        include: [
          { model: Clinic, as: 'clinic' },
          { model: ClinicLocation, as: 'clinicLocation' }
        ]
      }
    ]
  });

  if (!payment) {
    const err = new Error('Cobro no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const isDoctor = payment.doctorId === user.id;
  const isPatient = payment.patientId === user.id;
  const isAdmin = user.role === 'admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    const err = new Error('No tienes acceso a este cobro');
    err.statusCode = 403;
    throw err;
  }

  return payment;
}

module.exports = {
  getSettings,
  updateSettings,
  getAppointmentSummary,
  reportPayment,
  recordPayment,
  approve,
  reject,
  voidPayment,
  listPending,
  listReceivable,
  listHistory,
  listMine,
  getPaymentForUser,
  generateVerificationCode
};
