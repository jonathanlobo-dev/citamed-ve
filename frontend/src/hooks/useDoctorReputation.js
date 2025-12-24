/**
 * useDoctorReputation Hook - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Hook para gestión de reputación de médicos
 */

import { useState, useCallback, useEffect } from 'react';
import reviewsService from '../services/reviewsService';
import toast from 'react-hot-toast';

/**
 * Hook para gestión de reputación de médicos
 * @param {Object} options - Opciones de configuración
 * @param {number} options.doctorProfileId - ID del doctor (para info pública)
 * @param {boolean} options.autoFetch - Cargar automáticamente
 * @param {boolean} options.isDoctor - Si el usuario actual es médico
 */
const useDoctorReputation = (options = {}) => {
  const { doctorProfileId = null, autoFetch = false, isDoctor = false } = options;

  // ═══════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════

  // Reputación
  const [reputation, setReputation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Reviews recibidos (para médico)
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Progreso (insights)
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Operaciones
  const [submitting, setSubmitting] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA - PÚBLICAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene reputación pública de un doctor
   */
  const fetchPublicReputation = useCallback(async (docId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getPublicReputation(docId);
      if (response.success) {
        setReputation(response.data);
      } else {
        setError(response.message || 'Error al cargar reputación');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene estadísticas públicas de un doctor
   */
  const fetchPublicStats = useCallback(async (docId) => {
    setLoadingStats(true);

    try {
      const response = await reviewsService.getPublicStats(docId);
      if (response.success) {
        setStats(response.data);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA - MÉDICO AUTENTICADO
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene reviews recibidos por el médico
   */
  const fetchMyReviews = useCallback(async (filters = {}, pagination = {}) => {
    setLoadingReviews(true);

    try {
      const response = await reviewsService.getDoctorReviews(filters, pagination);
      if (response.success) {
        setReviews(response.data.reviews || []);
        setReviewsPagination(response.data.pagination || reviewsPagination);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingReviews(false);
    }
  }, [reviewsPagination]);

  /**
   * Obtiene estadísticas del médico autenticado
   */
  const fetchMyStats = useCallback(async () => {
    setLoadingStats(true);

    try {
      const response = await reviewsService.getDoctorStats();
      if (response.success) {
        setStats(response.data);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Obtiene progreso de reputación del médico
   */
  const fetchReputationProgress = useCallback(async () => {
    setLoadingProgress(true);

    try {
      const response = await reviewsService.getReputationProgress();
      if (response.success) {
        setProgress(response.data);
        // También actualiza reputation con los datos básicos
        if (response.data.currentLevel) {
          setReputation(prev => ({
            ...prev,
            reputationLevel: response.data.currentLevel.name,
            badge: response.data.currentLevel
          }));
        }
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingProgress(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE ACCIÓN - MÉDICO
  // ═══════════════════════════════════════════════════════════════

  /**
   * Responde a un review
   */
  const replyToReview = useCallback(async (reviewId, reply) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.replyToReview(reviewId, reply);
      if (response.success) {
        toast.success('Respuesta publicada');
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, doctorReply: reply, doctorRepliedAt: new Date().toISOString() }
              : r
          )
        );
      } else {
        toast.error(response.message || 'Error al publicar respuesta');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al publicar respuesta';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE ADMIN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Recalcula ratings de un doctor
   */
  const recalculateRatings = useCallback(async (docId) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.recalculateRatings(docId);
      if (response.success) {
        toast.success('Ratings recalculados exitosamente');
        // Recargar datos
        await fetchPublicReputation(docId);
        await fetchPublicStats(docId);
      } else {
        toast.error(response.message || 'Error al recalcular');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al recalcular';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [fetchPublicReputation, fetchPublicStats]);

  // ═══════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcula el progreso hacia el siguiente nivel
   */
  const calculateProgress = useCallback(() => {
    if (!progress || !progress.nextLevel) {
      return { percentage: 100, remaining: null };
    }

    const { appointmentsProgress, ratingProgress } = progress;

    // El progreso es el mínimo entre ambos requisitos
    const appointmentsPct = appointmentsProgress?.percentage || 0;
    const ratingPct = ratingProgress?.percentage || 0;

    return {
      percentage: Math.min(appointmentsPct, ratingPct),
      appointments: {
        current: appointmentsProgress?.current || 0,
        required: appointmentsProgress?.required || 0,
        percentage: appointmentsPct
      },
      rating: {
        current: ratingProgress?.current || 0,
        required: ratingProgress?.required || 0,
        percentage: ratingPct
      }
    };
  }, [progress]);

  /**
   * Obtiene el siguiente nivel
   */
  const getNextLevel = useCallback(() => {
    if (!progress || !progress.nextLevel) {
      return null;
    }
    return progress.nextLevel;
  }, [progress]);

  /**
   * Verifica si puede subir de nivel
   */
  const canLevelUp = useCallback(() => {
    if (!progress) return false;
    return progress.canLevelUp === true;
  }, [progress]);

  /**
   * Refresca todos los datos
   */
  const refreshAll = useCallback(async () => {
    if (isDoctor) {
      await Promise.all([
        fetchMyStats(),
        fetchReputationProgress(),
        fetchMyReviews()
      ]);
    } else if (doctorProfileId) {
      await Promise.all([
        fetchPublicReputation(doctorProfileId),
        fetchPublicStats(doctorProfileId)
      ]);
    }
  }, [isDoctor, doctorProfileId, fetchMyStats, fetchReputationProgress, fetchMyReviews, fetchPublicReputation, fetchPublicStats]);

  /**
   * Limpia el estado
   */
  const reset = useCallback(() => {
    setReputation(null);
    setStats(null);
    setReviews([]);
    setProgress(null);
    setError(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene el color del nivel actual
   */
  const levelColor = reputation?.reputationLevel
    ? reviewsService.getReputationColor(reputation.reputationLevel)
    : '#9CA3AF';

  /**
   * Obtiene el nombre formateado del nivel
   */
  const levelName = reputation?.reputationLevel
    ? reviewsService.formatReputationLevel(reputation.reputationLevel)
    : 'Nuevo';

  /**
   * Obtiene clases de estilo para el badge
   */
  const badgeClasses = reputation?.reputationLevel
    ? {
        bg: reviewsService.getReputationBgColor(reputation.reputationLevel),
        text: reviewsService.getReputationTextColor(reputation.reputationLevel)
      }
    : { bg: 'bg-gray-100', text: 'text-gray-700' };

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoFetch) {
      if (isDoctor) {
        fetchMyStats();
        fetchReputationProgress();
        fetchMyReviews();
      } else if (doctorProfileId) {
        fetchPublicReputation(doctorProfileId);
        fetchPublicStats(doctorProfileId);
      }
    }
  }, [autoFetch, isDoctor, doctorProfileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // Estado básico
    reputation,
    loading,
    error,
    submitting,

    // Estadísticas
    stats,
    loadingStats,

    // Reviews (para médico)
    reviews,
    loadingReviews,
    reviewsPagination,

    // Progreso
    progress,
    loadingProgress,

    // Computed
    levelColor,
    levelName,
    badgeClasses,

    // Carga pública
    fetchPublicReputation,
    fetchPublicStats,

    // Carga para médico
    fetchMyReviews,
    fetchMyStats,
    fetchReputationProgress,

    // Acciones
    replyToReview,
    recalculateRatings,

    // Utilidades
    calculateProgress,
    getNextLevel,
    canLevelUp,
    refreshAll,
    reset
  };
};

export default useDoctorReputation;
