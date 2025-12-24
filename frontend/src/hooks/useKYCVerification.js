/**
 * useKYCVerification Hook - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Hook para gestionar flujo de verificación KYC de doctores:
 * - Subida de documentos
 * - Estado de verificación
 * - Envío de solicitud
 */

import { useState, useCallback, useEffect } from 'react';
import * as kycService from '../services/kycVerificationService';
import toast from 'react-hot-toast';

/**
 * Hook para gestionar verificación KYC de doctores
 * @param {Object} options - Opciones
 * @param {boolean} options.autoLoad - Cargar estado automáticamente al montar
 * @param {Function} options.onStatusChange - Callback cuando cambia el estado
 */
export function useKYCVerification({ autoLoad = true, onStatusChange } = {}) {
  // Estado principal
  const [status, setStatus] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [uploadConfig, setUploadConfig] = useState(null);

  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Errores
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // CARGAR ESTADO DE VERIFICACIÓN
  // ═══════════════════════════════════════════════════════════════

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await kycService.getVerificationStatus();

      if (response.success) {
        setStatus(response.data);
        onStatusChange?.(response.data);
      } else {
        throw new Error(response.error || 'Error cargando estado');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error cargando estado de verificación';
      setError(message);
      console.error('Error loading KYC status:', err);
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  // ═══════════════════════════════════════════════════════════════
  // CARGAR TIPOS DE DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════

  const loadDocumentTypes = useCallback(async () => {
    try {
      const response = await kycService.getDocumentTypes();

      if (response.success) {
        setDocumentTypes(response.data.documentTypes || []);
        setUploadConfig(response.data.uploadConfig || null);
      }
    } catch (err) {
      console.error('Error loading document types:', err);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // SUBIR DOCUMENTO
  // ═══════════════════════════════════════════════════════════════

  const uploadDocument = useCallback(async (file, documentType, expirationDate = null) => {
    // Validar archivo
    const validation = kycService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return { success: false, error: validation.errors[0] };
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const response = await kycService.uploadDocument(
        file,
        documentType,
        expirationDate,
        (progress) => setUploadProgress(progress)
      );

      if (response.success) {
        toast.success('Documento subido exitosamente');
        // Recargar estado para actualizar lista de documentos
        await loadStatus();
        return response;
      } else {
        throw new Error(response.error || 'Error al subir documento');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al subir documento';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [loadStatus]);

  // ═══════════════════════════════════════════════════════════════
  // ELIMINAR DOCUMENTO
  // ═══════════════════════════════════════════════════════════════

  const deleteDocument = useCallback(async (documentId) => {
    try {
      const response = await kycService.deleteDocument(documentId);

      if (response.success) {
        toast.success('Documento eliminado');
        await loadStatus();
        return response;
      } else {
        throw new Error(response.error || 'Error al eliminar documento');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al eliminar documento';
      toast.error(message);
      return { success: false, error: message };
    }
  }, [loadStatus]);

  // ═══════════════════════════════════════════════════════════════
  // ENVIAR SOLICITUD DE VERIFICACIÓN
  // ═══════════════════════════════════════════════════════════════

  const submitVerification = useCallback(async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await kycService.submitVerification();

      if (response.success) {
        toast.success('Solicitud de verificación enviada');
        await loadStatus();
        return response;
      } else {
        throw new Error(response.error || 'Error al enviar solicitud');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error al enviar solicitud';
      setError(message);
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setSubmitting(false);
    }
  }, [loadStatus]);

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  // Cargar datos al montar
  useEffect(() => {
    if (autoLoad) {
      loadStatus();
      loadDocumentTypes();
    }
  }, [autoLoad, loadStatus, loadDocumentTypes]);

  // ═══════════════════════════════════════════════════════════════
  // VALORES DERIVADOS
  // ═══════════════════════════════════════════════════════════════

  const isVerified = status?.isVerified === true;
  const isPending = status?.status === 'pending';
  const isRejected = status?.status === 'rejected';
  const canSubmit = status?.canSubmitVerification === true;
  const documentsComplete = status?.documents?.missing?.length === 0;
  const missingDocuments = status?.documents?.missing || [];
  const uploadedDocuments = status?.documents?.list || [];

  return {
    // Estado
    status,
    documentTypes,
    uploadConfig,

    // Estados de carga
    loading,
    uploading,
    submitting,
    uploadProgress,

    // Error
    error,

    // Valores derivados
    isVerified,
    isPending,
    isRejected,
    canSubmit,
    documentsComplete,
    missingDocuments,
    uploadedDocuments,

    // Funciones
    loadStatus,
    loadDocumentTypes,
    uploadDocument,
    deleteDocument,
    submitVerification,

    // Utilidades del servicio
    getStatusName: kycService.getStatusName,
    getStatusColor: kycService.getStatusColor,
    getDocumentStatusName: kycService.getDocumentStatusName,
    validateFile: kycService.validateFile,
    formatFileSize: kycService.formatFileSize
  };
}

/**
 * Hook para administradores - Cola de verificaciones
 */
export function useVerificationQueue() {
  const [queue, setQueue] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar cola de verificaciones
  const loadQueue = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await kycService.getVerificationQueue({
        page: params.page || 1,
        limit: params.limit || 20,
        status: params.status,
        assignedTo: params.assignedTo,
        sortBy: params.sortBy || 'priority',
        sortOrder: params.sortOrder || 'DESC'
      });

      if (response.success) {
        setQueue(response.data.requests || []);
        setPagination(response.data.pagination || {});
      } else {
        throw new Error(response.error || 'Error cargando cola');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Error cargando cola';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const response = await kycService.getVerificationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  // Asignar solicitud
  const assignRequest = useCallback(async (requestId, adminId = null) => {
    try {
      const response = await kycService.assignRequest(requestId, adminId);
      if (response.success) {
        toast.success('Solicitud asignada');
        await loadQueue();
        return response;
      }
      throw new Error(response.error);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al asignar');
      return { success: false };
    }
  }, [loadQueue]);

  // Aprobar documento
  const approveDocument = useCallback(async (documentId, notes = null) => {
    try {
      const response = await kycService.approveDocument(documentId, notes);
      if (response.success) {
        toast.success('Documento aprobado');
        return response;
      }
      throw new Error(response.error);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aprobar');
      return { success: false };
    }
  }, []);

  // Rechazar documento
  const rejectDocument = useCallback(async (documentId, reason) => {
    try {
      const response = await kycService.rejectDocument(documentId, reason);
      if (response.success) {
        toast.success('Documento rechazado');
        return response;
      }
      throw new Error(response.error);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al rechazar');
      return { success: false };
    }
  }, []);

  // Aprobar verificación
  const approveVerification = useCallback(async (requestId, notes = null) => {
    try {
      const response = await kycService.approveVerification(requestId, notes);
      if (response.success) {
        toast.success('Doctor verificado exitosamente');
        await loadQueue();
        await loadStats();
        return response;
      }
      throw new Error(response.error);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aprobar');
      return { success: false };
    }
  }, [loadQueue, loadStats]);

  // Rechazar verificación
  const rejectVerification = useCallback(async (requestId, reason) => {
    try {
      const response = await kycService.rejectVerification(requestId, reason);
      if (response.success) {
        toast.success('Verificación rechazada');
        await loadQueue();
        await loadStats();
        return response;
      }
      throw new Error(response.error);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al rechazar');
      return { success: false };
    }
  }, [loadQueue, loadStats]);

  // Cargar al montar
  useEffect(() => {
    loadQueue();
    loadStats();
  }, [loadQueue, loadStats]);

  return {
    queue,
    pagination,
    stats,
    loading,
    error,

    // Funciones
    loadQueue,
    loadStats,
    assignRequest,
    approveDocument,
    rejectDocument,
    approveVerification,
    rejectVerification,

    // Obtener detalles
    getRequestDetails: kycService.getRequestDetails
  };
}

export default useKYCVerification;
