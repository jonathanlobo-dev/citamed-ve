/**
 * AuditStatsPage Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Página de estadísticas de auditoría
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Activity,
  Users,
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Info,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import useAudit from '../../hooks/useAudit';
import Button from '../common/button/button';
import { AdminGate } from '../permissions/PermissionGate';

// Componente de tarjeta de estadística
const StatCard = ({ title, value, icon: Icon, color, subtext }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    teal: 'bg-teal-50 text-teal-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtext && (
            <p className="text-xs text-gray-400 mt-1">{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color] || colorClasses.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
};

// Componente de barra de progreso
const ProgressBar = ({ label, value, max, color = 'teal' }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-${color}-500 h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const AuditStatsPage = () => {
  const {
    stats,
    loadingStats,
    fetchStats
  } = useAudit();

  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Cargar estadísticas iniciales
  useEffect(() => {
    fetchStats();
  }, []);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyDateRange = () => {
    fetchStats(dateRange.startDate, dateRange.endDate);
  };

  const handleRefresh = () => {
    fetchStats(dateRange.startDate, dateRange.endDate);
  };

  // Calcular totales por severidad
  const getSeverityCounts = () => {
    if (!stats?.bySeverity) return { info: 0, warning: 0, error: 0, critical: 0 };

    const counts = { info: 0, warning: 0, error: 0, critical: 0 };
    stats.bySeverity.forEach(item => {
      counts[item.severity] = parseInt(item.count) || 0;
    });
    return counts;
  };

  const severityCounts = getSeverityCounts();
  const maxSeverityCount = Math.max(...Object.values(severityCounts));

  return (
    <AdminGate
      fallback={
        <div className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Acceso Restringido</h2>
          <p className="text-gray-500 mt-2">Solo administradores pueden ver las estadísticas</p>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Link
                  to="/admin/audit"
                  className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver a logs
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <BarChart2 className="w-8 h-8 text-teal-600" />
                  Estadísticas de Auditoría
                </h1>
                <p className="text-gray-500 mt-1">
                  Análisis y métricas del sistema
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={loadingStats}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingStats ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>
          </div>

          {/* Filtro de fechas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Desde
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button onClick={handleApplyDateRange} disabled={loadingStats}>
                Aplicar
              </Button>
            </div>
          </div>

          {loadingStats && !stats ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total de Logs"
                  value={stats.total || 0}
                  icon={Activity}
                  color="teal"
                  subtext="En el período seleccionado"
                />
                <StatCard
                  title="Usuarios Activos"
                  value={stats.uniqueUsers || 0}
                  icon={Users}
                  color="blue"
                  subtext="Con actividad registrada"
                />
                <StatCard
                  title="Alertas de Seguridad"
                  value={severityCounts.error + severityCounts.critical}
                  icon={Shield}
                  color="red"
                  subtext="Errores y críticos"
                />
                <StatCard
                  title="Acciones Únicas"
                  value={stats.byAction?.length || 0}
                  icon={TrendingUp}
                  color="purple"
                  subtext="Tipos de acciones"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Por severidad */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Distribución por Severidad
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-5 h-5 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-800">Info</span>
                          <span className="text-blue-600">{severityCounts.info.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${maxSeverityCount > 0 ? (severityCounts.info / maxSeverityCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-yellow-800">Warning</span>
                          <span className="text-yellow-600">{severityCounts.warning.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-yellow-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${maxSeverityCount > 0 ? (severityCounts.warning / maxSeverityCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-800">Error</span>
                          <span className="text-red-600">{severityCounts.error.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${maxSeverityCount > 0 ? (severityCounts.error / maxSeverityCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-800">Critical</span>
                          <span className="text-purple-600">{severityCounts.critical.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${maxSeverityCount > 0 ? (severityCounts.critical / maxSeverityCount) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top acciones */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-500" />
                    Top Acciones
                  </h3>
                  {stats.byAction && stats.byAction.length > 0 ? (
                    <div className="space-y-2">
                      {stats.byAction.slice(0, 10).map((item, index) => (
                        <ProgressBar
                          key={item.action}
                          label={item.action}
                          value={parseInt(item.count)}
                          max={parseInt(stats.byAction[0].count)}
                          color="teal"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
                  )}
                </div>

                {/* Top usuarios */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Usuarios más Activos
                  </h3>
                  {stats.byUser && stats.byUser.length > 0 ? (
                    <div className="space-y-3">
                      {stats.byUser.slice(0, 10).map((item, index) => (
                        <div key={item.userId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {item.user?.name || item.user?.email || `Usuario ${item.userId}`}
                              </div>
                              <div className="text-xs text-gray-500">ID: {item.userId}</div>
                            </div>
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {parseInt(item.count).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
                  )}
                </div>

                {/* Por recurso */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-500" />
                    Por Recurso
                  </h3>
                  {stats.byResource && stats.byResource.length > 0 ? (
                    <div className="space-y-2">
                      {stats.byResource.map((item) => (
                        <ProgressBar
                          key={item.resource}
                          label={item.resource}
                          value={parseInt(item.count)}
                          max={parseInt(stats.byResource[0].count)}
                          color="purple"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <BarChart2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No se pudieron cargar las estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </AdminGate>
  );
};

export default AuditStatsPage;
