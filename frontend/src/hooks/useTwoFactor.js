/**
 * useTwoFactor Hook - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Hook para gestionar flujo de 2FA:
 * - Generación de QR
 * - Activación/Desactivación
 * - Verificación de código
 * - Gestión de backup codes
 */

import { useState, useCallback, useEffect } from 'react';
import twoFactorService from '../services/twoFactorService';

// Estados del flujo de configuración
export const SETUP_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  READY: 'ready',      // QR generado, esperando código
  VERIFYING: 'verifying',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Hook para gestionar 2FA
 * @param {Object} options - Opciones
 * @param {boolean} options.autoFetchStatus - Cargar estado al montar
 * @returns {Object} Estado y funciones de 2FA
 */
export function useTwoFactor({ autoFetchStatus = true } = {}) {
  const [status, setStatus] = useState(SETUP_STATUS.IDLE);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estado de 2FA del usuario
  const [twoFactorStatus, setTwoFactorStatus] = useState({
    enabled: false,
    activatedAt: null,
    backupCodesRemaining: 0
  });

  // Datos de configuración
  const [setupData, setSetupData] = useState({
    qrCode: null,
    manualEntryKey: null,
    secret: null,
    backupCodes: []
  });

  /**
   * Obtiene estado de 2FA del usuario
   */
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await twoFactorService.getStatus();
      if (response.success) {
        setTwoFactorStatus(response.data);
      }
    } catch (err) {
      console.error('Error fetching 2FA status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar estado al montar si autoFetchStatus es true
  useEffect(() => {
    if (autoFetchStatus) {
      fetchStatus();
    }
  }, [autoFetchStatus, fetchStatus]);

  /**
   * Genera QR code para configurar 2FA
   */
  const generateSecret = useCallback(async () => {
    setStatus(SETUP_STATUS.LOADING);
    setError(null);

    try {
      const response = await twoFactorService.generateSecret();

      if (response.success) {
        setSetupData({
          qrCode: response.data.qrCode,
          manualEntryKey: response.data.manualEntryKey,
          secret: response.data.secret,
          backupCodes: []
        });
        setStatus(SETUP_STATUS.READY);
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al generar código QR';
      setError(errorMessage);
      setStatus(SETUP_STATUS.ERROR);
      throw err;
    }
  }, []);

  /**
   * Activa 2FA con código de verificación
   * @param {string} token - Código de 6 dígitos
   */
  const enable = useCallback(async (token) => {
    if (!setupData.secret) {
      setError('Primero debes generar el código QR');
      return { success: false };
    }

    setStatus(SETUP_STATUS.VERIFYING);
    setError(null);

    try {
      const response = await twoFactorService.enable(setupData.secret, token);

      if (response.success) {
        setSetupData(prev => ({
          ...prev,
          backupCodes: response.data.backupCodes
        }));
        setTwoFactorStatus({
          enabled: true,
          activatedAt: new Date().toISOString(),
          backupCodesRemaining: response.data.backupCodes.length
        });
        setStatus(SETUP_STATUS.SUCCESS);
        return { success: true, backupCodes: response.data.backupCodes };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Código inválido';
      setError(errorMessage);
      setStatus(SETUP_STATUS.READY); // Volver a ready para reintentar
      return { success: false, message: errorMessage };
    }
  }, [setupData.secret]);

  /**
   * Verifica código 2FA (para login)
   * @param {number} userId - ID del usuario
   * @param {string} token - Código de 6 dígitos o backup code
   */
  const verify = useCallback(async (userId, token) => {
    setLoading(true);
    setError(null);

    try {
      const response = await twoFactorService.verify(userId, token);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Código inválido';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Desactiva 2FA
   * @param {string} password - Contraseña del usuario
   */
  const disable = useCallback(async (password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await twoFactorService.disable(password);

      if (response.success) {
        setTwoFactorStatus({
          enabled: false,
          activatedAt: null,
          backupCodesRemaining: 0
        });
        setSetupData({
          qrCode: null,
          manualEntryKey: null,
          secret: null,
          backupCodes: []
        });
        setStatus(SETUP_STATUS.IDLE);
        return { success: true };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al desactivar 2FA';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Regenera códigos de respaldo
   * @param {string} password - Contraseña del usuario
   */
  const regenerateBackupCodes = useCallback(async (password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await twoFactorService.regenerateBackupCodes(password);

      if (response.success) {
        setSetupData(prev => ({
          ...prev,
          backupCodes: response.data.backupCodes
        }));
        setTwoFactorStatus(prev => ({
          ...prev,
          backupCodesRemaining: response.data.backupCodes.length
        }));
        return { success: true, backupCodes: response.data.backupCodes };
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al regenerar códigos';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reinicia el estado de configuración
   */
  const reset = useCallback(() => {
    setStatus(SETUP_STATUS.IDLE);
    setError(null);
    setSetupData({
      qrCode: null,
      manualEntryKey: null,
      secret: null,
      backupCodes: []
    });
  }, []);

  return {
    // Estado
    status,
    error,
    loading,
    twoFactorStatus,
    setupData,

    // Estados derivados
    isEnabled: twoFactorStatus.enabled,
    isLoading: loading || status === SETUP_STATUS.LOADING || status === SETUP_STATUS.VERIFYING,
    isReady: status === SETUP_STATUS.READY,
    isSuccess: status === SETUP_STATUS.SUCCESS,

    // Funciones
    fetchStatus,
    generateSecret,
    enable,
    verify,
    disable,
    regenerateBackupCodes,
    reset
  };
}

export default useTwoFactor;
