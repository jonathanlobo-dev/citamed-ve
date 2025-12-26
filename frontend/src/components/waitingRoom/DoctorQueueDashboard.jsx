/**
 * DoctorQueueDashboard - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Dashboard del doctor para manejar la cola en tiempo real
 */

import { useState, useEffect } from 'react';
import './DoctorQueueDashboard.css';

const DoctorQueueDashboard = ({
  queue = [],
  stats = {},
  onCallNext,
  onCallPatient,
  onStartConsultation,
  onEndConsultation,
  onMarkNoShow,
  isOnline = false,
  onGoOnline,
  onGoOffline
}) => {
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    const inConsultation = queue.find(p => p.status === 'in_consultation');
    setCurrentPatient(inConsultation || null);
  }, [queue]);

  // Sistema de 3 Fases: waiting (en casa) → en_route (viniendo) → checked_in (presente)
  const waitingPatients = queue.filter(p => ['waiting', 'en_route', 'checked_in'].includes(p.status));
  const calledPatient = queue.find(p => p.status === 'called');

  // Contadores por estado para estadísticas
  const patientsWaiting = queue.filter(p => p.status === 'waiting').length;
  const patientsEnRoute = queue.filter(p => p.status === 'en_route').length;
  const patientsPresent = queue.filter(p => p.status === 'checked_in').length;

  // Función para obtener el estado visual del paciente
  const getPatientStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <span className="patient-status-badge waiting">🏠 En casa</span>;
      case 'en_route':
        return <span className="patient-status-badge en-route">🚗 En camino</span>;
      case 'checked_in':
        return <span className="patient-status-badge present">✅ Presente</span>;
      case 'called':
        return <span className="patient-status-badge called">📢 Llamado</span>;
      default:
        return null;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="doctor-dashboard">
      {/* Header con estado online */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Panel de Consultas del Dia</h2>
          <p className="today-date">
            {new Date().toLocaleDateString('es-VE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <button
          className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
          onClick={isOnline ? onGoOffline : onGoOnline}
        >
          <span className="status-dot"></span>
          {isOnline ? 'Online - Atendiendo' : 'Offline'}
        </button>
      </div>

      {/* Estadísticas del día - Sistema de 3 Fases */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{patientsWaiting}</span>
          <span className="stat-label">🏠 En casa</span>
        </div>
        <div className="stat-card highlight-orange">
          <span className="stat-value">{patientsEnRoute}</span>
          <span className="stat-label">🚗 En camino</span>
        </div>
        <div className="stat-card highlight-green">
          <span className="stat-value">{patientsPresent}</span>
          <span className="stat-label">✅ Presentes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.completedToday || 0}</span>
          <span className="stat-label">Atendidos hoy</span>
        </div>
      </div>

      {/* Tiempo promedio */}
      <div className="time-stats">
        <div className="time-stat">
          <span className="time-value">{stats.avgWaitTime || 0} min</span>
          <span className="time-label">Espera promedio</span>
        </div>
        <div className="time-stat">
          <span className="time-value">{stats.avgConsultationTime || 20} min</span>
          <span className="time-label">Consulta promedio</span>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Panel de consulta actual */}
        <div className="current-consultation">
          <h3>Consulta Actual</h3>
          {currentPatient ? (
            <div className="current-patient-card">
              <div className="patient-info">
                <div className="patient-avatar large">
                  {currentPatient.patient.initials}
                </div>
                <div className="patient-details">
                  <span className="patient-name">{currentPatient.patient.name}</span>
                  <span className="appointment-time">
                    Cita: {currentPatient.appointmentTime}
                  </span>
                </div>
              </div>
              <div className="consultation-timer">
                <span className="timer-label">En consulta desde</span>
                <span className="timer-value">
                  {formatTime(currentPatient.consultationStart)}
                </span>
              </div>
              <button
                className="btn btn-success btn-end-consultation"
                onClick={() => onEndConsultation(currentPatient.id)}
              >
                Finalizar Consulta
              </button>
            </div>
          ) : calledPatient ? (
            <div className="called-patient-card">
              <div className="patient-info">
                <div className="patient-avatar large called">
                  {calledPatient.patient.initials}
                </div>
                <div className="patient-details">
                  <span className="patient-name">{calledPatient.patient.name}</span>
                  <span className="status-called">Paciente llamado</span>
                </div>
              </div>
              <div className="called-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onStartConsultation(calledPatient.id)}
                >
                  Iniciar Consulta
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => onMarkNoShow(calledPatient.id)}
                >
                  No se presento
                </button>
              </div>
            </div>
          ) : (
            <div className="no-patient">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No hay paciente en consulta</p>
              {waitingPatients.length > 0 && (
                <button className="btn btn-primary" onClick={onCallNext}>
                  Llamar siguiente paciente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cola de espera */}
        <div className="waiting-queue">
          <div className="queue-header">
            <h3>Cola de Espera</h3>
            <span className="queue-count">{waitingPatients.length} pacientes</span>
          </div>

          {waitingPatients.length === 0 ? (
            <div className="empty-queue">
              <p>No hay pacientes en la cola</p>
            </div>
          ) : (
            <div className="queue-list">
              {waitingPatients.map((patient) => (
                <div key={patient.id} className={`queue-item status-${patient.status}`}>
                  <div className="queue-position">{patient.position}</div>
                  <div className={`patient-avatar ${patient.status === 'en_route' ? 'en-route' : ''}`}>
                    {patient.patient.initials}
                  </div>
                  <div className="patient-info">
                    <span className="patient-name">{patient.patient.name}</span>
                    <span className="appointment-time">{patient.appointmentTime}</span>
                    {patient.reasonForVisit && (
                      <span className="patient-reason" title={patient.reasonForVisit}>
                        📋 {patient.reasonForVisit.length > 25
                          ? patient.reasonForVisit.substring(0, 25) + '...'
                          : patient.reasonForVisit}
                      </span>
                    )}
                  </div>
                  <div className="queue-status">
                    {getPatientStatusBadge(patient.status)}
                  </div>
                  <div className="queue-wait-time">
                    <span className="wait-label">Espera:</span>
                    <span className="wait-value">{patient.estimatedWaitMinutes || 0} min</span>
                  </div>
                  <div className="queue-actions">
                    {patient.patient.phone && (
                      <a
                        href={`https://wa.me/${patient.patient.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-whatsapp"
                        title="Enviar WhatsApp"
                      >
                        💬
                      </a>
                    )}
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => onCallPatient(patient.id)}
                      disabled={!!currentPatient || !!calledPatient || patient.status === 'waiting'}
                      title={patient.status === 'waiting' ? 'El paciente aún no ha salido de casa' : 'Llamar paciente'}
                    >
                      {patient.status === 'waiting' ? '⏳' : '📢'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQueueDashboard;
