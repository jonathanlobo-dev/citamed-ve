/**
 * Socket.io Event Constants - CITAMED.VE
 *
 * Constantes para nombres de eventos WebSocket.
 * Evita strings mágicos y facilita mantenimiento.
 *
 * Convención de nombres:
 * - SCREAMING_SNAKE_CASE para constantes
 * - kebab-case para valores (eventos Socket.io)
 * - Prefijos por dominio: WR_ (waiting room), NOTIF_ (notifications)
 */

/**
 * Eventos base de conexión
 */
const CONNECTION_EVENTS = {
  // Conexión establecida (built-in Socket.io)
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Autenticación
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth-error',

  // Errores generales
  ERROR: 'error'
};

/**
 * Eventos de rooms
 */
const ROOM_EVENTS = {
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  ROOM_JOINED: 'room-joined',
  ROOM_LEFT: 'room-left',
  ROOM_ERROR: 'room-error'
};

/**
 * Eventos de Sala de Espera Virtual (M03)
 * Skeleton - Se completarán en el módulo de agendamiento
 */
const WAITING_ROOM_EVENTS = {
  // Doctor events
  WR_DOCTOR_ONLINE: 'wr:doctor-online',
  WR_DOCTOR_OFFLINE: 'wr:doctor-offline',
  WR_CALL_NEXT: 'wr:call-next',
  WR_CALL_PATIENT: 'wr:call-patient',

  // Patient events
  WR_PATIENT_CHECKIN: 'wr:patient-checkin',
  WR_PATIENT_CHECKOUT: 'wr:patient-checkout',
  WR_PATIENT_CANCEL: 'wr:patient-cancel',

  // Queue updates (broadcast)
  WR_QUEUE_UPDATE: 'wr:queue-update',
  WR_POSITION_UPDATE: 'wr:position-update',
  WR_WAIT_TIME_UPDATE: 'wr:wait-time-update',

  // Notifications
  WR_YOUR_TURN: 'wr:your-turn',
  WR_ALMOST_YOUR_TURN: 'wr:almost-your-turn',
  WR_DELAY_NOTIFICATION: 'wr:delay-notification'
};

/**
 * Eventos de Notificaciones
 * Skeleton - Se completarán en módulos posteriores
 */
const NOTIFICATION_EVENTS = {
  // General notifications
  NOTIF_NEW: 'notif:new',
  NOTIF_READ: 'notif:read',
  NOTIF_READ_ALL: 'notif:read-all',

  // Appointment notifications
  NOTIF_APPOINTMENT_REMINDER: 'notif:appointment-reminder',
  NOTIF_APPOINTMENT_CONFIRMED: 'notif:appointment-confirmed',
  NOTIF_APPOINTMENT_CANCELLED: 'notif:appointment-cancelled',
  NOTIF_APPOINTMENT_RESCHEDULED: 'notif:appointment-rescheduled',

  // System notifications
  NOTIF_SYSTEM: 'notif:system',
  NOTIF_MAINTENANCE: 'notif:maintenance'
};

/**
 * Eventos de Chat (M04 - Telemedicina)
 * Skeleton - Se completarán en el módulo de telemedicina
 */
const CHAT_EVENTS = {
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_STOP_TYPING: 'chat:stop-typing',
  CHAT_READ: 'chat:read',
  CHAT_FILE: 'chat:file'
};

/**
 * Todos los eventos exportados
 */
const EVENTS = {
  ...CONNECTION_EVENTS,
  ...ROOM_EVENTS,
  ...WAITING_ROOM_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...CHAT_EVENTS
};

/**
 * Grupos de eventos para validación
 */
const EVENT_GROUPS = {
  CONNECTION: Object.values(CONNECTION_EVENTS),
  ROOM: Object.values(ROOM_EVENTS),
  WAITING_ROOM: Object.values(WAITING_ROOM_EVENTS),
  NOTIFICATION: Object.values(NOTIFICATION_EVENTS),
  CHAT: Object.values(CHAT_EVENTS)
};

/**
 * Verificar si un evento es válido
 */
const isValidEvent = (eventName) => {
  return Object.values(EVENTS).includes(eventName);
};

module.exports = {
  EVENTS,
  CONNECTION_EVENTS,
  ROOM_EVENTS,
  WAITING_ROOM_EVENTS,
  NOTIFICATION_EVENTS,
  CHAT_EVENTS,
  EVENT_GROUPS,
  isValidEvent
};
