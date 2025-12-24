/**
 * StarRating Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Componente de 5 estrellas interactivo
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Componente de calificación con estrellas
 * @param {Object} props
 * @param {number} props.value - Valor actual (1-5)
 * @param {function} props.onChange - Callback al cambiar valor
 * @param {boolean} props.readonly - Si es solo lectura
 * @param {string} props.size - Tamaño: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} props.showValue - Mostrar valor numérico
 * @param {string} props.label - Etiqueta opcional
 * @param {boolean} props.allowHalf - Permitir medias estrellas (solo readonly)
 */
const StarRating = ({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  label = '',
  allowHalf = false,
  className = ''
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  // Tamaños de estrellas
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const starSize = sizes[size] || sizes.md;
  const textSize = textSizes[size] || textSizes.md;

  /**
   * Maneja click en estrella
   */
  const handleClick = (starValue) => {
    if (!readonly && onChange) {
      onChange(starValue);
    }
  };

  /**
   * Maneja hover en estrella
   */
  const handleMouseEnter = (starValue) => {
    if (!readonly) {
      setHoverValue(starValue);
    }
  };

  /**
   * Maneja salida del hover
   */
  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  /**
   * Obtiene el estado de llenado de una estrella
   */
  const getStarFill = (starIndex) => {
    const displayValue = hoverValue || value;

    if (displayValue >= starIndex) {
      return 'full';
    }

    if (allowHalf && displayValue >= starIndex - 0.5) {
      return 'half';
    }

    return 'empty';
  };

  /**
   * Renderiza una estrella individual
   */
  const renderStar = (starIndex) => {
    const fill = getStarFill(starIndex);

    const starClasses = `
      ${starSize}
      transition-all duration-150
      ${!readonly ? 'cursor-pointer hover:scale-110' : ''}
      ${fill === 'full' ? 'text-yellow-400 fill-yellow-400' : ''}
      ${fill === 'half' ? 'text-yellow-400' : ''}
      ${fill === 'empty' ? 'text-gray-300' : ''}
    `;

    if (fill === 'half') {
      // Estrella medio llena
      return (
        <div key={starIndex} className="relative">
          <Star className={`${starSize} text-gray-300`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${starSize} text-yellow-400 fill-yellow-400`} />
          </div>
        </div>
      );
    }

    return (
      <Star
        key={starIndex}
        className={starClasses}
        onClick={() => handleClick(starIndex)}
        onMouseEnter={() => handleMouseEnter(starIndex)}
      />
    );
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className={`${textSize} text-gray-600 font-medium`}>{label}</span>
      )}

      <div
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map(starIndex => renderStar(starIndex))}

        {showValue && (
          <span className={`ml-2 ${textSize} font-semibold text-gray-700`}>
            {value.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating;
