/**
 * myClinicalRecord.js - CITAMED.VE
 * M03 / Semana 6 - Rutas de historia clínica del propio paciente
 */

const express = require('express');
const router = express.Router();
const myClinicalRecordController = require('../controllers/myClinicalRecordController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');

// Historia clínica del paciente con todos sus médicos (sin doctorNotes)
router.get(
  '/me/record',
  authenticateToken,
  requireRoles(['patient', 'admin']),
  myClinicalRecordController.getMyClinicalRecord.bind(myClinicalRecordController)
);

module.exports = router;
