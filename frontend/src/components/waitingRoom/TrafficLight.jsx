/**
 * TrafficLight - CITAMED.VE
 * Semáforo visual inteligente para sala de espera
 *
 * Estados:
 * - RED: Espera tranquilo (3+ personas antes)
 * - YELLOW: Prepárate (1-2 personas antes)
 * - GREEN: Pasa a consulta (es tu turno)
 */

import { useEffect, useState } from 'react';
import './TrafficLight.css';

const TrafficLight = ({
  position,
  status,
  estimatedMinutes,
  onStatusChange
}) => {
  const [currentLight, setCurrentLight] = useState('red');
  const [message, setMessage] = useState('');
  const [subMessage, setSubMessage] = useState('');

  useEffect(() => {
    if (status === 'called' || status === 'in_consultation') {
      setCurrentLight('green');
      setMessage('Pasa a consulta');
      setSubMessage('El doctor te espera');
    } else if (position === 1) {
      setCurrentLight('yellow');
      setMessage('Prepárate');
      setSubMessage('Eres el siguiente');
    } else if (position === 2) {
      setCurrentLight('yellow');
      setMessage('Casi es tu turno');
      setSubMessage('1 persona antes de ti');
    } else if (position <= 4) {
      setCurrentLight('red');
      setMessage('Espera tranquilo');
      setSubMessage(`${position - 1} personas antes de ti`);
    } else {
      setCurrentLight('red');
      setMessage('En cola');
      setSubMessage(`Posición #${position}`);
    }

    if (onStatusChange) {
      onStatusChange(currentLight);
    }
  }, [position, status, currentLight, onStatusChange]);

  return (
    <div className="traffic-light-container">
      <div className={`traffic-light ${currentLight}`}>
        <div className={`light red ${currentLight === 'red' ? 'active' : ''}`}>
          <div className="light-glow"></div>
        </div>
        <div className={`light yellow ${currentLight === 'yellow' ? 'active' : ''}`}>
          <div className="light-glow"></div>
        </div>
        <div className={`light green ${currentLight === 'green' ? 'active' : ''}`}>
          <div className="light-glow"></div>
        </div>
      </div>

      <div className="traffic-info">
        <h2 className={`traffic-message ${currentLight}`}>{message}</h2>
        <p className="traffic-submessage">{subMessage}</p>

        {currentLight !== 'green' && estimatedMinutes > 0 && (
          <div className="time-estimate">
            <span className="time-value">~{estimatedMinutes}</span>
            <span className="time-unit">min</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafficLight;
