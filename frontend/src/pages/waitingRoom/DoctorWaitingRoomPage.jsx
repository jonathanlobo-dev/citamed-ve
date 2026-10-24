/**
 * DoctorWaitingRoomPage - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Dashboard del doctor para manejar la cola en tiempo real
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DoctorQueueDashboard from '../../components/waitingRoom/DoctorQueueDashboard';
import AssistantDoctorBanner from '../../components/assistant/AssistantDoctorBanner';
import useWaitingRoom from '../../hooks/useWaitingRoom';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import prescriptionAPI from '../../services/prescriptionService';
import api from '../../services/api';
import './DoctorWaitingRoomPage.css';

const DoctorWaitingRoomPage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const token = localStorage.getItem('citamed_token');
  const user = authUser || JSON.parse(localStorage.getItem('citamed_user') || '{}');

  const {
    connected,
    reconnecting,
    error,
    queue,
    stats,
    goOnline,
    goOffline,
    callNextPatient,
    callSpecificPatient
  } = useWaitingRoom(token, 'doctor');

  // Persistir estado online en localStorage
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('citamed_doctor_online');
    return saved === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [localQueue, setLocalQueue] = useState([]);
  const [localStats, setLocalStats] = useState({});

  // Expediente mínimo y alergias del paciente
  const [currentPatientHistory, setCurrentPatientHistory] = useState(null);
  const [loadingCurrentHistory, setLoadingCurrentHistory] = useState(false);

  // Sincronizar historial del paciente actualmente en consulta (solo para médico)
  useEffect(() => {
    if (user?.role === 'assistant') {
      setCurrentPatientHistory(null);
      return;
    }
    const inConsultation = localQueue.find((p) => p.status === 'in_consultation');
    const pId = inConsultation?.patientId || inConsultation?.patient?.id;
    if (pId) {
      setLoadingCurrentHistory(true);
      appointmentService
        .getPatientHistory(pId)
        .then((res) => setCurrentPatientHistory(res.data))
        .catch((err) => {
          console.error('Error cargando historial de paciente en consulta:', err);
          setCurrentPatientHistory(null);
        })
        .finally(() => setLoadingCurrentHistory(false));
    } else {
      setCurrentPatientHistory(null);
    }
  }, [localQueue, user?.role]);

  // Cargar cola inicial via API
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await api.get('/waiting-room/queue');
        const data = response.data;
        setLocalQueue(data.data?.queue || []);
        setLocalStats(data.data?.stats || {});
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQueue();
    } else {
      // Sin token, dejar de cargar y mostrar la página vacía
      setLoading(false);
    }
  }, [token]);

  // Actualizar con datos de WebSocket
  useEffect(() => {
    if (queue.length > 0) {
      setLocalQueue(queue);
    }
    if (Object.keys(stats).length > 0) {
      setLocalStats(stats);
    }
  }, [queue, stats]);

  const handleGoOnline = () => {
    goOnline();
    setIsOnline(true);
    localStorage.setItem('citamed_doctor_online', 'true');
  };

  const handleGoOffline = () => {
    goOffline();
    setIsOnline(false);
    localStorage.setItem('citamed_doctor_online', 'false');
  };

  // Al conectarse el WebSocket, re-emitir estado online si estaba activo
  useEffect(() => {
    if (connected && isOnline) {
      goOnline();
    }
  }, [connected]);

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      await api.post('/waiting-room/call-next');
      callNextPatient();
      await refreshQueue();
    } catch (err) {
      console.error('Error calling next:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallPatient = async (queueEntryId) => {
    setActionLoading(true);
    try {
      await api.post(`/waiting-room/call/${queueEntryId}`);
      callSpecificPatient(queueEntryId);
      await refreshQueue();
    } catch (err) {
      console.error('Error calling patient:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhysicalCheckIn = async (queueEntryId) => {
    setActionLoading(true);
    try {
      await api.put(`/waiting-room/physical-check-in/${queueEntryId}`);
      await refreshQueue();
    } catch (err) {
      console.error('Error recording physical check-in:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartConsultation = async (queueEntryId, appointmentId) => {
    if (user?.role === 'assistant') return;
    setActionLoading(true);
    try {
      const response = await api.post(`/waiting-room/start-consultation/${queueEntryId}`);
      const entry = localQueue.find((q) => q.id === queueEntryId);
      let aptId = appointmentId || entry?.appointmentId || entry?.appointment?.id;

      if (response.data?.data?.appointmentId) {
        aptId = response.data.data.appointmentId;
      }
      if (aptId) {
        navigate(`/medico/consulta/${aptId}`);
      } else {
        await refreshQueue();
      }
    } catch (err) {
      console.error('Error starting consultation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndConsultation = (queueEntryId, appointmentId) => {
    if (user?.role === 'assistant') return;
    const entry = localQueue.find((q) => q.id === queueEntryId);
    const aptId = appointmentId || entry?.appointmentId || entry?.appointment?.id || queueEntryId;
    if (aptId) {
      navigate(`/medico/consulta/${aptId}`);
    }
  };

  const handleDownloadPrescriptionPdf = async (prescriptionId) => {
    try {
      const response = await prescriptionAPI.downloadPdf(prescriptionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recipe-CitaMed-${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Error al descargar el PDF del récipe');
    }
  };

  const handleMarkNoShow = async (queueEntryId) => {
    if (!confirm('¿Marcar paciente como no presentado?')) return;

    setActionLoading(true);
    try {
      await api.put(`/waiting-room/no-show/${queueEntryId}`);
      await refreshQueue();
    } catch (err) {
      console.error('Error marking no-show:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const refreshQueue = async () => {
    try {
      const response = await api.get('/waiting-room/queue');
      const data = response.data;
      setLocalQueue(data.data?.queue || []);
      setLocalStats(data.data?.stats || {});
    } catch (err) {
      console.error('Error refreshing queue:', err);
    }
  };

  if (loading) {
    return (
      <div className="doctor-waiting-room loading">
        <div className="spinner"></div>
        <p>Cargando panel de consultas...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="doctor-waiting-room error">
        <p>Sesión no válida. Por favor inicie sesión nuevamente.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Ir a Login
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="doctor-waiting-room">
      <AssistantDoctorBanner />
      {/* Header de navegación */}
      <header className="doctor-wr-header">
        <div className="header-left">
          <Link
            to={user?.role === 'assistant' ? '/asistente' : '/medico/dashboard'}
            className="btn-back"
            title={user?.role === 'assistant' ? 'Volver al Portal' : 'Volver al Dashboard'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="header-brand">
            <h1>Sala de Espera Virtual</h1>
            <span className="header-subtitle">
              {user?.role === 'assistant' ? 'Portal de Asistente' : 'Panel del Doctor'}
            </span>
          </div>
        </div>

        <div className="header-center">
          <div className={`connection-status ${connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{connected ? 'Conectado' : reconnecting ? 'Reconectando...' : 'Sin conexión'}</span>
          </div>
        </div>

        <div className="header-right">
          {user?.role !== 'assistant' && (
            <Link
              to="/medico/consulta/nueva"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm mr-2"
              style={{ backgroundColor: 'var(--primary, #0284c7)', color: '#fff', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva consulta
            </Link>
          )}
          <nav className="header-nav">
            <Link to={user?.role === 'assistant' ? '/asistente' : '/medico/dashboard'} className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {user?.role === 'assistant' ? 'Portal' : 'Dashboard'}
            </Link>
            <Link to="/medico/agenda" className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Agenda
            </Link>
          </nav>

          <div className="user-menu">
            <span className="user-name">
              {user?.role === 'assistant'
                ? `${user?.firstName || 'Asistente'} (Asistente)`
                : `Dr. ${user?.firstName || ''}`}
            </span>
            <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {reconnecting && (
        <div className="connection-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Conexión perdida. Reconectando...
        </div>
      )}

      {!connected && !reconnecting && (
        <div className="connection-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Sin conexión en tiempo real. Mostrando datos actualizados periódicamente.
        </div>
      )}

      <main className="doctor-wr-content">
        <DoctorQueueDashboard
          queue={localQueue}
          stats={localStats}
          isOnline={isOnline}
          actionLoading={actionLoading}
          userRole={user?.role}
          onGoOnline={handleGoOnline}
          onGoOffline={handleGoOffline}
          onCallNext={handleCallNext}
          onCallPatient={handleCallPatient}
          onPhysicalCheckIn={handlePhysicalCheckIn}
          onStartConsultation={handleStartConsultation}
          onEndConsultation={handleEndConsultation}
          onMarkNoShow={handleMarkNoShow}
          currentPatientHistory={currentPatientHistory}
          loadingCurrentHistory={loadingCurrentHistory}
          onDownloadPrescriptionPdf={handleDownloadPrescriptionPdf}
        />
      </main>
    </div>
  );
};

export default DoctorWaitingRoomPage;
