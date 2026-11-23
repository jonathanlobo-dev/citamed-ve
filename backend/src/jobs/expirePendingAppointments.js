// src/jobs/expirePendingAppointments.js
// CITAMED.VE - Decisión DEC-01 (22/11): una pre-cita ocupa su cupo, pero si el consultorio no la acepta
// en 24 horas se cancela sola y el cupo se libera. Así una solicitud olvidada no bloquea el horario.
// Se puede apagar con PENDING_EXPIRY_HOURS=0.

const cron = require('node-cron');
const { Op } = require('sequelize');
const { logger } = require('../config/logger');

const DEFAULT_HOURS = 24;
const REASON = 'El consultorio no aceptó la solicitud en 24 horas. Puedes pedir otro horario.';

/** Horas de vida de una pre-cita (0 = apagado). Valores inválidos usan el valor por defecto. */
function expiryHours(env = process.env) {
  const raw = env.PENDING_EXPIRY_HOURS;
  if (raw === undefined || raw === '') return DEFAULT_HOURS;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_HOURS;
}

/** Instante antes del cual una pre-cita ya venció */
function expiryCutoff(now = new Date(), hours = DEFAULT_HOURS) {
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

let running = false;
let isConfigured = false;

async function run(now = new Date()) {
  const hours = expiryHours();
  if (!hours || running) return { expired: 0 };
  running = true;
  let expired = 0;
  try {
    const db = require('../models');
    const appointmentService = require('../services/appointmentService');
    const reminderService = require('../services/reminderService');
    const stale = await db.Appointment.findAll({
      where: { status: 'pending', createdAt: { [Op.lt]: expiryCutoff(now, hours) } },
      attributes: ['id'],
      limit: 200
    });
    for (const { id } of stale) {
      try {
        const appointment = await appointmentService.cancelAppointment(id, 'system', REASON);
        reminderService.sendCancellationNotification(appointment, 'system');
        expired++;
      } catch (err) {
        logger.error(`[PreCitas] No se pudo vencer la cita ${id}: ${err.message}`);
      }
    }
    if (expired) logger.info(`[PreCitas] ${expired} pre-citas vencidas y cupos liberados`);
  } catch (err) {
    logger.error(`[PreCitas] Error en la pasada: ${err.message}`);
  } finally {
    running = false;
  }
  return { expired };
}

function setupPendingExpiry() {
  if (isConfigured) return;
  if (!expiryHours()) {
    logger.info('Vencimiento de pre-citas apagado (PENDING_EXPIRY_HOURS=0)');
    return;
  }
  cron.schedule('*/30 * * * *', () => { run(); });
  isConfigured = true;
  logger.info(`Vencimiento de pre-citas programado: ${expiryHours()} horas`);
}

module.exports = { setupPendingExpiry, run, expiryHours, expiryCutoff, REASON };
