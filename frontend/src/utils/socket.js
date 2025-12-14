/**
 * Socket.io Client - CITAMED.VE
 *
 * Cliente singleton de Socket.io para conexiones WebSocket:
 * - Conexión automática con JWT
 * - Reconexión automática
 * - Múltiples namespaces
 * - Logging en desarrollo
 */

import { io } from 'socket.io-client';

// Configuración desde variables de entorno
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const isDev = import.meta.env.DEV;

/**
 * Constantes de eventos (sincronizadas con backend)
 */
export const EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  AUTHENTICATED: 'authenticated',
  ERROR: 'error',

  // Rooms
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',

  // Waiting Room
  WR_DOCTOR_ONLINE: 'wr:doctor-online',
  WR_DOCTOR_OFFLINE: 'wr:doctor-offline',
  WR_CALL_NEXT: 'wr:call-next',
  WR_PATIENT_CHECKIN: 'wr:patient-checkin',
  WR_PATIENT_CANCEL: 'wr:patient-cancel',
  WR_QUEUE_UPDATE: 'wr:queue-update',
  WR_POSITION_UPDATE: 'wr:position-update',
  WR_YOUR_TURN: 'wr:your-turn',
  WR_ALMOST_YOUR_TURN: 'wr:almost-your-turn',

  // Notifications
  NOTIF_NEW: 'notif:new',
  NOTIF_READ: 'notif:read',
  NOTIF_READ_ALL: 'notif:read-all',
  NOTIF_APPOINTMENT_REMINDER: 'notif:appointment-reminder',
  NOTIF_SYSTEM: 'notif:system'
};

/**
 * Opciones de conexión por defecto
 */
const defaultOptions = {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ['websocket', 'polling']
};

/**
 * Cache de sockets por namespace
 */
const socketCache = new Map();

/**
 * Obtener token JWT del localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Crear o obtener socket para un namespace
 *
 * @param {string} namespace - Namespace ('/', '/waiting-room', '/notifications')
 * @returns {Socket|null} - Instancia de Socket.io o null si no hay token
 */
export const getSocket = (namespace = '/') => {
  const token = getToken();

  if (!token) {
    if (isDev) {
      console.warn('[Socket] No token available, cannot connect');
    }
    return null;
  }

  const cacheKey = namespace;

  // Retornar socket existente si está conectado o conectando
  if (socketCache.has(cacheKey)) {
    const existingSocket = socketCache.get(cacheKey);
    if (existingSocket.connected || existingSocket.connecting) {
      return existingSocket;
    }
    // Limpiar socket desconectado
    existingSocket.removeAllListeners();
    socketCache.delete(cacheKey);
  }

  // Crear nuevo socket
  const url = namespace === '/' ? SOCKET_URL : `${SOCKET_URL}${namespace}`;

  const socket = io(url, {
    ...defaultOptions,
    auth: { token },
    query: { token }
  });

  // Logging en desarrollo
  if (isDev) {
    socket.on('connect', () => {
      console.log(`[Socket] Connected to ${namespace} (id: ${socket.id})`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected from ${namespace}: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[Socket] Connection error on ${namespace}:`, error.message);
    });

    socket.on(EVENTS.AUTHENTICATED, (data) => {
      console.log(`[Socket] Authenticated on ${namespace}:`, data);
    });

    socket.on(EVENTS.ERROR, (error) => {
      console.error(`[Socket] Error on ${namespace}:`, error);
    });
  }

  socketCache.set(cacheKey, socket);
  return socket;
};

/**
 * Conectar socket a un namespace
 *
 * @param {string} namespace - Namespace a conectar
 * @returns {Socket|null} - Socket conectado o null
 */
export const connectSocket = (namespace = '/') => {
  const socket = getSocket(namespace);
  if (socket && !socket.connected) {
    socket.connect();
  }
  return socket;
};

/**
 * Desconectar socket de un namespace
 *
 * @param {string} namespace - Namespace a desconectar
 */
export const disconnectSocket = (namespace = '/') => {
  const cacheKey = namespace;
  const socket = socketCache.get(cacheKey);

  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socketCache.delete(cacheKey);

    if (isDev) {
      console.log(`[Socket] Manually disconnected from ${namespace}`);
    }
  }
};

/**
 * Desconectar todos los sockets
 */
export const disconnectAllSockets = () => {
  for (const [namespace, socket] of socketCache) {
    socket.disconnect();
    socket.removeAllListeners();
    if (isDev) {
      console.log(`[Socket] Disconnected from ${namespace}`);
    }
  }
  socketCache.clear();
};

/**
 * Verificar si un socket está conectado
 *
 * @param {string} namespace - Namespace a verificar
 * @returns {boolean} - true si está conectado
 */
export const isConnected = (namespace = '/') => {
  const socket = socketCache.get(namespace);
  return socket?.connected || false;
};

/**
 * Emitir evento con acknowledge
 *
 * @param {string} namespace - Namespace
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 * @param {number} timeout - Timeout en ms
 * @returns {Promise} - Promesa con respuesta del servidor
 */
export const emitWithAck = (namespace, event, data, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const socket = socketCache.get(namespace);

    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Socket emit timeout'));
    }, timeout);

    socket.emit(event, data, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
};

/**
 * Unirse a una room
 *
 * @param {string} roomName - Nombre de la room
 * @param {string} namespace - Namespace (default: '/')
 */
export const joinRoom = (roomName, namespace = '/') => {
  const socket = socketCache.get(namespace);
  if (socket?.connected) {
    socket.emit(EVENTS.JOIN_ROOM, roomName);
  }
};

/**
 * Salir de una room
 *
 * @param {string} roomName - Nombre de la room
 * @param {string} namespace - Namespace (default: '/')
 */
export const leaveRoom = (roomName, namespace = '/') => {
  const socket = socketCache.get(namespace);
  if (socket?.connected) {
    socket.emit(EVENTS.LEAVE_ROOM, roomName);
  }
};

// Export por defecto para uso simple
export default {
  getSocket,
  connectSocket,
  disconnectSocket,
  disconnectAllSockets,
  isConnected,
  emitWithAck,
  joinRoom,
  leaveRoom,
  EVENTS
};
