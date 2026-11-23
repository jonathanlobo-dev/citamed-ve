/**
 * VirtualChairs - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA - Visualizacion de "las sillitas"
 * Representa visualmente la cola de espera
 */

import { useState, useEffect } from 'react';
import ChairIcon from './ChairIcon';
import './VirtualChairs.css';

// Color de la silla ocupada según el estado del paciente
const STATUS_COLORS = {
  waiting: '#6366f1',
  scheduled: '#6366f1',
  en_route: '#f59e0b',
  checked_in: '#3b82f6',
  called: '#eab308',
  in_consultation: '#10b981'
};

const VirtualChairs = ({ chairs = [], totalInQueue = 0, inConsultation = false, myPosition = null }) => {
  const getChairIcon = (chair) => {
    if (!chair.occupied) {
      return <ChairIcon className="chair-icon empty" size={44} color="#cbd5e1" />;
    }

    // Silla ocupada - Sistema de 3 Fases
    const status = chair.status || 'waiting';
    const isEnRoute = status === 'en_route' || chair.patient?.isEnRoute;
    const isCheckedIn = status === 'checked_in' || chair.patient?.isCheckedIn;
    const isCalled = status === 'called' || chair.patient?.isCalled;
    const isInConsultation = status === 'in_consultation' || chair.patient?.isInConsultation;

    return (
      <div className={`chair-occupied ${status}`}>
        <div className={`chair-person ${isEnRoute ? 'en-route' : ''}`}>
          <ChairIcon
            occupied
            size={48}
            color={STATUS_COLORS[isInConsultation ? 'in_consultation' : isCalled ? 'called' : isCheckedIn ? 'checked_in' : isEnRoute ? 'en_route' : 'waiting']}
          />
        </div>
        {isInConsultation && (
          <span className="status-badge consultation">En consulta</span>
        )}
        {isCalled && !isInConsultation && (
          <span className="status-badge called">Llamado</span>
        )}
        {isCheckedIn && !isCalled && !isInConsultation && (
          <span className="status-badge checked-in">Presente</span>
        )}
        {isEnRoute && !isCheckedIn && !isCalled && !isInConsultation && (
          <span className="status-badge en-route">En camino</span>
        )}
        {!isEnRoute && !isCheckedIn && !isCalled && !isInConsultation && (
          <span className="status-badge waiting">Esperando</span>
        )}
      </div>
    );
  };

  return (
    <div className="virtual-chairs-container">
      <div className="chairs-header">
        <h3>Sala de Espera Virtual</h3>
        <div className="queue-info">
          <span className="queue-count">
            {totalInQueue} {totalInQueue === 1 ? 'persona' : 'personas'} en cola
          </span>
          {inConsultation && (
            <span className="in-consultation-badge">
              Doctor atendiendo
            </span>
          )}
        </div>
      </div>

      <div className="chairs-grid">
        {chairs.map((chair, index) => (
          <div
            key={chair.position}
            className={`chair-slot ${chair.occupied ? 'occupied' : 'empty'} ${
              myPosition === chair.position ? 'my-position' : ''
            }`}
          >
            <div className="chair-number">{chair.position}</div>
            {getChairIcon(chair)}
            {myPosition === chair.position && (
              <div className="my-position-indicator">Tú</div>
            )}
          </div>
        ))}
      </div>

      <div className="chairs-legend">
        <div className="legend-item">
          <span className="legend-dot empty"></span>
          <span>Libre</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot waiting"></span>
          <span>En cola</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot en-route"></span>
          <span>En camino</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot checked-in"></span>
          <span>Presente</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot called"></span>
          <span>Llamado</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot in-consultation"></span>
          <span>En consulta</span>
        </div>
      </div>
    </div>
  );
};

export default VirtualChairs;
