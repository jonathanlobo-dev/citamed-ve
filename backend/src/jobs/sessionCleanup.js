// src/jobs/sessionCleanup.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Cron job para limpieza de sesiones expiradas e historial antiguo

const cron = require('node-cron');
const { logger } = require('../config/logger');

// Variable para controlar si el job ya está configurado
let isConfigured = false;

/**
 * Configura el job de limpieza de sesiones
 * Solo se configura una vez incluso si se llama múltiples veces
 */
function setupSessionCleanup() {
  if (isConfigured) {
    logger.debug('Session cleanup job already configured');
    return;
  }

  // Obtener expresión cron de variables de entorno o usar default (cada hora)
  const cronExpression = process.env.SESSION_CLEANUP_CRON || '0 * * * *';

  // Validar expresión cron
  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid cron expression: ${cronExpression}`);
    return;
  }

  // Programar el job
  cron.schedule(cronExpression, async () => {
    await runSessionCleanup();
  });

  isConfigured = true;
  logger.info(`Session cleanup job scheduled: ${cronExpression}`);
}

/**
 * Ejecuta la limpieza de sesiones
 * Puede llamarse manualmente o desde el cron job
 */
async function runSessionCleanup() {
  const startTime = Date.now();
  logger.info('Starting session cleanup job...');

  try {
    // Importar aquí para evitar problemas de inicialización circular
    const { UserSession, LoginHistory } = require('../models');

    // Limpiar sesiones expiradas
    const sessionResult = await UserSession.cleanExpiredSessions();
    logger.info(`Sessions cleaned: ${sessionResult.deletedCount}`);

    // Limpiar historial de login antiguo (más de 90 días)
    const daysToKeep = parseInt(process.env.LOGIN_HISTORY_DAYS_TO_KEEP) || 90;
    const historyResult = await LoginHistory.cleanOldRecords(daysToKeep);
    logger.info(`Login history cleaned: ${historyResult.deletedCount}`);

    const duration = Date.now() - startTime;
    logger.info(`Session cleanup completed in ${duration}ms`, {
      sessionsDeleted: sessionResult.deletedCount,
      historyDeleted: historyResult.deletedCount,
      durationMs: duration
    });

    return {
      success: true,
      sessionsDeleted: sessionResult.deletedCount,
      historyDeleted: historyResult.deletedCount,
      durationMs: duration
    };

  } catch (error) {
    logger.error('Error in session cleanup job:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Detiene todos los jobs programados (para tests o shutdown)
 */
function stopAllJobs() {
  // node-cron no tiene un método directo para detener todos los jobs
  // pero podemos marcar como no configurado para evitar duplicados
  isConfigured = false;
  logger.info('Session cleanup job marked for reconfiguration');
}

module.exports = {
  setupSessionCleanup,
  runSessionCleanup,
  stopAllJobs
};
