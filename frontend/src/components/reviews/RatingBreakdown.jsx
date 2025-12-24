/**
 * RatingBreakdown Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Barra de distribución de calificaciones
 */

import React from 'react';
import { Star } from 'lucide-react';

/**
 * Barra de distribución de calificaciones
 * @param {Object} props
 * @param {Object} props.breakdown - Objeto con conteo por rating {5: 100, 4: 50, ...}
 * @param {number} props.total - Total de reviews
 * @param {string} props.size - Tamaño: 'sm', 'md', 'lg'
 * @param {boolean} props.showPercentages - Mostrar porcentajes
 * @param {boolean} props.showCounts - Mostrar conteos
 * @param {boolean} props.interactive - Si es clickeable para filtrar
 * @param {function} props.onRatingClick - Callback al clickear un rating
 * @param {number} props.selectedRating - Rating actualmente seleccionado
 */
const RatingBreakdown = ({
  breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  total = 0,
  size = 'md',
  showPercentages = true,
  showCounts = false,
  interactive = false,
  onRatingClick,
  selectedRating = null,
  className = ''
}) => {
  // Configuración de tamaños
  const sizeConfig = {
    sm: {
      barHeight: 'h-2',
      text: 'text-xs',
      starSize: 'w-3 h-3',
      gap: 'gap-1',
      rowGap: 'gap-1'
    },
    md: {
      barHeight: 'h-3',
      text: 'text-sm',
      starSize: 'w-4 h-4',
      gap: 'gap-2',
      rowGap: 'gap-2'
    },
    lg: {
      barHeight: 'h-4',
      text: 'text-base',
      starSize: 'w-5 h-5',
      gap: 'gap-3',
      rowGap: 'gap-3'
    }
  };

  const sizeStyles = sizeConfig[size] || sizeConfig.md;

  /**
   * Calcula porcentaje para un rating
   */
  const getPercentage = (rating) => {
    if (total === 0) return 0;
    return Math.round((breakdown[rating] || 0) / total * 100);
  };

  /**
   * Obtiene el color de la barra según el rating
   */
  const getBarColor = (rating) => {
    const colors = {
      5: 'bg-green-500',
      4: 'bg-lime-500',
      3: 'bg-yellow-500',
      2: 'bg-orange-500',
      1: 'bg-red-500'
    };
    return colors[rating] || 'bg-gray-400';
  };

  /**
   * Maneja click en un rating
   */
  const handleClick = (rating) => {
    if (interactive && onRatingClick) {
      // Si ya está seleccionado, deseleccionar
      onRatingClick(selectedRating === rating ? null : rating);
    }
  };

  return (
    <div className={`flex flex-col ${sizeStyles.rowGap} ${className}`}>
      {[5, 4, 3, 2, 1].map(rating => {
        const percentage = getPercentage(rating);
        const count = breakdown[rating] || 0;
        const isSelected = selectedRating === rating;

        return (
          <div
            key={rating}
            className={`
              flex items-center ${sizeStyles.gap}
              ${interactive ? 'cursor-pointer hover:opacity-80' : ''}
              ${isSelected ? 'opacity-100' : selectedRating !== null ? 'opacity-50' : ''}
              transition-opacity duration-200
            `}
            onClick={() => handleClick(rating)}
          >
            {/* Número y estrella */}
            <div className={`flex items-center ${sizeStyles.gap} min-w-[40px]`}>
              <span className={`${sizeStyles.text} font-medium text-gray-700`}>
                {rating}
              </span>
              <Star
                className={`${sizeStyles.starSize} text-yellow-400 fill-yellow-400`}
              />
            </div>

            {/* Barra de progreso */}
            <div className={`flex-1 bg-gray-200 rounded-full ${sizeStyles.barHeight} overflow-hidden`}>
              <div
                className={`
                  ${sizeStyles.barHeight} ${getBarColor(rating)}
                  rounded-full transition-all duration-500
                `}
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Porcentaje o conteo */}
            <div className={`min-w-[50px] text-right ${sizeStyles.text} text-gray-600`}>
              {showPercentages && `${percentage}%`}
              {showCounts && ` (${count})`}
              {!showPercentages && showCounts && `${count}`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Resumen compacto de rating
 */
export const RatingSummary = ({
  average = 0,
  total = 0,
  breakdown = {},
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex items-start gap-6 ${className}`}>
      {/* Rating promedio grande */}
      <div className="text-center">
        <div className="text-5xl font-bold text-gray-800">
          {average.toFixed(1)}
        </div>
        <div className="flex justify-center mt-1">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={`w-5 h-5 ${
                star <= Math.round(average)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {total} {total === 1 ? 'reseña' : 'reseñas'}
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1">
        <RatingBreakdown
          breakdown={breakdown}
          total={total}
          size={size}
          showPercentages={true}
        />
      </div>
    </div>
  );
};

/**
 * Breakdown de dimensiones específicas
 */
export const DimensionBreakdown = ({
  dimensions = {},
  size = 'md',
  className = ''
}) => {
  const dimensionLabels = {
    punctuality: 'Puntualidad',
    treatment: 'Trato',
    clarity: 'Claridad',
    facilities: 'Instalaciones'
  };

  const sizeConfig = {
    sm: { barHeight: 'h-2', text: 'text-xs' },
    md: { barHeight: 'h-3', text: 'text-sm' },
    lg: { barHeight: 'h-4', text: 'text-base' }
  };

  const sizeStyles = sizeConfig[size] || sizeConfig.md;

  /**
   * Obtiene el color según el valor
   */
  const getColor = (value) => {
    if (value >= 4.5) return 'bg-green-500';
    if (value >= 4.0) return 'bg-lime-500';
    if (value >= 3.5) return 'bg-yellow-500';
    if (value >= 3.0) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {Object.entries(dimensionLabels).map(([key, label]) => {
        const value = parseFloat(dimensions[key]) || 0;
        const percentage = (value / 5) * 100;

        return (
          <div key={key} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className={`${sizeStyles.text} text-gray-700`}>
                {label}
              </span>
              <span className={`${sizeStyles.text} font-medium text-gray-800`}>
                {value.toFixed(1)}
              </span>
            </div>
            <div className={`bg-gray-200 rounded-full ${sizeStyles.barHeight} overflow-hidden`}>
              <div
                className={`${sizeStyles.barHeight} ${getColor(value)} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RatingBreakdown;
