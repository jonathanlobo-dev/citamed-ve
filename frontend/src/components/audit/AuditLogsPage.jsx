/**
 * AuditLogsPage Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Página principal de logs de auditoría
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  RefreshCw,
  BarChart2,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAudit from '../../hooks/useAudit';
import AuditFilters from './AuditFilters';
import AuditLogsTable from './AuditLogsTable';
import AuditLogDetailModal from './AuditLogDetailModal';
import SecurityAlertsWidget from './SecurityAlertsWidget';
import Button from '../common/button/button';
import { AdminGate } from '../permissions/PermissionGate';

const AuditLogsPage = () => {
  const {
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

    // Alertas de seguridad
    securityAlerts,
    loadingAlerts,
    alertsCount,
    fetchSecurityAlerts,

    // Acciones disponibles
    availableActions,
    fetchAvailableActions,

    // Exportación
    exporting,
    exportLogs,

    // Utilidades
    updateFilters,
    clearFilters,
    goToPage
  } = useAudit({ defaultLimit: 15 });

  const [showExportMenu, setShowExportMenu] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchLogs();
    fetchSecurityAlerts();
    fetchAvailableActions();
  }, []);

  const handleViewDetails = async (log) => {
    await fetchLogDetails(log.id);
  };

  const handleExport = async (format) => {
    await exportLogs(filters, format);
    setShowExportMenu(false);
  };

  const handleRefresh = () => {
    fetchLogs(filters, currentPage);
    fetchSecurityAlerts();
  };

  return (
    <AdminGate
      fallback={
        <div className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">Solo administradores pueden ver los logs de auditoría</p>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-teal-600" />
                  Logs de Auditoría
                </h1>
                <p className="text-gray-500 mt-1">
                  Registro de todas las acciones del sistema
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Botón estadísticas */}
                <Link
                  to="/admin/audit/stats"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BarChart2 className="w-4 h-4" />
                  Estadísticas
                </Link>

                {/* Botón exportar */}
                <div className="relative">
                  <Button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={exporting || logs.length === 0}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {exporting ? 'Exportando...' : 'Exportar'}
                  </Button>

                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                    >
                      <button
                        onClick={() => handleExport('csv')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        Exportar como CSV
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors border-t"
                      >
                        Exportar como JSON
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Botón refrescar */}
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  variant="primary"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar con alertas */}
            <div className="lg:col-span-1">
              <SecurityAlertsWidget
                alerts={securityAlerts}
                loading={loadingAlerts}
                count={alertsCount}
                onRefresh={fetchSecurityAlerts}
                onViewAlert={handleViewDetails}
                onViewAll={() => updateFilters({ severity: 'critical,error,warning' })}
                compact
              />

              {/* Resumen rápido */}
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total de logs</span>
                    <span className="font-semibold text-gray-900">{total.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Alertas activas</span>
                    <span className="font-semibold text-red-600">{alertsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Acciones únicas</span>
                    <span className="font-semibold text-gray-900">{availableActions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3 space-y-6">
              {/* Filtros */}
              <AuditFilters
                filters={filters}
                availableActions={availableActions}
                onFilterChange={updateFilters}
                onClearFilters={clearFilters}
                loading={loading}
              />

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {/* Tabla de logs */}
              <AuditLogsTable
                logs={logs}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                total={total}
                onViewDetails={handleViewDetails}
                onPageChange={goToPage}
              />
            </div>
          </div>
        </div>

        {/* Modal de detalle */}
        <AuditLogDetailModal
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={closeLogDetails}
          loading={loadingLog}
        />

        {/* Cerrar menú exportar al hacer click fuera */}
        {showExportMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowExportMenu(false)}
          />
        )}
      </div>
    </AdminGate>
  );
};

export default AuditLogsPage;
