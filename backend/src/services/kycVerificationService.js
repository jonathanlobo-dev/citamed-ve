/**
 * KYC Verification Service - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Servicio completo para gestión de verificación de doctores
 */

const { Op } = require('sequelize');
const db = require('../models');
const auditService = require('./auditService');

const { DoctorProfile, DoctorDocument, VerificationRequest, User } = db;

/**
 * Configuración de documentos requeridos
 */
const REQUIRED_DOCUMENTS = ['medical_degree', 'mpps_certificate', 'national_id'];

const DOCUMENT_TYPES = {
  medical_degree: { name: 'Título Universitario', required: true },
  mpps_certificate: { name: 'Certificado MPPS', required: true },
  national_id: { name: 'Cédula de Identidad', required: true },
  professional_id: { name: 'Cédula Profesional', required: false },
  specialty_certificate: { name: 'Certificado de Especialidad', required: false },
  other: { name: 'Otro Documento', required: false }
};

// ═══════════════════════════════════════════════════════════════
// 1. getVerificationStatus - Estado de verificación del doctor
// ═══════════════════════════════════════════════════════════════

async function getVerificationStatus(doctorProfileId) {
  const doctorProfile = await DoctorProfile.findByPk(doctorProfileId, {
    attributes: [
      'id', 'firstName', 'lastName', 'verificationStatus',
      'verificationRequestedAt', 'verifiedAt', 'rejectionReason', 'isVerified'
    ]
  });

  if (!doctorProfile) {
    throw new Error('Perfil de doctor no encontrado');
  }

  // Obtener documentos
  const documents = await DoctorDocument.findAll({
    where: {
      doctorProfileId,
      status: { [Op.ne]: 'rejected' }
    },
    attributes: ['id', 'documentType', 'status', 'uploadedAt', 'fileName', 'reviewedAt'],
    order: [['uploadedAt', 'DESC']]
  });

  // Verificar completitud
  const uploadedTypes = documents.map(d => d.documentType);
  const missingDocs = REQUIRED_DOCUMENTS.filter(r => !uploadedTypes.includes(r));
  const approvedDocs = documents.filter(d => d.status === 'approved');

  // Obtener solicitud activa
  const activeRequest = await VerificationRequest.findOne({
    where: {
      doctorProfileId,
      status: { [Op.in]: ['submitted', 'in_review', 'on_hold'] }
    },
    order: [['requestDate', 'DESC']]
  });

  return {
    status: doctorProfile.verificationStatus,
    isVerified: doctorProfile.isVerified,
    requestedAt: doctorProfile.verificationRequestedAt,
    verifiedAt: doctorProfile.verifiedAt,
    rejectionReason: doctorProfile.rejectionReason,
    documents: {
      total: REQUIRED_DOCUMENTS.length,
      uploaded: uploadedTypes.filter(t => REQUIRED_DOCUMENTS.includes(t)).length,
      approved: approvedDocs.filter(d => REQUIRED_DOCUMENTS.includes(d.documentType)).length,
      missing: missingDocs,
      list: documents.map(d => ({
        id: d.id,
        type: d.documentType,
        typeName: DOCUMENT_TYPES[d.documentType]?.name || d.documentType,
        status: d.status,
        fileName: d.fileName,
        uploadedAt: d.uploadedAt,
        reviewedAt: d.reviewedAt
      }))
    },
    activeRequest: activeRequest ? {
      id: activeRequest.id,
      status: activeRequest.status,
      requestDate: activeRequest.requestDate,
      waitingDays: activeRequest.getWaitingDays()
    } : null,
    canSubmitVerification: missingDocs.length === 0 && !activeRequest
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. uploadDocument - Subir documento de verificación
// ═══════════════════════════════════════════════════════════════

async function uploadDocument(doctorProfileId, documentData) {
  const {
    documentType,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
    expirationDate,
    metadata = {}
  } = documentData;

  // Validar tipo de documento
  if (!Object.keys(DOCUMENT_TYPES).includes(documentType)) {
    throw new Error('Tipo de documento no válido');
  }

  // Verificar si ya existe un documento del mismo tipo pendiente o aprobado
  const existing = await DoctorDocument.findOne({
    where: {
      doctorProfileId,
      documentType,
      status: { [Op.in]: ['pending', 'approved'] }
    }
  });

  if (existing) {
    throw new Error(`Ya existe un documento de tipo ${DOCUMENT_TYPES[documentType].name} pendiente o aprobado`);
  }

  // Crear documento
  const document = await DoctorDocument.create({
    doctorProfileId,
    documentType,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
    expirationDate: expirationDate || null,
    metadata,
    status: 'pending'
  });

  // Actualizar estado del doctor si estaba incompleto
  const doctorProfile = await DoctorProfile.findByPk(doctorProfileId);
  if (doctorProfile.verificationStatus === 'documents_incomplete') {
    const completeness = await checkDocumentCompleteness(doctorProfileId);
    if (completeness.isComplete) {
      await doctorProfile.update({ verificationStatus: 'unverified' });
    }
  }

  return document;
}

// ═══════════════════════════════════════════════════════════════
// 3. deleteDocument - Eliminar documento
// ═══════════════════════════════════════════════════════════════

async function deleteDocument(documentId, doctorProfileId) {
  const document = await DoctorDocument.findOne({
    where: {
      id: documentId,
      doctorProfileId
    }
  });

  if (!document) {
    throw new Error('Documento no encontrado');
  }

  // No permitir eliminar documentos ya aprobados
  if (document.status === 'approved') {
    throw new Error('No se puede eliminar un documento aprobado');
  }

  await document.destroy();

  return { success: true, message: 'Documento eliminado' };
}

// ═══════════════════════════════════════════════════════════════
// 4. submitVerificationRequest - Enviar solicitud de verificación
// ═══════════════════════════════════════════════════════════════

async function submitVerificationRequest(doctorProfileId, userId) {
  // Verificar que todos los documentos requeridos estén subidos
  const completeness = await checkDocumentCompleteness(doctorProfileId);

  if (!completeness.isComplete) {
    throw new Error(`Faltan documentos requeridos: ${completeness.missing.map(m => DOCUMENT_TYPES[m].name).join(', ')}`);
  }

  // Verificar que no haya solicitud activa
  const existingRequest = await VerificationRequest.getActiveByDoctor(doctorProfileId);
  if (existingRequest) {
    throw new Error('Ya existe una solicitud de verificación activa');
  }

  // Verificar estado del doctor
  const doctorProfile = await DoctorProfile.findByPk(doctorProfileId);
  if (!doctorProfile.canRequestVerification()) {
    throw new Error('El doctor no puede solicitar verificación en este momento');
  }

  // Crear solicitud
  const request = await VerificationRequest.create({
    doctorProfileId,
    status: 'submitted',
    priority: 0
  });

  // Actualizar estado del doctor
  await doctorProfile.update({
    verificationStatus: 'pending',
    verificationRequestedAt: new Date()
  });

  // Registrar en auditoría
  await auditService.log({
    userId,
    action: 'verification.request_submitted',
    entityType: 'doctor_profile',
    entityId: doctorProfileId,
    details: { requestId: request.id }
  });

  return request;
}

// ═══════════════════════════════════════════════════════════════
// 5. getVerificationQueue - Cola de verificaciones para admin
// ═══════════════════════════════════════════════════════════════

async function getVerificationQueue(options = {}) {
  const {
    page = 1,
    limit = 20,
    status = null,
    assignedTo = null,
    sortBy = 'priority',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;

  const where = {};
  if (status) {
    where.status = status;
  } else {
    where.status = { [Op.in]: ['submitted', 'in_review', 'on_hold'] };
  }
  if (assignedTo) {
    where.assignedTo = assignedTo;
  }

  const order = sortBy === 'priority'
    ? [['priority', 'DESC'], ['requestDate', 'ASC']]
    : [[sortBy, sortOrder]];

  const { count, rows } = await VerificationRequest.findAndCountAll({
    where,
    order,
    limit,
    offset,
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        attributes: ['id', 'firstName', 'lastName', 'mppsNumber', 'licenseNumber', 'profilePhoto'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email']
          }
        ]
      },
      {
        model: User,
        as: 'assignedAdmin',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }
    ]
  });

  // Agregar conteo de documentos para cada solicitud
  const requestsWithDocs = await Promise.all(rows.map(async (request) => {
    const docCount = await DoctorDocument.count({
      where: {
        doctorProfileId: request.doctorProfileId,
        status: { [Op.ne]: 'rejected' }
      }
    });

    return {
      ...request.toJSON(),
      documentsCount: docCount,
      waitingDays: request.getWaitingDays()
    };
  }));

  return {
    requests: requestsWithDocs,
    pagination: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit)
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. getRequestDetails - Detalles de solicitud para revisión
// ═══════════════════════════════════════════════════════════════

async function getRequestDetails(requestId) {
  const request = await VerificationRequest.findByPk(requestId, {
    include: [
      {
        model: DoctorProfile,
        as: 'doctorProfile',
        include: [
          { model: User, as: 'user', attributes: ['id', 'email', 'phoneNumber'] }
        ]
      },
      {
        model: User,
        as: 'assignedAdmin',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }
    ]
  });

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  // Obtener documentos
  const documents = await DoctorDocument.findAll({
    where: {
      doctorProfileId: request.doctorProfileId
    },
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }
    ],
    order: [['uploadedAt', 'DESC']]
  });

  // Historial de solicitudes anteriores
  const previousRequests = await VerificationRequest.findAll({
    where: {
      doctorProfileId: request.doctorProfileId,
      id: { [Op.ne]: requestId }
    },
    order: [['requestDate', 'DESC']],
    limit: 5
  });

  return {
    request: {
      ...request.toJSON(),
      waitingDays: request.getWaitingDays()
    },
    documents: documents.map(doc => ({
      ...doc.toJSON(),
      typeName: DOCUMENT_TYPES[doc.documentType]?.name || doc.documentType,
      isRequired: REQUIRED_DOCUMENTS.includes(doc.documentType)
    })),
    previousRequests,
    requiredDocuments: REQUIRED_DOCUMENTS.map(type => ({
      type,
      name: DOCUMENT_TYPES[type].name,
      uploaded: documents.some(d => d.documentType === type && d.status !== 'rejected'),
      approved: documents.some(d => d.documentType === type && d.status === 'approved')
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. assignRequest - Asignar solicitud a admin
// ═══════════════════════════════════════════════════════════════

async function assignRequest(requestId, adminId, currentUserId) {
  const request = await VerificationRequest.findByPk(requestId);

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  if (request.status === 'approved' || request.status === 'rejected') {
    throw new Error('No se puede asignar una solicitud ya completada');
  }

  const previousAssigned = request.assignedTo;

  await request.update({
    assignedTo: adminId,
    status: 'in_review'
  });

  // Registrar en auditoría
  await auditService.log({
    userId: currentUserId,
    action: 'verification.request_assigned',
    entityType: 'verification_request',
    entityId: requestId,
    details: {
      previousAssigned,
      newAssigned: adminId
    }
  });

  return request;
}

// ═══════════════════════════════════════════════════════════════
// 8. approveDocument - Aprobar documento individual
// ═══════════════════════════════════════════════════════════════

async function approveDocument(documentId, adminId, notes = null) {
  const document = await DoctorDocument.findByPk(documentId);

  if (!document) {
    throw new Error('Documento no encontrado');
  }

  if (document.status === 'approved') {
    throw new Error('El documento ya está aprobado');
  }

  await document.update({
    status: 'approved',
    reviewedAt: new Date(),
    reviewedBy: adminId,
    reviewNotes: notes
  });

  // Registrar en auditoría
  await auditService.log({
    userId: adminId,
    action: 'verification.document_approved',
    entityType: 'doctor_document',
    entityId: documentId,
    details: { documentType: document.documentType }
  });

  return document;
}

// ═══════════════════════════════════════════════════════════════
// 9. rejectDocument - Rechazar documento individual
// ═══════════════════════════════════════════════════════════════

async function rejectDocument(documentId, adminId, reason) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Se requiere una razón para rechazar el documento');
  }

  const document = await DoctorDocument.findByPk(documentId);

  if (!document) {
    throw new Error('Documento no encontrado');
  }

  await document.update({
    status: 'rejected',
    reviewedAt: new Date(),
    reviewedBy: adminId,
    reviewNotes: reason
  });

  // Registrar en auditoría
  await auditService.log({
    userId: adminId,
    action: 'verification.document_rejected',
    entityType: 'doctor_document',
    entityId: documentId,
    details: { documentType: document.documentType, reason }
  });

  return document;
}

// ═══════════════════════════════════════════════════════════════
// 10. approveVerification - Aprobar verificación completa
// ═══════════════════════════════════════════════════════════════

async function approveVerification(requestId, adminId, notes = null) {
  const request = await VerificationRequest.findByPk(requestId);

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  if (request.status === 'approved') {
    throw new Error('La solicitud ya fue aprobada');
  }

  // Verificar que todos los documentos requeridos estén aprobados
  const allApproved = await DoctorDocument.areAllRequiredApproved(request.doctorProfileId);
  if (!allApproved) {
    throw new Error('Todos los documentos requeridos deben estar aprobados antes de aprobar la verificación');
  }

  // Actualizar solicitud
  await request.update({
    status: 'approved',
    completedAt: new Date(),
    notes
  });

  // Actualizar perfil del doctor
  const doctorProfile = await DoctorProfile.findByPk(request.doctorProfileId);
  await doctorProfile.update({
    verificationStatus: 'approved',
    isVerified: true,
    verifiedAt: new Date(),
    verifiedBy: adminId,
    verificationNotes: notes,
    rejectionReason: null
  });

  // Registrar en auditoría
  await auditService.log({
    userId: adminId,
    action: 'verification.approved',
    entityType: 'doctor_profile',
    entityId: request.doctorProfileId,
    details: { requestId }
  });

  return { request, doctorProfile };
}

// ═══════════════════════════════════════════════════════════════
// 11. rejectVerification - Rechazar verificación
// ═══════════════════════════════════════════════════════════════

async function rejectVerification(requestId, adminId, reason) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('Se requiere una razón para rechazar la verificación');
  }

  const request = await VerificationRequest.findByPk(requestId);

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  if (request.status === 'rejected') {
    throw new Error('La solicitud ya fue rechazada');
  }

  // Actualizar solicitud
  await request.update({
    status: 'rejected',
    completedAt: new Date(),
    notes: reason
  });

  // Actualizar perfil del doctor
  const doctorProfile = await DoctorProfile.findByPk(request.doctorProfileId);
  await doctorProfile.update({
    verificationStatus: 'rejected',
    isVerified: false,
    rejectionReason: reason,
    verificationNotes: `Rechazado el ${new Date().toLocaleDateString('es-VE')}: ${reason}`
  });

  // Registrar en auditoría
  await auditService.log({
    userId: adminId,
    action: 'verification.rejected',
    entityType: 'doctor_profile',
    entityId: request.doctorProfileId,
    details: { requestId, reason }
  });

  return { request, doctorProfile };
}

