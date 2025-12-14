/**
 * useSocketEvent Hook - CITAMED.VE
 *
 * Hook para suscribirse a eventos específicos de Socket.io:
 * - Suscripción/desuscripción automática
 * - Soporte para múltiples eventos
 * - Historial de mensajes opcional
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../utils/socket';

/**
 * Hook para suscribirse a un evento de Socket.io
 *
 * @param {string} namespace - Namespace del socket
 * @param {string|string[]} events - Evento(s) a escuchar
 * @param {Function} callback - Función a ejecutar cuando llega el evento (opcional)
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.keepHistory - Mantener historial de mensajes (default: false)
 * @param {number} options.historyLimit - Límite de mensajes en historial (default: 50)
 * @returns {Object} - Último dato recibido y historial
 */
const useSocketEvent = (namespace, events, callback, options = {}) => {
  const {
    keepHistory = false,
    historyLimit = 50
  } = options;

  const [lastData, setLastData] = useState(null);
  const [history, setHistory] = useState([]);
  const callbackRef = useRef(callback);

  // Mantener callback actualizado sin re-suscribir
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Normalizar eventos a array
  const eventArray = Array.isArray(events) ? events : [events];

  useEffect(() => {
    const socket = getSocket(namespace);

    if (!socket) {
      return;
    }

    // Handler genérico para todos los eventos
    const createHandler = (eventName) => (data) => {
      const message = {
        event: eventName,
        data,
        timestamp: Date.now()
      };

      setLastData(message);

      if (keepHistory) {
        setHistory((prev) => {
          const updated = [message, ...prev];
          return updated.slice(0, historyLimit);
        });
      }

      // Ejecutar callback si existe
      if (callbackRef.current) {
        callbackRef.current(data, eventName);
      }
    };

    // Registrar handlers para cada evento
    const handlers = {};
    eventArray.forEach((eventName) => {
      handlers[eventName] = createHandler(eventName);
      socket.on(eventName, handlers[eventName]);
    });

    // Cleanup
    return () => {
      eventArray.forEach((eventName) => {
        socket.off(eventName, handlers[eventName]);
      });
    };
  }, [namespace, JSON.stringify(eventArray), keepHistory, historyLimit]);

  /**
   * Limpiar historial
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastData(null);
  }, []);

  return {
    lastData,
    history,
    clearHistory
  };
};

/**
 * Hook para escuchar eventos de waiting room
 *
 * @param {Function} onQueueUpdate - Callback para actualizaciones de cola
 * @param {Function} onYourTurn - Callback para turno del paciente
 */
export const useWaitingRoomEvents = (onQueueUpdate, onYourTurn) => {
  const namespace = '/waiting-room';

  useSocketEvent(namespace, 'wr:queue-update', onQueueUpdate);
  useSocketEvent(namespace, 'wr:your-turn', onYourTurn);
  useSocketEvent(namespace, 'wr:almost-your-turn', (data) => {
    // Notificación de "casi tu turno"
    console.log('[WaitingRoom] Almost your turn:', data);
  });

  const { lastData: doctorStatus } = useSocketEvent(
    namespace,
    ['wr:doctor-online', 'wr:doctor-offline']
  );

  return { doctorStatus };
};

/**
 * Hook para escuchar notificaciones
 *
 * @param {Function} onNewNotification - Callback para nuevas notificaciones
 */
export const useNotificationEvents = (onNewNotification) => {
  const namespace = '/notifications';

  const { lastData, history } = useSocketEvent(
    namespace,
    ['notif:new', 'notif:appointment-reminder', 'notif:system'],
    onNewNotification,
    { keepHistory: true, historyLimit: 20 }
  );

  return { lastNotification: lastData, notificationHistory: history };
};

export default useSocketEvent;
