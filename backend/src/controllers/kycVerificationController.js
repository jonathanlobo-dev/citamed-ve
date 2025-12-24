/**
 * KYC Verification Controller - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * 12 endpoints para gestión de verificación de doctores
 */

const kycService = require('../services/kycVerificationService');
const storageService = require('../services/storageService');
const db = require('../models');

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS PARA DOCTORES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/verification/status
 * Obtiene estado de verificación del doctor autenticado
 */
const getMyVerificationStatus = async (req, res) => {
  try {
    // Obtener perfil del doctor
    const doctorProfile = await db.DoctorProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de doctor no encontrado'
      });
    }

    const status = await kycService.getVerificationStatus(doctorProfile.id);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error obteniendo estado de verificación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/verification/documents
 * Sube un documento de verificación
 */
const uploadDocument = async (req, res) => {
  try {
    const { documentType, expirationDate } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'El tipo de documento es requerido'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó archivo'
      });
    }

    // Obtener perfil del doctor
    const doctorProfile = await db.DoctorProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de doctor no encontrado'
      });
    }

    // Guardar archivo
    const fileData = await storageService.saveFile(req.file, doctorProfile.id);

    // Crear registro de documento
    const document = await kycService.uploadDocument(doctorProfile.id, {
      documentType,
      fileName: req.file.originalname,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      expirationDate: expirationDate || null
    });

    res.status(201).json({
      success: true,
      message: 'Documento subido exitosamente',
      data: {
        id: document.id,
        documentType: document.documentType,
        fileName: document.fileName,
        status: document.status,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error subiendo documento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/verification/documents/:id
 * Elimina un documento de verificación
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener perfil del doctor
    const doctorProfile = await db.DoctorProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de doctor no encontrado'
      });
    }

    // Obtener documento para eliminar archivo
    const document = await db.DoctorDocument.findOne({
      where: { id, doctorProfileId: doctorProfile.id }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento no encontrado'
      });
    }

    // Eliminar archivo del storage
    await storageService.deleteFile(document.fileUrl);

    // Eliminar registro
    await kycService.deleteDocument(id, doctorProfile.id);

    res.json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando documento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/verification/submit
 * Envía solicitud de verificación
 */
const submitVerification = async (req, res) => {
  try {
    // Obtener perfil del doctor
    const doctorProfile = await db.DoctorProfile.findOne({
      where: { userId: req.user.id }
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        error: 'Perfil de doctor no encontrado'
      });
    }

    const request = await kycService.submitVerificationRequest(
      doctorProfile.id,
      req.user.id
    );

    res.status(201).json({
      success: true,
      message: 'Solicitud de verificación enviada exitosamente',
      data: {
        requestId: request.id,
        status: request.status,
        requestDate: request.requestDate
      }
    });
  } catch (error) {
    console.error('Error enviando solicitud de verificación:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/verification/document-types
 * Obtiene tipos de documentos disponibles
 */
const getDocumentTypes = async (req, res) => {
  try {
    const types = kycService.getDocumentTypes();
    const uploadConfig = storageService.getStorageInfo();

    res.json({
      success: true,
      data: {
        documentTypes: types,
        uploadConfig: {
          maxFileSize: uploadConfig.maxFileSizeMB,
          allowedTypes: uploadConfig.allowedExtensions
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo tipos de documentos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS PARA ADMINISTRADORES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/verification/queue
 * Obtiene cola de verificaciones pendientes
 */
const getVerificationQueue = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      assignedTo,
      sortBy = 'priority',
      sortOrder = 'DESC'
    } = req.query;

    const result = await kycService.getVerificationQueue({
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null,
      assignedTo: assignedTo ? parseInt(assignedTo) : null,
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo cola de verificación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/admin/verification/requests/:id
 * Obtiene detalles de una solicitud
 */
const getRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await kycService.getRequestDetails(parseInt(id));

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error obteniendo detalles de solicitud:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/requests/:id/assign
 * Asigna solicitud a un admin
 */
const assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const request = await kycService.assignRequest(
      parseInt(id),
      adminId || req.user.id,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Solicitud asignada exitosamente',
      data: request
    });
  } catch (error) {
    console.error('Error asignando solicitud:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/documents/:id/approve
 * Aprueba un documento individual
 */
const approveDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const document = await kycService.approveDocument(
      parseInt(id),
      req.user.id,
      notes
    );

    res.json({
      success: true,
      message: 'Documento aprobado exitosamente',
      data: {
        id: document.id,
        documentType: document.documentType,
        status: document.status,
        reviewedAt: document.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error aprobando documento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/documents/:id/reject
 * Rechaza un documento individual
 */
const rejectDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una razón para el rechazo'
      });
    }

    const document = await kycService.rejectDocument(
      parseInt(id),
      req.user.id,
      reason
    );

    res.json({
      success: true,
      message: 'Documento rechazado',
      data: {
        id: document.id,
        documentType: document.documentType,
        status: document.status,
        reviewedAt: document.reviewedAt
      }
    });
  } catch (error) {
    console.error('Error rechazando documento:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/requests/:id/approve
 * Aprueba verificación completa del doctor
 */
const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await kycService.approveVerification(
      parseInt(id),
      req.user.id,
      notes
    );

    res.json({
      success: true,
      message: 'Doctor verificado exitosamente',
      data: {
        requestId: result.request.id,
        doctorProfileId: result.doctorProfile.id,
        verificationStatus: result.doctorProfile.verificationStatus,
        verifiedAt: result.doctorProfile.verifiedAt
      }
    });
  } catch (error) {
    console.error('Error aprobando verificación:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/requests/:id/reject
 * Rechaza verificación del doctor
 */
const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una razón para el rechazo'
      });
    }

    const result = await kycService.rejectVerification(
      parseInt(id),
      req.user.id,
      reason
    );

    res.json({
      success: true,
      message: 'Verificación rechazada',
      data: {
        requestId: result.request.id,
        doctorProfileId: result.doctorProfile.id,
        verificationStatus: result.doctorProfile.verificationStatus,
        rejectionReason: result.doctorProfile.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error rechazando verificación:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/admin/verification/stats
 * Obtiene estadísticas de verificación
 */
const getVerificationStats = async (req, res) => {
  try {
    const stats = await kycService.getVerificationStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/verification/requests/:id/priority
 * Actualiza prioridad de una solicitud
 */
const updateRequestPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (typeof priority !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'La prioridad debe ser un número'
      });
    }

    const request = await kycService.updateRequestPriority(
      parseInt(id),
      priority,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Prioridad actualizada',
      data: request
    });
  } catch (error) {
    console.error('Error actualizando prioridad:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/admin/verification/requests/:id/hold
 * Pone solicitud en espera
 */
const holdRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await kycService.holdRequest(
      parseInt(id),
      req.user.id,
      reason
    );

    res.json({
      success: true,
      message: 'Solicitud puesta en espera',
      data: request
    });
  } catch (error) {
    console.error('Error poniendo en espera:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  // Endpoints para doctores (5)
  getMyVerificationStatus,
  uploadDocument,
  deleteDocument,
  submitVerification,
  getDocumentTypes,

  // Endpoints para admins (9)
  getVerificationQueue,
  getRequestDetails,
  assignRequest,
  approveDocument,
  rejectDocument,
  approveVerification,
  rejectVerification,
  getVerificationStats,
  updateRequestPriority,
  holdRequest
};
