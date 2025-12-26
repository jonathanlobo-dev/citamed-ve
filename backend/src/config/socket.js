/**
 * Socket.io Server Configuration - CITAMED.VE
 *
 * Infraestructura base de WebSocket para comunicación real-time:
 * - Namespaces: /waiting-room, /chat, /notifications
 * - Autenticación JWT en handshake
 * - Rooms por doctor para sala de espera
 * - Logging de conexiones/desconexiones
 *
 * @see docs/WEBSOCKET.md para documentación completa
 */

const { Server } = require('socket.io');
const { socketAuthMiddleware } = require('../middleware/socketAuth');
const { EVENTS } = require('../socket/events');
const waitingRoomHandler = require('../socket/handlers/waitingRoom');
const notificationsHandler = require('../socket/handlers/notifications');

// Configuración desde variables de entorno
const isProduction = process.env.NODE_ENV === 'production';

// En desarrollo, permitir cualquier localhost
const getCorsOrigin = () => {
  if (isProduction) {
    return process.env.SOCKET_CORS_ORIGIN || 'https://citamed.ve';
  }
  // En desarrollo, aceptar cualquier localhost/127.0.0.1
  return (origin, callback) => {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  };
};

const socketConfig = {
  cors: {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 30000,
  pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE) || 1e6,
  transports: ['websocket', 'polling']
};

// Estadísticas de conexión
const stats = {
  totalConnections: 0,
  activeConnections: 0,
  authFailures: 0,
  rooms: new Map()
};

let io = null;

/**
 * Inicializar servidor Socket.io
 * @param {http.Server} httpServer - Servidor HTTP de Express
 * @returns {Server} Instancia de Socket.io
 */
const initializeSocket = (httpServer) => {
  if (io) {
    console.log('[Socket.io] Already initialized');
    return io;
  }

  io = new Server(httpServer, socketConfig);

  console.log('[Socket.io] Initializing server...');
  console.log(`[Socket.io] CORS: ${isProduction ? 'production mode' : 'development mode (all localhost allowed)'}`);

  // ==========================================
  // MAIN NAMESPACE (/)
  // ==========================================
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    stats.totalConnections++;
    stats.activeConnections++;

    const userId = socket.userId;
    const userRole = socket.userRole;

    console.log(`[Socket.io] Connected: ${socket.id} (user: ${userId}, role: ${userRole})`);

    // Emitir confirmación de autenticación
    socket.emit(EVENTS.AUTHENTICATED, {
      userId,
      role: userRole,
      socketId: socket.id
    });

    // ==========================================
    // JOIN/LEAVE ROOMS
    // ==========================================
    socket.on(EVENTS.JOIN_ROOM, (roomName) => {
      if (!roomName || typeof roomName !== 'string') {
        socket.emit(EVENTS.ERROR, { message: 'Invalid room name' });
        return;
      }

      // Validar formato de room
      if (!isValidRoom(roomName, socket)) {
        socket.emit(EVENTS.ERROR, { message: 'Unauthorized to join room' });
        return;
      }

      socket.join(roomName);
      trackRoomJoin(roomName, socket.id);

      console.log(`[Socket.io] ${socket.id} joined room: ${roomName}`);
      socket.emit(EVENTS.ROOM_JOINED, { room: roomName });
    });

    socket.on(EVENTS.LEAVE_ROOM, (roomName) => {
      socket.leave(roomName);
      trackRoomLeave(roomName, socket.id);

      console.log(`[Socket.io] ${socket.id} left room: ${roomName}`);
      socket.emit(EVENTS.ROOM_LEFT, { room: roomName });
    });

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on('disconnect', (reason) => {
      stats.activeConnections--;

      // Limpiar de todas las rooms
      cleanupSocketFromRooms(socket.id);

      console.log(`[Socket.io] Disconnected: ${socket.id} (reason: ${reason})`);
    });

    // ==========================================
    // ERROR HANDLING
    // ==========================================
    socket.on('error', (error) => {
      console.error(`[Socket.io] Error on socket ${socket.id}:`, error.message);
    });
  });

  // ==========================================
  // NAMESPACE: /waiting-room
  // ==========================================
  const waitingRoomNsp = io.of('/waiting-room');
  waitingRoomNsp.use(socketAuthMiddleware);
  waitingRoomNsp.on('connection', (socket) => {
    console.log(`[Socket.io] /waiting-room connected: ${socket.id}`);
    waitingRoomHandler(socket, waitingRoomNsp);
  });

  // ==========================================
  // NAMESPACE: /notifications
  // ==========================================
  const notificationsNsp = io.of('/notifications');
  notificationsNsp.use(socketAuthMiddleware);
  notificationsNsp.on('connection', (socket) => {
    console.log(`[Socket.io] /notifications connected: ${socket.id}`);
    notificationsHandler(socket, notificationsNsp);
  });

  console.log('[Socket.io] Server initialized successfully');
  console.log('[Socket.io] Namespaces: /, /waiting-room, /notifications');

  return io;
};

