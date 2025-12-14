/**
 * useSocket Hook - CITAMED.VE
 *
 * Hook para gestionar conexión Socket.io en componentes React:
 * - Conexión automática al montar
 * - Desconexión al desmontar
 * - Estado de conexión reactivo
 * - Reconexión automática
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, connectSocket, disconnectSocket, EVENTS } from '../utils/socket';

/**
 * Hook para gestionar conexión Socket.io
 *
 * @param {string} namespace - Namespace a conectar ('/', '/waiting-room', '/notifications')
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoConnect - Conectar automáticamente (default: true)
 * @param {boolean} options.disconnectOnUnmount - Desconectar al desmontar (default: false)
 * @returns {Object} - Estado y métodos del socket
 */
const useSocket = (namespace = '/', options = {}) => {
  const {
    autoConnect = true,
    disconnectOnUnmount = false
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  /**
   * Conectar al socket
   */
  const connect = useCallback(() => {
    const socket = connectSocket(namespace);
    if (socket) {
      socketRef.current = socket;
    }
    return socket;
  }, [namespace]);

  /**
   * Desconectar del socket
   */
  const disconnect = useCallback(() => {
    disconnectSocket(namespace);
    socketRef.current = null;
    setIsConnected(false);
  }, [namespace]);

  /**
   * Emitir evento
   */
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn('[useSocket] Cannot emit, socket not connected');
    return false;
  }, []);

  /**
   * Emitir evento con callback de respuesta
   */
  const emitWithCallback = useCallback((event, data, callback) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, callback);
      return true;
    }
    console.warn('[useSocket] Cannot emit, socket not connected');
    return false;
  }, []);

  /**
   * Unirse a room
   */
  const joinRoom = useCallback((roomName) => {
    return emit(EVENTS.JOIN_ROOM, roomName);
  }, [emit]);

  /**
   * Salir de room
   */
  const leaveRoom = useCallback((roomName) => {
    return emit(EVENTS.LEAVE_ROOM, roomName);
  }, [emit]);

  // Efecto para gestionar conexión y listeners
  useEffect(() => {
    const socket = getSocket(namespace);

    if (!socket) {
      setError(new Error('No authentication token available'));
      return;
    }

    socketRef.current = socket;

    // Handlers de conexión
    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server inició la desconexión, no reconectar automáticamente
        setError(new Error('Disconnected by server'));
      }
    };

    const handleConnectError = (err) => {
      setError(err);
      setIsConnected(false);
    };

    const handleAuthenticated = (data) => {
      setLastMessage({ type: 'authenticated', data, timestamp: Date.now() });
    };

    const handleError = (err) => {
      setError(typeof err === 'object' ? err : new Error(err));
    };

    // Registrar listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on(EVENTS.AUTHENTICATED, handleAuthenticated);
    socket.on(EVENTS.ERROR, handleError);

    // Actualizar estado inicial
    setIsConnected(socket.connected);

    // Conectar si es necesario
    if (autoConnect && !socket.connected) {
      socket.connect();
    }

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off(EVENTS.AUTHENTICATED, handleAuthenticated);
      socket.off(EVENTS.ERROR, handleError);

      if (disconnectOnUnmount) {
        disconnectSocket(namespace);
      }
    };
  }, [namespace, autoConnect, disconnectOnUnmount]);

  return {
    // Estado
    socket: socketRef.current,
    isConnected,
    error,
    lastMessage,

    // Métodos
    connect,
    disconnect,
    emit,
    emitWithCallback,
    joinRoom,
    leaveRoom
  };
};

export default useSocket;
