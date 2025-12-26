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

const { WaitingQueue, Appointment, User, DoctorProfile } = db;

class WaitingRoomService {
  constructor() {
    // Tiempo promedio de consulta por defecto (minutos)
    this.defaultConsultationTime = 20;
  }

  /**
   * Check-in de paciente - Activar entrada en cola existente o crear nueva
   * Con el nuevo sistema, la cola ya se crea al agendar (estado 'scheduled')
   * El check-in cambia el estado a 'waiting' (cola activa)
   */
  async checkIn(appointmentId) {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: User, as: 'patient' },
        { model: User, as: 'doctor' },
        { model: DoctorProfile, as: 'doctorProfile' }
      ]
    });

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    // Verificar que es el dia correcto
    const today = new Date().toISOString().split('T')[0];
    const appointmentDateStr = new Date(appointment.appointmentDate).toISOString().split('T')[0];
    if (appointmentDateStr !== today) {
      throw new Error('Solo puedes hacer check-in el dia de tu cita');
    }

    // Verificar estado de la cita
    if (!['pending', 'confirmed'].includes(appointment.status)) {
      throw new Error('Esta cita no puede hacer check-in');
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
      const stats = await WaitingQueue.getDayStats(appointment.doctorId);
      const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

      queueEntry = await WaitingQueue.addToQueue(
        appointmentId,
        appointment.doctorId,
        appointment.patientId,
        avgTime
      );
    }

    // Actualizar estado de la cita
    appointment.status = 'confirmed';
    appointment.checkInTime = new Date();
    await appointment.save();

    // Recalcular tiempos con base en el progreso real del día
    await this._recalculateDynamicTimes(appointment.doctorId);

    // Notificar via WebSocket
    this._emitQueueUpdate(appointment.doctorId);

    // Retornar informacion completa
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
  async markEnRoute(queueEntryId) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Entrada de cola no encontrada');
    }

    if (entry.status !== 'waiting') {
      return entry; // Ya está en otro estado, no cambiar
    }

    entry.status = 'en_route';
    await entry.save();

    // Notificar al doctor que el paciente viene en camino
    this._emitQueueUpdate(entry.doctorId);

    return entry;
  }

  /**
   * Confirmar llegada física (FASE 3 - cuando el paciente llega al consultorio)
   */
  async confirmArrival(queueEntryId) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Entrada de cola no encontrada');
    }

    if (!['waiting', 'en_route'].includes(entry.status)) {
      throw new Error('El paciente debe estar en cola o en camino');
    }

    entry.status = 'checked_in';
    entry.checkInTime = new Date();
    await entry.save();

    // Notificar al doctor que el paciente llegó
    this._emitQueueUpdate(entry.doctorId);

    return entry;
  }

  /**
   * @deprecated Use confirmArrival instead
   * Check-in físico (cuando el paciente llega al consultorio)
   */
  async physicalCheckIn(queueEntryId) {
    return this.confirmArrival(queueEntryId);
  }

  /**
   * Obtener cola actual del doctor
   */
  async getDoctorQueue(doctorId) {
    const queue = await WaitingQueue.getActiveQueue(doctorId);
    const stats = await WaitingQueue.getDayStats(doctorId);

    // Formatear para frontend
    const formattedQueue = queue.map((entry, index) => ({
      id: entry.id,
      position: entry.position,
      status: entry.status,
      patient: {
        id: entry.patient.id,
        name: `${entry.patient.firstName} ${entry.patient.lastName}`,
        initials: `${entry.patient.firstName[0]}${entry.patient.lastName[0]}`
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
   * Obtener posicion del paciente
   */
  async getPatientPosition(appointmentId) {
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
   * Llamar al siguiente paciente
   */
  async callNextPatient(doctorId) {
    const nextEntry = await WaitingQueue.callNext(doctorId);

    if (!nextEntry) {
      return null;
    }

    // Emitir notificacion al paciente
    this._emitToPatient(nextEntry.patientId, WAITING_ROOM_EVENTS.WR_YOUR_TURN, {
      message: 'Es tu turno! Por favor dirigete al consultorio.',
      appointmentId: nextEntry.appointmentId,
      queueEntryId: nextEntry.id
    });

    // Actualizar cola
    this._emitQueueUpdate(doctorId);

    // Recalcular tiempos para los demas
    await this._recalculateAndNotify(doctorId);

    return nextEntry;
  }

  /**
   * Llamar a un paciente especifico
   */
  async callSpecificPatient(queueEntryId) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Paciente no encontrado en la cola');
    }

    entry.status = 'called';
    entry.calledTime = new Date();
    entry.notificationTurnSent = true;
    await entry.save();

    // Notificar al paciente
    this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_YOUR_TURN, {
      message: 'Es tu turno! Por favor dirigete al consultorio.',
      appointmentId: entry.appointmentId,
      queueEntryId: entry.id
    });

    this._emitQueueUpdate(entry.doctorId);

    return entry;
  }

  /**
   * Iniciar consulta
   */
  async startConsultation(queueEntryId) {
    const entry = await WaitingQueue.startConsultation(queueEntryId);

    if (!entry) {
      throw new Error('Entrada no encontrada');
    }

    // Actualizar cita
    const appointment = await Appointment.findByPk(entry.appointmentId);
    if (appointment) {
      await appointment.addStatusHistory('in_progress', 'Consulta iniciada');
    }

    this._emitQueueUpdate(entry.doctorId);

    return entry;
  }

  /**
   * Finalizar consulta
   */
  async endConsultation(queueEntryId) {
    const entry = await WaitingQueue.endConsultation(queueEntryId);

    if (!entry) {
      throw new Error('Entrada no encontrada');
    }

    // Actualizar cita
    const appointment = await Appointment.findByPk(entry.appointmentId);
    if (appointment) {
      appointment.status = 'completed';
      appointment.checkOutTime = new Date();
      appointment.actualDuration = entry.consultationDurationMinutes;
      await appointment.save();
    }

    // Actualizar cola y notificar
    this._emitQueueUpdate(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    return entry;
  }

  /**
   * Marcar paciente como no-show
   */
  async markNoShow(queueEntryId) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Entrada no encontrada');
    }

    entry.status = 'no_show';
    await entry.save();

    // Actualizar cita
    const appointment = await Appointment.findByPk(entry.appointmentId);
    if (appointment) {
      await appointment.addStatusHistory('no_show', 'Paciente no se presento');
    }

    // Recalcular posiciones
    await WaitingQueue.update(
      { position: db.sequelize.literal('position - 1') },
      {
        where: {
          doctorId: entry.doctorId,
          position: { [Op.gt]: entry.position },
          status: { [Op.in]: ['waiting', 'checked_in'] }
        }
      }
    );

    this._emitQueueUpdate(entry.doctorId);
    await this._recalculateAndNotify(entry.doctorId);

    return entry;
  }

  /**
   * Cancelar turno
   */
  async cancelTurn(queueEntryId, reason = 'Cancelado por el paciente') {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Entrada no encontrada');
    }

    const doctorId = entry.doctorId;
    const position = entry.position;

    entry.status = 'cancelled';
    await entry.save();

    // Recalcular posiciones
    await WaitingQueue.update(
      { position: db.sequelize.literal('position - 1') },
      {
        where: {
          doctorId,
          position: { [Op.gt]: position },
          status: { [Op.in]: ['waiting', 'checked_in'] }
        }
      }
    );

    this._emitQueueUpdate(doctorId);
    await this._recalculateAndNotify(doctorId);

    return entry;
  }

  /**
   * Obtener estadisticas del dia
   */
  async getDayStats(doctorId, date = new Date()) {
    return await WaitingQueue.getDayStats(doctorId, date);
  }

  // ==========================================
  // METODOS PRIVADOS
  // ==========================================

  /**
   * Emitir actualizacion de cola via WebSocket
   */
  async _emitQueueUpdate(doctorId) {
    try {
      const io = getIO();
      const queueData = await this.getDoctorQueue(doctorId);

      // Emitir a la room del doctor
      io.of('/waiting-room')
        .to(`doctor:${doctorId}`)
        .emit(WAITING_ROOM_EVENTS.WR_QUEUE_UPDATE, queueData);

    } catch (error) {
      console.error('[WaitingRoomService] Error emitting queue update:', error.message);
    }
  }

  /**
   * Emitir a un paciente especifico
   */
  _emitToPatient(patientId, event, data) {
    try {
      const io = getIO();
      io.of('/notifications').emit(event, {
        ...data,
        targetUserId: patientId
      });
    } catch (error) {
      console.error('[WaitingRoomService] Error emitting to patient:', error.message);
    }
  }

  /**
   * Recalcular tiempos DINÁMICAMENTE basándose en el progreso real del día
   * Si las consultas están tardando menos, actualiza las estimaciones hacia abajo
   * Si están tardando más, actualiza hacia arriba
   */
  async _recalculateDynamicTimes(doctorId) {
    const stats = await WaitingQueue.getDayStats(doctorId);

    // Obtener todas las entradas activas del día ordenadas por hora de cita
    const activeEntries = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['scheduled', 'waiting', 'en_route', 'checked_in', 'called'] }
      },
      include: [{
        model: Appointment,
        as: 'appointment',
        attributes: ['appointmentTime', 'duration']
      }],
      order: [['position', 'ASC']]
    });

    if (activeEntries.length === 0) return;

    // Calcular el tiempo promedio REAL basado en consultas completadas hoy
    const avgRealTime = stats.avgConsultationTime || this.defaultConsultationTime;

    // Obtener la hora actual
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Calcular tiempo acumulado basándose en consultas anteriores
    let accumulatedDelay = 0;

    // Verificar si hay consulta en progreso
    const inProgress = await WaitingQueue.findOne({
      where: {
        doctorId,
        status: 'in_consultation'
      }
    });

    if (inProgress && inProgress.consultationStart) {
      // Calcular cuánto tiempo lleva la consulta actual
      const consultationMinutes = Math.round((now - new Date(inProgress.consultationStart)) / 60000);
      const expectedDuration = inProgress.appointment?.duration || avgRealTime;

      // Si la consulta lleva más del tiempo esperado, hay retraso
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

      // Calcular tiempo estimado basado en posición actual + retraso acumulado
      const waitMinutesFromPosition = position * avgRealTime;
      const estimatedStartTime = appointmentMinutes + waitMinutesFromPosition + accumulatedDelay;

      // Calcular cuántos minutos faltan desde ahora
      const minutesFromNow = Math.max(0, estimatedStartTime - currentTime);

      entry.estimatedWaitMinutes = minutesFromNow;
      await entry.save();

      position++;
    }
  }

  /**
   * Recalcular tiempos y enviar notificaciones progresivas
   */
  async _recalculateAndNotify(doctorId) {
    // Primero recalcular tiempos dinámicamente
    await this._recalculateDynamicTimes(doctorId);

    const stats = await WaitingQueue.getDayStats(doctorId);
    const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

    // Obtener cola actualizada
    const queue = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'en_route', 'checked_in'] }
      },
      order: [['position', 'ASC']]
    });

    // Enviar notificaciones progresivas
    for (const entry of queue) {
      // Notificacion "Faltan 5"
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

      // Notificacion "Faltan 2"
      if (entry.position === 2 && !entry.notification2Sent) {
        entry.notification2Sent = true;
        await entry.save();
        this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_ALMOST_YOUR_TURN, {
          message: 'Faltan 2 personas. Preparate para tu consulta!',
          position: 2,
          estimatedMinutes: entry.estimatedWaitMinutes,
          type: '2_remaining'
        });
      }

      // Notificacion "Eres el siguiente"
      if (entry.position === 1 && !entry.notificationNextSent) {
        entry.notificationNextSent = true;
        await entry.save();
        this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_ALMOST_YOUR_TURN, {
          message: 'Eres el siguiente! Dirigete al consultorio.',
          position: 1,
          type: 'next'
        });
      }

      // Emitir posicion actualizada a cada paciente
      this._emitToPatient(entry.patientId, WAITING_ROOM_EVENTS.WR_POSITION_UPDATE, {
        position: entry.position,
        estimatedMinutes: entry.estimatedWaitMinutes,
        queueEntryId: entry.id
      });
    }
  }

  /**
   * Generar visualizacion de "sillitas"
   */
  async getChairsVisualization(doctorId, maxChairs = 10) {
    const queue = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'checked_in', 'called', 'in_consultation'] }
      },
      include: [{ model: User, as: 'patient', attributes: ['firstName', 'lastName'] }],
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
