/**
 * Search Routes - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Rutas de búsqueda avanzada
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route   GET /api/search/doctors
 * @desc    Buscar médicos con filtros combinables
 * @access  Public
 * @query   query, specialtyIds, city, state, minPrice, maxPrice, minRating,
 *          minExperience, languages, acceptsInsurance, insuranceNames, isVerified,
 *          gender, reputationLevels, hasAvailability, acceptsNewPatients,
 *          userLat, userLng, maxDistance, consultationType, sortBy, sortOrder, page, limit
 */
router.get('/doctors', searchController.searchDoctors);

/**
 * @route   GET /api/search/quick
 * @desc    Búsqueda rápida para autocomplete
 * @access  Public
 * @query   query, limit
 */
router.get('/quick', searchController.quickSearch);

/**
 * @route   GET /api/search/specialties
 * @desc    Obtener especialidades para filtros
 * @access  Public
 * @query   query
 */
router.get('/specialties', searchController.getSpecialties);

/**
 * @route   GET /api/search/cities
 * @desc    Obtener ciudades para filtros
 * @access  Public
 * @query   query, state
 */
router.get('/cities', searchController.getCities);

/**
 * @route   GET /api/search/states
 * @desc    Obtener estados para filtros
 * @access  Public
 * @query   query
 */
router.get('/states', searchController.getStates);

/**
 * @route   GET /api/search/insurance-providers
 * @desc    Obtener proveedores de seguros
 * @access  Public
 */
router.get('/insurance-providers', searchController.getInsuranceProviders);

/**
 * @route   GET /api/search/stats
 * @desc    Obtener estadísticas de búsqueda
 * @access  Public
 */
router.get('/stats', searchController.getSearchStats);

/**
 * @route   POST /api/search/cache/:doctorId
 * @desc    Actualizar cache de un médico específico
 * @access  Private (Admin)
 */
router.post('/cache/:doctorId', authenticateToken, searchController.updateDoctorCache);

/**
 * @route   POST /api/search/cache/rebuild
 * @desc    Reconstruir todo el cache de búsqueda
 * @access  Private (Admin)
 */
router.post('/cache/rebuild', authenticateToken, searchController.rebuildCache);

module.exports = router;
