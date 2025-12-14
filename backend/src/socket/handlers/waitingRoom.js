/**
 * Waiting Room Socket Handler - CITAMED.VE
 *
 * SKELETON - Handlers para eventos de Sala de Espera Virtual
 * Se completará en Módulo 3 (M03) - Agendamiento
 *
 * Este handler maneja:
 * - Doctor online/offline status
 * - Patient check-in/checkout
 * - Queue updates en tiempo real
 * - Notificaciones de turno
 */

const { WAITING_ROOM_EVENTS, EVENTS } = require('../events');

/**
 * Handler principal para namespace /waiting-room
 *
 * @param {Socket} socket - Socket del cliente conectado
 * @param {Namespace} nsp - Namespace de waiting-room
 */
const waitingRoomHandler = (socket, nsp) => {
  const userId = socket.userId;
  const userRole = socket.userRole;

  console.log(`[WaitingRoom] User ${userId} (${userRole}) connected`);

  // ==========================================
  // DOCTOR EVENTS
  // ==========================================

  /**
   * Doctor se marca como online/disponible
   * Emite estado a pacientes en su sala de espera
   */
  socket.on(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can go online' });
      return;
    }

    const roomName = `doctor:${userId}`;
    socket.join(roomName);

    console.log(`[WaitingRoom] Doctor ${userId} is now ONLINE`);

    // Broadcast a pacientes en la sala
    nsp.to(roomName).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, {
      doctorId: userId,
      timestamp: new Date().toISOString()
    });

    // TODO M03: Actualizar estado en base de datos
    // TODO M03: Enviar cola actual al doctor
  });

  /**
   * Doctor se marca como offline
   */
  socket.on(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can go offline' });
      return;
    }

    const roomName = `doctor:${userId}`;

    console.log(`[WaitingRoom] Doctor ${userId} is now OFFLINE`);

    // Broadcast a pacientes
    nsp.to(roomName).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, {
      doctorId: userId,
      timestamp: new Date().toISOString()
    });

    socket.leave(roomName);

    // TODO M03: Actualizar estado en base de datos
    // TODO M03: Notificar a pacientes en cola
  });

  /**
   * Doctor llama al siguiente paciente
   */
  socket.on(WAITING_ROOM_EVENTS.WR_CALL_NEXT, (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can call patients' });
      return;
    }

    console.log(`[WaitingRoom] Doctor ${userId} calling next patient`);

    // TODO M03: Implementar lógica de cola
    // 1. Obtener siguiente paciente de la cola
    // 2. Emitir WR_YOUR_TURN al paciente
    // 3. Actualizar posiciones de todos en la cola
    // 4. Broadcast WR_QUEUE_UPDATE a la sala

    socket.emit(EVENTS.ERROR, {
      message: 'Feature not implemented yet - Coming in M03'
    });
  });

  // ==========================================
  // PATIENT EVENTS
  // ==========================================

  /**
   * Paciente hace check-in en sala de espera
   */
  socket.on(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, (data) => {
    if (userRole !== 'patient') {
      socket.emit(EVENTS.ERROR, { message: 'Only patients can check-in' });
      return;
    }

    const { appointmentId, doctorId } = data || {};

    if (!appointmentId || !doctorId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing appointmentId or doctorId' });
      return;
    }

    const roomName = `doctor:${doctorId}`;
    socket.join(roomName);

    console.log(`[WaitingRoom] Patient ${userId} checked-in for appointment ${appointmentId}`);

    // TODO M03: Implementar check-in real
    // 1. Verificar cita existe y es válida
    // 2. Agregar paciente a cola en Redis/DB
    // 3. Calcular posición y tiempo estimado
    // 4. Emitir WR_QUEUE_UPDATE a la sala
    // 5. Emitir WR_POSITION_UPDATE al paciente

    socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, {
      status: 'pending',
      message: 'Check-in feature coming in M03',
      appointmentId,
      doctorId
    });
  });

  /**
   * Paciente cancela su turno
   */
  socket.on(WAITING_ROOM_EVENTS.WR_PATIENT_CANCEL, (data) => {
    if (userRole !== 'patient') {
      socket.emit(EVENTS.ERROR, { message: 'Only patients can cancel' });
      return;
    }

    console.log(`[WaitingRoom] Patient ${userId} cancelled their turn`);

    // TODO M03: Implementar cancelación
    // 1. Remover de cola
    // 2. Actualizar posiciones
    // 3. Broadcast WR_QUEUE_UPDATE

    socket.emit(EVENTS.ERROR, {
      message: 'Feature not implemented yet - Coming in M03'
    });
  });

  // ==========================================
  // DISCONNECT
  // ==========================================
  socket.on('disconnect', (reason) => {
    console.log(`[WaitingRoom] User ${userId} disconnected: ${reason}`);

    // TODO M03: Manejar desconexión
    // - Si es doctor: marcar como offline
    // - Si es paciente: mantener en cola por X minutos
  });
};

module.exports = waitingRoomHandler;
