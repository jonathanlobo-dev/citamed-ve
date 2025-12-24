// src/hooks/useSession.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Hook para gestión de sesiones del usuario

import { useState, useCallback } from 'react';
import sessionService from '../services/sessionService';

/**
 * Hook para gestión de sesiones activas y historial de login
 */
const useSession = () => {
  // Estado para sesiones activas
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  // Estado para historial de login
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);

  // Estado para sesiones sospechosas
  const [suspiciousSessions, setSuspiciousSessions] = useState([]);

  // Estado para estadísticas
  const [stats, setStats] = useState(null);

  // Estado para operaciones
  const [revoking, setRevoking] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  /**
   * Obtener sesiones activas
   */
  const fetchActiveSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);

    try {
      const response = await sessionService.getActiveSessions();
      if (response.success) {
        setSessions(response.sessions || []);
      } else {
        setSessionsError(response.error || 'Error al obtener sesiones');
      }
    } catch (error) {
      setSessionsError(error.error || 'Error de conexión');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  /**
   * Revocar una sesión específica
   */
  const revokeSession = useCallback(async (sessionId) => {
    setRevoking(true);

    try {
      const response = await sessionService.revokeSession(sessionId);
      if (response.success) {
        // Actualizar lista de sesiones
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error || 'Error al cerrar sesión' };
      }
    } catch (error) {
      return { success: false, error: error.error || 'Error de conexión' };
    } finally {
      setRevoking(false);
    }
  }, []);

  /**
   * Revocar todas las sesiones excepto la actual
   */
  const revokeAllSessions = useCallback(async () => {
    setRevokingAll(true);

    try {
      const response = await sessionService.revokeAllSessions();
      if (response.success) {
        // Mantener solo la sesión actual
        setSessions(prev => prev.filter(s => s.isCurrent));
        return {
          success: true,
          revokedCount: response.revokedCount,
          message: response.message
        };
      } else {
        return { success: false, error: response.error || 'Error al cerrar sesiones' };
      }
    } catch (error) {
      return { success: false, error: error.error || 'Error de conexión' };
    } finally {
      setRevokingAll(false);
    }
  }, []);

  /**
   * Obtener historial de login
   */
  const fetchLoginHistory = useCallback(async (limit = 20, offset = 0, append = false) => {
    setHistoryLoading(true);

    try {
      const response = await sessionService.getLoginHistory(limit, offset);
      if (response.success) {
        if (append) {
          setLoginHistory(prev => [...prev, ...response.history]);
        } else {
          setLoginHistory(response.history || []);
        }
        setHistoryTotal(response.total);
        setHistoryHasMore(response.hasMore);
      }
    } catch (error) {
      console.error('Error obteniendo historial:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  /**
   * Cargar más historial (paginación)
   */
  const loadMoreHistory = useCallback(async () => {
    if (historyHasMore && !historyLoading) {
      await fetchLoginHistory(20, loginHistory.length, true);
    }
  }, [fetchLoginHistory, historyHasMore, historyLoading, loginHistory.length]);

  /**
   * Detectar sesiones sospechosas
   */
  const fetchSuspiciousSessions = useCallback(async () => {
    try {
      const response = await sessionService.getSuspiciousSessions();
      if (response.success) {
        setSuspiciousSessions(response.suspiciousSessions || []);
      }
    } catch (error) {
      console.error('Error detectando sesiones sospechosas:', error);
    }
  }, []);

  /**
   * Obtener estadísticas de login
   */
  const fetchLoginStats = useCallback(async () => {
    try {
      const response = await sessionService.getLoginStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }, []);

  /**
   * Cerrar sesión actual (logout)
   */
  const logout = useCallback(async () => {
    try {
      await sessionService.logout();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.error || 'Error al cerrar sesión' };
    }
  }, []);

  /**
   * Refrescar todos los datos
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchActiveSessions(),
      fetchLoginHistory(),
      fetchSuspiciousSessions(),
      fetchLoginStats()
    ]);
  }, [fetchActiveSessions, fetchLoginHistory, fetchSuspiciousSessions, fetchLoginStats]);

  return {
    // Sesiones activas
    sessions,
    sessionsLoading,
    sessionsError,
    fetchActiveSessions,
    revokeSession,
    revokeAllSessions,
    revoking,
    revokingAll,

    // Historial de login
    loginHistory,
    historyLoading,
    historyTotal,
    historyHasMore,
    fetchLoginHistory,
    loadMoreHistory,

    // Sesiones sospechosas
    suspiciousSessions,
    fetchSuspiciousSessions,

    // Estadísticas
    stats,
    fetchLoginStats,

    // Utilidades
    logout,
    refreshAll
  };
};

export default useSession;
