/**
 * ReminderService - CITAMED.VE
 * M03 - Recordatorios Multi-Canal
 *
 * Sistema de recordatorios para citas:
 * - Email 24h antes
 * - SMS 2h antes
 * - WhatsApp (via Twilio)
 * - Push notifications
 */

const { Op } = require('sequelize');
const db = require('../models');
const emailService = require('./emailService');
const smsService = require('./smsService');
const { getIO } = require('../config/socket');
const { NOTIFICATION_EVENTS } = require('../socket/events');

const { Appointment, User, DoctorProfile, Specialty } = db;

class ReminderService {
  constructor() {
    this.intervals = {
      email24h: 24 * 60 * 60 * 1000,  // 24 horas en ms
      sms2h: 2 * 60 * 60 * 1000,      // 2 horas en ms
      whatsapp1h: 1 * 60 * 60 * 1000, // 1 hora en ms
      push30min: 30 * 60 * 1000       // 30 minutos en ms
    };
  }

  /**
   * Obtener citas que necesitan recordatorio de 24h
   */
  async getAppointmentsFor24hReminder() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return await Appointment.findAll({
      where: {
        appointmentDate: tomorrowStr,
        status: { [Op.in]: ['pending', 'confirmed'] },
        reminderSent: false
      },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
        {
          model: DoctorProfile,
          as: 'doctorProfile',
          include: [{ model: Specialty, as: 'specialty', attributes: ['name'] }]
        }
      ]
    });
  }

  /**
   * Obtener citas que necesitan recordatorio de 2h
   */
  async getAppointmentsFor2hReminder() {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + this.intervals.sms2h);

    const today = now.toISOString().split('T')[0];
    const targetTime = twoHoursLater.toTimeString().slice(0, 5);

    // Citas de hoy que estan a 2 horas
    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: today,
        status: 'confirmed',
        reminderSent: true  // Ya se envio el de 24h
      },
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] }
      ]
    });

    // Filtrar las que estan aproximadamente a 2 horas
    return appointments.filter(apt => {
      const aptTime = apt.appointmentTime.slice(0, 5);
      return aptTime === targetTime;
    });
  }

  /**
   * Enviar recordatorio por Email
   */
  async sendEmailReminder(appointment) {
    const { patient, doctor, doctorProfile } = appointment;

    const emailData = {
      to: patient.email,
      subject: 'Recordatorio: Tu cita medica manana - CITAMED.VE',
      template: 'appointment-reminder',
      data: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctorProfile?.specialty?.name || 'Medicina General',
        date: this._formatDate(appointment.appointmentDate),
        time: this._formatTime(appointment.appointmentTime),
        location: appointment.locationAddress || 'Ver detalles en la app',
        appointmentNumber: appointment.appointmentNumber,
        cancelUrl: `${process.env.FRONTEND_URL}/citas/${appointment.id}/cancelar`,
        rescheduleUrl: `${process.env.FRONTEND_URL}/citas/${appointment.id}/reprogramar`
      }
    };

    try {
      await emailService.send(emailData);

      appointment.reminderSent = true;
      appointment.reminderSentAt = new Date();
      await appointment.save();

      return { success: true, channel: 'email' };
    } catch (error) {
      console.error('[ReminderService] Email error:', error.message);
      return { success: false, channel: 'email', error: error.message };
    }
  }

  /**
   * Enviar recordatorio por SMS
   */
  async sendSmsReminder(appointment) {
    const { patient, doctor } = appointment;

    if (!patient.phone) {
      return { success: false, channel: 'sms', error: 'No phone number' };
    }

    const message = `CITAMED: Recuerda tu cita hoy a las ${this._formatTime(appointment.appointmentTime)} ` +
                    `con Dr. ${doctor.firstName} ${doctor.lastName}. ` +
                    `Haz check-in en la app cuando llegues.`;

    try {
      await smsService.send(patient.phone, message);
      return { success: true, channel: 'sms' };
    } catch (error) {
      console.error('[ReminderService] SMS error:', error.message);
      return { success: false, channel: 'sms', error: error.message };
    }
  }

  /**
   * Enviar recordatorio por WhatsApp (via Twilio)
   */
  async sendWhatsAppReminder(appointment) {
    const { patient, doctor, doctorProfile } = appointment;

    if (!patient.phone) {
      return { success: false, channel: 'whatsapp', error: 'No phone number' };
    }

    const message = {
      to: `whatsapp:${patient.phone}`,
      body: `*CITAMED.VE - Recordatorio de Cita*\n\n` +
            `Hola ${patient.firstName}!\n\n` +
            `Tu cita esta programada para:\n` +
            `*Doctor:* Dr. ${doctor.firstName} ${doctor.lastName}\n` +
            `*Especialidad:* ${doctorProfile?.specialty?.name || 'Medicina General'}\n` +
            `*Fecha:* ${this._formatDate(appointment.appointmentDate)}\n` +
            `*Hora:* ${this._formatTime(appointment.appointmentTime)}\n\n` +
            `Recuerda hacer check-in cuando llegues al consultorio.\n\n` +
            `Si necesitas cancelar o reprogramar, hazlo desde la app CITAMED.`
    };

    try {
      await smsService.sendWhatsApp(message.to, message.body);
      return { success: true, channel: 'whatsapp' };
    } catch (error) {
      console.error('[ReminderService] WhatsApp error:', error.message);
      return { success: false, channel: 'whatsapp', error: error.message };
    }
  }

  /**
   * Enviar push notification
   */
  async sendPushReminder(appointment) {
    const { patient } = appointment;

    try {
      const io = getIO();

      io.of('/notifications').emit(NOTIFICATION_EVENTS.NOTIF_APPOINTMENT_REMINDER, {
        targetUserId: patient.id,
        title: 'Cita en 30 minutos',
        body: `Tu cita es a las ${this._formatTime(appointment.appointmentTime)}. Haz check-in cuando llegues.`,
        data: {
          type: 'appointment_reminder',
          appointmentId: appointment.id
        }
      });

      return { success: true, channel: 'push' };
    } catch (error) {
      console.error('[ReminderService] Push error:', error.message);
      return { success: false, channel: 'push', error: error.message };
    }
  }

  /**
   * Procesar todos los recordatorios pendientes de 24h
   */
  async process24hReminders() {
    console.log('[ReminderService] Processing 24h reminders...');

    const appointments = await this.getAppointmentsFor24hReminder();
    const results = [];

    for (const appointment of appointments) {
      const result = await this.sendEmailReminder(appointment);
      results.push({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        ...result
      });
    }

    console.log(`[ReminderService] Processed ${results.length} 24h reminders`);
    return results;
  }

  /**
   * Procesar todos los recordatorios pendientes de 2h
   */
  async process2hReminders() {
    console.log('[ReminderService] Processing 2h reminders...');

    const appointments = await this.getAppointmentsFor2hReminder();
    const results = [];

    for (const appointment of appointments) {
      // Enviar SMS y WhatsApp en paralelo
      const [smsResult, whatsappResult] = await Promise.all([
        this.sendSmsReminder(appointment),
        this.sendWhatsAppReminder(appointment)
      ]);

      results.push({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        sms: smsResult,
        whatsapp: whatsappResult
      });
    }

    console.log(`[ReminderService] Processed ${results.length} 2h reminders`);
    return results;
  }

  /**
   * Enviar confirmacion de cita
   */
  async sendAppointmentConfirmation(appointment) {
    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'patient' },
        { model: User, as: 'doctor' },
        { model: DoctorProfile, as: 'doctorProfile', include: [{ model: Specialty, as: 'specialty' }] }
      ]
    });

    const { patient, doctor, doctorProfile } = fullAppointment;

    // Email de confirmacion
    const emailData = {
      to: patient.email,
      subject: 'Cita Confirmada - CITAMED.VE',
      template: 'appointment-confirmation',
      data: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialty: doctorProfile?.specialty?.name || 'Medicina General',
        date: this._formatDate(fullAppointment.appointmentDate),
        time: this._formatTime(fullAppointment.appointmentTime),
        appointmentNumber: fullAppointment.appointmentNumber,
        location: fullAppointment.locationAddress
      }
    };

    try {
      await emailService.send(emailData);

      fullAppointment.confirmationSent = true;
      fullAppointment.confirmationSentAt = new Date();
      await fullAppointment.save();

      return { success: true };
    } catch (error) {
      console.error('[ReminderService] Confirmation email error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificacion de cancelacion
   */
  async sendCancellationNotification(appointment, cancelledBy) {
    const fullAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        { model: User, as: 'patient' },
        { model: User, as: 'doctor' }
      ]
    });

    const { patient, doctor } = fullAppointment;
    const recipient = cancelledBy === 'patient' ? doctor : patient;

    // Push notification
    try {
      const io = getIO();
      io.of('/notifications').emit(NOTIFICATION_EVENTS.NOTIF_APPOINTMENT_CANCELLED, {
        targetUserId: recipient.id,
        title: 'Cita Cancelada',
        body: cancelledBy === 'patient'
          ? `${patient.firstName} ${patient.lastName} ha cancelado su cita del ${this._formatDate(fullAppointment.appointmentDate)}`
          : `Dr. ${doctor.firstName} ${doctor.lastName} ha cancelado tu cita del ${this._formatDate(fullAppointment.appointmentDate)}`,
        data: {
          type: 'appointment_cancelled',
          appointmentId: fullAppointment.id
        }
      });
    } catch (error) {
      console.error('[ReminderService] Cancellation notification error:', error.message);
    }
  }

  // Helpers
  _formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-VE', options);
  }

  _formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }
}

module.exports = new ReminderService();