// ═══════════════════════════════════════════════════════════════
// 12. getVerificationStats - Estadísticas de verificación
// ═══════════════════════════════════════════════════════════════

async function getVerificationStats() {
  // Estadísticas de solicitudes
  const requestStats = await VerificationRequest.getStats();

  // Estadísticas de doctores por estado de verificación
  const [doctorStats] = await db.sequelize.query(`
    SELECT
      verification_status,
      COUNT(*) as count
    FROM doctor_profiles
    GROUP BY verification_status
  `);

  // Documentos pendientes de revisión
  const pendingDocuments = await DoctorDocument.count({
    where: { status: 'pending' }
  });

  // Solicitudes sin asignar
  const unassignedRequests = await VerificationRequest.count({
    where: {
      assignedTo: null,
      status: 'submitted'
    }
  });

  // Verificaciones completadas hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = await VerificationRequest.count({
    where: {
      status: { [Op.in]: ['approved', 'rejected'] },
      completedAt: { [Op.gte]: today }
    }
  });

  return {
    requests: requestStats,
    doctors: doctorStats.reduce((acc, row) => {
      acc[row.verification_status] = parseInt(row.count);
      return acc;
    }, {}),
    pendingDocuments,
    unassignedRequests,
    completedToday
  };
}

// ═══════════════════════════════════════════════════════════════
// 13. checkDocumentCompleteness - Verificar documentos completos
// ═══════════════════════════════════════════════════════════════

