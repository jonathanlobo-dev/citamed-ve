// src/components/settings/LoginHistoryTable.jsx
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Componente para mostrar historial de inicios de sesión

import { motion } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Loader
} from 'lucide-react';
import Button from '../common/Button/button';

// Iconos según tipo de dispositivo
const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle
};

const LoginHistoryRow = ({ record }) => {
  const DeviceIcon = deviceIcons[record.deviceType] || HelpCircle;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-gray-50 transition-colors"
    >
      {/* Fecha */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {new Date(record.loginAt).toLocaleDateString('es-VE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </div>
        <div className="text-xs text-gray-500">
          {new Date(record.loginAt).toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </td>

      {/* Estado */}
      <td className="px-4 py-3 whitespace-nowrap">
        {record.success ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            Exitoso
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 text-sm">
            <XCircle className="w-4 h-4" />
            Fallido
          </span>
        )}
      </td>

      {/* Dispositivo */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <DeviceIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-900 truncate max-w-[150px]">
            {record.deviceName || 'Desconocido'}
          </span>
        </div>
      </td>

      {/* Ubicación */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400" />
          {record.location || 'Desconocida'}
        </div>
      </td>

      {/* IP */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="font-mono text-xs text-gray-500">
          {record.ipAddress || '-'}
        </span>
      </td>

      {/* Razón de fallo */}
      {!record.success && record.failureReason && (
        <td className="px-4 py-3 text-xs text-red-500">
          {record.failureReason}
        </td>
      )}
    </motion.tr>
  );
};

const LoginHistoryTable = ({ history, loading, onLoadMore, hasMore }) => {
  if (loading && history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No hay historial de accesos disponible</p>
      </div>
    );
  }

  return (
    <div>
      {/* Tabla desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispositivo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ubicación
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((record) => (
              <LoginHistoryRow key={record.id} record={record} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden space-y-3">
        {history.map((record) => (
          <MobileHistoryCard key={record.id} record={record} />
        ))}
      </div>

      {/* Cargar más */}
      {hasMore && (
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              'Cargar más'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Versión móvil en cards
const MobileHistoryCard = ({ record }) => {
  const DeviceIcon = deviceIcons[record.deviceType] || HelpCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <DeviceIcon className="w-5 h-5 text-gray-400" />
          <span className="font-medium text-gray-900">
            {record.deviceName || 'Desconocido'}
          </span>
        </div>
        {record.success ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="mt-2 text-sm text-gray-600 space-y-1">
        <div>
          {new Date(record.loginAt).toLocaleDateString('es-VE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {record.location || 'Desconocida'}
        </div>
        <div className="font-mono text-xs text-gray-400">
          {record.ipAddress}
        </div>
      </div>

      {!record.success && record.failureReason && (
        <div className="mt-2 text-xs text-red-500">
          {record.failureReason}
        </div>
      )}
    </motion.div>
  );
};

export default LoginHistoryTable;
