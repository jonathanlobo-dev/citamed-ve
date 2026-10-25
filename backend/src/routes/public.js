/**
 * public.js - CITAMED.VE
 * Rutas públicas para perfil médico por slug y confirmación/cancelación de citas por WhatsApp
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { generalLimiter } = require('../middleware/rateLimiter');
const publicController = require('../controllers/publicController');

// Limitador de ráfaga para confirmación y cancelación pública (15 peticiones por 15 min por IP)
const publicActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Has alcanzado el límite de solicitudes. Por favor intenta de nuevo en unos minutos.'
  }
});

// ==========================================
// BLOQUE B: PERFIL PÚBLICO DEL MÉDICO
// ==========================================

/**
 * @route   GET /api/public/doctors/:slug
 * @desc    Obtener perfil público de un médico por slug
 * @access  Público (con limitador general)
 */
router.get('/doctors/:slug', generalLimiter, publicController.getDoctorBySlug);

// ==========================================
// BLOQUE C: CONFIRMACIÓN Y CANCELACIÓN DE CITAS
// ==========================================

/**
 * @route   GET /api/public/appointments/:token
 * @desc    Obtener resumen de cita para confirmar/cancelar (sin datos clínicos)
 * @access  Público (con limitador general)
 */
router.get('/appointments/:token', generalLimiter, publicController.getAppointmentByToken);

/**
 * @route   POST /api/public/appointments/:token/confirm
 * @desc    Confirmar asistencia a una cita
 * @access  Público (con limitador de ráfaga)
 */
router.post('/appointments/:token/confirm', publicActionLimiter, publicController.confirmAppointment);

/**
 * @route   POST /api/public/appointments/:token/cancel
 * @desc    Cancelar una cita a petición del paciente
 * @access  Público (con limitador de ráfaga)
 */
router.post('/appointments/:token/cancel', publicActionLimiter, publicController.cancelAppointment);

module.exports = router;
