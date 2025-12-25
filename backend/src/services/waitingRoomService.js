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
   * Check-in de paciente - Agregar a la cola
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

    // Verificar si ya esta en cola
    const existingEntry = await WaitingQueue.findOne({
      where: { appointmentId }
    });

    if (existingEntry) {
      throw new Error('Ya hiciste check-in para esta cita');
    }

    // Obtener tiempo promedio de consulta del doctor
    const stats = await WaitingQueue.getDayStats(appointment.doctorId);
    const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

    // Agregar a la cola
    const queueEntry = await WaitingQueue.addToQueue(
      appointmentId,
      appointment.doctorId,
      appointment.patientId,
      avgTime
    );

    // Actualizar estado de la cita
    appointment.status = 'confirmed';
    appointment.checkInTime = new Date();
    await appointment.save();

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
   * Check-in fisico (cuando el paciente llega al consultorio)
   */
  async physicalCheckIn(queueEntryId) {
    const entry = await WaitingQueue.findByPk(queueEntryId);

    if (!entry) {
      throw new Error('Entrada de cola no encontrada');
    }

    if (entry.status !== 'waiting') {
      throw new Error('El paciente debe estar en estado waiting');
    }

    entry.status = 'checked_in';
    entry.checkInTime = new Date();
    await entry.save();

    // Notificar
    this._emitQueueUpdate(entry.doctorId);

    return entry;
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
   * Recalcular tiempos y enviar notificaciones progresivas
   */
  async _recalculateAndNotify(doctorId) {
    const stats = await WaitingQueue.getDayStats(doctorId);
    const avgTime = stats.avgConsultationTime || this.defaultConsultationTime;

    // Recalcular tiempos estimados
    await WaitingQueue.recalculateEstimates(doctorId, avgTime);

    // Obtener cola actualizada
    const queue = await WaitingQueue.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'checked_in'] }
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
