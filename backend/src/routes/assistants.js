/**
 * assistants.js - CITAMED.VE
 * Semana 9 / Bloque A - Rutas para gestión de asistentes y vinculación con médicos
 */

const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');

// ==========================================
// RUTAS DEL MÉDICO (Gestión de sus asistentes)
// ==========================================

// Listar asistentes del médico
router.get(
  '/',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  assistantController.getMyAssistants.bind(assistantController)
);

// Invitar a una asistente por correo
router.post(
  '/invite',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  assistantController.inviteAssistant.bind(assistantController)
);

// Actualizar permisos de una asistente
router.put(
  '/:linkId/permissions',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  assistantController.updatePermissions.bind(assistantController)
);

// Revocar vínculo con una asistente
router.delete(
  '/:linkId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  assistantController.revokeAssistant.bind(assistantController)
);

// ==========================================
// RUTAS DE LA ASISTENTE (Gestión de sus médicos)
// ==========================================

// Listar médicos con los que la asistente tiene vínculo
router.get(
  '/my-doctors',
  authenticateToken,
  requireRoles(['assistant', 'admin']),
  assistantController.getMyDoctors.bind(assistantController)
);

// Aceptar invitación de un médico
router.post(
  '/:linkId/accept',
  authenticateToken,
  requireRoles(['assistant', 'admin']),
  assistantController.acceptInvitation.bind(assistantController)
);

// Rechazar invitación de un médico
router.post(
  '/:linkId/decline',
  authenticateToken,
  requireRoles(['assistant', 'admin']),
  assistantController.declineInvitation.bind(assistantController)
);

module.exports = router;
