/**
 * useVerification Hook - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Hook para gestionar flujo de verificación:
 * - Envío de código (email/SMS)
 * - Verificación de código
 * - Reenvío con cooldown
 * - Manejo de errores y estados
 */

import { useState, useCallback } from 'react';
import verificationService from '../services/verificationService';
import { useCooldown } from './useCooldown';

// Estados del flujo de verificación
export const VERIFICATION_STATUS = {
  IDLE: 'idle',           // Estado inicial
  SENDING: 'sending',     // Enviando código
  SENT: 'sent',           // Código enviado, esperando input
  VERIFYING: 'verifying', // Verificando código
  VERIFIED: 'verified',   // Verificación exitosa
  ERROR: 'error'          // Error en el proceso
};

// Configuración de cooldown por tipo
const COOLDOWN_CONFIG = {
  email: 60,   // 60 segundos para email
  phone: 120   // 120 segundos para SMS
};

/**
 * Hook para gestionar verificación de email o teléfono
 * @param {Object} config - Configuración
 * @param {string} config.type - Tipo: 'email' o 'phone'
 * @param {number} config.userId - ID del usuario
 * @param {string} [config.phoneNumber] - Número de teléfono (solo para type='phone')
 * @param {Function} [config.onSuccess] - Callback cuando verificación es exitosa
 * @param {Function} [config.onError] - Callback cuando hay error
 * @returns {Object} Estado y funciones de verificación
 */
export function useVerification({
  type = 'email',
  userId,
  phoneNumber,
  onSuccess,
  onError
}) {
  const [status, setStatus] = useState(VERIFICATION_STATUS.IDLE);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);

  // Cooldown para reenvío
  const cooldown = useCooldown({
    key: `${type}_verification_${userId}`,
    duration: COOLDOWN_CONFIG[type]
  });

  /**
   * Envía código de verificación
   */
  const sendCode = useCallback(async () => {
    if (!userId) {
      setError('Usuario no identificado');
      setStatus(VERIFICATION_STATUS.ERROR);
      return { success: false, message: 'Usuario no identificado' };
    }

    setStatus(VERIFICATION_STATUS.SENDING);
    setError(null);

    try {
      let response;

      if (type === 'email') {
        response = await verificationService.sendEmailVerification(userId);
      } else if (type === 'phone') {
        if (!phoneNumber) {
          throw new Error('Número de teléfono requerido');
        }
        response = await verificationService.sendPhoneVerification(userId, phoneNumber);
      }

      if (response.success) {
        setToken(response.token);
        setExpiresAt(response.expiresAt);
        setStatus(VERIFICATION_STATUS.SENT);
        cooldown.startCooldown();
        return response;
      } else {
        throw new Error(response.message || 'Error al enviar código');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al enviar código';
      setError(errorMessage);
      setStatus(VERIFICATION_STATUS.ERROR);
      onError?.(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [userId, type, phoneNumber, cooldown, onError]);

  /**
   * Verifica el código ingresado
   * @param {string} code - Código de 6 dígitos
   */
  const verifyCode = useCallback(async (code) => {
    if (!token) {
      setError('Token no disponible. Solicita un nuevo código.');
      setStatus(VERIFICATION_STATUS.ERROR);
      return { success: false, message: 'Token no disponible' };
    }

    if (!code || code.length !== 6) {
      setError('Código debe tener 6 dígitos');
      return { success: false, message: 'Código debe tener 6 dígitos' };
    }

    setStatus(VERIFICATION_STATUS.VERIFYING);
    setError(null);

    try {
      let response;

      if (type === 'email') {
        response = await verificationService.verifyEmail(token, code);
      } else if (type === 'phone') {
        response = await verificationService.verifyPhone(token, code);
      }

      if (response.success) {
        setStatus(VERIFICATION_STATUS.VERIFIED);
        cooldown.clearCooldown();
        onSuccess?.(response);
        return response;
      } else {
        // Actualizar intentos restantes si viene en la respuesta
        if (response.attemptsRemaining !== undefined) {
          setAttemptsRemaining(response.attemptsRemaining);
        }
        throw new Error(response.message || 'Código inválido');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al verificar código';
      const attemptsLeft = err.response?.data?.attemptsRemaining;

      if (attemptsLeft !== undefined) {
        setAttemptsRemaining(attemptsLeft);
      }

      setError(errorMessage);
      setStatus(VERIFICATION_STATUS.SENT); // Volver a sent para permitir reintentar
      onError?.(errorMessage);
      return { success: false, message: errorMessage, attemptsRemaining: attemptsLeft };
    }
  }, [token, type, cooldown, onSuccess, onError]);

  /**
   * Reenvía el código de verificación
   */
  const resendCode = useCallback(async () => {
    if (cooldown.isActive) {
      const message = `Espera ${cooldown.formattedTime} para reenviar`;
      setError(message);
      return { success: false, message };
    }

    setError(null);

    try {
      let response;

      if (type === 'email') {
        response = await verificationService.resendEmailVerification(userId);
      } else if (type === 'phone') {
        response = await verificationService.resendPhoneVerification(userId, phoneNumber);
      }

      if (response.success) {
        setToken(response.token);
        setExpiresAt(response.expiresAt);
        setStatus(VERIFICATION_STATUS.SENT);
        cooldown.startCooldown();
        setAttemptsRemaining(null); // Reset attempts
        return response;
      } else {
        throw new Error(response.message || 'Error al reenviar código');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al reenviar código';
      setError(errorMessage);
      onError?.(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [userId, type, phoneNumber, cooldown, onError]);

  /**
   * Reinicia el estado de verificación
   */
  const reset = useCallback(() => {
    setStatus(VERIFICATION_STATUS.IDLE);
    setToken(null);
    setError(null);
    setExpiresAt(null);
    setAttemptsRemaining(null);
  }, []);

  /**
   * Obtiene el estado de verificación del usuario
   */
  const checkStatus = useCallback(async () => {
    if (!userId) return null;

    try {
      const response = await verificationService.getVerificationStatus(userId);
      return response;
    } catch (err) {
      console.error('Error checking verification status:', err);
      return null;
    }
  }, [userId]);

  return {
    // Estado
    status,
    token,
    error,
    expiresAt,
    attemptsRemaining,

    // Estados derivados
    isIdle: status === VERIFICATION_STATUS.IDLE,
    isSending: status === VERIFICATION_STATUS.SENDING,
    isSent: status === VERIFICATION_STATUS.SENT,
    isVerifying: status === VERIFICATION_STATUS.VERIFYING,
    isVerified: status === VERIFICATION_STATUS.VERIFIED,
    isError: status === VERIFICATION_STATUS.ERROR,

    // Cooldown
    cooldown: {
      isActive: cooldown.isActive,
      secondsRemaining: cooldown.secondsRemaining,
      formattedTime: cooldown.formattedTime
    },

    // Funciones
    sendCode,
    verifyCode,
    resendCode,
    reset,
    checkStatus
  };
}

export default useVerification;
