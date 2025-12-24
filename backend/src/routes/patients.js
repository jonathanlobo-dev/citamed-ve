/**
 * Patient Profile Routes - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Rutas para gestión de perfil de paciente
 */

const express = require('express');
const router = express.Router();
const patientProfileController = require('../controllers/patientProfileController');
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  validateUpdateProfile,
  validateEmergencyContact,
  validateInsurance,
  validateAddMedicalHistory,
  validateUpdateMedicalHistory,
  validateHistoryId,
  validateAddAllergy,
  validateUpdateAllergy,
  validateAllergyId,
  validateAddMedication,
  validateUpdateMedication,
  validateMedicationId,
  validatePatientId
} = require('../validators/patientProfileValidator');

// ═══════════════════════════════════════════════════════════════
// RUTAS PARA EL PROPIO PACIENTE (AUTENTICADO)
// ═══════════════════════════════════════════════════════════════

// Perfil propio
router.get('/me', verifyToken, patientProfileController.getMyProfile);
router.put('/me', verifyToken, validateUpdateProfile, patientProfileController.updateProfile);
router.put('/me/emergency-contact', verifyToken, validateEmergencyContact, patientProfileController.updateEmergencyContact);
router.put('/me/insurance', verifyToken, validateInsurance, patientProfileController.updateInsurance);
router.get('/me/completeness', verifyToken, patientProfileController.getCompleteness);

// Historial médico propio
router.post('/me/medical-history', verifyToken, validateAddMedicalHistory, patientProfileController.addMedicalHistory);
router.put('/me/medical-history/:historyId', verifyToken, validateUpdateMedicalHistory, patientProfileController.updateMedicalHistory);
router.delete('/me/medical-history/:historyId', verifyToken, validateHistoryId, patientProfileController.deleteMedicalHistory);

// Alergias propias
router.post('/me/allergies', verifyToken, validateAddAllergy, patientProfileController.addAllergy);
router.put('/me/allergies/:allergyId', verifyToken, validateUpdateAllergy, patientProfileController.updateAllergy);
router.delete('/me/allergies/:allergyId', verifyToken, validateAllergyId, patientProfileController.deleteAllergy);

// Medicamentos propios
router.post('/me/medications', verifyToken, validateAddMedication, patientProfileController.addMedication);
router.put('/me/medications/:medicationId', verifyToken, validateUpdateMedication, patientProfileController.updateMedication);
router.delete('/me/medications/:medicationId', verifyToken, validateMedicationId, patientProfileController.deleteMedication);
router.post('/me/medications/:medicationId/stop', verifyToken, validateMedicationId, patientProfileController.stopMedication);

// ═══════════════════════════════════════════════════════════════
// RUTAS PARA DOCTORES/ADMIN (VER PACIENTES)
// ═══════════════════════════════════════════════════════════════

// Ver perfil de paciente (solo doctores y admin)
router.get(
  '/:patientId',
  verifyToken,
  requireRole(['doctor', 'admin']),
  validatePatientId,
  patientProfileController.getProfile
);

// Ver resumen médico de paciente (solo doctores y admin)
router.get(
  '/:patientId/summary',
  verifyToken,
  requireRole(['doctor', 'admin']),
  validatePatientId,
  patientProfileController.getMedicalSummary
);

module.exports = router;
