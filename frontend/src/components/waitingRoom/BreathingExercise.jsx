/**
 * BreathingExercise - CITAMED.VE
 * Ejercicio de respiración guiada para reducir ansiedad
 *
 * Técnica 4-7-8:
 * - Inhala 4 segundos
 * - Mantén 7 segundos
 * - Exhala 8 segundos
 */

import { useState, useEffect, useCallback } from 'react';
import './BreathingExercise.css';

const BreathingExercise = ({ isMinimized = false, onToggle }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle, inhale, hold, exhale
  const [countdown, setCountdown] = useState(0);
  const [cycles, setCycles] = useState(0);

  const PHASES = {
    inhale: { duration: 4, next: 'hold', label: 'Inhala' },
    hold: { duration: 7, next: 'exhale', label: 'Mantén' },
    exhale: { duration: 8, next: 'inhale', label: 'Exhala' }
  };

  const startExercise = useCallback(() => {
    setIsActive(true);
    setPhase('inhale');
    setCountdown(PHASES.inhale.duration);
    setCycles(0);
  }, []);

  const stopExercise = useCallback(() => {
    setIsActive(false);
    setPhase('idle');
    setCountdown(0);
  }, []);

  useEffect(() => {
    if (!isActive || phase === 'idle') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const currentPhase = PHASES[phase];
          const nextPhase = currentPhase.next;

          // Contar ciclo completo
          if (phase === 'exhale') {
            setCycles(c => c + 1);
          }

          setPhase(nextPhase);
          return PHASES[nextPhase].duration;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const getCircleScale = () => {
    if (phase === 'inhale') return 1.3;
    if (phase === 'hold') return 1.3;
    if (phase === 'exhale') return 1;
    return 1;
  };

  const getPhaseColor = () => {
    if (phase === 'inhale') return '#3b82f6';
    if (phase === 'hold') return '#8b5cf6';
    if (phase === 'exhale') return '#22c55e';
    return '#94a3b8';
  };

  // Vista minimizada
  if (isMinimized) {
    return (
      <button
        onClick={onToggle}
        className="breathing-mini"
        title="Ejercicio de respiración"
      >
        <div className={`mini-circle ${isActive ? 'active' : ''}`} style={{
          transform: isActive ? `scale(${getCircleScale()})` : 'scale(1)',
          background: getPhaseColor()
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      </button>
    );
  }

  return (
    <div className="breathing-exercise">
      <div className="breathing-header">
        <div className="breathing-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>Respira conmigo</span>
        </div>
        {onToggle && (
          <button onClick={onToggle} className="breathing-minimize">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        )}
      </div>

      <div className="breathing-visual">
        <div
          className={`breathing-circle ${phase}`}
          style={{
            transform: `scale(${getCircleScale()})`,
            borderColor: getPhaseColor(),
            boxShadow: isActive ? `0 0 40px ${getPhaseColor()}40` : 'none'
          }}
        >
          <div className="circle-inner" style={{ background: `${getPhaseColor()}20` }}>
            {isActive ? (
              <>
                <span className="phase-label">{PHASES[phase]?.label || ''}</span>
                <span className="phase-countdown">{countdown}</span>
              </>
            ) : (
              <span className="phase-label idle">Toca para iniciar</span>
            )}
          </div>
        </div>

        {/* Indicadores de progreso */}
        <div className="phase-indicators">
          <div className={`indicator ${phase === 'inhale' ? 'active' : ''}`}>
            <span className="indicator-dot"></span>
            <span>Inhala</span>
          </div>
          <div className={`indicator ${phase === 'hold' ? 'active' : ''}`}>
            <span className="indicator-dot"></span>
            <span>Mantén</span>
          </div>
          <div className={`indicator ${phase === 'exhale' ? 'active' : ''}`}>
            <span className="indicator-dot"></span>
            <span>Exhala</span>
          </div>
        </div>
      </div>

      <div className="breathing-controls">
        {!isActive ? (
          <button onClick={startExercise} className="btn-start">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Comenzar
          </button>
        ) : (
          <button onClick={stopExercise} className="btn-stop">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Detener
          </button>
        )}

        {cycles > 0 && (
          <span className="cycles-count">{cycles} ciclos completados</span>
        )}
      </div>

      <p className="breathing-tip">
        La técnica 4-7-8 ayuda a reducir la ansiedad y relajar el cuerpo
      </p>
    </div>
  );
};

export default BreathingExercise;
