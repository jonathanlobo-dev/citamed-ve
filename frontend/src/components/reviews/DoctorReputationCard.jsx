/**
 * DoctorReputationCard Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Resumen de reputación del médico
 */

import React from 'react';
import {
  Star,
  Users,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight
} from 'lucide-react';
import ReputationBadge, { ReputationBadgeLarge } from './ReputationBadge';
import { DimensionBreakdown } from './RatingBreakdown';

/**
 * Tarjeta de resumen de reputación
 * @param {Object} props
 * @param {Object} props.reputation - Datos de reputación
 * @param {Object} props.stats - Estadísticas de reviews
 * @param {boolean} props.compact - Versión compacta
 * @param {boolean} props.showDimensions - Mostrar breakdown por dimensiones
 * @param {function} props.onViewReviews - Callback al ver reviews
 */
const DoctorReputationCard = ({
  reputation = {},
  stats = {},
  compact = false,
  showDimensions = true,
  onViewReviews,
  className = ''
}) => {
  const {
    averageRating = 0,
    totalReviews = 0,
    totalAppointments = 0,
    reputationLevel = 'new',
    ratingBreakdown = {}
  } = reputation;

  const {
    wouldRecommendPercent = 0,
    dimensions = {}
  } = stats;

  /**
   * Renderiza estrellas de rating
   */
  const renderStars = (rating, size = 'w-5 h-5') => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${
            star <= Math.round(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  // Versión compacta
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {renderStars(averageRating, 'w-4 h-4')}
          <span className="font-semibold text-gray-800">
            {parseFloat(averageRating).toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          ({totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'})
        </span>
        <ReputationBadge level={reputationLevel} size="sm" />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header con nivel de reputación */}
      <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Reputación del médico
            </h3>
            <p className="text-sm text-gray-600">
              Basada en {totalReviews} reseñas verificadas
            </p>
          </div>
          <ReputationBadge
            level={reputationLevel}
            size="lg"
            showDescription={true}
          />
        </div>

        {/* Rating principal */}
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-gray-800">
            {parseFloat(averageRating).toFixed(1)}
          </div>
          <div>
            {renderStars(averageRating, 'w-6 h-6')}
            <p className="text-sm text-gray-600 mt-1">
              {wouldRecommendPercent}% lo recomiendan
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 divide-x divide-gray-200 border-b border-gray-200">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs">Reseñas</span>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalReviews}</div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Citas</span>
          </div>
          <div className="text-xl font-bold text-gray-800">{totalAppointments}</div>
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Recomiendan</span>
          </div>
          <div className="text-xl font-bold text-gray-800">{wouldRecommendPercent}%</div>
        </div>
      </div>

      {/* Breakdown por dimensiones */}
      {showDimensions && dimensions && Object.keys(dimensions).length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">
            Calificaciones por categoría
          </h4>
          <DimensionBreakdown dimensions={dimensions} size="sm" />
        </div>
      )}

      {/* Breakdown de estrellas */}
      {ratingBreakdown && Object.keys(ratingBreakdown).length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-700 mb-3">
            Distribución de calificaciones
          </h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = ratingBreakdown[rating] || 0;
              const percentage = totalReviews > 0
                ? Math.round((count / totalReviews) * 100)
                : 0;

              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-8 text-sm text-gray-600 flex items-center gap-1">
                    {rating}
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs text-gray-500">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Botón para ver reviews */}
      {onViewReviews && (
        <button
          onClick={onViewReviews}
          className="w-full p-4 flex items-center justify-between text-teal-600 hover:bg-teal-50 transition-colors"
        >
          <span className="font-medium">Ver todas las reseñas</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/**
 * Mini card de reputación para listados
 */
export const DoctorReputationMini = ({
  averageRating = 0,
  totalReviews = 0,
  reputationLevel = 'new',
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        <span className="font-semibold text-gray-800">
          {parseFloat(averageRating).toFixed(1)}
        </span>
      </div>
      <span className="text-sm text-gray-500">
        ({totalReviews})
      </span>
      {reputationLevel !== 'new' && (
        <ReputationBadge level={reputationLevel} size="xs" showLabel={false} />
      )}
    </div>
  );
};

export default DoctorReputationCard;
