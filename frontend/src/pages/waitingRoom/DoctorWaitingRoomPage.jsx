/**
 * DoctorWaitingRoomPage - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Dashboard del doctor para manejar la cola en tiempo real
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DoctorQueueDashboard from '../../components/waitingRoom/DoctorQueueDashboard';
import useWaitingRoom from '../../hooks/useWaitingRoom';
import { useAuth } from '../../context/AuthContext';
import './DoctorWaitingRoomPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DoctorWaitingRoomPage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const token = localStorage.getItem('citamed_token');
  const user = authUser || JSON.parse(localStorage.getItem('citamed_user') || '{}');

  const {
    connected,
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
  const [localQueue, setLocalQueue] = useState([]);
  const [localStats, setLocalStats] = useState({});

  // Cargar cola inicial via API
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await fetch(`${API_URL}/api/waiting-room/queue`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setLocalQueue(data.data?.queue || []);
          setLocalStats(data.data?.stats || {});
        } else {
          console.warn('[DoctorWaitingRoom] API responded with:', response.status);
        }
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
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/call-next`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        callNextPatient();
        refreshQueue();
      }
    } catch (err) {
      console.error('Error calling next:', err);
    }
  };

  const handleCallPatient = async (queueEntryId) => {
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/call/${queueEntryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        callSpecificPatient(queueEntryId);
        refreshQueue();
      }
    } catch (err) {
      console.error('Error calling patient:', err);
    }
  };

  const handleStartConsultation = async (queueEntryId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/start-consultation/${queueEntryId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        refreshQueue();
      }
    } catch (err) {
      console.error('Error starting consultation:', err);
    }
  };

  const handleEndConsultation = async (queueEntryId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/end-consultation/${queueEntryId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        refreshQueue();
      }
    } catch (err) {
      console.error('Error ending consultation:', err);
    }
  };

  const handleMarkNoShow = async (queueEntryId) => {
    if (!confirm('Marcar paciente como no presentado?')) return;

    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/no-show/${queueEntryId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        refreshQueue();
      }
    } catch (err) {
      console.error('Error marking no-show:', err);
    }
  };

  const refreshQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLocalQueue(data.data.queue || []);
        setLocalStats(data.data.stats || {});
      }
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
      {/* Header de navegación */}
      <header className="doctor-wr-header">
        <div className="header-left">
          <Link to="/medico/dashboard" className="btn-back" title="Volver al Dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="header-brand">
            <h1>Sala de Espera Virtual</h1>
            <span className="header-subtitle">Panel del Doctor</span>
          </div>
        </div>

        <div className="header-center">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{connected ? 'Conectado' : 'Desconectado'}</span>
          </div>
        </div>

        <div className="header-right">
          <nav className="header-nav">
            <Link to="/medico/dashboard" className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
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
            <span className="user-name">Dr. {user?.firstName || ''}</span>
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

      {!connected && (
        <div className="connection-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Conexión perdida. Reconectando...
        </div>
      )}

      <main className="doctor-wr-content">
        <DoctorQueueDashboard
          queue={localQueue}
          stats={localStats}
          isOnline={isOnline}
          onGoOnline={handleGoOnline}
          onGoOffline={handleGoOffline}
          onCallNext={handleCallNext}
          onCallPatient={handleCallPatient}
          onStartConsultation={handleStartConsultation}
          onEndConsultation={handleEndConsultation}
          onMarkNoShow={handleMarkNoShow}
        />
      </main>
    </div>
  );
};

export default DoctorWaitingRoomPage;
