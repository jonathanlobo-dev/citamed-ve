/**
 * Waiting Room Socket Handler - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA - Handlers en tiempo real
 */

const { WAITING_ROOM_EVENTS, EVENTS } = require('../events');
const waitingRoomService = require('../../services/waitingRoomService');

// Store de doctores online
const onlineDoctors = new Map();

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
   */
  socket.on(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, async (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can go online' });
      return;
    }

    const roomName = `doctor:${userId}`;
    socket.join(roomName);
    onlineDoctors.set(userId, {
      socketId: socket.id,
      onlineSince: new Date()
    });

    console.log(`[WaitingRoom] Doctor ${userId} is now ONLINE`);

    // Obtener cola actual
    try {
      const queueData = await waitingRoomService.getDoctorQueue(userId);

      // Enviar cola al doctor
      socket.emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, queueData);

      // Broadcast a pacientes en la sala
      nsp.to(roomName).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, {
        doctorId: userId,
        timestamp: new Date().toISOString(),
        queue: queueData
      });
    } catch (error) {
      console.error('[WaitingRoom] Error getting queue:', error.message);
    }
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
    onlineDoctors.delete(userId);

    console.log(`[WaitingRoom] Doctor ${userId} is now OFFLINE`);

    // Broadcast a pacientes
    nsp.to(roomName).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, {
      doctorId: userId,
      timestamp: new Date().toISOString(),
      message: 'El doctor ha terminado las consultas del dia'
    });

    socket.leave(roomName);
  });

  /**
   * Doctor llama al siguiente paciente
   */
  socket.on(WAITING_ROOM_EVENTS.WR_CALL_NEXT, async (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can call patients' });
      return;
    }

    console.log(`[WaitingRoom] Doctor ${userId} calling next patient`);

    try {
      const entry = await waitingRoomService.callNextPatient(userId);

      if (!entry) {
        socket.emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, {
          message: 'No hay mas pacientes en la cola',
          queue: []
        });
        return;
      }

      // La notificacion al paciente ya se envia en el servicio
      // Aqui solo confirmamos al doctor

      socket.emit('call_success', {
        patientId: entry.patientId,
        queueEntryId: entry.id,
        message: 'Paciente llamado exitosamente'
      });

    } catch (error) {
      console.error('[WaitingRoom] Error calling next:', error.message);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  /**
   * Doctor llama a un paciente especifico
   */
  socket.on(WAITING_ROOM_EVENTS.WR_CALL_PATIENT, async (data) => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can call patients' });
      return;
    }

    const { queueEntryId } = data || {};

    if (!queueEntryId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing queueEntryId' });
      return;
    }

    console.log(`[WaitingRoom] Doctor ${userId} calling patient ${queueEntryId}`);

    try {
      const entry = await waitingRoomService.callSpecificPatient(queueEntryId);

      socket.emit('call_success', {
        patientId: entry.patientId,
        queueEntryId: entry.id,
        message: 'Paciente llamado exitosamente'
      });
    } catch (error) {
      console.error('[WaitingRoom] Error calling patient:', error.message);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  // ==========================================
  // PATIENT EVENTS
  // ==========================================

  /**
   * Paciente hace check-in en sala de espera
   */
  socket.on(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, async (data) => {
    if (userRole !== 'patient') {
      socket.emit(EVENTS.ERROR, { message: 'Only patients can check-in' });
      return;
    }

    const { appointmentId, doctorId } = data || {};

    if (!appointmentId || !doctorId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing appointmentId or doctorId' });
      return;
    }

    console.log(`[WaitingRoom] Patient ${userId} checking in for appointment ${appointmentId}`);

    try {
      const result = await waitingRoomService.checkIn(appointmentId);

      // Unirse a la sala del doctor
      const roomName = `doctor:${doctorId}`;
      socket.join(roomName);

      // Confirmar check-in al paciente
      socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, {
        status: 'success',
        message: 'Check-in exitoso! Ya estas en la cola virtual.',
        position: result.position,
        estimatedWaitMinutes: result.estimatedWaitMinutes,
        queueEntryId: result.queueEntry.id,
        appointmentId
      });

      // Emitir actualizacion de posicion
      socket.emit(WAITING_ROOM_EVENTS.WR_POSITION_UPDATE, {
        position: result.position,
        estimatedMinutes: result.estimatedWaitMinutes,
        queueEntryId: result.queueEntry.id
      });

    } catch (error) {
      console.error('[WaitingRoom] Check-in error:', error.message);
      socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, {
        status: 'error',
        message: error.message,
        appointmentId,
        doctorId
      });
    }
  });

  /**
   * Paciente cancela su turno
   */
  socket.on(WAITING_ROOM_EVENTS.WR_PATIENT_CANCEL, async (data) => {
    if (userRole !== 'patient') {
      socket.emit(EVENTS.ERROR, { message: 'Only patients can cancel' });
      return;
    }

    const { queueEntryId, reason } = data || {};

    if (!queueEntryId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing queueEntryId' });
      return;
    }

    console.log(`[WaitingRoom] Patient ${userId} cancelling turn ${queueEntryId}`);

    try {
      const entry = await waitingRoomService.cancelTurn(queueEntryId, reason);

      socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CANCEL, {
        status: 'success',
        message: 'Turno cancelado exitosamente',
        queueEntryId
      });

      // Salir de la sala del doctor
      socket.leave(`doctor:${entry.doctorId}`);

    } catch (error) {
      console.error('[WaitingRoom] Cancel error:', error.message);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  /**
   * Paciente solicita su posicion actual
   */
  socket.on('get_position', async (data) => {
    const { appointmentId } = data || {};

    if (!appointmentId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing appointmentId' });
      return;
    }

    try {
      const position = await waitingRoomService.getPatientPosition(appointmentId);

      if (position) {
        socket.emit(WAITING_ROOM_EVENTS.WR_POSITION_UPDATE, {
          position: position.position,
          peopleAhead: position.peopleAhead,
          estimatedMinutes: position.estimatedWaitMinutes,
          status: position.status
        });
      }
    } catch (error) {
      console.error('[WaitingRoom] Get position error:', error.message);
    }
  });

  /**
   * Suscribirse a cola de un doctor
   */
  socket.on('subscribe_queue', async (data) => {
    const { doctorId } = data || {};

    if (!doctorId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing doctorId' });
      return;
    }

    const roomName = `doctor:${doctorId}`;
    socket.join(roomName);

    console.log(`[WaitingRoom] User ${userId} subscribed to queue of doctor ${doctorId}`);

    // Enviar cola actual
    try {
      const chairs = await waitingRoomService.getChairsVisualization(doctorId);
      socket.emit('chairs_update', chairs);
    } catch (error) {
      console.error('[WaitingRoom] Error getting chairs:', error.message);
    }
  });

  // ==========================================
  // DISCONNECT
  // ==========================================
  socket.on('disconnect', (reason) => {
    console.log(`[WaitingRoom] User ${userId} disconnected: ${reason}`);

    // Si es doctor, marcar como offline
    if (userRole === 'doctor' && onlineDoctors.has(userId)) {
      onlineDoctors.delete(userId);
      const roomName = `doctor:${userId}`;

      nsp.to(roomName).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, {
        doctorId: userId,
        timestamp: new Date().toISOString(),
        reason: 'disconnected'
      });

      console.log(`[WaitingRoom] Doctor ${userId} marked as OFFLINE due to disconnect`);
    }

    // Si es paciente, mantenerlo en la cola (no se elimina por desconexion)
  });
};

/**
 * Verificar si un doctor esta online
 */
const isDoctorOnline = (doctorId) => {
  return onlineDoctors.has(doctorId);
};

/**
 * Obtener doctores online
 */
const getOnlineDoctors = () => {
  return Array.from(onlineDoctors.keys());
};

module.exports = waitingRoomHandler;
module.exports.isDoctorOnline = isDoctorOnline;
module.exports.getOnlineDoctors = getOnlineDoctors;
