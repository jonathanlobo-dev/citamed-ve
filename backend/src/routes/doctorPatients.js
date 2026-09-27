/**
 * doctorPatients.js - CITAMED.VE
 * M03 / Semana 6 - Rutas de pacientes y ficha clínica para el médico
 */

const express = require('express');
const router = express.Router();
const doctorPatientsController = require('../controllers/doctorPatientsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');

// Lista de pacientes con los que el médico tiene o tuvo citas
router.get(
  '/',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  doctorPatientsController.getDoctorPatients.bind(doctorPatientsController)
);

// Ficha clínica del paciente para el médico
router.get(
  '/:patientId/record',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  doctorPatientsController.getPatientRecordForDoctor.bind(doctorPatientsController)
);

// Registrar alergia al paciente desde la consulta
router.post(
  '/:patientId/allergies',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  doctorPatientsController.addPatientAllergy.bind(doctorPatientsController)
);

// Registrar condición / antecedente al paciente desde la consulta
router.post(
  '/:patientId/conditions',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  doctorPatientsController.addPatientCondition.bind(doctorPatientsController)
);

module.exports = router;
