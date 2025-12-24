/**
 * AuditLogsTable Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Tabla de logs de auditoría con paginación
 */

import { motion } from 'framer-motion';
import {
  Eye,
  User,
  Clock,
  MapPin,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Loader,
  FileText,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import auditService from '../../services/auditService';

// Iconos por severidad
const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  critical: Shield
};

// Estilos por severidad
const severityStyles = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-purple-100 text-purple-800 border-purple-200'
};

const AuditLogRow = ({ log, onViewDetails }) => {
  const SeverityIcon = severityIcons[log.severity] || Info;
  const severityInfo = auditService.formatSeverity(log.severity);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 transition-colors border-b border-gray-100"
    >
      {/* Fecha/Hora */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">
              {new Date(log.createdAt).toLocaleDateString('es-VE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(log.createdAt).toLocaleTimeString('es-VE', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
          </div>
        </div>
      </td>

      {/* Severidad */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${severityStyles[log.severity]}`}>
          <SeverityIcon className="w-3 h-3" />
          {severityInfo.label}
        </span>
      </td>

      {/* Acción */}
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">
          {auditService.formatAction(log.action)}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {log.action}
        </div>
      </td>

      {/* Usuario */}
      <td className="px-4 py-3 whitespace-nowrap">
        {log.user ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <div className="text-sm text-gray-900">
                {log.user.name || log.user.email}
              </div>
              <div className="text-xs text-gray-500">
                ID: {log.userId}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Sistema</span>
        )}
      </td>

      {/* Recurso */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {auditService.formatResource(log.resource)}
        </div>
        {log.resourceId && (
          <div className="text-xs text-gray-500 font-mono">
            ID: {log.resourceId}
          </div>
        )}
      </td>

      {/* IP */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-xs">{log.ipAddress || '-'}</span>
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <button
          onClick={() => onViewDetails(log)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          Ver
        </button>
      </td>
    </motion.tr>
  );
};

// Versión móvil en cards
const MobileLogCard = ({ log, onViewDetails }) => {
  const SeverityIcon = severityIcons[log.severity] || Info;
  const severityInfo = auditService.formatSeverity(log.severity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${severityStyles[log.severity]}`}>
          <SeverityIcon className="w-3 h-3" />
          {severityInfo.label}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(log.createdAt).toLocaleString('es-VE')}
        </span>
      </div>

      <div className="mb-3">
        <div className="font-medium text-gray-900">
          {auditService.formatAction(log.action)}
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {log.action}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <User className="w-4 h-4 text-gray-400" />
          {log.user?.email || 'Sistema'}
        </div>
        <div className="flex items-center gap-1">
          <Monitor className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-xs">{log.ipAddress || '-'}</span>
        </div>
      </div>

      <button
        onClick={() => onViewDetails(log)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
      >
        <Eye className="w-4 h-4" />
        Ver detalles
      </button>
    </motion.div>
  );
};

const AuditLogsTable = ({
  logs = [],
  loading = false,
  currentPage = 1,
  totalPages = 0,
  total = 0,
  onViewDetails,
  onPageChange
}) => {
  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium">No hay logs disponibles</p>
        <p className="text-sm mt-1">Ajusta los filtros para ver más resultados</p>
      </div>
    );
  }

  return (
    <div>
      {/* Contador */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {logs.length} de {total} registros
      </div>

      {/* Tabla desktop */}
      <div className="hidden lg:block overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recurso
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                onViewDetails={onViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="lg:hidden space-y-3">
        {logs.map((log) => (
          <MobileLogCard
            key={log.id}
            log={log}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>

            {/* Números de página */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 text-sm rounded-lg transition-colors ${
                      pageNum === currentPage
                        ? 'bg-teal-500 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTable;
