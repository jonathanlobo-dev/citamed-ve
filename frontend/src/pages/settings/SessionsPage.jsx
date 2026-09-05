// src/pages/settings/SessionsPage.jsx
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Página de gestión de sesiones activas e historial

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  History,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Loader,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useSession from '../../hooks/useSession';
import SessionCard from '../../components/settings/SessionCard';
import LoginHistoryTable from '../../components/settings/LoginHistoryTable';
import Button from '../../components/common/Button/button';
import toast from 'react-hot-toast';

const SessionsPage = () => {
  const navigate = useNavigate();
  const { user, getDashboardPath } = useAuth();
  const [activeTab, setActiveTab] = useState('sessions');
  const [showRevokeAllModal, setShowRevokeAllModal] = useState(false);

  const {
    sessions,
    sessionsLoading,
    sessionsError,
    fetchActiveSessions,
    revokeSession,
    revokeAllSessions,
    revoking,
    revokingAll,
    loginHistory,
    historyLoading,
    historyHasMore,
    fetchLoginHistory,
    loadMoreHistory,
    suspiciousSessions,
    fetchSuspiciousSessions
  } = useSession();

  // Cargar datos iniciales
  useEffect(() => {
    fetchActiveSessions();
    fetchSuspiciousSessions();
  }, [fetchActiveSessions, fetchSuspiciousSessions]);

  // Cargar historial cuando cambia a esa tab
  useEffect(() => {
    if (activeTab === 'history' && loginHistory.length === 0) {
      fetchLoginHistory();
    }
  }, [activeTab, fetchLoginHistory, loginHistory.length]);

  // Manejar revocación de sesión
  const handleRevokeSession = async (sessionId) => {
    const result = await revokeSession(sessionId);
    if (result.success) {
      toast.success('Sesión cerrada correctamente');
    } else {
      toast.error(result.error || 'Error al cerrar sesión');
    }
  };

  // Manejar revocación de todas las sesiones
  const handleRevokeAll = async () => {
    const result = await revokeAllSessions();
    setShowRevokeAllModal(false);
    if (result.success) {
      toast.success(`${result.revokedCount} sesión(es) cerrada(s)`);
    } else {
      toast.error(result.error || 'Error al cerrar sesiones');
    }
  };

  // Refresh
  const handleRefresh = async () => {
    await fetchActiveSessions();
    toast.success('Lista actualizada');
  };

  const dashboardPath = user ? getDashboardPath(user.role) : '/';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(dashboardPath)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Seguridad y Sesiones
              </h1>
              <p className="text-sm text-gray-500">
                Gestiona tus dispositivos conectados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Alerta de sesiones sospechosas */}
        {suspiciousSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Sesiones sospechosas detectadas
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Se detectaron {suspiciousSessions.length} sesión(es) desde ubicaciones
                inusuales. Si no las reconoces, ciérralas inmediatamente.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Sesiones Activas
            {sessions.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'sessions' ? 'bg-white/20' : 'bg-gray-200'
              }`}>
                {sessions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <History className="w-4 h-4" />
            Historial de Accesos
          </button>
        </div>

        {/* Contenido */}
        <AnimatePresence mode="wait">
          {activeTab === 'sessions' ? (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {/* Acciones */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-500">
                  {sessions.length} dispositivo(s) conectado(s)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={sessionsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${sessionsLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                  {sessions.length > 1 && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRevokeAllModal(true)}
                      disabled={revokingAll}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar todas
                    </Button>
                  )}
                </div>
              </div>

              {/* Error */}
              {sessionsError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700">
                  {sessionsError}
                </div>
              )}

              {/* Lista de sesiones */}
              {sessionsLoading && sessions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hay sesiones activas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      isCurrent={session.isCurrent}
                      onRevoke={handleRevokeSession}
                      revoking={revoking}
                    />
                  ))}
                </div>
              )}

              {/* Info */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Mantén tu cuenta segura</p>
                  <p className="mt-1">
                    Si ves un dispositivo que no reconoces, cierra esa sesión
                    inmediatamente y cambia tu contraseña.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <LoginHistoryTable
                history={loginHistory}
                loading={historyLoading}
                onLoadMore={loadMoreHistory}
                hasMore={historyHasMore}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal confirmar cerrar todas */}
      <AnimatePresence>
        {showRevokeAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowRevokeAllModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <LogOut className="w-6 h-6" />
                <h3 className="text-lg font-bold">Cerrar todas las sesiones</h3>
              </div>

              <p className="text-gray-600 mb-6">
                Se cerrarán todas las sesiones en otros dispositivos. Tendrás que
                volver a iniciar sesión en cada uno de ellos.
              </p>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRevokeAllModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleRevokeAll}
                  disabled={revokingAll}
                >
                  {revokingAll ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Cerrando...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar todas
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SessionsPage;
