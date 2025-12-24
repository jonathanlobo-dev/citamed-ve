/**
 * useAudit Hook - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Hook para gestión de logs de auditoría
 * Solo para administradores
 */

import { useState, useCallback, useEffect } from 'react';
import auditService from '../services/auditService';

/**
 * Hook para consulta y gestión de logs de auditoría
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoFetch - Cargar logs automáticamente al montar
 * @param {number} options.defaultLimit - Límite por defecto de registros por página
 */
const useAudit = (options = {}) => {
  const { autoFetch = false, defaultLimit = 50 } = options;

  // ========================================
  // ESTADO DE LOGS
  // ========================================

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Filtros activos
  const [filters, setFilters] = useState({});

  // ========================================
  // ESTADO DE LOG INDIVIDUAL
  // ========================================

  const [selectedLog, setSelectedLog] = useState(null);
  const [loadingLog, setLoadingLog] = useState(false);

  // ========================================
  // ESTADO DE HISTORIAL DE RECURSO
  // ========================================

  const [resourceHistory, setResourceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // ========================================
  // ESTADO DE ALERTAS DE SEGURIDAD
  // ========================================

  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  // ========================================
  // ESTADO DE ESTADÍSTICAS
  // ========================================

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ========================================
  // ESTADO DE ACCIONES DISPONIBLES
  // ========================================

  const [availableActions, setAvailableActions] = useState([]);

  // ========================================
  // ESTADO DE EXPORTACIÓN
  // ========================================

  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // ========================================
  // FUNCIONES DE CONSULTA
  // ========================================

  /**
   * Obtener logs con filtros y paginación
   */
  const fetchLogs = useCallback(async (newFilters = null, page = 1) => {
    setLoading(true);
    setError(null);

    const activeFilters = newFilters !== null ? newFilters : filters;
    if (newFilters !== null) {
      setFilters(newFilters);
    }

    try {
      const response = await auditService.getLogs(activeFilters, page, defaultLimit);
      if (response.success) {
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 0);
      } else {
        setError(response.message || 'Error al obtener logs');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [filters, defaultLimit]);

  /**
   * Obtener detalle de un log específico
   */
  const fetchLogDetails = useCallback(async (logId) => {
    setLoadingLog(true);

    try {
      const response = await auditService.getLogById(logId);
      if (response.success) {
        setSelectedLog(response.data);
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    } finally {
      setLoadingLog(false);
    }
  }, []);

  /**
   * Obtener historial de un recurso específico
   */
  const fetchResourceHistory = useCallback(async (resource, resourceId, limit = 50) => {
    setLoadingHistory(true);

    try {
      const response = await auditService.getResourceHistory(resource, resourceId, limit);
      if (response.success) {
        setResourceHistory(response.data.history || []);
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  /**
   * Obtener alertas de seguridad
   */
  const fetchSecurityAlerts = useCallback(async (since = 24) => {
    setLoadingAlerts(true);

    try {
      const response = await auditService.getSecurityAlerts(since);
      if (response.success) {
        setSecurityAlerts(response.data.alerts || []);
        setAlertsCount(response.data.count || 0);
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  /**
   * Obtener estadísticas de auditoría
   */
  const fetchStats = useCallback(async (startDate, endDate) => {
    setLoadingStats(true);

    try {
      const response = await auditService.getAuditStats(startDate, endDate);
      if (response.success) {
        setStats(response.data);
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      return { success: false, message: errorMessage };
    } finally {
      setLoadingStats(false);
    }
  }, []);

  /**
   * Obtener acciones disponibles para filtrar
   */
  const fetchAvailableActions = useCallback(async () => {
    try {
      const response = await auditService.getAvailableActions();
      if (response.success) {
        setAvailableActions(response.data.actions || []);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, []);

  // ========================================
  // FUNCIONES DE EXPORTACIÓN
  // ========================================

  /**
   * Exportar logs a archivo
   */
  const exportLogs = useCallback(async (exportFilters = null, format = 'csv') => {
    setExporting(true);
    setExportResult(null);

    const activeFilters = exportFilters || filters;

    try {
      const response = await auditService.exportLogs(activeFilters, format);
      if (response.success) {
        setExportResult({
          success: true,
          filename: response.data.filename,
          downloadUrl: response.data.downloadUrl,
          recordCount: response.data.recordCount
        });

        // Auto-descargar el archivo
        if (response.data.filename) {
          await auditService.downloadExportFile(response.data.filename);
        }
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al exportar';
      setExportResult({ success: false, message: errorMessage });
      return { success: false, message: errorMessage };
    } finally {
      setExporting(false);
    }
  }, [filters]);

  // ========================================
  // FUNCIONES DE PAGINACIÓN
  // ========================================

  /**
   * Ir a página específica
   */
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(null, page);
    }
  }, [fetchLogs, totalPages]);

  /**
   * Ir a página siguiente
   */
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  /**
   * Ir a página anterior
   */
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // ========================================
  // FUNCIONES DE UTILIDAD
  // ========================================

  /**
   * Actualizar filtros y recargar
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    fetchLogs({ ...filters, ...newFilters }, 1);
  }, [filters, fetchLogs]);

  /**
   * Limpiar filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchLogs({}, 1);
  }, [fetchLogs]);

  /**
   * Cerrar detalle del log
   */
  const closeLogDetails = useCallback(() => {
    setSelectedLog(null);
  }, []);

  /**
   * Limpiar historial de recurso
   */
  const clearResourceHistory = useCallback(() => {
    setResourceHistory([]);
  }, []);

  /**
   * Refrescar todos los datos
   */
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchLogs(filters, currentPage),
      fetchSecurityAlerts(),
      fetchStats()
    ]);
  }, [fetchLogs, fetchSecurityAlerts, fetchStats, filters, currentPage]);

  // ========================================
  // EFECTOS
  // ========================================

  // Cargar datos iniciales si autoFetch está habilitado
  useEffect(() => {
    if (autoFetch) {
      fetchLogs();
      fetchAvailableActions();
    }
  }, [autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================
  // RETURN
  // ========================================

  return {
    // Logs
    logs,
    loading,
    error,
    total,
    currentPage,
    totalPages,
    filters,
    fetchLogs,

    // Log individual
    selectedLog,
    loadingLog,
    fetchLogDetails,
    closeLogDetails,

    // Historial de recurso
    resourceHistory,
    loadingHistory,
    fetchResourceHistory,
    clearResourceHistory,

    // Alertas de seguridad
    securityAlerts,
    loadingAlerts,
    alertsCount,
    fetchSecurityAlerts,

    // Estadísticas
    stats,
    loadingStats,
    fetchStats,

    // Acciones disponibles
    availableActions,
    fetchAvailableActions,

    // Exportación
    exporting,
    exportResult,
    exportLogs,

    // Paginación
    goToPage,
    nextPage,
    prevPage,

    // Utilidades
    updateFilters,
    clearFilters,
    refreshAll,

    // Utilidades de formato (re-exportadas del servicio)
    formatSeverity: auditService.formatSeverity,
    formatAction: auditService.formatAction,
    formatResource: auditService.formatResource,
    getActionIcon: auditService.getActionIcon
  };
};

export default useAudit;
