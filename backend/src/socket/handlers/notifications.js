/**
 * Notifications Socket Handler - CITAMED.VE
 *
 * SKELETON - Handlers para eventos de Notificaciones
 * Se completará en módulos posteriores
 *
 * Este handler maneja:
 * - Notificaciones en tiempo real
 * - Marcar notificaciones como leídas
 * - Contadores de no leídas
 */

const { NOTIFICATION_EVENTS, EVENTS } = require('../events');

/**
 * Handler principal para namespace /notifications
 *
 * @param {Socket} socket - Socket del cliente conectado
 * @param {Namespace} nsp - Namespace de notifications
 */
const notificationsHandler = (socket, nsp) => {
  const userId = socket.userId;
  const userRole = socket.userRole;

  console.log(`[Notifications] User ${userId} (${userRole}) connected`);

  // Unir al usuario a su room personal de notificaciones
  const userRoom = `user:${userId}`;
  socket.join(userRoom);

  // ==========================================
  // NOTIFICATION EVENTS
  // ==========================================

  /**
   * Marcar notificación como leída
   */
  socket.on(NOTIFICATION_EVENTS.NOTIF_READ, (data) => {
    const { notificationId } = data || {};

    if (!notificationId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing notificationId' });
      return;
    }

    console.log(`[Notifications] User ${userId} marked notification ${notificationId} as read`);

    // TODO: Implementar en módulo de notificaciones
    // 1. Actualizar en base de datos
    // 2. Emitir confirmación
    // 3. Actualizar contador de no leídas

    socket.emit(NOTIFICATION_EVENTS.NOTIF_READ, {
      status: 'pending',
      message: 'Feature coming soon',
      notificationId
    });
  });

  /**
   * Marcar todas las notificaciones como leídas
   */
  socket.on(NOTIFICATION_EVENTS.NOTIF_READ_ALL, () => {
    console.log(`[Notifications] User ${userId} marked all notifications as read`);

    // TODO: Implementar
    // 1. Actualizar todas en base de datos
    // 2. Emitir confirmación
    // 3. Resetear contador

    socket.emit(NOTIFICATION_EVENTS.NOTIF_READ_ALL, {
      status: 'pending',
      message: 'Feature coming soon'
    });
  });

  // ==========================================
  // DISCONNECT
  // ==========================================
  socket.on('disconnect', (reason) => {
    console.log(`[Notifications] User ${userId} disconnected: ${reason}`);
  });
};

/**
 * Enviar notificación a un usuario específico
 * Función helper para usar desde otros módulos
 *
 * @param {Namespace} nsp - Namespace de notifications
 * @param {string} userId - ID del usuario destino
 * @param {Object} notification - Datos de la notificación
 */
const sendNotificationToUser = (nsp, userId, notification) => {
  const userRoom = `user:${userId}`;
  nsp.to(userRoom).emit(NOTIFICATION_EVENTS.NOTIF_NEW, {
    ...notification,
    timestamp: new Date().toISOString()
  });
  console.log(`[Notifications] Sent notification to user ${userId}`);
};

/**
 * Broadcast notificación de sistema a todos los usuarios conectados
 *
 * @param {Namespace} nsp - Namespace de notifications
 * @param {Object} notification - Datos de la notificación
 */
const broadcastSystemNotification = (nsp, notification) => {
  nsp.emit(NOTIFICATION_EVENTS.NOTIF_SYSTEM, {
    ...notification,
    timestamp: new Date().toISOString()
  });
  console.log('[Notifications] Broadcast system notification');
};

module.exports = {
  default: notificationsHandler,
  notificationsHandler,
  sendNotificationToUser,
  broadcastSystemNotification
};
