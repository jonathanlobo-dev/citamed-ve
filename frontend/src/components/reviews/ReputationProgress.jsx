/**
 * ReputationProgress Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Progreso hacia el siguiente nivel de reputación
 */

import React from 'react';
import {
  Star,
  Calendar,
  TrendingUp,
  Award,
  ChevronRight,
  CheckCircle,
  Target
} from 'lucide-react';
import ReputationBadge, { ReputationLevelsProgress } from './ReputationBadge';
import reviewsService from '../../services/reviewsService';

/**
 * CONFIGURACIÓN DE NIVELES
 */
const LEVEL_REQUIREMENTS = {
  new: { appointments: 0, rating: 0 },
  bronze: { appointments: 10, rating: 0 },
  silver: { appointments: 50, rating: 4.0 },
  gold: { appointments: 200, rating: 4.5 },
  platinum: { appointments: 500, rating: 4.8 }
};

const LEVEL_BENEFITS = {
  bronze: [
    'Badge de Bronce visible en perfil',
    'Prioridad básica en búsquedas'
  ],
  silver: [
    'Badge de Plata visible en perfil',
    'Mayor visibilidad en búsquedas',
    'Estadísticas detalladas de reseñas'
  ],
  gold: [
    'Badge de Oro destacado',
    'Alta prioridad en búsquedas',
    'Descuentos en suscripción premium',
    'Acceso a reportes de pacientes'
  ],
  platinum: [
    'Badge de Platino exclusivo',
    'Máxima prioridad en búsquedas',
    'Suscripción premium gratuita',
    'Soporte prioritario',
    'Perfil destacado en homepage'
  ]
};

/**
 * Componente de progreso de reputación
 * @param {Object} props
 * @param {Object} props.progress - Datos de progreso
 * @param {string} props.currentLevel - Nivel actual
 * @param {Object} props.currentStats - Estadísticas actuales
 * @param {boolean} props.showBenefits - Mostrar beneficios del siguiente nivel
 * @param {boolean} props.showTimeline - Mostrar timeline de niveles
 */
const ReputationProgress = ({
  progress = {},
  currentLevel = 'new',
  currentStats = {},
  showBenefits = true,
  showTimeline = true,
  className = ''
}) => {
  const {
    nextLevel,
    appointmentsProgress = {},
    ratingProgress = {},
    canLevelUp = false
  } = progress;

  const {
    totalAppointments = 0,
    averageRating = 0
  } = currentStats;

  /**
   * Obtiene el siguiente nivel en la jerarquía
   */
  const getNextLevel = () => {
    const levels = ['new', 'bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return null;
  };

  const nextLevelKey = nextLevel?.name || getNextLevel();
  const nextLevelReqs = nextLevelKey ? LEVEL_REQUIREMENTS[nextLevelKey] : null;
  const nextLevelBenefits = nextLevelKey ? LEVEL_BENEFITS[nextLevelKey] : [];

  /**
   * Calcula el progreso de un requisito
   */
  const calculateProgress = (current, required) => {
    if (!required || required === 0) return 100;
    return Math.min(100, Math.round((current / required) * 100));
  };

  const appointmentsPct = nextLevelReqs
    ? calculateProgress(totalAppointments, nextLevelReqs.appointments)
    : 100;

  const ratingPct = nextLevelReqs?.rating
    ? calculateProgress(averageRating, nextLevelReqs.rating)
    : 100;

  // Si ya está en platino
  if (currentLevel === 'platinum') {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 ${className}`}>
        <div className="text-center">
          <ReputationBadge level="platinum" size="lg" animated={true} />
          <h3 className="text-xl font-bold text-purple-800 mt-4">
            ¡Nivel máximo alcanzado!
          </h3>
          <p className="text-purple-600 mt-2">
            Eres un médico Platino. Disfruta de todos los beneficios exclusivos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              Progreso de reputación
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Tu camino hacia el siguiente nivel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReputationBadge level={currentLevel} size="sm" />
            {nextLevelKey && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <ReputationBadge level={nextLevelKey} size="sm" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline de niveles */}
      {showTimeline && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <ReputationLevelsProgress currentLevel={currentLevel} />
        </div>
      )}

      {/* Requisitos del siguiente nivel */}
      {nextLevelReqs && (
        <div className="p-4 space-y-4">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Target className="w-4 h-4 text-teal-600" />
            Requisitos para {reviewsService.formatReputationLevel(nextLevelKey)}
          </h4>

          {/* Progreso de citas */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Citas completadas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">
                  {totalAppointments} / {nextLevelReqs.appointments}
                </span>
                {appointmentsPct >= 100 && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  appointmentsPct >= 100 ? 'bg-green-500' : 'bg-teal-500'
                }`}
                style={{ width: `${appointmentsPct}%` }}
              />
            </div>
            {appointmentsPct < 100 && (
              <p className="text-xs text-gray-500">
                Te faltan {nextLevelReqs.appointments - totalAppointments} citas más
              </p>
            )}
          </div>

          {/* Progreso de rating (si aplica) */}
          {nextLevelReqs.rating > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="w-4 h-4" />
                  <span>Calificación promedio</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">
                    {parseFloat(averageRating).toFixed(1)} / {nextLevelReqs.rating}
                  </span>
                  {ratingPct >= 100 && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ratingPct >= 100 ? 'bg-green-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${ratingPct}%` }}
                />
              </div>
              {ratingPct < 100 && (
                <p className="text-xs text-gray-500">
                  Necesitas un promedio de {nextLevelReqs.rating} estrellas
                </p>
              )}
            </div>
          )}

          {/* Mensaje de listo para subir */}
          {canLevelUp && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <div className="flex items-center gap-2 text-green-700">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">
                  ¡Cumples los requisitos para el nivel {reviewsService.formatReputationLevel(nextLevelKey)}!
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Tu nivel se actualizará automáticamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Beneficios del siguiente nivel */}
      {showBenefits && nextLevelBenefits.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-teal-600" />
            Beneficios de {reviewsService.formatReputationLevel(nextLevelKey)}
          </h4>
          <ul className="space-y-2">
            {nextLevelBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Widget compacto de progreso
 */
export const ReputationProgressMini = ({
  currentLevel = 'new',
  progress = 0,
  nextLevel = null,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <ReputationBadge level={currentLevel} size="sm" />
      {nextLevel && (
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Próximo nivel</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReputationProgress;
