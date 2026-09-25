/**
 * Waiting Room Socket Handler - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Handlers en tiempo real para el namespace /waiting-room
 */

const { WAITING_ROOM_EVENTS, EVENTS } = require('../events');
const waitingRoomService = require('../../services/waitingRoomService');
const { todayCaracas } = require('../../utils/dateCaracas');
const db = require('../../models');
const { Appointment } = db;

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
  socket.on(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, async () => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can go online' });
      return;
    }

    const roomName = `doctor:${userId}`;
    const publicRoom = `queue-public:${userId}`;
    socket.join(roomName);

    onlineDoctors.set(userId, {
      socketId: socket.id,
      onlineSince: new Date()
    });

    console.log(`[WaitingRoom] Doctor ${userId} is now ONLINE`);

    // Obtener cola actual
    try {
      const queueData = await waitingRoomService.getDoctorQueue(userId, { id: userId, role: userRole });

      // Enviar cola completa privada al doctor
      socket.emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, queueData);

      // Notificar a la sala pública que el doctor está online
      nsp.to(publicRoom).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, {
        doctorId: userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[WaitingRoom] Error getting queue:', error.message);
    }
  });

  /**
   * Doctor se marca como offline
   */
  socket.on(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, () => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can go offline' });
      return;
    }

    const publicRoom = `queue-public:${userId}`;
    onlineDoctors.delete(userId);

    console.log(`[WaitingRoom] Doctor ${userId} is now OFFLINE`);

    // Notificar a pacientes en sala pública
    nsp.to(publicRoom).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, {
      doctorId: userId,
      timestamp: new Date().toISOString(),
      message: 'El doctor ha terminado las consultas del día'
    });
  });

  /**
   * Doctor llama al siguiente paciente
   */
  socket.on(WAITING_ROOM_EVENTS.WR_CALL_NEXT, async () => {
    if (userRole !== 'doctor') {
      socket.emit(EVENTS.ERROR, { message: 'Only doctors can call patients' });
      return;
    }

    console.log(`[WaitingRoom] Doctor ${userId} calling next patient`);

    try {
      const entry = await waitingRoomService.callNextPatient(userId, { id: userId, role: userRole });

      if (!entry) {
        socket.emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, {
          message: 'No hay más pacientes en la cola',
          queue: []
        });
        return;
      }

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
   * Doctor llama a un paciente específico
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

    console.log(`[WaitingRoom] Doctor ${userId} calling patient entry ${queueEntryId}`);

    try {
      const entry = await waitingRoomService.callSpecificPatient(queueEntryId, { id: userId, role: userRole });

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
      const result = await waitingRoomService.checkIn(appointmentId, { id: userId, role: userRole });

      // A5 & D3: Unirse a la sala pública del doctor (NUNCA a doctor:{doctorId})
      const publicRoom = `queue-public:${doctorId}`;
      socket.join(publicRoom);

      // Confirmar check-in al paciente
      socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CHECKIN, {
        status: 'success',
        message: '¡Check-in exitoso! Ya estás en la cola virtual.',
        position: result.position,
        estimatedWaitMinutes: result.estimatedWaitMinutes,
        queueEntryId: result.queueEntry.id,
        appointmentId
      });

      // Emitir actualización de posición
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
      const entry = await waitingRoomService.cancelTurn(queueEntryId, { id: userId, role: userRole }, reason);

      socket.emit(WAITING_ROOM_EVENTS.WR_PATIENT_CANCEL, {
        status: 'success',
        message: 'Turno cancelado exitosamente',
        queueEntryId
      });

      // Salir de la sala pública del doctor
      if (entry?.doctorId) {
        socket.leave(`queue-public:${entry.doctorId}`);
      }
    } catch (error) {
      console.error('[WaitingRoom] Cancel error:', error.message);
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  /**
   * Paciente solicita su posición actual (A4: validada contra pertenencia)
   */
  socket.on('get_position', async (data) => {
    const { appointmentId } = data || {};

    if (!appointmentId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing appointmentId' });
      return;
    }

    try {
      const position = await waitingRoomService.getPatientPosition(appointmentId, { id: userId, role: userRole });

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
      socket.emit(EVENTS.ERROR, { message: error.message });
    }
  });

  /**
   * Suscribirse a cola de un doctor
   * A5: Solo pacientes con cita de hoy pueden suscribirse; los une a queue-public:{doctorId}
   */
  socket.on('subscribe_queue', async (data) => {
    const { doctorId } = data || {};

    if (!doctorId) {
      socket.emit(EVENTS.ERROR, { message: 'Missing doctorId' });
      return;
    }

    // Si es paciente, verificar que tenga cita hoy con este doctor
    if (userRole === 'patient') {
      try {
        const today = todayCaracas();
        const appointment = await Appointment.findOne({
          where: {
            patientId: userId,
            doctorId,
            appointmentDate: today
          }
        });

        if (!appointment) {
          socket.emit(EVENTS.ERROR, { message: 'Solo puedes ver la sala de espera si tienes cita hoy con este especialista' });
          return;
        }
      } catch (err) {
        console.error('[WaitingRoom] Error checking appointment for subscribe:', err.message);
        socket.emit(EVENTS.ERROR, { message: 'Error verificando cita' });
        return;
      }
    }

    // Unirse a la sala pública (nunca a doctor:{doctorId})
    const publicRoomName = `queue-public:${doctorId}`;
    socket.join(publicRoomName);

    console.log(`[WaitingRoom] User ${userId} (${userRole}) subscribed to ${publicRoomName}`);

    // Enviar visualización de sillitas y estado inicial
    try {
      const chairs = await waitingRoomService.getChairsVisualization(doctorId);
      socket.emit('chairs_update', chairs);

      if (isDoctorOnline(doctorId)) {
        socket.emit(WAITING_ROOM_EVENTS.WR_DOCTOR_ONLINE, {
          doctorId,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[WaitingRoom] Error getting chairs:', error.message);
    }
  });

  // ==========================================
  // DISCONNECT
  // ==========================================
  socket.on('disconnect', (reason) => {
    console.log(`[WaitingRoom] User ${userId} disconnected: ${reason}`);

    // Si es doctor, marcar como offline y avisar a pacientes en queue-public
    if (userRole === 'doctor' && onlineDoctors.has(userId)) {
      onlineDoctors.delete(userId);
      const publicRoom = `queue-public:${userId}`;

      nsp.to(publicRoom).emit(WAITING_ROOM_EVENTS.WR_DOCTOR_OFFLINE, {
        doctorId: userId,
        timestamp: new Date().toISOString(),
        reason: 'disconnected'
      });

      console.log(`[WaitingRoom] Doctor ${userId} marked as OFFLINE due to disconnect`);
    }
  });
};

/**
 * Verificar si un doctor está online
 */
const isDoctorOnline = (doctorId) => {
  return onlineDoctors.has(parseInt(doctorId, 10));
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
