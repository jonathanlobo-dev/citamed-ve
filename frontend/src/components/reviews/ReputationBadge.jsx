/**
 * ReputationBadge Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Badge visual del nivel de reputación
 */

import React from 'react';
import { Award, Shield, Star, Crown, Gem } from 'lucide-react';
import reviewsService from '../../services/reviewsService';

/**
 * Configuración de niveles
 */
const LEVEL_CONFIG = {
  new: {
    icon: Star,
    label: 'Nuevo',
    description: 'Médico recién registrado',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-500',
    gradientFrom: 'from-gray-200',
    gradientTo: 'to-gray-100'
  },
  bronze: {
    icon: Shield,
    label: 'Bronce',
    description: '10+ citas completadas',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-400',
    iconColor: 'text-amber-600',
    gradientFrom: 'from-amber-200',
    gradientTo: 'to-amber-100'
  },
  silver: {
    icon: Award,
    label: 'Plata',
    description: '50+ citas, 4.0+ rating',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-400',
    iconColor: 'text-slate-500',
    gradientFrom: 'from-slate-200',
    gradientTo: 'to-slate-100'
  },
  gold: {
    icon: Crown,
    label: 'Oro',
    description: '200+ citas, 4.5+ rating',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-400',
    iconColor: 'text-yellow-600',
    gradientFrom: 'from-yellow-200',
    gradientTo: 'to-yellow-100'
  },
  platinum: {
    icon: Gem,
    label: 'Platino',
    description: '500+ citas, 4.8+ rating',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-400',
    iconColor: 'text-purple-600',
    gradientFrom: 'from-purple-200',
    gradientTo: 'to-purple-100'
  }
};

/**
 * Badge de nivel de reputación
 * @param {Object} props
 * @param {string} props.level - Nivel: 'new', 'bronze', 'silver', 'gold', 'platinum'
 * @param {string} props.size - Tamaño: 'xs', 'sm', 'md', 'lg'
 * @param {boolean} props.showLabel - Mostrar etiqueta del nivel
 * @param {boolean} props.showDescription - Mostrar descripción
 * @param {boolean} props.withBorder - Mostrar borde
 * @param {boolean} props.animated - Animación de brillo
 */
const ReputationBadge = ({
  level = 'new',
  size = 'md',
  showLabel = true,
  showDescription = false,
  withBorder = true,
  animated = false,
  className = ''
}) => {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.new;
  const Icon = config.icon;

  // Tamaños
  const sizeConfig = {
    xs: {
      container: 'px-1.5 py-0.5',
      icon: 'w-3 h-3',
      text: 'text-xs',
      gap: 'gap-1'
    },
    sm: {
      container: 'px-2 py-1',
      icon: 'w-4 h-4',
      text: 'text-sm',
      gap: 'gap-1.5'
    },
    md: {
      container: 'px-3 py-1.5',
      icon: 'w-5 h-5',
      text: 'text-sm',
      gap: 'gap-2'
    },
    lg: {
      container: 'px-4 py-2',
      icon: 'w-6 h-6',
      text: 'text-base',
      gap: 'gap-2'
    }
  };

  const sizeStyles = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div
        className={`
          inline-flex items-center ${sizeStyles.gap}
          ${sizeStyles.container}
          ${config.bgColor}
          ${config.textColor}
          ${withBorder ? `border ${config.borderColor}` : ''}
          rounded-full
          font-medium
          ${animated ? 'animate-pulse' : ''}
          transition-all duration-200
          hover:shadow-sm
        `}
      >
        <Icon className={`${sizeStyles.icon} ${config.iconColor}`} />

        {showLabel && (
          <span className={sizeStyles.text}>
            {config.label}
          </span>
        )}
      </div>

      {showDescription && (
        <span className="text-xs text-gray-500 mt-1 text-center">
          {config.description}
        </span>
      )}
    </div>
  );
};

/**
 * Badge grande con más detalles
 */
export const ReputationBadgeLarge = ({
  level = 'new',
  rating = 0,
  totalReviews = 0,
  totalAppointments = 0,
  className = ''
}) => {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.new;
  const Icon = config.icon;

  return (
    <div
      className={`
        bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo}
        rounded-xl p-4 border ${config.borderColor}
        ${className}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>
        <div>
          <h4 className={`font-bold text-lg ${config.textColor}`}>
            Nivel {config.label}
          </h4>
          <p className="text-sm text-gray-600">{config.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/60 rounded-lg p-2">
          <div className="font-bold text-lg text-gray-800">
            {rating.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">Rating</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="font-bold text-lg text-gray-800">
            {totalReviews}
          </div>
          <div className="text-xs text-gray-500">Reseñas</div>
        </div>
        <div className="bg-white/60 rounded-lg p-2">
          <div className="font-bold text-lg text-gray-800">
            {totalAppointments}
          </div>
          <div className="text-xs text-gray-500">Citas</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Lista de todos los niveles con progreso
 */
export const ReputationLevelsProgress = ({
  currentLevel = 'new',
  className = ''
}) => {
  const levels = ['new', 'bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = levels.indexOf(currentLevel);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {levels.map((level, index) => {
        const config = LEVEL_CONFIG[level];
        const Icon = config.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <React.Fragment key={level}>
            {/* Línea conectora */}
            {index > 0 && (
              <div
                className={`
                  flex-1 h-1 mx-1
                  ${index <= currentIndex ? 'bg-teal-500' : 'bg-gray-200'}
                `}
              />
            )}

            {/* Icono del nivel */}
            <div
              className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-full
                ${isCurrent ? `${config.bgColor} ring-2 ring-offset-2 ring-teal-500` : ''}
                ${isCompleted ? config.bgColor : 'bg-gray-100'}
                transition-all duration-300
              `}
              title={`${config.label}: ${config.description}`}
            >
              <Icon
                className={`
                  w-5 h-5
                  ${isCompleted ? config.iconColor : 'text-gray-400'}
                `}
              />

              {isCurrent && (
                <div className="absolute -bottom-6 whitespace-nowrap">
                  <span className={`text-xs font-medium ${config.textColor}`}>
                    {config.label}
                  </span>
                </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ReputationBadge;
