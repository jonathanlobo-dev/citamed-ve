/**
 * useCooldown Hook - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Hook para gestionar temporizador de cooldown:
 * - Countdown en segundos
 * - Persistencia en localStorage (sobrevive refresh)
 * - Auto-cleanup cuando expira
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'citamed_cooldown_';

/**
 * Hook para gestionar cooldown/countdown
 * @param {Object} config - Configuración
 * @param {string} config.key - Identificador único del cooldown
 * @param {number} config.duration - Duración en segundos (default: 60)
 * @returns {Object} Estado y funciones del cooldown
 */
export function useCooldown({ key, duration = 60 }) {
  const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
  const intervalRef = useRef(null);

  // Calcular segundos restantes desde localStorage
  const getInitialSeconds = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const expiresAt = parseInt(saved, 10);
        const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    } catch (error) {
      console.error('Error loading cooldown:', error);
    }
    return 0;
  }, [storageKey]);

  const [secondsRemaining, setSecondsRemaining] = useState(getInitialSeconds);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Countdown effect
  useEffect(() => {
    if (secondsRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            localStorage.removeItem(storageKey);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [secondsRemaining, storageKey]);

  /**
   * Inicia el cooldown
   * @param {number} [customDuration] - Duración personalizada en segundos
   */
  const startCooldown = useCallback((customDuration) => {
    const seconds = customDuration || duration;
    const expiresAt = Date.now() + (seconds * 1000);

    try {
      localStorage.setItem(storageKey, expiresAt.toString());
    } catch (error) {
      console.error('Error saving cooldown:', error);
    }

    setSecondsRemaining(seconds);
  }, [duration, storageKey]);

  /**
   * Detiene y limpia el cooldown
   */
  const clearCooldown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    localStorage.removeItem(storageKey);
    setSecondsRemaining(0);
  }, [storageKey]);

  /**
   * Formatea los segundos como MM:SS
   */
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Estado
    secondsRemaining,
    isActive: secondsRemaining > 0,
    formattedTime: formatTime(secondsRemaining),

    // Funciones
    startCooldown,
    clearCooldown
  };
}

export default useCooldown;