/**
 * Validar si el socket puede unirse a una room
 */
const isValidRoom = (roomName, socket) => {
  // Formato esperado: "doctor:{id}" o "patient:{id}"
  const [type, id] = roomName.split(':');

  if (!type || !id) return false;

  // Doctors pueden unirse a su propia room
  if (type === 'doctor' && socket.userRole === 'doctor') {
    return true; // En producción, verificar que id === socket.userId
  }

  // Pacientes pueden unirse a rooms de doctores (para ver sala de espera)
  if (type === 'doctor' && socket.userRole === 'patient') {
    return true;
  }

  // Admins pueden unirse a cualquier room
  if (socket.userRole === 'admin') {
    return true;
  }

  return false;
};

/**
 * Tracking de rooms
 */
const trackRoomJoin = (roomName, socketId) => {
  if (!stats.rooms.has(roomName)) {
    stats.rooms.set(roomName, new Set());
  }
  stats.rooms.get(roomName).add(socketId);
};

const trackRoomLeave = (roomName, socketId) => {
  if (stats.rooms.has(roomName)) {
    stats.rooms.get(roomName).delete(socketId);
    if (stats.rooms.get(roomName).size === 0) {
      stats.rooms.delete(roomName);
    }
  }
};

const cleanupSocketFromRooms = (socketId) => {
  for (const [roomName, sockets] of stats.rooms) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      stats.rooms.delete(roomName);
    }
  }
};

/**
 * Obtener instancia de Socket.io
 */
const getIO = () => {
  if (!io) {
    throw new Error('[Socket.io] Not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Obtener estadísticas de conexión
 */
const getStats = () => {
  const roomStats = {};
  for (const [roomName, sockets] of stats.rooms) {
    roomStats[roomName] = sockets.size;
  }

  return {
    totalConnections: stats.totalConnections,
    activeConnections: stats.activeConnections,
    authFailures: stats.authFailures,
    rooms: roomStats,
    roomCount: stats.rooms.size
  };
};

/**
 * Incrementar contador de fallos de autenticación
 */
const incrementAuthFailure = () => {
  stats.authFailures++;
};

/**
 * Emitir a room específica
 */
const emitToRoom = (roomName, event, data) => {
  if (!io) return;
  io.to(roomName).emit(event, data);
};

/**
 * Emitir a usuario específico por userId
 */
const emitToUser = (userId, event, data) => {
  if (!io) return;
  // En producción, mantener mapping userId -> socketId
  io.emit(event, { ...data, targetUserId: userId });
};

/**
 * Cerrar servidor Socket.io (graceful shutdown)
 */
const closeSocket = () => {
  if (io) {
    io.close();
    io = null;
    console.log('[Socket.io] Server closed');
  }
};

module.exports = {
  initializeSocket,
  getIO,
  getStats,
  incrementAuthFailure,
  emitToRoom,
  emitToUser,
  closeSocket,
  socketConfig
};