async function checkDocumentCompleteness(doctorProfileId) {
  const documents = await DoctorDocument.findAll({
    where: {
      doctorProfileId,
      documentType: { [Op.in]: REQUIRED_DOCUMENTS },
      status: { [Op.ne]: 'rejected' }
    }
  });

  const uploadedTypes = documents.map(d => d.documentType);
  const approvedTypes = documents.filter(d => d.status === 'approved').map(d => d.documentType);
  const missing = REQUIRED_DOCUMENTS.filter(r => !uploadedTypes.includes(r));

  return {
    isComplete: missing.length === 0,
    isFullyApproved: approvedTypes.length === REQUIRED_DOCUMENTS.length,
    total: REQUIRED_DOCUMENTS.length,
    uploaded: uploadedTypes.length,
    approved: approvedTypes.length,
    missing,
    documents: documents.map(d => ({
      type: d.documentType,
      typeName: DOCUMENT_TYPES[d.documentType]?.name,
      status: d.status,
      uploadedAt: d.uploadedAt
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene los tipos de documentos configurados
 */
function getDocumentTypes() {
  return Object.entries(DOCUMENT_TYPES).map(([type, config]) => ({
    type,
    ...config
  }));
}

/**
 * Marca documentos expirados automáticamente
 */
async function markExpiredDocuments() {
  return await DoctorDocument.markExpiredDocuments();
}

/**
 * Actualiza prioridad de una solicitud
 */
async function updateRequestPriority(requestId, priority, adminId) {
  const request = await VerificationRequest.findByPk(requestId);

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  const oldPriority = request.priority;
  await request.update({ priority });

  await auditService.log({
    userId: adminId,
    action: 'verification.priority_updated',
    entityType: 'verification_request',
    entityId: requestId,
    details: { oldPriority, newPriority: priority }
  });

  return request;
}

/**
 * Pone una solicitud en espera
 */
async function holdRequest(requestId, adminId, reason) {
  const request = await VerificationRequest.findByPk(requestId);

  if (!request) {
    throw new Error('Solicitud no encontrada');
  }

  await request.update({
    status: 'on_hold',
    notes: reason
  });

  await auditService.log({
    userId: adminId,
    action: 'verification.request_on_hold',
    entityType: 'verification_request',
    entityId: requestId,
    details: { reason }
  });

  return request;
}

module.exports = {
  // Funciones principales (13)
  getVerificationStatus,
  uploadDocument,
  deleteDocument,
  submitVerificationRequest,
  getVerificationQueue,
  getRequestDetails,
  assignRequest,
  approveDocument,
  rejectDocument,
  approveVerification,
  rejectVerification,
  getVerificationStats,
  checkDocumentCompleteness,

  // Funciones auxiliares
  getDocumentTypes,
  markExpiredDocuments,
  updateRequestPriority,
  holdRequest,

  // Constantes exportadas
  REQUIRED_DOCUMENTS,
  DOCUMENT_TYPES
};
