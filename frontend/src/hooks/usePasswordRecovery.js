/**
 * usePasswordRecovery Hook - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Hook para gestionar flujo de recuperación de contraseña:
 * - Solicitar reset
 * - Verificar token/código
 * - Cambiar contraseña
 * - Validar fortaleza
 */

import { useState, useCallback } from 'react';
import passwordRecoveryService from '../services/passwordRecoveryService';

// Estados del flujo
export const RECOVERY_STEPS = {
  REQUEST: 'request',    // Formulario de email
  SENT: 'sent',          // Email enviado
  VERIFY: 'verify',      // Verificando token/código
  RESET: 'reset',        // Formulario de nueva contraseña
  SUCCESS: 'success',    // Éxito
  ERROR: 'error'         // Error
};

/**
 * Hook para recuperación de contraseña
 * @param {Object} options
 * @param {string} options.initialToken - Token inicial de URL
 * @returns {Object} Estado y funciones
 */
export function usePasswordRecovery({ initialToken = null } = {}) {
  const [step, setStep] = useState(
    initialToken ? RECOVERY_STEPS.VERIFY : RECOVERY_STEPS.REQUEST
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(initialToken);
  const [tokenValid, setTokenValid] = useState(null);

  // Cooldown para reenvío (60 segundos)
  const [cooldown, setCooldown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  /**
   * Solicita reset de contraseña
   * @param {string} userEmail - Email del usuario
   */
  const requestReset = useCallback(async (userEmail) => {
    setLoading(true);
    setError(null);

    try {
      const result = await passwordRecoveryService.requestReset(userEmail);

      if (result.success) {
        setEmail(userEmail);
        setStep(RECOVERY_STEPS.SENT);

        // Iniciar cooldown de 60 segundos
        setCooldown(60);
        setCanResend(false);

        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return { success: true, devCode: result.devCode, devToken: result.devToken };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al procesar solicitud';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reenvía email de recuperación
   */
  const resendEmail = useCallback(async () => {
    if (!canResend || !email) return { success: false };
    return await requestReset(email);
  }, [canResend, email, requestReset]);

  /**
   * Verifica token de URL
   * @param {string} urlToken - Token de la URL
   */
  const verifyToken = useCallback(async (urlToken = token) => {
    if (!urlToken) {
      setError('Token no proporcionado');
      setStep(RECOVERY_STEPS.ERROR);
      return { valid: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await passwordRecoveryService.verifyToken(urlToken);

      if (result.valid) {
        setToken(urlToken);
        setTokenValid(true);
        setEmail(result.email || '');
        setStep(RECOVERY_STEPS.RESET);
        return { valid: true, email: result.email };
      } else {
        setTokenValid(false);
        setError(result.reason || 'Token inválido');
        setStep(RECOVERY_STEPS.ERROR);
        return { valid: false, reason: result.reason };
      }
    } catch (err) {
      const message = err.response?.data?.reason || 'Error al verificar token';
      setTokenValid(false);
      setError(message);
      setStep(RECOVERY_STEPS.ERROR);
      return { valid: false, reason: message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Verifica código de 6 dígitos
   * @param {string} code - Código de 6 dígitos
   */
  const verifyCode = useCallback(async (code) => {
    if (!email) {
      setError('Email no disponible');
      return { valid: false };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await passwordRecoveryService.verifyCode(email, code);

      if (result.valid) {
        setToken(result.token);
        setTokenValid(true);
        setStep(RECOVERY_STEPS.RESET);
        return { valid: true, token: result.token };
      } else {
        setError(result.message || 'Código incorrecto');
        return {
          valid: false,
          message: result.message,
          attemptsRemaining: result.attemptsRemaining
        };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al verificar código';
      setError(message);
      return {
        valid: false,
        message,
        attemptsRemaining: err.response?.data?.attemptsRemaining
      };
    } finally {
      setLoading(false);
    }
  }, [email]);

  /**
   * Cambia la contraseña
   * @param {string} newPassword - Nueva contraseña
   * @param {string} confirmPassword - Confirmación
   */
  const resetPassword = useCallback(async (newPassword, confirmPassword) => {
    if (!token) {
      setError('Token no disponible');
      return { success: false };
    }

    // Validar que coincidan
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return { success: false, message: 'Las contraseñas no coinciden' };
    }

    setLoading(true);
    setError(null);

    try {
      const result = await passwordRecoveryService.resetPassword(
        token,
        newPassword,
        confirmPassword
      );

      if (result.success) {
        setStep(RECOVERY_STEPS.SUCCESS);
        return { success: true };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cambiar contraseña';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [token]);

  /**
   * Valida fortaleza de contraseña (local)
   * @param {string} password - Contraseña
   * @returns {Object} { valid, strength, requirements }
   */
  const validatePasswordStrength = useCallback((password) => {
    const requirements = {
      minLength: password && password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    };

    const valid = requirements.minLength &&
                  requirements.hasLowercase &&
                  requirements.hasUppercase &&
                  requirements.hasNumber;

    let strength = 'weak';
    if (valid) {
      if (password.length >= 12 && requirements.hasSpecial) {
        strength = 'strong';
      } else if (password.length >= 10) {
        strength = 'medium';
      } else {
        strength = 'medium';
      }
    }

    return { valid, strength, requirements };
  }, []);

  /**
   * Reinicia el flujo
   */
  const reset = useCallback(() => {
    setStep(RECOVERY_STEPS.REQUEST);
    setLoading(false);
    setError(null);
    setEmail('');
    setToken(null);
    setTokenValid(null);
    setCooldown(0);
    setCanResend(true);
  }, []);

  /**
   * Ir al paso de verificación con código
   */
  const goToCodeVerification = useCallback(() => {
    setStep(RECOVERY_STEPS.VERIFY);
  }, []);

  return {
    // Estado
    step,
    loading,
    error,
    email,
    token,
    tokenValid,
    cooldown,
    canResend,

    // Estados derivados
    isLoading: loading,
    isRequest: step === RECOVERY_STEPS.REQUEST,
    isSent: step === RECOVERY_STEPS.SENT,
    isVerify: step === RECOVERY_STEPS.VERIFY,
    isReset: step === RECOVERY_STEPS.RESET,
    isSuccess: step === RECOVERY_STEPS.SUCCESS,
    isError: step === RECOVERY_STEPS.ERROR,

    // Funciones
    requestReset,
    resendEmail,
    verifyToken,
    verifyCode,
    resetPassword,
    validatePasswordStrength,
    reset,
    goToCodeVerification,

    // Setters
    setStep,
    setError,
    setEmail
  };
}

export default usePasswordRecovery;
