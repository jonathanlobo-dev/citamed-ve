// src/jobs/appointmentReminders.js
// CITAMED.VE - M03 / Semana 10
// Recordatorio de citas por correo, una sola vez, 20 a 28 horas antes (hora de Caracas).
// Solo se registra si APPOINTMENT_EMAILS_ENABLED=true.

const cron = require('node-cron');
const { logger } = require('../config/logger');
const reminderService = require('../services/reminderService');
const { emailsEnabled } = require('../utils/appointmentEmails');

let isConfigured = false;
let running = false;

async function run() {
  // Si una pasada tarda más que el intervalo, la siguiente espera: así no se pisan
  if (running) return;
  running = true;
  try {
    const result = await reminderService.runReminderPass();
    if (result.sent || result.failed) {
      logger.info(`[Reminder] Pasada lista: ${result.sent} enviados, ${result.failed} fallidos, ${result.skipped} omitidos`);
    }
  } catch (err) {
    logger.error(`[Reminder] Error en la pasada programada: ${err.message}`);
  } finally {
    running = false;
  }
}

function setupAppointmentReminders() {
  if (isConfigured) return;
  if (!emailsEnabled()) {
    logger.info('Recordatorios de citas apagados (APPOINTMENT_EMAILS_ENABLED no es true)');
    return;
  }
  const expression = process.env.APPOINTMENT_REMINDERS_CRON || '*/30 * * * *';
  if (!cron.validate(expression)) {
    logger.error(`Invalid cron expression for appointment reminders: ${expression}`);
    return;
  }
  cron.schedule(expression, run);
  isConfigured = true;
  logger.info(`Appointment reminders scheduled: ${expression}`);
}

module.exports = { setupAppointmentReminders, run };
