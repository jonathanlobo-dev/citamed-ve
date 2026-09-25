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
  onGoOffline,
  actionLoading = false
}) => {
  const [currentPatient, setCurrentPatient] = useState(null);

  useEffect(() => {
    const inConsultation = queue.find(p => p.status === 'in_consultation');
    setCurrentPatient(inConsultation || null);
  }, [queue]);

  const activeQueue = queue.filter(p => ['scheduled', 'waiting', 'en_route', 'checked_in', 'called', 'in_consultation'].includes(p.status));
  const waitingPatients = queue.filter(p => ['scheduled', 'waiting', 'en_route', 'checked_in'].includes(p.status));
  const calledPatient = queue.find(p => p.status === 'called');

  // Contadores por estado
  const patientsScheduled = queue.filter(p => p.status === 'scheduled').length;
  const patientsWaiting = queue.filter(p => p.status === 'waiting').length;
  const patientsPresent = queue.filter(p => p.status === 'checked_in').length;

  // B2: Chips de estado (Agendado, En cola, Llegó, Llamado, En consulta)
  const getPatientStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <span className="patient-status-badge scheduled">📋 Agendado</span>;
      case 'waiting':
        return <span className="patient-status-badge waiting">🏠 En cola</span>;
      case 'en_route':
        return <span className="patient-status-badge en-route">🚗 En camino</span>;
      case 'checked_in':
        return <span className="patient-status-badge present">✅ Llegó</span>;
      case 'called':
        return <span className="patient-status-badge called">📢 Llamado</span>;
      case 'in_consultation':
        return <span className="patient-status-badge in-consultation">👨‍⚕️ En consulta</span>;
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
      {/* Header con estado online y botón grande de llamar al siguiente */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Panel de Consultas del Día</h2>
          <p className="today-date">
            {new Date().toLocaleDateString('es-VE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <div className="header-actions">
          {/* B2: Botón grande Llamar al siguiente */}
          <button
            type="button"
            className="btn btn-call-next-hero"
            onClick={onCallNext}
            disabled={actionLoading || !!currentPatient || !!calledPatient || waitingPatients.length === 0}
            title={waitingPatients.length === 0 ? 'No hay pacientes esperando' : 'Llamar al siguiente paciente en la cola'}
          >
            📢 Llamar al siguiente
          </button>

          <button
            type="button"
            className={`online-toggle ${isOnline ? 'online' : 'offline'}`}
            onClick={isOnline ? onGoOffline : onGoOnline}
            disabled={actionLoading}
          >
            <span className="status-dot"></span>
            {isOnline ? 'Online - Atendiendo' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{patientsScheduled}</span>
          <span className="stat-label">📋 Agendados</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{patientsWaiting}</span>
          <span className="stat-label">🏠 En cola</span>
        </div>
        <div className="stat-card highlight-green">
          <span className="stat-value">{patientsPresent}</span>
          <span className="stat-label">✅ Llegaron</span>
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
        {/* Panel de consulta actual o llamado */}
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
                  <span className="patient-status-badge in-consultation">👨‍⚕️ En consulta</span>
                </div>
              </div>
              <div className="consultation-timer">
                <span className="timer-label">En consulta desde</span>
                <span className="timer-value">
                  {formatTime(currentPatient.joinedAt || new Date())}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-success btn-end-consultation"
                onClick={() => onEndConsultation(currentPatient.id)}
                disabled={actionLoading}
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
                  <span className="status-called">📢 Paciente llamado al consultorio</span>
                  <span className="appointment-time">Cita: {calledPatient.appointmentTime}</span>
                </div>
              </div>
              <div className="called-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onStartConsultation(calledPatient.id)}
                  disabled={actionLoading}
                >
                  Iniciar Consulta
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onMarkNoShow(calledPatient.id)}
                  disabled={actionLoading}
                >
                  No asistió
                </button>
              </div>
            </div>
          ) : (
            <div className="no-patient">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No hay paciente en consulta actualmente</p>
              {waitingPatients.length > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onCallNext}
                  disabled={actionLoading}
                >
                  Llamar siguiente paciente
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cola de espera con botones por fila */}
        <div className="waiting-queue">
          <div className="queue-header">
            <h3>Turnos de Hoy</h3>
            <span className="queue-count">{activeQueue.length} paciente{activeQueue.length !== 1 ? 's' : ''}</span>
          </div>

          {activeQueue.length === 0 ? (
            <div className="empty-queue">
              <p>No hay pacientes en la cola para hoy</p>
            </div>
          ) : (
            <div className="queue-list">
              {activeQueue.map((patient) => {
                const isCurrent = patient.status === 'in_consultation';
                const isCalled = patient.status === 'called';

                return (
                  <div key={patient.id} className={`queue-item status-${patient.status} ${isCurrent ? 'active' : ''}`}>
                    <div className="queue-position">#{patient.position}</div>
                    <div className="patient-avatar">
                      {patient.patient.initials}
                    </div>
                    <div className="patient-info">
                      <span className="patient-name">{patient.patient.name}</span>
                      <span className="appointment-time">{patient.appointmentTime}</span>
                    </div>
                    <div className="queue-status">
                      {getPatientStatusBadge(patient.status)}
                    </div>
                    <div className="queue-wait-time">
                      <span className="wait-label">Espera est.:</span>
                      <span className="wait-value">{patient.estimatedWaitMinutes || 0} min</span>
                    </div>

                    {/* B2: Botones por fila según estado */}
                    <div className="queue-actions">
                      {/* Estado: Agendado, En cola, Llegó */}
                      {['scheduled', 'waiting', 'en_route', 'checked_in'].includes(patient.status) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline"
                            onClick={() => onCallPatient(patient.id)}
                            disabled={actionLoading || !!currentPatient || !!calledPatient}
                            title="Llamar a este paciente"
                          >
                            Llamar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onMarkNoShow(patient.id)}
                            disabled={actionLoading}
                            title="Marcar no asistió"
                          >
                            No asistió
                          </button>
                        </>
                      )}

                      {/* Estado: Llamado */}
                      {isCalled && (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => onStartConsultation(patient.id)}
                            disabled={actionLoading}
                          >
                            Iniciar consulta
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => onMarkNoShow(patient.id)}
                            disabled={actionLoading}
                          >
                            No asistió
                          </button>
                        </>
                      )}

                      {/* Estado: En consulta */}
                      {isCurrent && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => onEndConsultation(patient.id)}
                          disabled={actionLoading}
                        >
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorQueueDashboard;
