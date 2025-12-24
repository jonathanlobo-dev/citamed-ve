/**
 * KYC Verification Service - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Servicio frontend para verificación de doctores
 */

import api from './api';

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS PARA DOCTORES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene estado de verificación del doctor autenticado
 */
export const getVerificationStatus = async () => {
  const response = await api.get('/kyc/status');
  return response.data;
};

/**
 * Obtiene tipos de documentos disponibles
 */
export const getDocumentTypes = async () => {
  const response = await api.get('/kyc/document-types');
  return response.data;
};

/**
 * Sube un documento de verificación
 * @param {File} file - Archivo a subir
 * @param {string} documentType - Tipo de documento
 * @param {string} expirationDate - Fecha de expiración (opcional)
 * @param {function} onProgress - Callback para progreso de upload
 */
export const uploadDocument = async (file, documentType, expirationDate = null, onProgress = null) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('documentType', documentType);
  if (expirationDate) {
    formData.append('expirationDate', expirationDate);
  }

  const response = await api.post('/kyc/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
};

/**
 * Elimina un documento de verificación
 * @param {number} documentId - ID del documento
 */
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/kyc/documents/${documentId}`);
  return response.data;
};

/**
 * Envía solicitud de verificación
 */
export const submitVerification = async () => {
  const response = await api.post('/kyc/submit');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// ENDPOINTS PARA ADMINISTRADORES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene cola de verificaciones pendientes
 * @param {Object} params - Parámetros de filtrado
 */
export const getVerificationQueue = async (params = {}) => {
  const response = await api.get('/kyc/admin/queue', { params });
  return response.data;
};

/**
 * Obtiene estadísticas de verificación
 */
export const getVerificationStats = async () => {
  const response = await api.get('/kyc/admin/stats');
  return response.data;
};

/**
 * Obtiene detalles de una solicitud
 * @param {number} requestId - ID de la solicitud
 */
export const getRequestDetails = async (requestId) => {
  const response = await api.get(`/kyc/admin/requests/${requestId}`);
  return response.data;
};

/**
 * Asigna solicitud a un admin
 * @param {number} requestId - ID de la solicitud
 * @param {number} adminId - ID del admin (opcional, si no se pasa se asigna al usuario actual)
 */
export const assignRequest = async (requestId, adminId = null) => {
  const response = await api.post(`/kyc/admin/requests/${requestId}/assign`, { adminId });
  return response.data;
};

/**
 * Actualiza prioridad de una solicitud
 * @param {number} requestId - ID de la solicitud
 * @param {number} priority - Nueva prioridad
 */
export const updateRequestPriority = async (requestId, priority) => {
  const response = await api.put(`/kyc/admin/requests/${requestId}/priority`, { priority });
  return response.data;
};

/**
 * Pone solicitud en espera
 * @param {number} requestId - ID de la solicitud
 * @param {string} reason - Razón de la espera
 */
export const holdRequest = async (requestId, reason) => {
  const response = await api.post(`/kyc/admin/requests/${requestId}/hold`, { reason });
  return response.data;
};

/**
 * Aprueba un documento individual
 * @param {number} documentId - ID del documento
 * @param {string} notes - Notas de aprobación (opcional)
 */
export const approveDocument = async (documentId, notes = null) => {
  const response = await api.post(`/kyc/admin/documents/${documentId}/approve`, { notes });
  return response.data;
};

/**
 * Rechaza un documento individual
 * @param {number} documentId - ID del documento
 * @param {string} reason - Razón del rechazo
 */
export const rejectDocument = async (documentId, reason) => {
  const response = await api.post(`/kyc/admin/documents/${documentId}/reject`, { reason });
  return response.data;
};

/**
 * Aprueba verificación completa del doctor
 * @param {number} requestId - ID de la solicitud
 * @param {string} notes - Notas de aprobación (opcional)
 */
export const approveVerification = async (requestId, notes = null) => {
  const response = await api.post(`/kyc/admin/requests/${requestId}/approve`, { notes });
  return response.data;
};

/**
 * Rechaza verificación del doctor
 * @param {number} requestId - ID de la solicitud
 * @param {string} reason - Razón del rechazo
 */
export const rejectVerification = async (requestId, reason) => {
  const response = await api.post(`/kyc/admin/requests/${requestId}/reject`, { reason });
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el nombre legible de un estado de verificación
 */
export const getStatusName = (status) => {
  const names = {
    unverified: 'Sin Verificar',
    pending: 'En Revisión',
    approved: 'Verificado',
    rejected: 'Rechazado',
    documents_incomplete: 'Documentos Incompletos'
  };
  return names[status] || status;
};

/**
 * Obtiene el color del badge para un estado
 */
export const getStatusColor = (status) => {
  const colors = {
    unverified: 'gray',
    pending: 'yellow',
    approved: 'green',
    rejected: 'red',
    documents_incomplete: 'orange'
  };
  return colors[status] || 'gray';
};

/**
 * Obtiene el nombre legible de un estado de documento
 */
export const getDocumentStatusName = (status) => {
  const names = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    expired: 'Expirado'
  };
  return names[status] || status;
};

/**
 * Obtiene el nombre legible de un estado de solicitud
 */
export const getRequestStatusName = (status) => {
  const names = {
    submitted: 'Enviada',
    in_review: 'En Revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    on_hold: 'En Espera'
  };
  return names[status] || status;
};

/**
 * Valida un archivo antes de subirlo
 */
export const validateFile = (file, maxSizeMB = 10) => {
  const errors = [];
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxSize = maxSizeMB * 1024 * 1024;

  if (!file) {
    errors.push('No se seleccionó ningún archivo');
    return { valid: false, errors };
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('Tipo de archivo no permitido. Use JPG, PNG, WebP o PDF');
  }

  if (file.size > maxSize) {
    errors.push(`El archivo excede el tamaño máximo de ${maxSizeMB}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Formatea el tamaño de archivo
 */
export const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Exportar todo como objeto para importación con destructuring
export default {
  // Para doctores
  getVerificationStatus,
  getDocumentTypes,
  uploadDocument,
  deleteDocument,
  submitVerification,

  // Para admins
  getVerificationQueue,
  getVerificationStats,
  getRequestDetails,
  assignRequest,
  updateRequestPriority,
  holdRequest,
  approveDocument,
  rejectDocument,
  approveVerification,
  rejectVerification,

  // Utilidades
  getStatusName,
  getStatusColor,
  getDocumentStatusName,
  getRequestStatusName,
  validateFile,
  formatFileSize
};
