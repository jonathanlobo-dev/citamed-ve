/**
 * guestBookingService.js - CITAMED.VE
 * Primera cita sin registro: un visitante pide su cita dando nombre, cédula, teléfono y correo.
 * Se crea su cuenta de paciente sin reclamar (accountClaimed=false, igual que la "consulta sin cita"),
 * la cita queda pendiente y recibe por correo un enlace para poner su clave.
 * La clave se pone con la página de recuperar clave (VerificationToken 'password_reset').
 */

const crypto = require('crypto');
const db = require('../models');
const appointmentService = require('./appointmentService');
const emailService = require('./emailService');
const auditService = require('./auditService');
const { logger } = require('../config/logger');
const { emailsEnabled } = require('../utils/appointmentEmails');
const { todayCaracas, nowTimeCaracas } = require('../utils/dateCaracas');
const guest = require('../utils/guestBooking');

const { User, PatientProfile, DoctorProfile, Specialty, VerificationToken, sequelize } = db;

const appUrl = () => (process.env.FRONTEND_URL || 'https://app.citamedve.app').replace(/\/$/, '');

const accountExists = (field) =>
  Object.assign(
    new Error(field === 'email'
      ? 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu clave para agendar.'
      : 'Ya existe una cuenta con esa cédula. Inicia sesión o recupera tu clave para agendar.'),
    { statusCode: 409, code: 'ACCOUNT_EXISTS', field }
  );

/** Horarios libres de un médico para un día (público: solo horas, sin datos de pacientes). */
async function getSlots(doctorProfileId, date) {
  const id = Number(doctorProfileId);
  if (!Number.isInteger(id) || id <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
    throw Object.assign(new Error('Se requiere doctorProfileId y date'), { statusCode: 400 });
  }
  const result = await appointmentService.getAvailableSlots(id, date);
  return {
    available: Boolean(result.available),
    reason: result.reason || null,
    slots: (result.slots || []).filter((s) => s.available !== false).map((s) => ({ start: s.start, duration: s.duration }))
  };
}

async function loadDoctor(doctorProfileId) {
  const profile = await DoctorProfile.findByPk(doctorProfileId, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'isActive', 'role'] },
      { model: Specialty, as: 'specialty', attributes: ['id', 'name'], required: false }
    ]
  });
  if (!profile || !profile.user || profile.user.role !== 'doctor' || profile.user.isActive === false) {
    throw Object.assign(new Error('El médico no está disponible'), { statusCode: 404 });
  }
  return profile;
}

async function sendClaimEmail({ user, doctorProfile, appointment }) {
  if (!emailsEnabled() || !guest.isDeliverableEmail(user.email)) return false;
  try {
    const { token } = await VerificationToken.createVerification({
      userId: user.id,
      type: 'email',
      contactValue: user.email,
      purpose: 'password_reset',
      expiryMinutes: guest.CLAIM_LINK_DAYS * 24 * 60
    });
    const built = guest.buildGuestEmail({
      patientName: user.firstName,
      doctorName: `Dr(a). ${doctorProfile.user.firstName} ${doctorProfile.user.lastName}`,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      location: appointment.locationAddress || doctorProfile.clinicAddress || doctorProfile.clinicName || '',
      claimLink: guest.claimUrl(appUrl(), token)
    });
    const result = await emailService.sendTransactional({ to: user.email, ...built });
    return Boolean(result && result.success);
  } catch (error) {
    logger.error('[GuestBooking] No se pudo enviar el correo de la primera cita', { error: error.message });
    return false;
  }
}

/**
 * Crea la cuenta sin reclamar y la cita pendiente de un visitante.
 * @param {Object} body Datos del formulario
 * @param {{ ipAddress?: string }} ctx
 */
async function createGuestAppointment(body, ctx = {}) {
  const input = guest.validateGuestInput(body);

  if (input.appointmentDate < todayCaracas() ||
      (input.appointmentDate === todayCaracas() && input.appointmentTime <= nowTimeCaracas())) {
    throw Object.assign(new Error('Elige una fecha y hora que todavía no hayan pasado'), { statusCode: 400 });
  }

  const doctorProfile = await loadDoctor(input.doctorProfileId);

  // Si ya existe alguien con ese correo o esa cédula no se duplica: se le pide iniciar sesión
  if (await User.findOne({ where: { email: input.email }, attributes: ['id'] })) throw accountExists('email');
  if (await PatientProfile.findOne({ where: { identificationNumber: input.cedula }, attributes: ['id'] })) throw accountExists('cedula');

  // Se comprueba el horario antes de crear nada, para no dejar cuentas sueltas por un turno ocupado
  const slots = await getSlots(input.doctorProfileId, input.appointmentDate);
  if (!slots.available || !slots.slots.some((s) => s.start === input.appointmentTime)) {
    throw Object.assign(new Error('El horario seleccionado ya no está disponible. Elige otro.'), { statusCode: 409, code: 'SLOT_TAKEN' });
  }

  const t = await sequelize.transaction();
  let user;
  let profile;
  try {
    user = await User.create({
      role: 'patient',
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email,
      password: crypto.randomBytes(32).toString('hex'),
      isActive: true,
      accountClaimed: false
    }, { transaction: t });
    profile = await PatientProfile.create({
      userId: user.id,
      firstName: input.firstName,
      lastName: input.lastName,
      identificationType: 'CI',
      identificationNumber: input.cedula,
      phoneNumber: input.phone,
      profileStatus: 'active',
      consentForDataSharing: true
    }, { transaction: t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') throw accountExists('email');
    throw error;
  }

  let appointment;
  try {
    appointment = await appointmentService.createAppointment({
      patientId: user.id,
      doctorId: doctorProfile.userId,
      doctorProfileId: doctorProfile.id,
      specialtyId: doctorProfile.specialtyId || null,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      appointmentType: 'first_consultation',
      reasonForVisit: input.reasonForVisit,
      locationType: 'clinic',
      locationAddress: doctorProfile.clinicAddress || null,
      consultationFee: doctorProfile.consultationFee || 0
    });
  } catch (error) {
    // El turno se ocupó justo ahora: no se deja una cuenta a medias
    try {
      await profile.destroy();
      await user.destroy();
    } catch (cleanupError) {
      logger.error('[GuestBooking] No se pudo limpiar la cuenta tras un turno ocupado', { error: cleanupError.message });
    }
    throw Object.assign(new Error(error.message || 'No pudimos agendar tu cita'), { statusCode: 409, code: 'SLOT_TAKEN' });
  }

  const emailSent = await sendClaimEmail({ user, doctorProfile, appointment });

  try {
    await auditService.log({
      userId: user.id,
      action: 'appointment.guest_booking_created',
      resource: 'appointment',
      resourceId: String(appointment.id),
      ipAddress: ctx.ipAddress || null,
      metadata: { doctorId: doctorProfile.userId, emailSent }
    });
  } catch (auditError) {
    logger.warn('[GuestBooking] Auditoría no registrada', { error: auditError.message });
  }

  return {
    appointment: {
      id: appointment.id,
      status: appointment.status,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime
    },
    emailSent
  };
}

module.exports = { createGuestAppointment, getSlots };
