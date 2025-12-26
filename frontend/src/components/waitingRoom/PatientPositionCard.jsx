/**
 * PatientPositionCard - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Tarjeta que muestra la posicion del paciente en la cola
 */

import { useState, useEffect } from 'react';
import './PatientPositionCard.css';

const PatientPositionCard = ({
  position,
  estimatedMinutes,
  status,
  doctorName,
  appointmentTime,
  onCancelTurn
}) => {
  const [timeRemaining, setTimeRemaining] = useState(estimatedMinutes);

  useEffect(() => {
    setTimeRemaining(estimatedMinutes);
  }, [estimatedMinutes]);

  const getStatusMessage = () => {
    switch (status) {
      case 'waiting':
        return 'En cola virtual';
      case 'checked_in':
        return 'Presente en consultorio';
      case 'called':
        return 'ES TU TURNO';
      case 'in_consultation':
        return 'En consulta';
      default:
        return 'En espera';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'called':
        return 'status-called';
      case 'in_consultation':
        return 'status-consultation';
      case 'checked_in':
        return 'status-checkedin';
      default:
        return 'status-waiting';
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className={`position-card ${getStatusColor()}`}>
      {status === 'called' && (
        <div className="turn-alert">
          <div className="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <span>ES TU TURNO - Dirigete al consultorio</span>
        </div>
      )}

      <div className="position-header">
        <div className="position-number-container">
          <span className="position-label">Tu posicion</span>
          <span className="position-number">{position}</span>
        </div>
        <div className="status-badge">{getStatusMessage()}</div>
      </div>

      <div className="position-details">
        <div className="detail-row">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="detail-content">
            <span className="detail-label">Tiempo estimado de espera</span>
            <span className="detail-value">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="detail-row">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="detail-content">
            <span className="detail-label">Doctor</span>
            <span className="detail-value">{doctorName}</span>
          </div>
        </div>

        <div className="detail-row">
          <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="detail-content">
            <span className="detail-label">Hora de cita</span>
            <span className="detail-value">{appointmentTime}</span>
          </div>
        </div>
      </div>

      {position > 1 && (
        <div className="people-ahead">
          <span className="ahead-count">{position - 1}</span>
          <span className="ahead-text">
            {position - 1 === 1 ? 'persona' : 'personas'} delante de ti
          </span>
        </div>
      )}

      {position === 1 && status !== 'called' && (
        <div className="next-badge">
          Eres el siguiente
        </div>
      )}

      <div className="position-actions">
        {status === 'called' && (
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-navigate"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Navegar al consultorio
          </a>
        )}

        {['waiting', 'checked_in'].includes(status) && onCancelTurn && (
          <button onClick={onCancelTurn} className="btn btn-secondary btn-cancel">
            Cancelar turno
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientPositionCard;
