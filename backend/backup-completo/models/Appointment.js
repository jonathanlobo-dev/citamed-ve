// models/Appointment.js
// MÓDULO 2 - CITAMED.VE
// Modelo básico de citas médicas

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Appointment = sequelize.define('Appointment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ========================================
    // RELACIONES
    // ========================================
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'ID del paciente (User)'
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'ID del doctor (User)'
    },
    doctorProfileId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'DoctorProfiles',
        key: 'id'
      }
    },
    specialtyId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Specialties',
        key: 'id'
      }
    },

    // ========================================
    // INFORMACIÓN DE LA CITA
    // ========================================
    appointmentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Número único de cita (ej: CITA-2024-00001)'
    },
    appointmentType: {
      type: DataTypes.ENUM(
        'first_consultation',     // Primera consulta
        'follow_up',              // Consulta de seguimiento
        'emergency',              // Emergencia
        'routine_checkup',        // Chequeo de rutina
        'telemedicine',           // Telemedicina
        'home_visit'              // Visita a domicilio
      ),
      defaultValue: 'first_consultation',
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de la cita'
    },
    appointmentTime: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: 'Hora de inicio de la cita'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: 'Duración estimada en minutos'
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: 'Hora de finalización (calculada)'
    },

    // ========================================
    // ESTADO DE LA CITA
    // ========================================
    status: {
      type: DataTypes.ENUM(
        'pending',           // Pendiente (esperando confirmación)
        'confirmed',         // Confirmada
        'in_progress',       // En progreso
        'completed',         // Completada
        'cancelled_patient', // Cancelada por paciente
        'cancelled_doctor',  // Cancelada por doctor
        'no_show',          // Paciente no asistió
        'rescheduled'       // Reprogramada
      ),
      defaultValue: 'pending',
    },
    statusHistory: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Historial de cambios de estado [{status, timestamp, reason}]'
    },

    // ========================================
    // MOTIVO Y NOTAS
    // ========================================
    reasonForVisit: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Motivo de la consulta (descripción del paciente)'
    },
    symptoms: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      comment: 'Síntomas reportados por el paciente'
    },
    patientNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas adicionales del paciente'
    },
    doctorNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas del doctor sobre la cita'
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Diagnóstico (completado por el doctor)'
    },
    treatment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tratamiento recomendado'
    },

    // ========================================
    // UBICACIÓN
    // ========================================
    locationType: {
      type: DataTypes.ENUM('clinic', 'hospital', 'telemedicine', 'home'),
      defaultValue: 'clinic',
      comment: 'Tipo de ubicación de la cita'
    },
    locationAddress: {
      type: DataTypes.STRING(300),
      allowNull: true,
      comment: 'Dirección del lugar de la cita'
    },
    locationDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Detalles adicionales de ubicación {room, floor, building}'
    },
    telemedicineLink: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Enlace de videollamada para telemedicina'
    },

    // ========================================
    // INFORMACIÓN FINANCIERA
    // ========================================
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Tarifa de consulta'
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'refunded', 'cancelled'),
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'transfer', 'insurance', 'citamedpaga'),
      allowNull: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de transacción de pago'
    },

    // ========================================
    // RECORDATORIOS Y NOTIFICACIONES
    // ========================================
    reminderSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Se envió recordatorio'
    },
    reminderSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    confirmationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Se envió confirmación'
    },
    confirmationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ========================================
    // SEGUIMIENTO
    // ========================================
    followUpRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Requiere cita de seguimiento'
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Fecha sugerida para seguimiento'
    },
    followUpNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas para el seguimiento'
    },
    prescriptionIssued: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Se emitió receta médica'
    },
    prescriptionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'URL del archivo de receta'
    },

    // ========================================
    // CANCELACIÓN Y REPROGRAMACIÓN
    // ========================================
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razón de cancelación'
    },
    cancelledBy: {
      type: DataTypes.ENUM('patient', 'doctor', 'admin', 'system'),
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rescheduledFrom: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de la cita original si fue reprogramada'
    },
    rescheduledTo: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de la nueva cita si fue reprogramada'
    },

    // ========================================
    // CALIFICACIÓN Y FEEDBACK
    // ========================================
    patientRating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 5
      },
      comment: 'Calificación del paciente al doctor (0-5)'
    },
    patientReview: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reseña del paciente'
    },
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // ========================================
    // METADATOS
    // ========================================
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Hora real de llegada del paciente'
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Hora real de salida del paciente'
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duración real en minutos'
    },

  }, {
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      { fields: ['patientId'] },
      { fields: ['doctorId'] },
      { fields: ['doctorProfileId'] },
      { fields: ['specialtyId'] },
      { fields: ['appointmentNumber'] },
      { fields: ['appointmentDate', 'appointmentTime'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['appointmentType'] },
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  Appointment.prototype.calculateEndTime = function() {
    if (this.appointmentTime && this.duration) {
      const [hours, minutes] = this.appointmentTime.split(':');
      const startDate = new Date();
      startDate.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const endDate = new Date(startDate.getTime() + this.duration * 60000);
      this.endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    }
    return this.endTime;
  };

  Appointment.prototype.addStatusHistory = async function(newStatus, reason = null) {
    const historyEntry = {
      status: newStatus,
      timestamp: new Date(),
      reason: reason,
      previousStatus: this.status
    };

    this.statusHistory.push(historyEntry);
    this.status = newStatus;
    
    await this.save();
    return this;
  };

  Appointment.prototype.canBeCancelled = function() {
    const cancelableStatuses = ['pending', 'confirmed'];
    return cancelableStatuses.includes(this.status);
  };

  Appointment.prototype.canBeRescheduled = function() {
    const reschedulableStatuses = ['pending', 'confirmed'];
    return reschedulableStatuses.includes(this.status);
  };

  Appointment.prototype.isUpcoming = function() {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appointmentDateTime > now && ['pending', 'confirmed'].includes(this.status);
  };

  Appointment.prototype.isPast = function() {
    const now = new Date();
    const appointmentDateTime = new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    return appointmentDateTime < now;
  };

  Appointment.prototype.getAppointmentDateTime = function() {
    return new Date(`${this.appointmentDate}T${this.appointmentTime}`);
  };

  // ========================================
  // HOOKS
  // ========================================

  Appointment.beforeCreate(async (instance) => {
    // Generar número de cita único
    if (!instance.appointmentNumber) {
      const year = new Date().getFullYear();
      const count = await Appointment.count();
      instance.appointmentNumber = `CITA-${year}-${String(count + 1).padStart(6, '0')}`;
    }

    // Calcular hora de finalización
    instance.calculateEndTime();

    // Inicializar historial de estado
    if (!instance.statusHistory || instance.statusHistory.length === 0) {
      instance.statusHistory = [{
        status: instance.status,
        timestamp: new Date(),
        reason: 'Cita creada'
      }];
    }
  });

  Appointment.beforeUpdate(async (instance) => {
    // Si cambió la duración o la hora, recalcular endTime
    if (instance.changed('duration') || instance.changed('appointmentTime')) {
      instance.calculateEndTime();
    }

    // Si cambió el estado, agregar al historial
    if (instance.changed('status')) {
      const previousStatus = instance._previousDataValues.status;
      instance.statusHistory.push({
        status: instance.status,
        timestamp: new Date(),
        previousStatus: previousStatus
      });
    }
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  Appointment.generateAppointmentNumber = async function() {
    const year = new Date().getFullYear();
    const count = await this.count();
    return `CITA-${year}-${String(count + 1).padStart(6, '0')}`;
  };

  Appointment.getUpcomingAppointments = async function(userId, userType = 'patient') {
    const whereClause = userType === 'patient' 
      ? { patientId: userId }
      : { doctorId: userId };

    const now = new Date();
    const { Op } = require('sequelize');

    return await this.findAll({
      where: {
        ...whereClause,
        status: { [Op.in]: ['pending', 'confirmed'] },
        appointmentDate: { [Op.gte]: now.toISOString().split('T')[0] }
      },
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });
  };

  Appointment.getPastAppointments = async function(userId, userType = 'patient') {
    const whereClause = userType === 'patient'
      ? { patientId: userId }
      : { doctorId: userId };

    const now = new Date();
    const { Op } = require('sequelize');

    return await this.findAll({
      where: {
        ...whereClause,
        [Op.or]: [
          { appointmentDate: { [Op.lt]: now.toISOString().split('T')[0] } },
          { status: { [Op.in]: ['completed', 'no_show'] } }
        ]
      },
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
    });
  };

  return Appointment;
};