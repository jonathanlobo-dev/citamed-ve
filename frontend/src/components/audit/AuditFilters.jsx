/**
 * AuditFilters Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Filtros para la búsqueda de logs de auditoría
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from '../common/Button/button';

const severityOptions = [
  { value: '', label: 'Todas las severidades' },
  { value: 'info', label: 'Info', color: 'blue' },
  { value: 'warning', label: 'Advertencia', color: 'yellow' },
  { value: 'error', label: 'Error', color: 'red' },
  { value: 'critical', label: 'Crítico', color: 'purple' }
];

const resourceOptions = [
  { value: '', label: 'Todos los recursos' },
  { value: 'user', label: 'Usuario' },
  { value: 'session', label: 'Sesión' },
  { value: 'auth', label: 'Autenticación' },
  { value: 'role', label: 'Rol' },
  { value: 'permission', label: 'Permiso' },
  { value: 'profile', label: 'Perfil' }
];

const AuditFilters = ({
  filters = {},
  availableActions = [],
  onFilterChange,
  onClearFilters,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    userId: '',
    action: '',
    resource: '',
    severity: '',
    startDate: '',
    endDate: '',
    ipAddress: '',
    ...filters
  });

  // Sincronizar con filtros externos
  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    // Limpiar valores vacíos
    const cleanFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([_, v]) => v !== '')
    );
    onFilterChange(cleanFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({
      search: '',
      userId: '',
      action: '',
      resource: '',
      severity: '',
      startDate: '',
      endDate: '',
      ipAddress: ''
    });
    onClearFilters();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilters();
    }
  };

  // Contar filtros activos
  const activeFiltersCount = Object.values(localFilters).filter(v => v !== '').length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Barra de búsqueda principal */}
      <div className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={localFilters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Severidad rápida */}
          <select
            value={localFilters.severity}
            onChange={(e) => handleInputChange('severity', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            {severityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Botón filtros avanzados */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-teal-100 text-teal-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Botón aplicar */}
          <Button
            onClick={handleApplyFilters}
            disabled={loading}
          >
            Buscar
          </Button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 px-4 py-4 bg-gray-50"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Usuario ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Usuario ID
              </label>
              <input
                type="text"
                placeholder="ID del usuario"
                value={localFilters.userId}
                onChange={(e) => handleInputChange('userId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Acción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Activity className="w-4 h-4 inline mr-1" />
                Acción
              </label>
              <select
                value={localFilters.action}
                onChange={(e) => handleInputChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Todas las acciones</option>
                {availableActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>

            {/* Recurso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                Recurso
              </label>
              <select
                value={localFilters.resource}
                onChange={(e) => handleInputChange('resource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {resourceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* IP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP
              </label>
              <input
                type="text"
                placeholder="Dirección IP"
                value={localFilters.ipAddress}
                onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Desde
              </label>
              <input
                type="date"
                value={localFilters.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Hasta
              </label>
              <input
                type="date"
                value={localFilters.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
            <Button onClick={handleApplyFilters} disabled={loading}>
              Aplicar filtros
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AuditFilters;
