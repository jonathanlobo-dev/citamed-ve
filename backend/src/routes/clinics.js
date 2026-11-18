/**
 * Clinics Routes - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clinicas y Organizaciones
 *
 * Rutas REST para gestion de clinicas
 */

const express = require('express');
const router = express.Router();
const clinicsController = require('../controllers/clinicsController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { requireClinicOwner } = require('../middleware/ownership');


// ═══════════════════════════════════════════════════════════════
// RUTAS PUBLICAS
// ═══════════════════════════════════════════════════════════════

// Buscar clinicas (publico)
router.get('/', clinicsController.searchClinics);

// Obtener clinica por ID (publico)
router.get('/:id', clinicsController.getClinicById);

// Obtener clinica con todas sus relaciones (publico)
router.get('/:id/full', clinicsController.getClinicWithLocations);

// Obtener sedes de una clinica (publico)
router.get('/:clinicId/locations', clinicsController.getClinicLocations);

// Obtener medicos de una clinica (publico)
router.get('/:clinicId/doctors', clinicsController.getClinicDoctors);

// Obtener servicios de una clinica (publico)
router.get('/:clinicId/services', clinicsController.getClinicServices);

// Obtener imagenes de una clinica (publico)
router.get('/:clinicId/images', clinicsController.getClinicImages);

// ═══════════════════════════════════════════════════════════════
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACION)
// ═══════════════════════════════════════════════════════════════

// Obtener mis clinicas
router.get('/user/my-clinics', authenticateToken, clinicsController.getMyClinic);

// Crear clinica
router.post('/', authenticateToken, clinicsController.createClinic);

// Actualizar clinica
router.put('/:id', authenticateToken, clinicsController.updateClinic);

// ═══════════════════════════════════════════════════════════════
// SEDES (LOCATIONS) - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Agregar sede a clinica
router.post('/:clinicId/locations', authenticateToken, requireClinicOwner, clinicsController.addLocation);

// Actualizar sede
router.put('/:clinicId/locations/:locationId', authenticateToken, requireClinicOwner, clinicsController.updateLocation);

// ═══════════════════════════════════════════════════════════════
// MEDICOS - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Asignar medico a clinica/sede
router.post('/:clinicId/doctors', authenticateToken, requireClinicOwner, clinicsController.assignDoctor);

// Remover medico de clinica/sede
router.delete('/:clinicId/doctors/:doctorId', authenticateToken, requireClinicOwner, clinicsController.removeDoctor);

// ═══════════════════════════════════════════════════════════════
// SERVICIOS - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Agregar servicio a clinica
router.post('/:clinicId/services', authenticateToken, requireClinicOwner, clinicsController.addService);

// ═══════════════════════════════════════════════════════════════
// IMAGENES - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Agregar imagen a clinica
router.post('/:clinicId/images', authenticateToken, requireClinicOwner, clinicsController.addImage);

// Eliminar imagen
router.delete('/:clinicId/images/:imageId', authenticateToken, requireClinicOwner, clinicsController.deleteImage);

// ═══════════════════════════════════════════════════════════════
// VERIFICACION (ADMIN) - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Verificar clinica (solo admin)
router.post('/:id/verify', authenticateToken, requireRole(['admin']), clinicsController.verifyClinic);

module.exports = router;
