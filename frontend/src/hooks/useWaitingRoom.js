/**
 * useWaitingRoom Hook - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Hook para manejar la conexión WebSocket de la sala de espera con
 * reconexión infinita, re-sincronización automática y fallback REST (D8).
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

const useWaitingRoom = (token, userRole, initialOptions = {}) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [error, setError] = useState(null);

  // Estado de la cola
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [myPosition, setMyPosition] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isDoctorOnline, setIsDoctorOnline] = useState(false);

  const socketRef = useRef(null);
  const appointmentIdRef = useRef(initialOptions.appointmentId || null);
  const doctorIdRef = useRef(initialOptions.doctorId || null);

  // Inicializar conexión con reconexión robusta
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(`${SOCKET_URL}/waiting-room`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 10000
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Eventos de conexión
    socketInstance.on(EVENTS.CONNECT, () => {
      setConnected(true);
      setReconnecting(false);
      setError(null);

      // Re-sincronización al conectar o reconectar (D8)
      if (userRole === 'doctor') {
        socketInstance.emit(EVENTS.WR_DOCTOR_ONLINE);
      } else if (userRole === 'patient') {
        if (appointmentIdRef.current) {
          socketInstance.emit('get_position', { appointmentId: appointmentIdRef.current });
        }
        if (doctorIdRef.current) {
          socketInstance.emit('subscribe_queue', { doctorId: doctorIdRef.current });
        }
      }
    });

    socketInstance.on(EVENTS.DISCONNECT, () => {
      setConnected(false);
      setReconnecting(true);
    });

    socketInstance.on('reconnect_attempt', () => {
      setReconnecting(true);
    });

    socketInstance.on('reconnect', () => {
      setConnected(true);
      setReconnecting(false);
    });

    socketInstance.on(EVENTS.ERROR, (err) => {
      console.error('[useWaitingRoom] Error:', err);
      setError(err.message || 'Error de conexión');
    });

    // Eventos de sala de espera
    socketInstance.on(EVENTS.WR_QUEUE_UPDATE, (data) => {
      if (data.queue) setQueue(data.queue);
      if (data.stats) setStats(data.stats);
    });

    socketInstance.on(EVENTS.WR_POSITION_UPDATE, (data) => {
      setMyPosition(data);
    });

    socketInstance.on(EVENTS.WR_YOUR_TURN, (data) => {
      setIsMyTurn(true);

      // Vibración si existe
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 400]);
      }

      // Notificación del navegador
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('CITAMED - ¡Es tu turno!', {
          body: data.message || 'Por favor dirígete al consultorio.',
          icon: '/favicon.ico'
        });
      }
    });

    socketInstance.on(EVENTS.WR_ALMOST_YOUR_TURN, (data) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const message = data.position === 1
          ? '¡Eres el siguiente! Prepárate.'
          : `Faltan ${data.position} personas para tu turno.`;

        new Notification('CITAMED - Prepárate', {
          body: message,
          icon: '/favicon.ico'
        });
      }
    });

    socketInstance.on(EVENTS.WR_DOCTOR_ONLINE, () => {
      setIsDoctorOnline(true);
    });

    socketInstance.on(EVENTS.WR_DOCTOR_OFFLINE, () => {
      setIsDoctorOnline(false);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [token, userRole]);

  // Polling REST de respaldo cada 30s mientras esté desconectado (D8)
  useEffect(() => {
    if (connected || !token) return;

    const pollInterval = setInterval(async () => {
      try {
        if (userRole === 'doctor') {
          const res = await fetch(`${SOCKET_URL}/api/waiting-room/queue`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data?.queue) setQueue(data.data.queue);
            if (data.data?.stats) setStats(data.data.stats);
          }
        } else if (userRole === 'patient' && appointmentIdRef.current) {
          const res = await fetch(`${SOCKET_URL}/api/waiting-room/my-position/${appointmentIdRef.current}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) setMyPosition(data.data);
          }
        }
      } catch (err) {
        console.warn('[useWaitingRoom] Polling REST fallback error:', err.message);
      }
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [connected, token, userRole]);

  // Solicitar permiso de notificaciones
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Funciones para pacientes
  const checkIn = useCallback((appointmentId, doctorId) => {
    appointmentIdRef.current = appointmentId;
    doctorIdRef.current = doctorId;
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
    doctorIdRef.current = doctorId;
    if (socketRef.current) {
      socketRef.current.emit('subscribe_queue', { doctorId });
    }
  }, []);

  const getMyPosition = useCallback((appointmentId) => {
    appointmentIdRef.current = appointmentId;
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
    reconnecting,
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
