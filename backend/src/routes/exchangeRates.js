/**
 * exchangeRates.js - CITAMED.VE
 * M05 / Semana 8 - Consulta de la tasa oficial BCV para pacientes y médicos
 */

const express = require('express');
const router = express.Router();
const exchangeRateService = require('../services/exchangeRateService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/exchange-rate  ->  { usd: {...}, eur: {...} }
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await exchangeRateService.getAll();
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[ExchangeRate] Error:', error);
    return res.status(500).json({ success: false, message: 'No se pudo obtener la tasa del día' });
  }
});

module.exports = router;
