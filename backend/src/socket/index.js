/**
 * Socket Module Index - CITAMED.VE
 *
 * Re-exporta configuración, eventos y handlers de Socket.io
 */

const {
  initializeSocket,
  getIO,
  getStats,
  emitToRoom,
  emitToUser,
  closeSocket
} = require('../config/socket');

const {
  EVENTS,
  CONNECTION_EVENTS,
  ROOM_EVENTS,
  WAITING_ROOM_EVENTS,
  NOTIFICATION_EVENTS,
  CHAT_EVENTS,
  EVENT_GROUPS,
  isValidEvent
} = require('./events');

const {
  waitingRoomHandler,
  notificationsHandler,
  sendNotificationToUser,
  broadcastSystemNotification
} = require('./handlers');

module.exports = {
  // Configuración y gestión
  initializeSocket,
  getIO,
  getStats,
  emitToRoom,
  emitToUser,
  closeSocket,

  // Constantes de eventos
  EVENTS,
  CONNECTION_EVENTS,
  ROOM_EVENTS,
  WAITING_ROOM_EVENTS,
  NOTIFICATION_EVENTS,
  CHAT_EVENTS,
  EVENT_GROUPS,
  isValidEvent,

  // Handlers
  waitingRoomHandler,
  notificationsHandler,

  // Helpers
  sendNotificationToUser,
  broadcastSystemNotification
};
