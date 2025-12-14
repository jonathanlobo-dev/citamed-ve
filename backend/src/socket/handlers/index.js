/**
 * Socket Handlers Index - CITAMED.VE
 *
 * Exporta todos los handlers de Socket.io
 */

const waitingRoomHandler = require('./waitingRoom');
const {
  notificationsHandler,
  sendNotificationToUser,
  broadcastSystemNotification
} = require('./notifications');

module.exports = {
  // Handlers principales
  waitingRoomHandler,
  notificationsHandler,

  // Helpers de notificaciones
  sendNotificationToUser,
  broadcastSystemNotification
};
