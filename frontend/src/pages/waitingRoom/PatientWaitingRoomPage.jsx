/**
 * PatientWaitingRoomPage - CITAMED.VE
 * M03 - Sala de Espera Virtual Enterprise
 *
 * LA JOYA DE LA CORONA - Experiencia completa del paciente:
 * - Semáforo visual inteligente
 * - Sillitas virtuales de la cola
 * - Geolocalización + tiempo de llegada
 * - Personas adelante/atrás
 * - Tiempo promedio de consulta
 * - Hora estimada de entrada
 * - Estado del doctor (adelantado/atrasado)
 * - Ejercicio de respiración
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  TrafficLight,
  LocationTracker,
  BreathingExercise,
  VirtualChairs,
  PatientPositionCard
} from '../../components/waitingRoom';
import useWaitingRoom from '../../hooks/useWaitingRoom';
import { useAuth } from '../../context/AuthContext';
import './PatientWaitingRoomPage.css';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const PatientWaitingRoomPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const token = localStorage.getItem('citamed_token');

  const {
    connected,
    error,
    myPosition,
    isMyTurn,
    isDoctorOnline,
    queue,
    stats,
    checkIn,
    cancelTurn,
    subscribeToDoctor,
    getMyPosition
  } = useWaitingRoom(token, 'patient');

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPhysicallyArrived, setHasPhysicallyArrived] = useState(false); // Check-in físico en consultorio
  const [showBreathing, setShowBreathing] = useState(false);
  const [clinicLocation, setClinicLocation] = useState(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [localQueue, setLocalQueue] = useState([]); // Cola cargada via API
  const [myQueueEntry, setMyQueueEntry] = useState(null); // Entrada en cola del paciente
  const [doctorStatus, setDoctorStatus] = useState({
    avgConsultationTime: 20,
    isAhead: false,
    isDelayed: false,
    delayMinutes: 0
  });

  // Verificar si hoy es el día de la cita
  const isAppointmentToday = useCallback(() => {
    if (!appointment?.appointmentDate) return false;
    const today = new Date().toISOString().split('T')[0];
    const aptDate = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    return today === aptDate;
  }, [appointment?.appointmentDate]);

  // Formatear la fecha de la cita para mostrar
  const formatAppointmentDate = useCallback(() => {
    if (!appointment?.appointmentDate) return '';
    return new Date(appointment.appointmentDate).toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }, [appointment?.appointmentDate]);

  // Cargar datos de la cita Y la cola del doctor
  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/appointments/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAppointment(data.data);

          // Ubicación de clínica (en producción vendría de la BD)
          setClinicLocation({
            lat: 10.4806 + (Math.random() * 0.02 - 0.01),
            lng: -66.9036 + (Math.random() * 0.02 - 0.01),
            address: data.data.clinic?.address || data.data.locationAddress || 'Av. Principal, Caracas'
          });

          if (data.data.doctorId) {
            subscribeToDoctor(data.data.doctorId);
            // Cargar cola del doctor via API
            fetchDoctorQueue(data.data.doctorId);
          }

          // Cargar mi entrada en la cola (si existe)
          fetchMyQueueEntry();

          // Verificar si ya hizo check-in FÍSICO (llegó al consultorio)
          if (data.data.queueStatus === 'checked_in' || data.data.queueStatus === 'waiting') {
            setHasPhysicallyArrived(true);
          }
        }
      } catch (err) {
        console.error('Error fetching appointment:', err);
      } finally {
        setLoading(false);
      }
    };

    // Cargar mi posición en la cola
    const fetchMyQueueEntry = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/waiting-room/my-position/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setMyQueueEntry(data.data);
            // Si ya está checked_in o waiting, marcar como llegada física
            if (['checked_in', 'waiting', 'called', 'in_consultation'].includes(data.data.status)) {
              setHasPhysicallyArrived(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching queue entry:', err);
      }
    };

    // Cargar cola del doctor via API REST (usa el endpoint de chairs para pacientes)
    const fetchDoctorQueue = async (doctorId) => {
      try {
        // Endpoint /chairs/:doctorId para ver las sillitas
        const response = await fetch(
          `${API_URL}/api/waiting-room/chairs/${doctorId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data?.chairs) {
            // Convertir chairs a formato de queue
            const queueFromChairs = data.data.chairs
              .filter(c => c.occupied)
              .map(c => ({
                position: c.position,
                status: c.status,
                patient: c.patient,
                patientName: c.patient?.initials || '??',
                isCheckedIn: c.patient?.isCheckedIn
              }));
            setLocalQueue(queueFromChairs);
          }
        }

        // También intentar obtener stats del doctor via queue/:doctorId
        const queueResponse = await fetch(
          `${API_URL}/api/waiting-room/queue/${doctorId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          if (queueData.data?.queue) {
            setLocalQueue(queueData.data.queue);
          }
          if (queueData.data?.stats) {
            setDoctorStatus(prev => ({
              ...prev,
              avgConsultationTime: queueData.data.stats.avgConsultationTime || 20
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching queue:', err);
      }
    };

    if (appointmentId && token) {
      fetchAppointment();
    } else {
      setLoading(false);
    }
  }, [appointmentId, token, subscribeToDoctor]);

  // Polling de posición y actualización de stats
  useEffect(() => {
    // Siempre hacer polling si estamos en la cola (scheduled o checked_in)
    if (myQueueEntry && appointmentId) {
      getMyPosition(appointmentId);
      const interval = setInterval(() => getMyPosition(appointmentId), 10000);
      return () => clearInterval(interval);
    }
  }, [myQueueEntry, appointmentId, getMyPosition]);

  // Actualizar estado del doctor basado en stats
  useEffect(() => {
    if (stats) {
      const avgTime = stats.avgConsultationTime || 20;
      const scheduledTime = appointment?.appointmentTime;

      if (scheduledTime && myPosition?.position) {
        // Calcular si va adelantado o atrasado
        const now = new Date();
        const [hours, mins] = scheduledTime.split(':').map(Number);
        const scheduled = new Date();
        scheduled.setHours(hours, mins, 0, 0);

        const estimatedWait = (myPosition.position - 1) * avgTime;
        const estimatedEntry = new Date(now.getTime() + estimatedWait * 60000);

        const diffMinutes = Math.round((estimatedEntry - scheduled) / 60000);

        setDoctorStatus({
          avgConsultationTime: avgTime,
          isAhead: diffMinutes < -5,
          isDelayed: diffMinutes > 5,
          delayMinutes: Math.abs(diffMinutes)
        });
      }
    }
  }, [stats, appointment, myPosition]);

  // Check-in físico: cuando el paciente llega al consultorio el día de la cita
  const handlePhysicalCheckIn = async () => {
    if (!appointment) return;

    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/check-in`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ appointmentId })
        }
      );

      if (response.ok) {
        setHasPhysicallyArrived(true);
        checkIn(appointmentId, appointment.doctorId);
        // Actualizar el estado de la entrada en cola
        setMyQueueEntry(prev => prev ? { ...prev, status: 'checked_in' } : null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error al confirmar llegada');
      }
    } catch (err) {
      console.error('Error checking in:', err);
    }
  };

  const handleCancelTurn = async () => {
    if (!myPosition?.queueEntryId) return;
    if (!confirm('¿Estás seguro de cancelar tu turno?')) return;

    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/cancel/${myPosition.queueEntryId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ reason: 'Cancelado por el paciente' })
        }
      );

      if (response.ok) {
        cancelTurn(myPosition.queueEntryId, 'Cancelado por el paciente');
        navigate('/paciente/mis-citas');
      }
    } catch (err) {
      console.error('Error cancelling turn:', err);
    }
  };

  // Marcar como "en camino" cuando el paciente sale
  const handleShouldLeave = useCallback(async () => {
    if (Notification.permission === 'granted') {
      new Notification('CITAMED - Sala de Espera', {
        body: '¡Sal ahora! Llegarás justo a tiempo para tu cita.',
        icon: '/favicon.ico'
      });
    }

    // Marcar como "en camino" en el backend
    if (myPosition?.queueEntryId) {
      try {
        await fetch(
          `${API_URL}/api/waiting-room/en-route/${myPosition.queueEntryId}`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        console.log('[WaitingRoom] Marked as en_route');
      } catch (err) {
        console.error('Error marking en_route:', err);
      }
    }
  }, [myPosition, token]);

  // Confirmar llegada física al consultorio (FASE 3)
  const handleConfirmArrival = useCallback(async () => {
    if (!myPosition?.queueEntryId) return;

    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/confirm-arrival/${myPosition.queueEntryId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        setHasArrived(true);
        // Mostrar notificación de éxito
        if (Notification.permission === 'granted') {
          new Notification('CITAMED - ¡Llegaste!', {
            body: 'Tu llegada ha sido registrada. El doctor te llamará pronto.',
            icon: '/favicon.ico'
          });
        }
      }
    } catch (err) {
      console.error('Error confirming arrival:', err);
    }
  }, [myPosition, token]);

  // Handler legacy para compatibilidad
  const handleArrived = useCallback(() => {
    handleConfirmArrival();
  }, [handleConfirmArrival]);

  // Pedir permiso de notificaciones
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Construir data para VirtualChairs
  const buildChairsData = () => {
    // Usar la cola de WebSocket si existe, sino usar la cargada por API
    const activeQueue = queue?.length > 0 ? queue : localQueue;
    const totalChairs = Math.max(activeQueue?.length || 0, 8);
    const chairs = [];

    for (let i = 1; i <= totalChairs; i++) {
      const queueEntry = activeQueue?.find(q => q.position === i);
      const patientName = queueEntry?.patientName || queueEntry?.patient?.name || '';
      chairs.push({
        position: i,
        occupied: !!queueEntry,
        status: queueEntry?.status || 'empty',
        patient: queueEntry ? {
          initials: patientName.split(' ').map(n => n[0]).join('').slice(0, 2) || '??',
          isInConsultation: queueEntry.status === 'in_consultation',
          isCalled: queueEntry.status === 'called',
          isCheckedIn: queueEntry.status === 'checked_in' || queueEntry.isCheckedIn
        } : null
      });
    }

    return chairs;
  };

  // Obtener total en cola
  const getQueueLength = () => {
    const activeQueue = queue?.length > 0 ? queue : localQueue;
    return activeQueue?.length || 0;
  };

  // Calcular hora estimada de entrada
  const getEstimatedEntryTime = () => {
    if (!myPosition?.position) return null;

    const now = new Date();
    const waitMinutes = (myPosition.position - 1) * doctorStatus.avgConsultationTime;
    const entry = new Date(now.getTime() + waitMinutes * 60000);

    return entry.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="waiting-room-page loading">
        <div className="loading-container">
          <div className="loading-pulse"></div>
          <p>Cargando sala de espera...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="waiting-room-page error-state">
        <div className="error-container">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2>Cita no encontrada</h2>
          <p>No pudimos encontrar la información de tu cita.</p>
          <button onClick={() => navigate('/paciente/mis-citas')} className="btn-primary">
            Ver mis citas
          </button>
        </div>
      </div>
    );
  }

  const doctorName = `Dr. ${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim();
  const specialty = appointment.doctorProfile?.specialty?.name || 'Medicina General';
  // Usar myQueueEntry primero, luego myPosition del WebSocket
  const position = myQueueEntry?.position || myPosition?.position || 0;
  const currentStatus = myQueueEntry?.status || myPosition?.status || 'scheduled';
  const estimatedMinutes = myQueueEntry?.estimatedWaitMinutes || myPosition?.estimatedMinutes || ((position - 1) * doctorStatus.avgConsultationTime);
  const peopleAhead = myQueueEntry?.appointmentsAhead ?? Math.max(0, position - 1);
  const peopleBehind = Math.max(0, (queue?.length || localQueue?.length || 0) - position);

  // Determinar si el usuario necesita confirmar llegada (está en cola pero no ha hecho check-in físico)
  const needsArrivalConfirmation = myQueueEntry && ['scheduled', 'en_route'].includes(currentStatus) && isAppointmentToday();

  return (
    <div className="waiting-room-page enterprise">
      {/* Header */}
      <header className="wr-header">
        <div className="header-left">
          <button onClick={() => navigate(-1)} className="btn-back" aria-label="Volver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="header-info">
            <h1>Sala de Espera Virtual</h1>
            <div className="header-meta">
              <span className="doctor-name">{doctorName}</span>
              <span className="separator">•</span>
              <span className="specialty">{specialty}</span>
            </div>
          </div>
        </div>
        <div className="header-center">
          <div className={`connection-badge ${connected ? 'online' : 'offline'}`}>
            <span className="connection-dot"></span>
            <span className="connection-text">{connected ? 'En línea' : 'Reconectando...'}</span>
          </div>
        </div>
        <div className="header-right">
          <Link to="/paciente/mis-citas" className="nav-link">Mis Citas</Link>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <main className="wr-content">
        {/* Vista cuando NO tienes entrada en cola (caso raro - cita sin cola) */}
        {!myQueueEntry ? (
          <div className="pre-checkin no-queue">
            <div className="checkin-card">
              <div className="card-header warning">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2>Cita Programada</h2>
                <p>Esta cita no tiene entrada en la cola virtual aún</p>
              </div>

              <div className="appointment-details">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Doctor</span>
                    <span className="detail-value">{doctorName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Hora programada</span>
                    <span className="detail-value highlight">{appointment.appointmentTime}</span>
                  </div>
                </div>
              </div>

              <p className="checkin-hint">Contacta a la clínica si tienes dudas sobre tu cita.</p>
            </div>

            <VirtualChairs
              chairs={buildChairsData()}
              totalInQueue={getQueueLength()}
              inConsultation={localQueue?.some(q => q.status === 'in_consultation')}
              myPosition={null}
            />
          </div>
        ) : (
          /* Vista Post Check-in - En cola */
          <div className="in-queue">
            {/* Fila superior: Semáforo + Stats del Doctor */}
            <div className="top-row">
              <TrafficLight
                position={position}
                status={isMyTurn ? 'called' : currentStatus}
                estimatedMinutes={estimatedMinutes}
              />

              {/* Panel de estadísticas del doctor */}
              <div className="doctor-stats-panel">
                <h3>Estado de la Consulta</h3>

                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <div className="stat-content">
                      <span className="stat-value">{doctorStatus.avgConsultationTime} min</span>
                      <span className="stat-label">Duración promedio</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <span className="stat-icon">🕐</span>
                    <div className="stat-content">
                      <span className="stat-value">{getEstimatedEntryTime() || '--:--'}</span>
                      <span className="stat-label">Hora estimada entrada</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <div className="stat-content">
                      <span className="stat-value">{peopleAhead}</span>
                      <span className="stat-label">Personas delante</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <span className="stat-icon">👤</span>
                    <div className="stat-content">
                      <span className="stat-value">{peopleBehind}</span>
                      <span className="stat-label">Personas detrás</span>
                    </div>
                  </div>
                </div>

                {/* Estado adelantado/atrasado */}
                <div className={`doctor-timing ${doctorStatus.isDelayed ? 'delayed' : doctorStatus.isAhead ? 'ahead' : 'on-time'}`}>
                  {doctorStatus.isDelayed ? (
                    <>
                      <span className="timing-icon">⚠️</span>
                      <span>El doctor va {doctorStatus.delayMinutes} min atrasado</span>
                    </>
                  ) : doctorStatus.isAhead ? (
                    <>
                      <span className="timing-icon">🚀</span>
                      <span>El doctor va {doctorStatus.delayMinutes} min adelantado</span>
                    </>
                  ) : (
                    <>
                      <span className="timing-icon">✅</span>
                      <span>El doctor va a tiempo</span>
                    </>
                  )}
                </div>

                {/* Estado online del doctor */}
                <div className={`doctor-online-status ${isDoctorOnline ? 'online' : 'offline'}`}>
                  <span className="status-dot"></span>
                  <span>{isDoctorOnline ? 'Doctor atendiendo' : 'Doctor no disponible'}</span>
                </div>
              </div>
            </div>

            {/* Sillitas virtuales - Tu posición resaltada */}
            <VirtualChairs
              chairs={buildChairsData()}
              totalInQueue={getQueueLength()}
              inConsultation={buildChairsData().some(c => c.patient?.isInConsultation)}
              myPosition={position}
            />

            {/* Fila inferior: Ubicación + Info de cita */}
            <div className="bottom-row">
              <LocationTracker
                clinicLocation={clinicLocation}
                estimatedWaitMinutes={estimatedMinutes}
                position={position}
                onShouldLeave={handleShouldLeave}
                onArrived={handleArrived}
              />

              <div className="appointment-panel">
                <h3>Tu Cita</h3>
                <div className="panel-content">
                  <div className="info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <span className="row-label">Doctor</span>
                      <span className="row-value">{doctorName}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <span className="row-label">Hora programada</span>
                      <span className="row-value">{appointment.appointmentTime}</span>
                    </div>
                  </div>
                  <div className="info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div>
                      <span className="row-label">Ubicación</span>
                      <span className="row-value">{clinicLocation?.address || 'No especificada'}</span>
                    </div>
                  </div>

                  {/* Estado actual en la cola */}
                  <div className={`queue-status-indicator status-${currentStatus}`}>
                    {currentStatus === 'scheduled' && (
                      <>📋 Agendado - Ya estás en la cola</>
                    )}
                    {currentStatus === 'en_route' && (
                      <>🚗 En camino al consultorio</>
                    )}
                    {currentStatus === 'waiting' && (
                      <>🏠 En cola virtual</>
                    )}
                    {currentStatus === 'checked_in' && (
                      <>✅ Presente en el consultorio</>
                    )}
                    {currentStatus === 'called' && (
                      <>📢 ¡Es tu turno!</>
                    )}
                    {currentStatus === 'in_consultation' && (
                      <>👨‍⚕️ En consulta</>
                    )}
                  </div>

                  {hasArrived && (
                    <div className="arrived-indicator">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Estás en el consultorio
                    </div>
                  )}
                </div>

                <div className="panel-actions">
                  {/* Botón de confirmar llegada cuando aplica */}
                  {needsArrivalConfirmation && (
                    <button onClick={handlePhysicalCheckIn} className="btn-arrival">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Confirmar Llegada
                    </button>
                  )}
                  <button onClick={handleCancelTurn} className="btn-cancel">
                    Cancelar turno
                  </button>
                </div>
              </div>
            </div>

            {/* Ejercicio de respiración */}
            <div className="breathing-section">
              {showBreathing ? (
                <BreathingExercise onToggle={() => setShowBreathing(false)} />
              ) : (
                <button className="breathing-toggle" onClick={() => setShowBreathing(true)}>
                  <span className="breathing-icon">🧘</span>
                  <span>¿Nervioso? Prueba el ejercicio de respiración</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="wr-footer">
        <p>CITAMED.VE - Sala de Espera Virtual</p>
      </footer>
    </div>
  );
};

export default PatientWaitingRoomPage;
