/**
 * useWaitingRoom Hook - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Hook para manejar la conexion WebSocket de la sala de espera
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTHENTICATED: 'authenticated',

  // Waiting Room
  WR_DOCTOR_ONLINE: 'wr:doctor-online',
  WR_DOCTOR_OFFLINE: 'wr:doctor-offline',
  WR_QUEUE_UPDATE: 'wr:queue-update',
  WR_POSITION_UPDATE: 'wr:position-update',
  WR_YOUR_TURN: 'wr:your-turn',
  WR_ALMOST_YOUR_TURN: 'wr:almost-your-turn',
  WR_PATIENT_CHECKIN: 'wr:patient-checkin',
  WR_CALL_NEXT: 'wr:call-next',
  WR_CALL_PATIENT: 'wr:call-patient'
};

const useWaitingRoom = (token, userRole) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  // Estado de la cola
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [myPosition, setMyPosition] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isDoctorOnline, setIsDoctorOnline] = useState(false);

  const socketRef = useRef(null);

  // Inicializar conexion
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(`${SOCKET_URL}/waiting-room`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Eventos de conexion
    socketInstance.on(EVENTS.CONNECT, () => {
      console.log('[useWaitingRoom] Connected');
      setConnected(true);
      setError(null);
    });

    socketInstance.on(EVENTS.DISCONNECT, (reason) => {
      console.log('[useWaitingRoom] Disconnected:', reason);
      setConnected(false);
    });

    socketInstance.on(EVENTS.ERROR, (err) => {
      console.error('[useWaitingRoom] Error:', err);
      setError(err.message || 'Error de conexion');
    });

    socketInstance.on(EVENTS.AUTHENTICATED, (data) => {
      console.log('[useWaitingRoom] Authenticated:', data);
    });

    // Eventos de sala de espera
    socketInstance.on(EVENTS.WR_QUEUE_UPDATE, (data) => {
      console.log('[useWaitingRoom] Queue update:', data);
      if (data.queue) setQueue(data.queue);
      if (data.stats) setStats(data.stats);
    });

    socketInstance.on(EVENTS.WR_POSITION_UPDATE, (data) => {
      console.log('[useWaitingRoom] Position update:', data);
      setMyPosition(data);
    });

    socketInstance.on(EVENTS.WR_YOUR_TURN, (data) => {
      console.log('[useWaitingRoom] YOUR TURN!', data);
      setIsMyTurn(true);

      // Mostrar notificacion del navegador
      if (Notification.permission === 'granted') {
        new Notification('CITAMED - Es tu turno!', {
          body: 'Por favor dirigete al consultorio.',
          icon: '/logo.png'
        });
      }
    });

    socketInstance.on(EVENTS.WR_ALMOST_YOUR_TURN, (data) => {
      console.log('[useWaitingRoom] Almost your turn:', data);

      // Mostrar notificacion
      if (Notification.permission === 'granted') {
        const message = data.position === 1
          ? 'Eres el siguiente! Preparate.'
          : `Faltan ${data.position} personas para tu turno.`;

        new Notification('CITAMED - Preparate', {
          body: message,
          icon: '/logo.png'
        });
      }
    });

    socketInstance.on(EVENTS.WR_DOCTOR_ONLINE, (data) => {
      console.log('[useWaitingRoom] Doctor online:', data);
      setIsDoctorOnline(true);
    });

    socketInstance.on(EVENTS.WR_DOCTOR_OFFLINE, (data) => {
      console.log('[useWaitingRoom] Doctor offline:', data);
      setIsDoctorOnline(false);
    });

    socketInstance.on('chairs_update', (data) => {
      console.log('[useWaitingRoom] Chairs update:', data);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Funciones para pacientes
  const checkIn = useCallback((appointmentId, doctorId) => {
    if (socketRef.current) {
      socketRef.current.emit(EVENTS.WR_PATIENT_CHECKIN, { appointmentId, doctorId });
    }
  }, []);

  const cancelTurn = useCallback((queueEntryId, reason) => {
    if (socketRef.current) {
      socketRef.current.emit('wr:patient-cancel', { queueEntryId, reason });
    }
  }, []);

  const subscribeToDoctor = useCallback((doctorId) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe_queue', { doctorId });
    }
  }, []);

  const getMyPosition = useCallback((appointmentId) => {
    if (socketRef.current) {
      socketRef.current.emit('get_position', { appointmentId });
    }
  }, []);

  // Funciones para doctores
  const goOnline = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit(EVENTS.WR_DOCTOR_ONLINE);
    }
  }, []);

  const goOffline = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('wr:doctor-offline');
    }
  }, []);

  const callNextPatient = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit(EVENTS.WR_CALL_NEXT);
    }
  }, []);

  const callSpecificPatient = useCallback((queueEntryId) => {
    if (socketRef.current) {
      socketRef.current.emit(EVENTS.WR_CALL_PATIENT, { queueEntryId });
    }
  }, []);

  return {
    // Estado
    connected,
    error,
    queue,
    stats,
    myPosition,
    isMyTurn,
    isDoctorOnline,

    // Funciones paciente
    checkIn,
    cancelTurn,
    subscribeToDoctor,
    getMyPosition,

    // Funciones doctor
    goOnline,
    goOffline,
    callNextPatient,
    callSpecificPatient
  };
};

export default useWaitingRoom;
