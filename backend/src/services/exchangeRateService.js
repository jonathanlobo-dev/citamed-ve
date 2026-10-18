/**
 * exchangeRateService.js - CITAMED.VE
 * M05 / Semana 8 - Tasa oficial BCV automática (USD/VES y EUR/VES)
 *
 * Fuentes en orden: Bolos (una sola llamada trae USD y EUR) y DolarApi como respaldo.
 * Si ninguna responde, se conserva la última tasa guardada. Cada tasa nueva queda en el
 * historial (exchange_rates); si la tasa no cambió solo se actualiza checked_at.
 */

const { Op } = require('sequelize');
const { ExchangeRate } = require('../models');
const { logger } = require('../config/logger');

const PAIRS = ['USD/VES', 'EUR/VES'];
const FRESH_MS = 20 * 60 * 1000;            // una tasa revisada hace menos de 20 min no se vuelve a consultar
const STALE_MS = 36 * 60 * 60 * 1000;       // pasadas 36 h sin poder actualizar se marca como desactualizada
const MANUAL_HOLD_MS = 12 * 60 * 60 * 1000; // una corrección manual no se pisa antes de 12 h
const MAX_JUMP = 0.5;                       // una variación automática mayor al 50% se rechaza
const FETCH_TIMEOUT_MS = 6000;

const BOLOS_URL = 'https://bolos-ve-production.up.railway.app/api/rates';
const DOLARAPI_URL = {
  'USD/VES': 'https://ve.dolarapi.com/v1/dolares/oficial',
  'EUR/VES': 'https://ve.dolarapi.com/v1/euros/oficial'
};

const isValidRate = (n) => typeof n === 'number' && Number.isFinite(n) && n > 1 && n < 100000;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Consulta las fuentes externas. Devuelve { 'USD/VES': { rate, source, raw }, ... } solo con lo que obtuvo.
 */
async function fetchExternalRates(pairs = PAIRS) {
  const found = {};

  try {
    const data = await fetchJson(BOLOS_URL);
    if (pairs.includes('USD/VES') && isValidRate(data?.bcv_usd)) {
      found['USD/VES'] = { rate: data.bcv_usd, source: 'bolos', raw: data };
    }
    if (pairs.includes('EUR/VES') && isValidRate(data?.bcv_eur)) {
      found['EUR/VES'] = { rate: data.bcv_eur, source: 'bolos', raw: data };
    }
  } catch (err) {
    logger.warn(`[ExchangeRate] Fuente Bolos no disponible: ${err.message}`);
  }

  for (const pair of pairs) {
    if (found[pair]) continue;
    try {
      const data = await fetchJson(DOLARAPI_URL[pair]);
      const price = data?.promedio ?? data?.precio;
      if (isValidRate(price)) found[pair] = { rate: price, source: 'dolarapi', raw: data };
    } catch (err) {
      logger.warn(`[ExchangeRate] DolarApi ${pair} no disponible: ${err.message}`);
    }
  }

  return found;
}

const getLatestRow = (pair) =>
  ExchangeRate.findOne({ where: { currencyPair: pair }, order: [['createdAt', 'DESC'], ['id', 'DESC']] });

let inFlight = null;

/**
 * Sincroniza las tasas. Con force=true ignora el tiempo de frescura (botón "Actualizar ahora").
 */
async function sync({ force = false } = {}) {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const result = {};
    const pending = [];

    for (const pair of PAIRS) {
      const latest = await getLatestRow(pair);
      const age = latest ? Date.now() - new Date(latest.checkedAt).getTime() : Infinity;
      const manualHold = latest?.isManual && Date.now() - new Date(latest.createdAt).getTime() < MANUAL_HOLD_MS;
      if (manualHold) { result[pair] = { status: 'manual_hold', rate: latest.rate }; continue; }
      if (!force && age < FRESH_MS) { result[pair] = { status: 'fresh', rate: latest.rate }; continue; }
      pending.push({ pair, latest });
    }

    if (pending.length === 0) return result;

    const external = await fetchExternalRates(pending.map((p) => p.pair));

    for (const { pair, latest } of pending) {
      const got = external[pair] && { ...external[pair], rate: Math.round(external[pair].rate * 10000) / 10000 };
      if (!got) {
        result[pair] = { status: 'unavailable', rate: latest ? latest.rate : null };
        continue;
      }
      if (latest && Math.abs(got.rate / latest.rate - 1) > MAX_JUMP) {
        logger.error(`[ExchangeRate] ${pair}: variación sospechosa ${latest.rate} -> ${got.rate}, se conserva la anterior`);
        result[pair] = { status: 'rejected', rate: latest.rate };
        continue;
      }
      if (latest && !latest.isManual && Number(latest.rate) === Number(got.rate)) {
        await latest.update({ checkedAt: new Date() });
        result[pair] = { status: 'unchanged', rate: latest.rate };
        continue;
      }
      const row = await ExchangeRate.create({
        currencyPair: pair, rate: got.rate, source: got.source, rawPayload: got.raw, checkedAt: new Date()
      });
      logger.info(`[ExchangeRate] ${pair} = ${row.rate} (${got.source})`);
      result[pair] = { status: 'updated', rate: row.rate };
    }
    return result;
  })().finally(() => { inFlight = null; });
  return inFlight;
}

const serialize = (row) => {
  if (!row) return null;
  const ageMs = Date.now() - new Date(row.checkedAt).getTime();
  return {
    pair: row.currencyPair,
    rate: row.rate,
    source: row.source,
    isManual: row.isManual,
    fetchedAt: row.createdAt,
    checkedAt: row.checkedAt,
    stale: ageMs > STALE_MS
  };
};

/**
 * Tasa vigente de un par. Si está vencida intenta actualizarla antes de responder
 * (así funciona aunque el servidor haya estado dormido) y, si falla, devuelve la última guardada.
 */
async function getCurrent(pair = 'USD/VES') {
  let row = await getLatestRow(pair);
  const age = row ? Date.now() - new Date(row.checkedAt).getTime() : Infinity;
  if (age >= FRESH_MS) {
    try { await sync(); } catch (err) { logger.warn(`[ExchangeRate] sync fallido: ${err.message}`); }
    row = await getLatestRow(pair);
  }
  return serialize(row);
}

async function getAll() {
  const out = {};
  for (const pair of PAIRS) out[pair === 'USD/VES' ? 'usd' : 'eur'] = await getCurrent(pair);
  return out;
}

/** Corrección manual del administrador. */
async function setManual({ pair = 'USD/VES', rate, userId }) {
  if (!PAIRS.includes(pair)) { const e = new Error('Par de monedas no válido'); e.status = 400; throw e; }
  const value = Number(rate);
  if (!isValidRate(value)) { const e = new Error('La tasa debe ser un número mayor que 1'); e.status = 400; throw e; }
  const row = await ExchangeRate.create({
    currencyPair: pair, rate: value, source: 'manual', isManual: true, createdBy: userId || null, checkedAt: new Date()
  });
  return serialize(row);
}

async function getHistory({ pair = 'USD/VES', days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await ExchangeRate.findAll({
    where: { currencyPair: pair, createdAt: { [Op.gte]: since } },
    order: [['createdAt', 'DESC']],
    limit: 200
  });
  return rows.map(serialize);
}

module.exports = { sync, getCurrent, getAll, setManual, getHistory, fetchExternalRates, PAIRS };
