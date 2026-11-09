/**
 * ReminderService - CITAMED.VE
 * M03 - Avisos de citas por correo: confirmación al agendar, aviso de cancelación y recordatorio.
 *
 * Todo está APAGADO por defecto y se enciende con APPOINTMENT_EMAILS_ENABLED=true. Mientras esté
 * apagado no sale ningún correo (que era lo que pasaba en la práctica: la versión anterior llamaba a
 * un método de envío que no existe y fallaba en silencio, y por eso se reescribió).
 *
 * Los correos usan emailService.sendTransactional (Resend, con SendGrid de respaldo). Nunca se envía a
 * cuentas de prueba ni a cuentas creadas por el médico que el paciente aún no reclamó.
 */

const { Op } = require('sequelize');
const db = require('../models');
const emailService = require('./emailService');
const { logger } = require('../config/logger');
const { todayCaracas } = require('../utils/dateCaracas');
const {
  isDeliverableEmail, appointmentInstant, inReminderWindow, buildEmail, emailsEnabled
} = require('../utils/appointmentEmails');

const { Appointment, User, DoctorProfile, Specialty } = db;

const INCLUDE = [
  { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'isActive', 'accountClaimed'] },
  { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
  {
    model: DoctorProfile,
    as: 'doctorProfile',
    attributes: ['id', 'clinicName', 'clinicAddress'],
    include: [{ model: Specialty, as: 'specialty', attributes: ['name'], required: false }],
    required: false
  }
];

function appUrl() {
  return (process.env.FRONTEND_URL || 'https://app.citamedve.app').replace(/\/$/, '');
}

/** ¿Se le puede escribir a este paciente? */
function canEmailPatient(patient) {
  if (!patient) return false;
  if (patient.isActive === false) return false;
  if (patient.accountClaimed === false) return false;
  return isDeliverableEmail(patient.email);
}

function emailData(appointment, extra = {}) {
  const { patient, doctor, doctorProfile } = appointment;
  return {
    patientName: patient?.firstName || '',
    doctorName: doctor ? `Dr(a). ${doctor.firstName} ${doctor.lastName}` : 'tu médico',
    specialty: doctorProfile?.specialty?.name || '',
    date: appointment.appointmentDate,
    time: appointment.appointmentTime,
    location: appointment.locationAddress || doctorProfile?.clinicAddress || doctorProfile?.clinicName || '',
    manageUrl: `${appUrl()}/paciente/mis-citas`,
    ...extra
  };
}

async function send(to, built) {
  const result = await emailService.sendTransactional({ to, subject: built.subject, html: built.html, text: built.text });
  return !!(result && result.success);
}

class ReminderService {
  /** Correo al agendar. Nunca rompe el flujo de la cita: si falla, solo queda en el registro. */
  async sendAppointmentConfirmation(appointment) {
    if (!emailsEnabled()) return { sent: false, reason: 'disabled' };
    try {
      const full = await this._load(appointment);
      if (!full || !canEmailPatient(full.patient)) return { sent: false, reason: 'no_recipient' };
      const ok = await send(full.patient.email, buildEmail('confirmation', emailData(full)));
      return { sent: ok };
    } catch (error) {
      logger.error('[Reminder] Correo de confirmación de cita falló', { error: error.message });
      return { sent: false, reason: 'error' };
    }
  }

  /** Correo al cancelar una cita. */
  async sendCancellationNotification(appointment, cancelledBy) {
    if (!emailsEnabled()) return { sent: false, reason: 'disabled' };
    try {
      const full = await this._load(appointment);
      // Si canceló el propio paciente, ya lo sabe: no se le escribe
      if (cancelledBy === 'patient') return { sent: false, reason: 'self_cancelled' };
      if (!full || !canEmailPatient(full.patient)) return { sent: false, reason: 'no_recipient' };
      const ok = await send(full.patient.email, buildEmail('cancellation', emailData(full, { cancelledBy })));
      return { sent: ok };
    } catch (error) {
      logger.error('[Reminder] Correo de cancelación de cita falló', { error: error.message });
      return { sent: false, reason: 'error' };
    }
  }

  /**
   * Una pasada del recordatorio: busca las citas que empiezan dentro de 20 a 28 horas (hora de Caracas)
   * y que aún no tienen recordatorio, y les escribe una sola vez.
   * Devuelve { checked, sent, skipped, failed }.
   */
  async runReminderPass({ now = new Date() } = {}) {
    const summary = { checked: 0, sent: 0, skipped: 0, failed: 0 };
    if (!emailsEnabled()) return { ...summary, disabled: true };

    const today = todayCaracas(now);
    const limit = todayCaracas(new Date(now.getTime() + 3 * 24 * 3600 * 1000));

    const candidates = await Appointment.findAll({
      where: {
        appointmentDate: { [Op.between]: [today, limit] },
        status: { [Op.in]: ['pending', 'confirmed'] },
        reminderSent: false
      },
      include: INCLUDE
    });

    for (const appointment of candidates) {
      const instant = appointmentInstant(appointment.appointmentDate, appointment.appointmentTime);
      if (!inReminderWindow(now, instant)) continue;
      summary.checked += 1;

      if (!canEmailPatient(appointment.patient)) { summary.skipped += 1; continue; }

      // Se reclama la cita antes de enviar: si dos pasadas coinciden, solo una la gana y no hay correo repetido
      const [claimed] = await Appointment.update(
        { reminderSent: true, reminderSentAt: now },
        { where: { id: appointment.id, reminderSent: false } }
      );
      if (!claimed) { summary.skipped += 1; continue; }

      let ok = false;
      try {
        ok = await send(appointment.patient.email, buildEmail('reminder', emailData(appointment)));
      } catch (error) {
        logger.error('[Reminder] Error enviando recordatorio', { appointmentId: appointment.id, error: error.message });
      }

      if (ok) {
        summary.sent += 1;
      } else {
        // No salió: se devuelve la cita a "sin recordar" para reintentar en la próxima pasada
        await Appointment.update({ reminderSent: false, reminderSentAt: null }, { where: { id: appointment.id } });
        summary.failed += 1;
      }
    }

    return summary;
  }

  async _load(appointment) {
    if (appointment?.patient && appointment?.doctor) return appointment;
    if (!appointment?.id) return null;
    return Appointment.findByPk(appointment.id, { include: INCLUDE });
  }
}

module.exports = new ReminderService();
module.exports.ReminderService = ReminderService;
