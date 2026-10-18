// src/jobs/exchangeRateSync.js
// CITAMED.VE - M05 / Semana 8
// Mantiene al día la tasa oficial BCV sin intervención de nadie

const cron = require('node-cron');
const { logger } = require('../config/logger');
const exchangeRateService = require('../services/exchangeRateService');

let isConfigured = false;

async function run() {
  try {
    await exchangeRateService.sync();
  } catch (err) {
    logger.error(`[ExchangeRate] Error en la sincronización programada: ${err.message}`);
  }
}

function setupExchangeRateSync() {
  if (isConfigured) return;
  const expression = process.env.EXCHANGE_RATE_CRON || '*/30 * * * *';
  if (!cron.validate(expression)) {
    logger.error(`Invalid cron expression for exchange rates: ${expression}`);
    return;
  }
  cron.schedule(expression, run);
  isConfigured = true;
  logger.info(`Exchange rate sync scheduled: ${expression}`);
  // Una primera lectura al arrancar, para que la tasa esté lista sin esperar al reloj
  setTimeout(run, 5000);
}

module.exports = { setupExchangeRateSync };
