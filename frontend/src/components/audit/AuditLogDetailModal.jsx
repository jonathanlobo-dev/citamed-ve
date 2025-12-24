/**
 * AuditLogDetailModal Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Modal para ver detalles de un log de auditoría
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  User,
  Monitor,
  MapPin,
  Globe,
  Activity,
  AlertTriangle,
  Info,
  XCircle,
  Shield,
  FileText,
  Code,
  Columns,
  Copy,
  Check
} from 'lucide-react';
import ChangesDiff from './ChangesDiff';
import auditService from '../../services/auditService';

// Iconos por severidad
const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  critical: Shield
};

const severityStyles = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-purple-100 text-purple-800 border-purple-200'
};

const InfoRow = ({ icon: Icon, label, value, mono = false }) => {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
        <div className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
};

const AuditLogDetailModal = ({ log, isOpen, onClose, loading = false }) => {
  const [diffViewMode, setDiffViewMode] = useState('inline');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const SeverityIcon = log ? severityIcons[log.severity] || Info : Info;
  const severityInfo = log ? auditService.formatSeverity(log.severity) : { label: 'Info' };

  const handleCopyId = () => {
    if (log?.id) {
      navigator.clipboard.writeText(log.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50"
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-teal-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detalle del Log
                  </h2>
                  {log && (
                    <button
                      onClick={handleCopyId}
                      className="text-xs text-gray-500 hover:text-gray-700 font-mono flex items-center gap-1"
                    >
                      {log.id}
                      {copied ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
              </div>
            ) : log ? (
              <div className="max-h-[70vh] overflow-y-auto">
                {/* Severidad y Acción */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${severityStyles[log.severity]}`}>
                      <SeverityIcon className="w-4 h-4" />
                      {severityInfo.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString('es-VE')}
                    </span>
                  </div>

                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="text-lg font-medium text-gray-900">
                      {auditService.formatAction(log.action)}
                    </div>
                    <div className="text-sm text-gray-500 font-mono mt-1">
                      {log.action}
                    </div>
                  </div>
                </div>

                {/* Información general */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Información General</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <InfoRow
                        icon={Clock}
                        label="Fecha y Hora"
                        value={new Date(log.createdAt).toLocaleString('es-VE', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      />
                      <InfoRow
                        icon={User}
                        label="Usuario"
                        value={log.user ? `${log.user.name || log.user.email} (ID: ${log.userId})` : 'Sistema'}
                      />
                      <InfoRow
                        icon={Activity}
                        label="Recurso"
                        value={`${auditService.formatResource(log.resource)} ${log.resourceId ? `(ID: ${log.resourceId})` : ''}`}
                      />
                    </div>

                    <div className="space-y-1">
                      <InfoRow
                        icon={Monitor}
                        label="Dirección IP"
                        value={log.ipAddress}
                        mono
                      />
                      <InfoRow
                        icon={Globe}
                        label="User Agent"
                        value={log.userAgent}
                      />
                      <InfoRow
                        icon={MapPin}
                        label="Ubicación"
                        value={log.metadata?.location || log.metadata?.geo}
                      />
                    </div>
                  </div>
                </div>

                {/* Cambios */}
                {(log.changesBefore || log.changesAfter) && (
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">Cambios Realizados</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDiffViewMode('inline')}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            diffViewMode === 'inline'
                              ? 'bg-teal-100 text-teal-800'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Activity className="w-4 h-4 inline mr-1" />
                          Por campo
                        </button>
                        <button
                          onClick={() => setDiffViewMode('sideBySide')}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            diffViewMode === 'sideBySide'
                              ? 'bg-teal-100 text-teal-800'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          <Columns className="w-4 h-4 inline mr-1" />
                          JSON
                        </button>
                      </div>
                    </div>

                    <ChangesDiff
                      before={log.changesBefore}
                      after={log.changesAfter}
                      viewMode={diffViewMode}
                    />
                  </div>
                )}

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Metadata Adicional</h3>
                    <pre className="bg-gray-100 rounded-lg p-4 text-sm overflow-auto max-h-48 font-mono text-gray-800">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Acciones */}
                <div className="px-6 py-4 flex justify-end gap-3 bg-gray-50">
                  <button
                    onClick={handleCopyJSON}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Code className="w-4 h-4" />
                        Copiar JSON
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                No se encontró el log
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AuditLogDetailModal;
