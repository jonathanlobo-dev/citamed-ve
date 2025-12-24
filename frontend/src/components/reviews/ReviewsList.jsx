/**
 * ReviewsList Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Lista de reviews con filtros y paginación
 */

import React from 'react';
import {
  Star,
  Filter,
  SortDesc,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import ReviewCard from './ReviewCard';
import { RatingSummary } from './RatingBreakdown';

/**
 * Lista de reviews con filtros
 * @param {Object} props
 * @param {Array} props.reviews - Lista de reviews
 * @param {Object} props.stats - Estadísticas de reviews
 * @param {Object} props.pagination - Datos de paginación
 * @param {Object} props.filters - Filtros actuales
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.error - Mensaje de error
 * @param {function} props.onFilterChange - Callback al cambiar filtros
 * @param {function} props.onPageChange - Callback al cambiar página
 * @param {function} props.onVote - Callback al votar
 * @param {function} props.onReply - Callback al responder (médico)
 * @param {function} props.onEdit - Callback al editar
 * @param {function} props.onDelete - Callback al eliminar
 * @param {function} props.onFlag - Callback al reportar
 * @param {boolean} props.canVote - Si el usuario puede votar
 * @param {boolean} props.isDoctor - Si es vista de médico
 * @param {boolean} props.showStats - Mostrar resumen de estadísticas
 */
const ReviewsList = ({
  reviews = [],
  stats = null,
  pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  filters = { rating: null, sortBy: 'recent', hasComment: false },
  loading = false,
  error = null,
  onFilterChange,
  onPageChange,
  onVote,
  onReply,
  onEdit,
  onDelete,
  onFlag,
  canVote = true,
  isDoctor = false,
  showStats = true,
  className = ''
}) => {

  /**
   * Opciones de ordenamiento
   */
  const sortOptions = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'rating_high', label: 'Mayor calificación' },
    { value: 'rating_low', label: 'Menor calificación' },
    { value: 'helpful', label: 'Más útiles' }
  ];

  /**
   * Maneja cambio de filtro de rating
   */
  const handleRatingFilter = (rating) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        rating: filters.rating === rating ? null : rating
      });
    }
  };

  /**
   * Maneja cambio de ordenamiento
   */
  const handleSortChange = (sortBy) => {
    if (onFilterChange) {
      onFilterChange({ ...filters, sortBy });
    }
  };

  /**
   * Maneja toggle de "solo con comentarios"
   */
  const handleCommentToggle = () => {
    if (onFilterChange) {
      onFilterChange({ ...filters, hasComment: !filters.hasComment });
    }
  };

  /**
   * Renderiza los controles de paginación
   */
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;

    const pages = [];
    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;

    // Siempre mostrar primera página
    pages.push(1);

    // Páginas intermedias
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        if (pages[pages.length - 1] !== i - 1) {
          pages.push('...');
        }
        pages.push(i);
      }
    }

    // Siempre mostrar última página
    if (totalPages > 1 && !pages.includes(totalPages)) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => onPageChange && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-gray-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange && onPageChange(page)}
                className={`
                  px-3 py-1 rounded-lg
                  ${currentPage === page
                    ? 'bg-teal-600 text-white'
                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Resumen de estadísticas */}
      {showStats && stats && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <RatingSummary
            average={parseFloat(stats.average) || 0}
            total={stats.total || 0}
            breakdown={stats.breakdown || {}}
            size="md"
          />
        </div>
      )}

      {/* Barra de filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Filtros de rating */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrar:</span>
            <div className="flex gap-1">
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRatingFilter(rating)}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded text-sm
                    ${filters.rating === rating
                      ? 'bg-teal-100 text-teal-700 border border-teal-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                    transition-colors
                  `}
                >
                  {rating}
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Ordenamiento y otros filtros */}
          <div className="flex items-center gap-4">
            {/* Solo con comentarios */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasComment}
                onChange={handleCommentToggle}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Con comentarios
              </span>
            </label>

            {/* Selector de ordenamiento */}
            <div className="flex items-center gap-2">
              <SortDesc className="w-4 h-4 text-gray-500" />
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info de resultados */}
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500">
          Mostrando {reviews.length} de {pagination.total} reseñas
          {filters.rating && ` con ${filters.rating} estrellas`}
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Lista de reviews */}
      {!loading && !error && (
        <>
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showDoctorReply={true}
                  showHelpfulVotes={true}
                  canVote={canVote}
                  canEdit={!isDoctor && review.canEdit}
                  canDelete={!isDoctor && review.canEdit}
                  canReply={isDoctor}
                  canFlag={!isDoctor}
                  onVote={onVote}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                  onFlag={onFlag}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                No hay reseñas
              </h3>
              <p className="text-gray-500">
                {filters.rating
                  ? `No hay reseñas con ${filters.rating} estrellas`
                  : 'Aún no hay reseñas para mostrar'}
              </p>
            </div>
          )}

          {/* Paginación */}
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default ReviewsList;
