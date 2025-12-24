/**
 * SecurityAlertsWidget Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Widget para mostrar alertas de seguridad recientes
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  XCircle,
  ChevronRight,
  RefreshCw,
  Clock,
  User,
  Monitor,
  Bell,
  BellOff
} from 'lucide-react';
import auditService from '../../services/auditService';

const severityIcons = {
  warning: AlertTriangle,
  error: XCircle,
  critical: Shield
};

const severityColors = {
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-500',
    text: 'text-yellow-800'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    text: 'text-red-800'
  },
  critical: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-500',
    text: 'text-purple-800'
  }
};

const AlertItem = ({ alert, onClick }) => {
  const colors = severityColors[alert.severity] || severityColors.warning;
  const Icon = severityIcons[alert.severity] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      onClick={() => onClick(alert)}
      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`font-medium ${colors.text}`}>
            {auditService.formatAction(alert.action)}
          </div>

          <div className="mt-1 text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {new Date(alert.createdAt).toLocaleString('es-VE')}
            </div>
            {alert.user && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                {alert.user.email || `Usuario ID: ${alert.userId}`}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Monitor className="w-3 h-3" />
              <span className="font-mono text-xs">{alert.ipAddress}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );
};

const SecurityAlertsWidget = ({
  alerts = [],
  loading = false,
  count = 0,
  onRefresh,
  onViewAlert,
  onViewAll,
  compact = false
}) => {
  const [showAll, setShowAll] = useState(false);

  const displayedAlerts = compact && !showAll
    ? alerts.slice(0, 3)
    : alerts;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Alertas de Seguridad</h3>
              <p className="text-sm text-gray-500">Últimas 24 horas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {count > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                {count}
              </span>
            )}
            <button
              onClick={() => onRefresh()}
              disabled={loading}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && alerts.length === 0 ? (
          <div className="py-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-2">Cargando alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-8 text-center">
            <BellOff className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-2">No hay alertas de seguridad</p>
            <p className="text-sm text-gray-400">Todo parece estar en orden</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {displayedAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onClick={onViewAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          {compact && alerts.length > 3 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              {showAll ? 'Ver menos' : `Ver ${alerts.length - 3} más`}
            </button>
          )}

          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium inline-flex items-center gap-1"
            >
              Ver todos los logs
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SecurityAlertsWidget;
