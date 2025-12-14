/**
 * Socket.io Authentication Middleware - CITAMED.VE
 *
 * Middleware para autenticación JWT en conexiones WebSocket:
 * - Valida token JWT en handshake
 * - Rechaza conexiones sin token válido
 * - Asocia userId y role al socket
 * - Logging de intentos no autorizados
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

/**
 * Middleware de autenticación para Socket.io
 * Se ejecuta en el handshake de cada conexión
 *
 * @param {Socket} socket - Socket del cliente
 * @param {Function} next - Callback para continuar o rechazar
 */
const socketAuthMiddleware = (socket, next) => {
  try {
    // Obtener token de diferentes fuentes
    const token = extractToken(socket);

    if (!token) {
      console.log(`[Socket Auth] Connection rejected: No token provided (${socket.id})`);
      return next(new Error('Authentication required: No token provided'));
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validar payload del token
    if (!decoded.id || !decoded.role) {
      console.log(`[Socket Auth] Connection rejected: Invalid token payload (${socket.id})`);
      return next(new Error('Authentication failed: Invalid token payload'));
    }

    // Asociar datos del usuario al socket
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    socket.userEmail = decoded.email || null;

    console.log(`[Socket Auth] Authenticated: user ${decoded.id} (${decoded.role})`);

    next();

  } catch (error) {
    handleAuthError(socket, error, next);
  }
};

/**
 * Extraer token de diferentes fuentes del handshake
 */
const extractToken = (socket) => {
  // 1. Desde query params (socket.io-client default)
  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }

  // 2. Desde auth object (socket.io v4+)
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }

  // 3. Desde headers Authorization
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 4. Desde headers custom
  if (socket.handshake.headers['x-auth-token']) {
    return socket.handshake.headers['x-auth-token'];
  }

  return null;
};

/**
 * Manejar errores de autenticación
 */
const handleAuthError = (socket, error, next) => {
  let message = 'Authentication failed';
  let logMessage = error.message;

  if (error.name === 'TokenExpiredError') {
    message = 'Authentication failed: Token expired';
    logMessage = 'Token expired';
  } else if (error.name === 'JsonWebTokenError') {
    message = 'Authentication failed: Invalid token';
    logMessage = 'Invalid token';
  } else if (error.name === 'NotBeforeError') {
    message = 'Authentication failed: Token not active';
    logMessage = 'Token not active yet';
  }

  console.log(`[Socket Auth] Connection rejected: ${logMessage} (${socket.id})`);

  // Intentar incrementar contador de fallos (si el módulo está disponible)
  try {
    const { incrementAuthFailure } = require('../config/socket');
    incrementAuthFailure();
  } catch (e) {
    // Ignorar si no está disponible (evitar circular dependency en init)
  }

  next(new Error(message));
};

/**
 * Middleware para verificar rol específico
 * Usar después de socketAuthMiddleware
 *
 * @param {string[]} allowedRoles - Roles permitidos
 */
const requireRole = (allowedRoles) => {
  return (socket, next) => {
    if (!socket.userRole) {
      return next(new Error('Not authenticated'));
    }

    if (!allowedRoles.includes(socket.userRole)) {
      console.log(`[Socket Auth] Access denied: role ${socket.userRole} not in [${allowedRoles.join(', ')}]`);
      return next(new Error(`Access denied: requires role ${allowedRoles.join(' or ')}`));
    }

    next();
  };
};

/**
 * Verificar si un socket está autenticado
 */
const isAuthenticated = (socket) => {
  return !!(socket.userId && socket.userRole);
};

/**
 * Obtener información del usuario desde el socket
 */
const getSocketUser = (socket) => {
  if (!isAuthenticated(socket)) {
    return null;
  }

  return {
    id: socket.userId,
    role: socket.userRole,
    email: socket.userEmail
  };
};

module.exports = {
  socketAuthMiddleware,
  requireRole,
  isAuthenticated,
  getSocketUser
};
