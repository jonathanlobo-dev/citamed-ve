/**
 * account.js - CITAMED.VE
 * Mi cuenta: correo, clave y solicitudes de cambio de datos protegidos.
 * Todas las rutas son de la propia persona autenticada (el admin resuelve solicitudes en /api/admin).
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');
const accountService = require('../services/accountService');

router.use(authenticateToken);

function clientMeta(req) {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null
  };
}

function handler(fn) {
  return async (req, res) => {
    try {
      const data = await fn(req);
      res.json({ success: true, data });
    } catch (error) {
      const status = error.statusCode || error.status || 500;
      if (status >= 500) console.error('Error en /api/account:', error);
      res.status(status).json({
        success: false,
        code: error.code,
        message: status >= 500 ? 'No pudimos completar la operación. Intenta de nuevo.' : error.message
      });
    }
  };
}

router.get('/', handler((req) => accountService.getSummary(req.user.id)));

router.post('/email/request', strictLimiter, handler((req) =>
  accountService.requestEmailChange(req.user.id, req.body || {}, clientMeta(req))));

router.post('/email/confirm', strictLimiter, handler((req) =>
  accountService.confirmEmailChange(req.user.id, req.body || {}, clientMeta(req))));

router.post('/password', strictLimiter, handler((req) =>
  accountService.changePassword(req.user.id, req.body || {})));

router.get('/change-requests', handler((req) => accountService.listMyChangeRequests(req.user.id)));

router.post('/change-requests', handler((req) => accountService.createChangeRequest(req.user.id, req.body || {})));

module.exports = router;
