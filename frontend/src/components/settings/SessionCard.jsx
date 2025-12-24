// src/components/settings/SessionCard.jsx
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Componente para mostrar información de una sesión activa

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor,
  Smartphone,
  Tablet,
  HelpCircle,
  MapPin,
  Clock,
  AlertTriangle,
  Trash2,
  Shield,
  X
} from 'lucide-react';
import Button from '../common/button/button';

// Iconos según tipo de dispositivo
const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: HelpCircle
};

const SessionCard = ({ session, isCurrent, onRevoke, revoking }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const DeviceIcon = deviceIcons[session.deviceType] || HelpCircle;

  const handleRevoke = () => {
    if (isCurrent) return;
    setShowConfirm(true);
  };

  const confirmRevoke = async () => {
    setShowConfirm(false);
    await onRevoke(session.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border-2 p-4 relative ${
        isCurrent
          ? 'border-primary bg-primary/5'
          : session.isSuspicious
          ? 'border-yellow-400 bg-yellow-50'
          : 'border-gray-200'
      }`}
    >
      {/* Badge sesión actual */}
      {isCurrent && (
        <div className="absolute -top-2 -right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Este dispositivo
        </div>
      )}

      {/* Badge sospechoso */}
      {session.isSuspicious && !isCurrent && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Sospechoso
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icono dispositivo */}
        <div className={`p-3 rounded-lg ${
          isCurrent ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-600'
        }`}>
          <DeviceIcon className="w-6 h-6" />
        </div>

        {/* Info del dispositivo */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {session.deviceName || 'Dispositivo desconocido'}
          </h4>

          <div className="mt-2 space-y-1 text-sm text-gray-600">
            {/* Ubicación */}
            {session.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{session.location}</span>
              </div>
            )}

            {/* IP */}
            {session.ipAddress && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-mono text-xs">IP:</span>
                <span className="font-mono text-xs">{session.ipAddress}</span>
              </div>
            )}

            {/* Última actividad */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{session.lastActivityFormatted || 'Desconocido'}</span>
            </div>
          </div>
        </div>

        {/* Botón cerrar sesión */}
        {!isCurrent && (
          <div>
            {showConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Cancelar"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={confirmRevoke}
                  disabled={revoking}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Confirmar"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión en este dispositivo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SessionCard;
