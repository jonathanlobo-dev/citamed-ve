/**
 * StepIndicator Component - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Componente visual para mostrar el progreso del wizard
 */

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Indicador de pasos del wizard
 * @param {Object} props
 * @param {number} props.currentStep - Paso actual
 * @param {number} props.totalSteps - Total de pasos
 * @param {Array} props.stepLabels - Labels de cada paso
 */
function StepIndicator({ currentStep, totalSteps, stepLabels = [] }) {
  return (
    <div className="mb-8">
      {/* Barra de progreso */}
      <div className="relative mb-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Indicadores de paso */}
      <div className="flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const label = stepLabels[i] || `Paso ${stepNum}`;

          return (
            <div
              key={stepNum}
              className="flex flex-col items-center"
              style={{ width: `${100 / totalSteps}%` }}
            >
              {/* Círculo del paso */}
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                  transition-colors duration-300
                  ${isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/30'
                      : 'bg-gray-200 text-gray-500'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  stepNum
                )}
              </motion.div>

              {/* Label del paso */}
              <span
                className={`
                  mt-2 text-xs text-center px-1 hidden sm:block
                  ${isCurrent ? 'text-primary font-semibold' : 'text-gray-500'}
                `}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Paso actual móvil */}
      <div className="sm:hidden text-center mt-4">
        <span className="text-sm font-medium text-primary">
          Paso {currentStep} de {totalSteps}: {stepLabels[currentStep - 1] || ''}
        </span>
      </div>
    </div>
  );
}

export default StepIndicator;
