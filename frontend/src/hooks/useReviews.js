/**
 * useReviews Hook - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Hook para gestión de reviews
 */

import { useState, useCallback, useEffect } from 'react';
import reviewsService from '../services/reviewsService';
import toast from 'react-hot-toast';

/**
 * Hook para gestión de reviews
 * @param {Object} options - Opciones de configuración
 * @param {number} options.doctorProfileId - ID del doctor (para reviews públicos)
 * @param {boolean} options.autoFetch - Cargar automáticamente
 */
const useReviews = (options = {}) => {
  const { doctorProfileId = null, autoFetch = false } = options;

  // ═══════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Paginación
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  // Estadísticas
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Filtros actuales
  const [filters, setFilters] = useState({
    rating: null,
    sortBy: 'recent',
    hasComment: false
  });

  // Operaciones
  const [submitting, setSubmitting] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene reviews públicos de un doctor
   */
  const fetchPublicReviews = useCallback(async (docId, newFilters = {}, newPagination = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...newFilters };
      const mergedPagination = { ...pagination, ...newPagination };

      const response = await reviewsService.getPublicReviews(
        docId,
        mergedFilters,
        { page: mergedPagination.page, limit: mergedPagination.limit }
      );

      if (response.success) {
        setReviews(response.data.reviews || []);
        setPagination(response.data.pagination || pagination);
        setFilters(mergedFilters);
      } else {
        setError(response.message || 'Error al cargar reviews');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

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

  /**
   * Obtiene mis reviews como paciente
   */
  const fetchMyReviews = useCallback(async (paginationOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await reviewsService.getMyReviews(paginationOptions);
      if (response.success) {
        setReviews(response.data.reviews || []);
        setPagination(response.data.pagination || pagination);
      } else {
        setError(response.message || 'Error al cargar tus reseñas');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [pagination]);

  /**
   * Verifica si puede dejar review para una cita
   */
  const checkCanReview = useCallback(async (appointmentId) => {
    try {
      const response = await reviewsService.canLeaveReview(appointmentId);
      return response;
    } catch (err) {
      return { success: false, data: { canReview: false, reason: err.message } };
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CREACIÓN/EDICIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crea un nuevo review
   */
  const createReview = useCallback(async (reviewData) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.createReview(reviewData);
      if (response.success) {
        toast.success('¡Reseña publicada exitosamente!');
        // Agregar al principio de la lista si estamos viendo reviews de este doctor
        if (doctorProfileId) {
          setReviews(prev => [response.data, ...prev]);
        }
      } else {
        toast.error(response.message || 'Error al publicar reseña');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al publicar reseña';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [doctorProfileId]);

  /**
   * Actualiza un review propio
   */
  const updateReview = useCallback(async (reviewId, updates) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.updateReview(reviewId, updates);
      if (response.success) {
        toast.success('Reseña actualizada exitosamente');
        setReviews(prev =>
          prev.map(r => r.id === reviewId ? { ...r, ...response.data } : r)
        );
      } else {
        toast.error(response.message || 'Error al actualizar reseña');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar reseña';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, []);

  /**
   * Elimina un review propio
   */
  const deleteReview = useCallback(async (reviewId) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.deleteReview(reviewId);
      if (response.success) {
        toast.success('Reseña eliminada');
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        toast.error(response.message || 'Error al eliminar reseña');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar reseña';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE INTERACCIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Vota si un review fue útil
   */
  const voteHelpful = useCallback(async (reviewId, isHelpful) => {
    try {
      const response = await reviewsService.voteHelpful(reviewId, isHelpful);
      if (response.success) {
        // Actualizar el estado del review localmente
        setReviews(prev =>
          prev.map(r => {
            if (r.id === reviewId) {
              return {
                ...r,
                userVote: { hasVoted: true, isHelpful },
                helpfulVotes: {
                  helpful: isHelpful ? (r.helpfulVotes?.helpful || 0) + 1 : r.helpfulVotes?.helpful || 0,
                  notHelpful: !isHelpful ? (r.helpfulVotes?.notHelpful || 0) + 1 : r.helpfulVotes?.notHelpful || 0
                }
              };
            }
            return r;
          })
        );
        toast.success(isHelpful ? '¡Gracias por tu voto!' : 'Voto registrado');
      }
      return response;
    } catch (err) {
      toast.error('Error al registrar voto');
      return { success: false, message: err.message };
    }
  }, []);

  /**
   * Elimina voto de un review
   */
  const removeVote = useCallback(async (reviewId) => {
    try {
      const response = await reviewsService.removeVote(reviewId);
      if (response.success) {
        setReviews(prev =>
          prev.map(r => {
            if (r.id === reviewId) {
              return {
                ...r,
                userVote: { hasVoted: false }
              };
            }
            return r;
          })
        );
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  /**
   * Reporta un review
   */
  const flagReview = useCallback(async (reviewId, reason) => {
    setSubmitting(true);

    try {
      const response = await reviewsService.flagReview(reviewId, reason);
      if (response.success) {
        toast.success('Reseña reportada. Será revisada por nuestro equipo.');
      } else {
        toast.error(response.message || 'Error al reportar reseña');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al reportar reseña';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FILTROS Y PAGINACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Cambia los filtros y recarga
   */
  const applyFilters = useCallback(async (newFilters) => {
    if (doctorProfileId) {
      return fetchPublicReviews(doctorProfileId, newFilters, { page: 1 });
    }
    return fetchMyReviews({ page: 1 });
  }, [doctorProfileId, fetchPublicReviews, fetchMyReviews]);

  /**
   * Cambia de página
   */
  const goToPage = useCallback(async (page) => {
    if (doctorProfileId) {
      return fetchPublicReviews(doctorProfileId, filters, { page });
    }
    return fetchMyReviews({ page });
  }, [doctorProfileId, filters, fetchPublicReviews, fetchMyReviews]);

  /**
   * Resetea filtros
   */
  const resetFilters = useCallback(() => {
    setFilters({
      rating: null,
      sortBy: 'recent',
      hasComment: false
    });
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Refresca la lista actual
   */
  const refresh = useCallback(async () => {
    if (doctorProfileId) {
      await Promise.all([
        fetchPublicReviews(doctorProfileId, filters, { page: pagination.page }),
        fetchPublicStats(doctorProfileId)
      ]);
    } else {
      await fetchMyReviews({ page: pagination.page });
    }
  }, [doctorProfileId, filters, pagination.page, fetchPublicReviews, fetchPublicStats, fetchMyReviews]);

  /**
   * Limpia el estado
   */
  const reset = useCallback(() => {
    setReviews([]);
    setStats(null);
    setPagination({ total: 0, page: 1, limit: 10, totalPages: 0 });
    setFilters({ rating: null, sortBy: 'recent', hasComment: false });
    setError(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoFetch && doctorProfileId) {
      fetchPublicReviews(doctorProfileId);
      fetchPublicStats(doctorProfileId);
    }
  }, [autoFetch, doctorProfileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // Estado
    reviews,
    loading,
    error,
    submitting,

    // Estadísticas
    stats,
    loadingStats,

    // Paginación
    pagination,

    // Filtros
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    goToPage,

    // Carga
    fetchPublicReviews,
    fetchPublicStats,
    fetchMyReviews,
    checkCanReview,

    // CRUD
    createReview,
    updateReview,
    deleteReview,

    // Interacciones
    voteHelpful,
    removeVote,
    flagReview,

    // Utilidades
    refresh,
    reset
  };
};

export default useReviews;
