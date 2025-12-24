/**
 * Clinics Controller - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clinicas y Organizaciones
 *
 * Controlador REST para gestion de clinicas
 */

const clinicService = require('../services/clinicService');

// ═══════════════════════════════════════════════════════════════
// CLINICAS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics - Crear nueva clinica
 */
const createClinic = async (req, res) => {
  try {
    const result = await clinicService.createClinic(req.body, req.user.id);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en createClinic:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:id - Obtener clinica por ID
 */
const getClinicById = async (req, res) => {
  try {
    const options = {
      includeLocations: req.query.includeLocations !== 'false',
      includeServices: req.query.includeServices === 'true',
      includeImages: req.query.includeImages === 'true',
      includeAdmin: req.query.includeAdmin === 'true',
      activeOnly: req.query.activeOnly !== 'false'
    };

    const result = await clinicService.getClinicById(req.params.id, options);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getClinicById:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:id/full - Obtener clinica con todas sus relaciones
 */
const getClinicWithLocations = async (req, res) => {
  try {
    const result = await clinicService.getClinicWithLocations(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en getClinicWithLocations:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/clinics/:id - Actualizar clinica
 */
const updateClinic = async (req, res) => {
  try {
    const result = await clinicService.updateClinic(req.params.id, req.body, req.user.id);

    if (!result.success) {
      return res.status(result.message.includes('permiso') ? 403 : 404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en updateClinic:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics - Buscar clinicas con filtros
 */
const searchClinics = async (req, res) => {
  try {
    const filters = {
      organizationType: req.query.organizationType,
      isVerified: req.query.isVerified === 'true' ? true : (req.query.isVerified === 'false' ? false : undefined),
      search: req.query.search,
      city: req.query.city,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const result = await clinicService.searchClinics(filters);
    res.json(result);
  } catch (error) {
    console.error('Error en searchClinics:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/my-clinics - Obtener clinicas del usuario actual
 */
const getMyClinic = async (req, res) => {
  try {
    const result = await clinicService.getUserClinics(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error en getMyClinic:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ═══════════════════════════════════════════════════════════════
// SEDES (LOCATIONS)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics/:clinicId/locations - Agregar sede
 */
const addLocation = async (req, res) => {
  try {
    const result = await clinicService.addLocation(req.params.clinicId, req.body);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en addLocation:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/clinics/:clinicId/locations/:locationId - Actualizar sede
 */
const updateLocation = async (req, res) => {
  try {
    const result = await clinicService.updateLocation(req.params.locationId, req.body);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en updateLocation:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:clinicId/locations - Obtener sedes de una clinica
 */
const getClinicLocations = async (req, res) => {
  try {
    const result = await clinicService.getClinicLocations(req.params.clinicId);
    res.json(result);
  } catch (error) {
    console.error('Error en getClinicLocations:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ═══════════════════════════════════════════════════════════════
// MEDICOS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics/:clinicId/doctors - Asignar medico a clinica/sede
 */
const assignDoctor = async (req, res) => {
  try {
    const { doctorId, locationId, ...assignmentData } = req.body;

    const result = await clinicService.assignDoctorToLocation(
      req.params.clinicId,
      locationId,
      doctorId,
      assignmentData
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en assignDoctor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/clinics/:clinicId/doctors/:doctorId - Remover medico
 */
const removeDoctor = async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await clinicService.removeDoctorFromLocation(
      req.params.clinicId,
      req.params.doctorId,
      locationId
    );

    res.json(result);
  } catch (error) {
    console.error('Error en removeDoctor:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:clinicId/doctors - Obtener medicos de una clinica
 */
const getClinicDoctors = async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await clinicService.getClinicDoctors(req.params.clinicId, locationId);
    res.json(result);
  } catch (error) {
    console.error('Error en getClinicDoctors:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ═══════════════════════════════════════════════════════════════
// SERVICIOS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics/:clinicId/services - Agregar servicio
 */
const addService = async (req, res) => {
  try {
    const { locationId, ...serviceData } = req.body;
    const result = await clinicService.addService(req.params.clinicId, locationId, serviceData);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error en addService:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:clinicId/services - Obtener servicios
 */
const getClinicServices = async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await clinicService.getClinicServices(req.params.clinicId, locationId);
    res.json(result);
  } catch (error) {
    console.error('Error en getClinicServices:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ═══════════════════════════════════════════════════════════════
// IMAGENES
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics/:clinicId/images - Agregar imagen
 */
const addImage = async (req, res) => {
  try {
    const { locationId, ...imageData } = req.body;
    const result = await clinicService.addImage(req.params.clinicId, locationId, imageData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error en addImage:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/clinics/:clinicId/images - Obtener imagenes
 */
const getClinicImages = async (req, res) => {
  try {
    const locationId = req.query.locationId || null;
    const result = await clinicService.getClinicImages(req.params.clinicId, locationId);
    res.json(result);
  } catch (error) {
    console.error('Error en getClinicImages:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/clinics/:clinicId/images/:imageId - Eliminar imagen
 */
const deleteImage = async (req, res) => {
  try {
    const result = await clinicService.deleteImage(req.params.imageId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en deleteImage:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ═══════════════════════════════════════════════════════════════
// VERIFICACION (ADMIN)
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/clinics/:id/verify - Verificar clinica (solo admin)
 */
const verifyClinic = async (req, res) => {
  try {
    const result = await clinicService.verifyClinic(req.params.id, req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en verifyClinic:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  // Clinicas
  createClinic,
  getClinicById,
  getClinicWithLocations,
  updateClinic,
  searchClinics,
  getMyClinic,

  // Sedes
  addLocation,
  updateLocation,
  getClinicLocations,

  // Medicos
  assignDoctor,
  removeDoctor,
  getClinicDoctors,

  // Servicios
  addService,
  getClinicServices,

  // Imagenes
  addImage,
  getClinicImages,
  deleteImage,

  // Verificacion
  verifyClinic
};
