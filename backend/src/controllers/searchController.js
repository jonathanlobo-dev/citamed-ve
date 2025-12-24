/**
 * Search Controller - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Controlador de búsqueda avanzada
 */

const searchService = require('../services/searchService');

/**
 * Buscar médicos con filtros
 * GET /api/search/doctors
 */
const searchDoctors = async (req, res) => {
  try {
    const {
      query,
      specialtyIds,
      city,
      state,
      minPrice,
      maxPrice,
      minRating,
      minExperience,
      languages,
      acceptsInsurance,
      insuranceNames,
      isVerified,
      gender,
      reputationLevels,
      hasAvailability,
      acceptsNewPatients,
      userLat,
      userLng,
      maxDistance,
      consultationType,
      sortBy,
      sortOrder,
      page,
      limit
    } = req.query;

    // Parsear parámetros
    const filters = {
      query,
      specialtyIds: specialtyIds ?
        (Array.isArray(specialtyIds) ? specialtyIds.map(Number) : [Number(specialtyIds)]) :
        undefined,
      city,
      state,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      minExperience: minExperience ? parseInt(minExperience, 10) : undefined,
      languages: languages ?
        (Array.isArray(languages) ? languages : [languages]) :
        undefined,
      acceptsInsurance: acceptsInsurance !== undefined ?
        acceptsInsurance === 'true' :
        undefined,
      insuranceNames: insuranceNames ?
        (Array.isArray(insuranceNames) ? insuranceNames : [insuranceNames]) :
        undefined,
      isVerified: isVerified !== undefined ?
        isVerified === 'true' :
        undefined,
      gender,
      reputationLevels: reputationLevels ?
        (Array.isArray(reputationLevels) ? reputationLevels : [reputationLevels]) :
        undefined,
      hasAvailability: hasAvailability !== undefined ?
        hasAvailability === 'true' :
        undefined,
      acceptsNewPatients: acceptsNewPatients !== undefined ?
        acceptsNewPatients === 'true' :
        undefined,
      userLat: userLat ? parseFloat(userLat) : undefined,
      userLng: userLng ? parseFloat(userLng) : undefined,
      maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
      consultationType,
      sortBy: sortBy || 'average_rating',
      sortOrder: sortOrder || 'DESC',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 50) : 20
    };

    const result = await searchService.searchDoctors(filters);
    res.json(result);
  } catch (error) {
    console.error('Search doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar médicos',
      error: error.message
    });
  }
};

/**
 * Búsqueda rápida para autocomplete
 * GET /api/search/quick
 */
const quickSearch = async (req, res) => {
  try {
    const { query, limit } = req.query;
    const result = await searchService.quickSearch(
      query,
      limit ? parseInt(limit, 10) : 5
    );
    res.json(result);
  } catch (error) {
    console.error('Quick search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda rápida',
      error: error.message
    });
  }
};

/**
 * Obtener especialidades para autocomplete
 * GET /api/search/specialties
 */
const getSpecialties = async (req, res) => {
  try {
    const { query } = req.query;
    const result = await searchService.getSpecialties(query);
    res.json(result);
  } catch (error) {
    console.error('Get specialties error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades',
      error: error.message
    });
  }
};

/**
 * Obtener ciudades para autocomplete
 * GET /api/search/cities
 */
const getCities = async (req, res) => {
  try {
    const { query, state } = req.query;
    const result = await searchService.getCities(query, state);
    res.json(result);
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ciudades',
      error: error.message
    });
  }
};

/**
 * Obtener estados para autocomplete
 * GET /api/search/states
 */
const getStates = async (req, res) => {
  try {
    const { query } = req.query;
    const result = await searchService.getStates(query);
    res.json(result);
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estados',
      error: error.message
    });
  }
};

/**
 * Obtener proveedores de seguros
 * GET /api/search/insurance-providers
 */
const getInsuranceProviders = async (req, res) => {
  try {
    const result = await searchService.getInsuranceProviders();
    res.json(result);
  } catch (error) {
    console.error('Get insurance providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores de seguros',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de búsqueda
 * GET /api/search/stats
 */
const getSearchStats = async (req, res) => {
  try {
    const result = await searchService.getSearchStats();
    res.json(result);
  } catch (error) {
    console.error('Get search stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

/**
 * Actualizar cache de un médico (admin)
 * POST /api/search/cache/:doctorId
 */
const updateDoctorCache = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const result = await searchService.updateDoctorSearchCache(parseInt(doctorId, 10));
    res.json(result);
  } catch (error) {
    console.error('Update doctor cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cache',
      error: error.message
    });
  }
};

/**
 * Reconstruir todo el cache (admin)
 * POST /api/search/cache/rebuild
 */
const rebuildCache = async (req, res) => {
  try {
    const result = await searchService.rebuildSearchCache();
    res.json(result);
  } catch (error) {
    console.error('Rebuild cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reconstruir cache',
      error: error.message
    });
  }
};

module.exports = {
  searchDoctors,
  quickSearch,
  getSpecialties,
  getCities,
  getStates,
  getInsuranceProviders,
  getSearchStats,
  updateDoctorCache,
  rebuildCache
};
