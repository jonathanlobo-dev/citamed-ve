/**
 * WaitingRoomService - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA
 * Servicio que gestiona la cola en tiempo real
 */

const { Op } = require('sequelize');
const db = require('../models');
const { getIO } = require('../config/socket');
const { WAITING_ROOM_EVENTS } = require('../socket/events');
const { todayCaracas, nowMinutesCaracas } = require('../utils/dateCaracas');
const appointmentService = require('./appointmentService');

const { WaitingQueue, Appointment, User, DoctorProfile } = db;

class WaitingRoomService {
  constructor() {
    // Tiempo promedio de consulta por defecto (minutos)
    this.defaultConsultationTime = 20;
  }

  /**
   * Helper privado para control de pertenencia (A4)
   */
  _assertAccess(entry, user, allowedRoles = []) {
    if (!user) {
      const err = new Error('No autenticado');
      err.statusCode = 401;
      throw err;
    }
    if (user.role === 'admin') return true;

    if (allowedRoles.includes('patient') && user.role === 'patient') {
      const patientId = entry.patientId || (entry.patient && entry.patient.id);
      if (patientId && patientId === user.id) return true;
    }

    if (allowedRoles.includes('doctor') && user.role === 'doctor') {
      const doctorId = entry.doctorId || (entry.doctor && entry.doctor.id);
      if (doctorId && doctorId === user.id) return true;
    }

    const err = new Error('No tienes permiso para acceder a este recurso');
    err.statusCode = 403;
    throw err;
  }

