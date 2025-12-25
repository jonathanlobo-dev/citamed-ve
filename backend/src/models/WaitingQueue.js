/**
 * WaitingQueue Model - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * La joya de la corona: Sistema de cola en tiempo real
 * que permite a pacientes ver su posicion y tiempo estimado
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const WaitingQueue = sequelize.define('WaitingQueue', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: 'appointment_id',
      references: {
        model: 'appointments',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    // Posicion actual en la cola
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },

    // Posicion original al entrar a la cola
    originalPosition: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'original_position',
      validate: {
        min: 1
      }
    },

    // Estado en la cola
    status: {
      type: DataTypes.ENUM(
        'waiting',         // Esperando en cola virtual
        'checked_in',      // Hizo check-in (llego fisicamente)
        'called',          // Fue llamado por el doctor
        'in_consultation', // En consulta
        'completed',       // Consulta completada
        'cancelled',       // Cancelo su turno
        'no_show'          // No se presento
      ),
      defaultValue: 'waiting'
    },

    // Timestamps de la cola
    joinedQueueAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_queue_at',
      comment: 'Cuando entro a la cola virtual'
    },

    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'check_in_time',
      comment: 'Cuando hizo check-in fisico'
    },

    calledTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'called_time',
      comment: 'Cuando fue llamado'
    },

    consultationStart: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'consultation_start',
      comment: 'Inicio de consulta'
    },

    consultationEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'consultation_end',
      comment: 'Fin de consulta'
    },

    // Tiempos estimados y reales
    estimatedWaitMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'estimated_wait_minutes',
      comment: 'Tiempo estimado de espera en minutos'
    },

    actualWaitMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'actual_wait_minutes',
      comment: 'Tiempo real de espera en minutos'
    },

    consultationDurationMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'consultation_duration_minutes',
      comment: 'Duracion de la consulta en minutos'
    },

    // Notificaciones progresivas
    notification5Sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notification_5_sent',
      comment: 'Notificacion "Faltan 5 personas"'
    },

    notification2Sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notification_2_sent',
      comment: 'Notificacion "Faltan 2 personas"'
    },

    notificationNextSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notification_next_sent',
      comment: 'Notificacion "Eres el siguiente"'
    },

    notificationTurnSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'notification_turn_sent',
      comment: 'Notificacion "Es tu turno"'
    },

    // Rating post-consulta
    patientRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'patient_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Calificacion del paciente sobre la experiencia'
    },

    // Metadatos
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Datos adicionales como device, location, etc.'
    }

  }, {
    tableName: 'waiting_queue',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['appointment_id'], unique: true },
      { fields: ['doctor_id'] },
      { fields: ['patient_id'] },
      { fields: ['status'] },
      { fields: ['doctor_id', 'status'] },
      { fields: ['doctor_id', 'position'] },
      { fields: ['joined_queue_at'] }
    ]
  });

  // ========================================
  // METODOS ESTATICOS
  // ========================================

  /**
   * Obtiene la cola activa de un doctor
   */
  WaitingQueue.getActiveQueue = async function(doctorId) {
    return await this.findAll({
      where: {
        doctorId,
        status: {
          [Op.in]: ['waiting', 'checked_in', 'called', 'in_consultation']
        }
      },
      order: [['position', 'ASC']],
      include: [
        {
          model: sequelize.models.Appointment,
          as: 'appointment',
          attributes: ['appointmentTime', 'appointmentType', 'reasonForVisit']
        },
        {
          model: sequelize.models.User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
  };

  /**
   * Obtiene la posicion de un paciente en la cola
   */
  WaitingQueue.getPatientPosition = async function(appointmentId) {
    const entry = await this.findOne({
      where: { appointmentId },
      include: [
        {
          model: sequelize.models.Appointment,
          as: 'appointment'
        }
      ]
    });

    if (!entry) return null;

    const aheadCount = await this.count({
      where: {
        doctorId: entry.doctorId,
        position: { [Op.lt]: entry.position },
        status: { [Op.in]: ['waiting', 'checked_in', 'called'] }
      }
    });

    return {
      entry,
      position: entry.position,
      peopleAhead: aheadCount,
      estimatedWaitMinutes: entry.estimatedWaitMinutes
    };
  };

  /**
   * Agregar paciente a la cola
   */
  WaitingQueue.addToQueue = async function(appointmentId, doctorId, patientId, avgConsultationTime = 20) {
    // Obtener la ultima posicion
    const lastInQueue = await this.findOne({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'checked_in', 'called', 'in_consultation'] }
      },
      order: [['position', 'DESC']]
    });

    const newPosition = lastInQueue ? lastInQueue.position + 1 : 1;

    // Calcular tiempo estimado
    const peopleAhead = newPosition - 1;
    const estimatedWaitMinutes = peopleAhead * avgConsultationTime;

    const entry = await this.create({
      appointmentId,
      doctorId,
      patientId,
      position: newPosition,
      originalPosition: newPosition,
      estimatedWaitMinutes,
      status: 'waiting'
    });

    return entry;
  };

  /**
   * Llamar al siguiente paciente
   */
  WaitingQueue.callNext = async function(doctorId) {
    const transaction = await sequelize.transaction();

    try {
      // Obtener el siguiente en la cola
      const next = await this.findOne({
        where: {
          doctorId,
          status: { [Op.in]: ['waiting', 'checked_in'] }
        },
        order: [['position', 'ASC']],
        transaction
      });

      if (!next) {
        await transaction.rollback();
        return null;
      }

      // Actualizar estado
      next.status = 'called';
      next.calledTime = new Date();
      next.notificationTurnSent = true;
      await next.save({ transaction });

      await transaction.commit();
      return next;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Iniciar consulta
   */
  WaitingQueue.startConsultation = async function(queueEntryId) {
    const entry = await this.findByPk(queueEntryId);
    if (!entry) return null;

    // Calcular tiempo real de espera
    const actualWait = Math.round(
      (new Date() - new Date(entry.joinedQueueAt)) / 60000
    );

    entry.status = 'in_consultation';
    entry.consultationStart = new Date();
    entry.actualWaitMinutes = actualWait;
    await entry.save();

    return entry;
  };

  /**
   * Finalizar consulta
   */
  WaitingQueue.endConsultation = async function(queueEntryId) {
    const transaction = await sequelize.transaction();

    try {
      const entry = await this.findByPk(queueEntryId, { transaction });
      if (!entry) {
        await transaction.rollback();
        return null;
      }

      // Calcular duracion
      const duration = Math.round(
        (new Date() - new Date(entry.consultationStart)) / 60000
      );

      entry.status = 'completed';
      entry.consultationEnd = new Date();
      entry.consultationDurationMinutes = duration;
      await entry.save({ transaction });

      // Recalcular posiciones de los demas en la cola
      await this.update(
        { position: sequelize.literal('position - 1') },
        {
          where: {
            doctorId: entry.doctorId,
            position: { [Op.gt]: entry.position },
            status: { [Op.in]: ['waiting', 'checked_in'] }
          },
          transaction
        }
      );

      await transaction.commit();
      return entry;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Recalcular tiempos estimados para toda la cola
   */
  WaitingQueue.recalculateEstimates = async function(doctorId, avgConsultationTime = 20) {
    const queue = await this.findAll({
      where: {
        doctorId,
        status: { [Op.in]: ['waiting', 'checked_in'] }
      },
      order: [['position', 'ASC']]
    });

    const updates = [];
    for (let i = 0; i < queue.length; i++) {
      const entry = queue[i];
      entry.estimatedWaitMinutes = i * avgConsultationTime;
      updates.push(entry.save());
    }

    await Promise.all(updates);
    return queue;
  };

  /**
   * Obtener pacientes que necesitan notificacion
   */
  WaitingQueue.getPatientsForNotification = async function(doctorId, position) {
    const notifications = [];

    // Faltan 5 personas
    if (position <= 5) {
      const patient5 = await this.findOne({
        where: {
          doctorId,
          position: position + 5,
          notification5Sent: false,
          status: { [Op.in]: ['waiting', 'checked_in'] }
        }
      });
      if (patient5) notifications.push({ type: '5_remaining', entry: patient5 });
    }

    // Faltan 2 personas
    if (position <= 2) {
      const patient2 = await this.findOne({
        where: {
          doctorId,
          position: position + 2,
          notification2Sent: false,
          status: { [Op.in]: ['waiting', 'checked_in'] }
        }
      });
      if (patient2) notifications.push({ type: '2_remaining', entry: patient2 });
    }

    // Siguiente
    if (position === 0) {
      const nextPatient = await this.findOne({
        where: {
          doctorId,
          position: 1,
          notificationNextSent: false,
          status: { [Op.in]: ['waiting', 'checked_in'] }
        }
      });
      if (nextPatient) notifications.push({ type: 'next', entry: nextPatient });
    }

    return notifications;
  };

  /**
   * Estadisticas de la cola del dia
   */
  WaitingQueue.getDayStats = async function(doctorId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await this.findAll({
      where: {
        doctorId,
        joinedQueueAt: {
          [Op.between]: [startOfDay, endOfDay]
        }
      }
    });

    const completed = entries.filter(e => e.status === 'completed');
    const waitTimes = completed.map(e => e.actualWaitMinutes).filter(Boolean);
    const consultationTimes = completed.map(e => e.consultationDurationMinutes).filter(Boolean);

    return {
      totalPatients: entries.length,
      completedConsultations: completed.length,
      cancelled: entries.filter(e => e.status === 'cancelled').length,
      noShows: entries.filter(e => e.status === 'no_show').length,
      currentlyWaiting: entries.filter(e => ['waiting', 'checked_in'].includes(e.status)).length,
      avgWaitTime: waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0,
      avgConsultationTime: consultationTimes.length > 0
        ? Math.round(consultationTimes.reduce((a, b) => a + b, 0) / consultationTimes.length)
        : 20
    };
  };

  return WaitingQueue;
};
