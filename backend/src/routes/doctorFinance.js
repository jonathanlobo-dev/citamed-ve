/**
 * doctorFinance.js - CITAMED.VE
 * Reportes del médico: egresos del consultorio y reporte de ingresos, egresos y utilidad.
 * Solo el médico. La asistente queda fuera (auth.js lo deniega por defecto) porque la utilidad
 * y los egresos son información del dueño del consultorio.
 */

const express = require('express');
const router = express.Router();
const service = require('../services/doctorFinanceService');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { creationLimiter, generalLimiter } = require('../middleware/rateLimiter');

const statusOf = (error) => error.statusCode || 500;

function handler(action) {
  return async (req, res) => {
    try {
      const data = await action(req);
      res.json({ success: true, data });
    } catch (error) {
      const status = statusOf(error);
      if (status >= 500) console.error('[DoctorFinance] error:', error);
      res.status(status).json({ success: false, message: status >= 500 ? 'No pudimos completar la operación' : error.message });
    }
  };
}

router.use(authenticateToken, requireRoles(['doctor']));

router.get('/report', generalLimiter, handler((req) => service.getReport(req.user, req.query)));
router.get('/expenses', generalLimiter, handler((req) => service.listExpenses(req.user, req.query)));
router.post('/expenses', creationLimiter, handler((req) => service.createExpense(req.user, req.body)));
router.put('/expenses/:id', creationLimiter, handler((req) => service.updateExpense(req.user, req.params.id, req.body)));
router.delete('/expenses/:id', creationLimiter, handler(async (req) => {
  await service.deleteExpense(req.user, req.params.id);
  return { id: Number(req.params.id) };
}));

module.exports = router;
