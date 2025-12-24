/**
 * Clinics Routes - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clinicas y Organizaciones
 *
 * Rutas REST para gestion de clinicas
 */

const express = require('express');
const router = express.Router();
const clinicsController = require('../controllers/clinicsController');
const { authenticateToken } = require('../middleware/auth');

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
router.post('/:clinicId/locations', authenticateToken, clinicsController.addLocation);

// Actualizar sede
router.put('/:clinicId/locations/:locationId', authenticateToken, clinicsController.updateLocation);

// ═══════════════════════════════════════════════════════════════
// MEDICOS - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Asignar medico a clinica/sede
router.post('/:clinicId/doctors', authenticateToken, clinicsController.assignDoctor);

// Remover medico de clinica/sede
router.delete('/:clinicId/doctors/:doctorId', authenticateToken, clinicsController.removeDoctor);

// ═══════════════════════════════════════════════════════════════
// SERVICIOS - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Agregar servicio a clinica
router.post('/:clinicId/services', authenticateToken, clinicsController.addService);

// ═══════════════════════════════════════════════════════════════
// IMAGENES - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Agregar imagen a clinica
router.post('/:clinicId/images', authenticateToken, clinicsController.addImage);

// Eliminar imagen
router.delete('/:clinicId/images/:imageId', authenticateToken, clinicsController.deleteImage);

// ═══════════════════════════════════════════════════════════════
// VERIFICACION (ADMIN) - PROTEGIDAS
// ═══════════════════════════════════════════════════════════════

// Verificar clinica (solo admin)
router.post('/:id/verify', authenticateToken, clinicsController.verifyClinic);

module.exports = router;
