/**
 * guestBooking.js - CITAMED.VE
 * Primera cita sin registro (público). Apagado salvo GUEST_BOOKING_ENABLED=true.
 *
 *  - GET  /api/guest-booking/slots         horarios libres de un médico para un día
 *  - POST /api/guest-booking/appointments  crea la cuenta sin reclamar y la cita pendiente
 *
 * Protección anti abuso: límite de peticiones por dirección y Cloudflare Turnstile cuando
 * existe TURNSTILE_SECRET_KEY (cabecera X-Turnstile-Token).
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const service = require('../services/guestBookingService');
const { requireTurnstile } = require('../middleware/turnstile');
const { guestBookingEnabled } = require('../utils/guestBooking');

const limiterOptions = (windowMs, max, message) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message }
});

// Consultar horarios es liviano; pedir la cita crea cuentas, así que es mucho más estricto
const slotsLimiter = rateLimit(limiterOptions(15 * 60 * 1000, 60, 'Demasiadas consultas. Intenta de nuevo en unos minutos.'));
const createLimiter = rateLimit(limiterOptions(60 * 60 * 1000, 6, 'Has pedido demasiadas citas desde esta conexión. Intenta de nuevo más tarde o inicia sesión.'));

function requireEnabled(req, res, next) {
  if (!guestBookingEnabled()) {
    return res.status(404).json({ success: false, message: 'No disponible' });
  }
  return next();
}

function handler(action) {
  return async (req, res) => {
    try {
      const data = await action(req);
      res.status(req.method === 'POST' ? 201 : 200).json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || 500;
      if (status >= 500) console.error('[GuestBooking] error:', error);
      res.status(status).json({
        success: false,
        code: error.code,
        field: error.field,
        message: status >= 500 ? 'No pudimos pedir tu cita. Intenta de nuevo.' : error.message
      });
    }
  };
}

router.get('/slots', requireEnabled, slotsLimiter, handler((req) => service.getSlots(req.query.doctorProfileId, req.query.date)));

router.post(
  '/appointments',
  requireEnabled,
  createLimiter,
  requireTurnstile,
  handler((req) => service.createGuestAppointment(req.body, { ipAddress: req.ip }))
);

module.exports = router;