  /**
   * Check-in de paciente - Activar entrada en cola existente o crear nueva
   * Solo el paciente dueño de la cita puede hacer check-in.
   * La cita debe ser de hoy (Venezuela) y estar confirmed.
   */
  async checkIn(appointmentId, user = null) {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: User, as: 'patient' },
        { model: User, as: 'doctor' },
        { model: DoctorProfile, as: 'doctorProfile' }
      ]
    });

    if (!appointment) {
      const err = new Error('Cita no encontrada');
      err.statusCode = 404;
      throw err;
    }

    // A4: Validar pertenencia del paciente
    if (user) {
      this._assertAccess(appointment, user, ['patient']);
    }

    // A3 & D5: Verificar que es el día correcto en hora de Caracas
    const today = todayCaracas();
    const appointmentDateStr = typeof appointment.appointmentDate === 'string'
      ? appointment.appointmentDate.slice(0, 10)
      : todayCaracas(new Date(appointment.appointmentDate));

    if (appointmentDateStr !== today) {
      const err = new Error('Solo puedes hacer check-in el día de tu cita');
      err.statusCode = 400;
      throw err;
    }

    // A3 & D6: Verificar estado de la cita (exactamente confirmed)
    if (appointment.status === 'pending') {
      const err = new Error('Tu cita aún no ha sido confirmada por el médico');
      err.statusCode = 400;
      throw err;
    }

    if (appointment.status !== 'confirmed') {
      const err = new Error('Esta cita no puede hacer check-in');
      err.statusCode = 400;
      throw err;
    }

    // Buscar entrada existente en cola (creada al agendar)
    let queueEntry = await WaitingQueue.findOne({
      where: { appointmentId }
    });

    if (queueEntry) {
      // La cita ya tiene entrada en cola - activarla si está en 'scheduled'
      if (queueEntry.status === 'scheduled') {
        queueEntry.status = 'waiting';
        queueEntry.joinedQueueAt = new Date();
        await queueEntry.save();
      } else if (['waiting', 'en_route', 'checked_in'].includes(queueEntry.status)) {
        // Ya está activa en la cola
        return {
          queueEntry,
          position: queueEntry.position,
          estimatedWaitMinutes: queueEntry.estimatedWaitMinutes,
          alreadyActive: true,
          appointment: {
            id: appointment.id,
            time: appointment.appointmentTime,
            doctor: {
              name: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
            }
          }
        };
      }
    } else {
      // No tiene entrada en cola (cita legacy) - crear una nueva
      const stats = await WaitingQueue.getDayStats(appointment.doctorId, today);
      const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

      queueEntry = await WaitingQueue.addToQueue(
        appointmentId,
        appointment.doctorId,
        appointment.patientId,
        avgTime
      );
    }

    // No cambiar estado de la cita, solo registrar hora de check-in
    appointment.checkInTime = new Date();
    await appointment.save();

    // Recalcular tiempos con base en el progreso real del día
    await this._recalculateDynamicTimes(appointment.doctorId);

    // Notificar via WebSocket
    this._emitQueueUpdate(appointment.doctorId);
    this._emitPublicQueue(appointment.doctorId);

    return {
      queueEntry,
      position: queueEntry.position,
      estimatedWaitMinutes: queueEntry.estimatedWaitMinutes,
      appointment: {
        id: appointment.id,
        time: appointment.appointmentTime,
        doctor: {
          name: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        }
      }
    };
  }

  /**
   * Marcar paciente como "en camino" (detectado por GPS)
   */
  async markEnRoute(queueEntryId, user = null) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Entrada de cola no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['patient']);
    }

    if (entry.status !== 'waiting') {
      return entry; // Ya está en otro estado, no cambiar
    }

    entry.status = 'en_route';
    await entry.save();

    // Notificar al doctor y cola pública
    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);

    return entry;
  }

  /**
   * Confirmar llegada física (FASE 3 - cuando el paciente llega al consultorio)
   */
  async confirmArrival(queueEntryId, user = null) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Entrada de cola no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['patient', 'doctor']);
    }

    if (!['waiting', 'en_route'].includes(entry.status)) {
      const err = new Error('El paciente debe estar en cola o en camino');
      err.statusCode = 400;
      throw err;
    }

    entry.status = 'checked_in';
    entry.checkInTime = new Date();
    await entry.save();

    // Notificar al doctor y sala pública
    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);

    return entry;
  }

  /**
   * @deprecated Use confirmArrival instead
   */
  async physicalCheckIn(queueEntryId, user = null) {
    return this.confirmArrival(queueEntryId, user);
  }

  /**
   * Obtener cola actual del doctor (A2: solo citas de hoy)
   */
  async getDoctorQueue(doctorId, user = null) {
    if (user && user.role !== 'admin' && (user.role !== 'doctor' || user.id !== parseInt(doctorId, 10))) {
      const err = new Error('No tienes permiso para ver esta cola médica');
      err.statusCode = 403;
      throw err;
    }

    const today = todayCaracas();
    const queue = await WaitingQueue.getActiveQueue(doctorId, true, today);
    const stats = await WaitingQueue.getDayStats(doctorId, today);

    // Formatear para frontend
    const formattedQueue = queue.map((entry, index) => ({
      id: entry.id,
      appointmentId: entry.appointmentId || entry.appointment?.id,
      patientId: entry.patientId || entry.patient?.id,
      position: entry.position,
      status: entry.status,
      patient: {
        id: entry.patient.id,
        name: `${entry.patient.firstName} ${entry.patient.lastName}`,
        initials: `${entry.patient.firstName[0]}${entry.patient.lastName[0]}`,
        phone: entry.patient.phone || ''
      },
      appointmentTime: entry.appointment.appointmentTime,
      estimatedWaitMinutes: index * (stats.avgConsultationTime || 20),
      joinedAt: entry.joinedQueueAt,
      isCheckedIn: entry.status === 'checked_in',
      notifications: {
        fiveSent: entry.notification5Sent,
        twoSent: entry.notification2Sent,
        nextSent: entry.notificationNextSent,
        turnSent: entry.notificationTurnSent
      }
    }));

    return {
      queue: formattedQueue,
      stats: {
        totalWaiting: queue.filter(e => ['waiting', 'checked_in'].includes(e.status)).length,
        inConsultation: queue.filter(e => e.status === 'in_consultation').length,
        completedToday: stats.completedConsultations,
        avgWaitTime: stats.avgWaitTime,
        avgConsultationTime: stats.avgConsultationTime
      }
    };
  }

  /**
   * Obtener posición del paciente (A4: solo el paciente dueño o médico)
   */
  async getPatientPosition(appointmentId, user = null) {
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      const err = new Error('Cita no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user && user.role !== 'admin' && appointment.patientId !== user.id && appointment.doctorId !== user.id) {
      const err = new Error('No tienes permiso para consultar esta posición');
      err.statusCode = 403;
      throw err;
    }

    const positionInfo = await WaitingQueue.getPatientPosition(appointmentId);

    if (!positionInfo) {
      return null;
    }

    const { entry, position, peopleAhead, estimatedWaitMinutes } = positionInfo;

    return {
      position,
      peopleAhead,
      estimatedWaitMinutes,
      status: entry.status,
      joinedAt: entry.joinedQueueAt,
      appointment: entry.appointment
    };
  }

  /**
   * Llamar al siguiente paciente (A4 & D1)
   */
  async callNextPatient(doctorId, user = null) {
    if (user && user.role !== 'admin' && (user.role !== 'doctor' || user.id !== parseInt(doctorId, 10))) {
      const err = new Error('No tienes permiso para llamar pacientes en esta cola');
      err.statusCode = 403;
      throw err;
    }

    const today = todayCaracas();
    const nextEntry = await WaitingQueue.callNext(doctorId, null, today);

    if (!nextEntry) {
      return null;
    }

    // A5: Emitir notificación al paciente directamente en /waiting-room a su room user:{id}
    this._emitToPatient(nextEntry.patientId, WAITING_ROOM_EVENTS.WR_YOUR_TURN, {
      message: '¡Es tu turno! Por favor dirígete al consultorio.',
      appointmentId: nextEntry.appointmentId,
      queueEntryId: nextEntry.id
    });

    // Actualizar colas
    this._emitQueueUpdate(doctorId);
    this._emitPublicQueue(doctorId);

    // Recalcular tiempos para los demás
    await this._recalculateAndNotify(doctorId);

    return nextEntry;
  }

  /**
   * Llamar a un paciente específico (A4 & D1)
   */
  async callSpecificPatient(queueEntryId, user = null) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Paciente no encontrado en la cola');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['doctor']);
    }

    entry.status = 'called';
    entry.calledTime = new Date();
    entry.notificationTurnSent = true;
    await entry.save();

    // A5: Emitir notificación al paciente a su room user:{id}
    this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_YOUR_TURN, {
      message: '¡Es tu turno! Por favor dirígete al consultorio.',
      appointmentId: entry.appointmentId,
      queueEntryId: entry.id
    });

    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    return entry;
  }

  /**
   * Iniciar consulta (A4 & A6)
   */
  async startConsultation(queueEntryId, user = null) {
    const entry = await WaitingQueue.findByPk(queueEntryId);
    if (!entry) {
      const err = new Error('Entrada no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['doctor']);
    }

    const updatedEntry = await WaitingQueue.startConsultation(queueEntryId);

    // Actualizar cita a in_progress
    const appointment = await Appointment.findByPk(entry.appointmentId);
    if (appointment) {
      await appointment.addStatusHistory('in_progress', 'Consulta iniciada');
    }

    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);

    return updatedEntry;
  }

  /**
   * Finalizar consulta (A6: sincronizado con appointmentService.completeAppointment)
   */
  async endConsultation(queueEntryId, user = null, notesData = {}) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Entrada no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['doctor']);
    }

    // A6: Delegar en appointmentService.completeAppointment para guardar notas y cerrar estado
    await appointmentService.completeAppointment(entry.appointmentId, user || { id: entry.doctorId, role: 'doctor' }, notesData);

    // Actualizar cola y notificar
    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    const freshEntry = await WaitingQueue.findByPk(queueEntryId);
    return freshEntry;
  }

  /**
   * Marcar paciente como no-show (A6: sincronizado con appointmentService.markAppointmentNoShow)
   */
  async markNoShow(queueEntryId, user = null) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Entrada no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['doctor']);
    }

    await appointmentService.markAppointmentNoShow(entry.appointmentId, user || { id: entry.doctorId, role: 'doctor' });

    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    const freshEntry = await WaitingQueue.findByPk(queueEntryId);
    return freshEntry;
  }

  /**
   * Cancelar turno (A6: cancela también la cita con cancelAppointment)
   */
  async cancelTurn(queueEntryId, user = null, reason = 'Cancelado por el paciente') {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      const err = new Error('Entrada no encontrada');
      err.statusCode = 404;
      throw err;
    }

    if (user) {
      this._assertAccess(entry, user, ['patient', 'doctor']);
    }

    const cancelledBy = user && user.role === 'doctor' ? 'doctor' : 'patient';
    await appointmentService.cancelAppointment(entry.appointmentId, cancelledBy, reason);

    this._emitQueueUpdate(entry.doctorId);
    this._emitPublicQueue(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    const freshEntry = await WaitingQueue.findByPk(queueEntryId);
    return freshEntry;
  }

  /**
   * Obtener estadísticas del día
   */
  async getDayStats(doctorId, date = null) {
    return await WaitingQueue.getDayStats(doctorId, date || todayCaracas());
  }

  // ==========================================
  // METODOS PRIVADOS
  // ==========================================

  /**
   * Emitir actualización de cola privada al doctor via WebSocket (con nombres completos)
   */
  async _emitQueueUpdate(doctorId) {
    try {
      const io = getIO();
      const queueData = await this.getDoctorQueue(doctorId);

      // Emitir solo a la room privada del doctor
      io.of('/waiting-room')
        .to(`doctor:${doctorId}`)
        .emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, queueData);

    } catch (error) {
      console.error('[WaitingRoomService] Error emitting queue update:', error.message);
    }
  }

  /**
   * A5: Emitir actualización de cola pública a la sala queue-public:{doctorId}
   * Solo incluye iniciales, posición, estado y tiempo estimado (sin datos personales)
   */
  async _emitPublicQueue(doctorId) {
    try {
      const io = getIO();
      const queueData = await this.getDoctorQueue(doctorId);

      const publicQueue = {
        queue: queueData.queue.map(entry => ({
          position: entry.position,
          status: entry.status,
          patient: {
            initials: entry.patient.initials
          },
          estimatedWaitMinutes: entry.estimatedWaitMinutes
        })),
        stats: {
          totalWaiting: queueData.stats.totalWaiting,
          avgWaitTime: queueData.stats.avgWaitTime
        }
      };

      io.of('/waiting-room')
        .to(`queue-public:${doctorId}`)
        .emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, publicQueue);

      const chairs = await this.getChairsVisualization(doctorId);
      io.of('/waiting-room')
        .to(`queue-public:${doctorId}`)
        .emit('chairs_update', chairs);

    } catch (error) {
      console.error('[WaitingRoomService] Error emitting public queue:', error.message);
    }
  }

  /**
   * A5: Emitir directamente al paciente por su room personal en /waiting-room
   */
  _emitToPatient(patientId, event, data) {
    try {
      const io = getIO();
      io.of('/waiting-room')
        .to(`user:${patientId}`)
        .emit(event, data);
    } catch (error) {
      console.error('[WaitingRoomService] Error emitting to patient:', error.message);
    }
  }

  /**
   * Recalcular tiempos DINÁMICAMENTE basándose en el progreso real del día (A2)
   */
  async _recalculateDynamicTimes(doctorId) {
    const today = todayCaracas();
    const stats = await WaitingQueue.getDayStats(doctorId, today);

    // Obtener todas las entradas activas del día ordenadas por hora de cita
    const activeEntries = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['scheduled', 'waiting', 'en_route', 'checked_in', 'called'] }
      },
      include: [{
        model: Appointment,
        as: 'appointment',
        where: { appointmentDate: today },
        required: true,
        attributes: ['appointmentTime', 'duration']
      }],
      order: [['position', 'ASC']]
    });

    if (activeEntries.length === 0) return;

    const avgRealTime = stats.avgConsultationTime || this.defaultConsultationTime;
    const currentTime = nowMinutesCaracas();

    let accumulatedDelay = 0;

    // Verificar si hay consulta en progreso hoy
    const inProgress = await WaitingQueue.findOne({
      where: {
        doctorId,
        status: 'in_consultation'
      },
      include: [{
        model: Appointment,
        as: 'appointment',
        where: { appointmentDate: today },
        required: true
      }]
    });

    if (inProgress && inProgress.consultationStart) {
      const consultationMinutes = Math.round((new Date() - new Date(inProgress.consultationStart)) / 60000);
      const expectedDuration = inProgress.appointment?.duration || avgRealTime;

      if (consultationMinutes > expectedDuration) {
        accumulatedDelay = consultationMinutes - expectedDuration;
      }
    }

    // Actualizar estimaciones para cada entrada
    let position = 0;
    for (const entry of activeEntries) {
      const appointmentTimeStr = entry.appointment?.appointmentTime || '08:00';
      const [hours, minutes] = appointmentTimeStr.split(':').map(Number);
      const appointmentMinutes = hours * 60 + minutes;

      const waitMinutesFromPosition = position * avgRealTime;
      const estimatedStartTime = appointmentMinutes + waitMinutesFromPosition + accumulatedDelay;
      const minutesFromNow = Math.max(0, estimatedStartTime - currentTime);

      entry.estimatedWaitMinutes = minutesFromNow;
      await entry.save();

      position++;
    }
  }

  /**
   * Recalcular tiempos y enviar notificaciones progresivas (A2 & A5)
   */
  async _recalculateAndNotify(doctorId) {
    await this._recalculateDynamicTimes(doctorId);

    const today = todayCaracas();
    const stats = await WaitingQueue.getDayStats(doctorId, today);
    const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

    const queue = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'en_route', 'checked_in'] }
      },
      include: [{
        model: Appointment,
        as: 'appointment',
        where: { appointmentDate: today },
        required: true
      }],
      order: [['position', 'ASC']]
    });

    // Enviar notificaciones progresivas
    for (const entry of queue) {
      if (entry.position === 5 && !entry.notification5Sent) {
        entry.notification5Sent = true;
        await entry.save();
        this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_POSITION_UPDATE, {
          message: 'Faltan 5 personas para tu turno. Tiempo estimado: ' + (entry.estimatedWaitMinutes || avgTime * 5) + ' min',
          position: 5,
          estimatedMinutes: entry.estimatedWaitMinutes,
          type: '5_remaining'
        });
      }

      if (entry.position === 2 && !entry.notification2Sent) {
        entry.notification2Sent = true;
        await entry.save();
        this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_ALMOST_YOUR_TURN, {
          message: 'Faltan 2 personas. ¡Prepárate para tu consulta!',
          position: 2,
          estimatedMinutes: entry.estimatedWaitMinutes,
          type: '2_remaining'
        });
      }

      if (entry.position === 1 && !entry.notificationNextSent) {
        entry.notificationNextSent = true;
        await entry.save();
        this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_ALMOST_YOUR_TURN, {
          message: '¡Eres el siguiente! Dirígete al consultorio.',
          position: 1,
          type: 'next'
        });
      }

      this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_POSITION_UPDATE, {
        position: entry.position,
        estimatedMinutes: entry.estimatedWaitMinutes,
        queueEntryId: entry.id
      });
    }
  }

  /**
   * Generar visualización de "sillitas" (A2: solo citas de hoy)
   */
  async getChairsVisualization(doctorId, maxChairs = 10) {
    const today = todayCaracas();
    const queue = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'checked_in', 'called', 'in_consultation'] }
      },
      include: [
        { model: User, as: 'patient', attributes: ['firstName', 'lastName'] },
        { model: Appointment, as: 'appointment', where: { appointmentDate: today }, required: true }
      ],
      order: [['position', 'ASC']],
      limit: maxChairs
    });

    const chairs = [];
    for (let i = 1; i <= maxChairs; i++) {
      const occupant = queue.find(e => e.position === i);

      chairs.push({
        position: i,
        occupied: !!occupant,
        status: occupant ? occupant.status : 'empty',
        patient: occupant ? {
          initials: `${occupant.patient.firstName[0]}${occupant.patient.lastName[0]}`,
          isCheckedIn: occupant.status === 'checked_in',
          isCalled: occupant.status === 'called',
          isInConsultation: occupant.status === 'in_consultation'
        } : null
      });
    }

    return {
      chairs,
      totalInQueue: queue.length,
      inConsultation: queue.filter(e => e.status === 'in_consultation').length > 0
    };
  }
}

module.exports = new WaitingRoomService();
