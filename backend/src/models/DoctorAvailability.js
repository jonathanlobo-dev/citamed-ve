/**
 * DoctorAvailability Model - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Horarios de disponibilidad del médico
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorAvailability = sequelize.define('DoctorAvailability', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id',
      references: {
        model: 'doctor_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    dayOfWeek: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'day_of_week',
      validate: {
        min: { args: [0], msg: 'Día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)' },
        max: { args: [6], msg: 'Día de la semana debe ser entre 0 (Domingo) y 6 (Sábado)' }
      },
      comment: '0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado'
    },

    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'start_time',
      comment: 'Hora de inicio de atención (HH:MM:SS)'
    },

    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
      field: 'end_time',
      validate: {
        isAfterStart(value) {
          if (value <= this.startTime) {
            throw new Error('La hora de fin debe ser posterior a la hora de inicio');
          }
        }
      },
      comment: 'Hora de fin de atención (HH:MM:SS)'
    },

    slotDuration: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      field: 'slot_duration',
      validate: {
        min: { args: [5], msg: 'La duración mínima es 5 minutos' },
        max: { args: [180], msg: 'La duración máxima es 180 minutos' }
      },
      comment: 'Duración de cada cita en minutos'
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
      comment: 'Indica si este horario está activo'
    },

    locationName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'location_name',
      comment: 'Nombre del lugar de atención (Ej: Consultorio Centro, Hospital X)'
    },

    locationAddress: {
      type: DataTypes.STRING(300),
      allowNull: true,
      field: 'location_address',
      comment: 'Dirección del lugar de atención'
    },

    consultationType: {
      type: DataTypes.STRING(50),
      defaultValue: 'presencial',
      field: 'consultation_type',
      validate: {
        isIn: {
          args: [['presencial', 'telemedicina', 'domicilio', 'mixto']],
          msg: 'Tipo de consulta inválido'
        }
      },
      comment: 'Tipo de consulta: presencial, telemedicina, domicilio, mixto'
    },

    maxPatients: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_patients',
      validate: {
        min: { args: [1], msg: 'El máximo de pacientes debe ser al menos 1' }
      },
      comment: 'Número máximo de pacientes en este horario'
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas adicionales sobre este horario'
    }

  }, {
    tableName: 'doctor_availability',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['doctor_profile_id', 'day_of_week'] },
      { fields: ['is_active'] }
    ]
  });

  // ========================================
  // CONSTANTES
  // ========================================

  DoctorAvailability.DAY_NAMES = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  DoctorAvailability.DAY_NAMES_SHORT = [
    'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
  ];

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Obtiene el nombre del día
   */
  DoctorAvailability.prototype.getDayName = function() {
    return DoctorAvailability.DAY_NAMES[this.dayOfWeek];
  };

  /**
   * Obtiene el nombre corto del día
   */
  DoctorAvailability.prototype.getDayNameShort = function() {
    return DoctorAvailability.DAY_NAMES_SHORT[this.dayOfWeek];
  };

  /**
   * Calcula el número de slots disponibles en este horario
   */
  DoctorAvailability.prototype.getNumberOfSlots = function() {
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);
    const totalMinutes = (end.hours * 60 + end.minutes) - (start.hours * 60 + start.minutes);
    return Math.floor(totalMinutes / this.slotDuration);
  };

  /**
   * Parsea una hora en formato HH:MM:SS
   */
  DoctorAvailability.prototype.parseTime = function(timeString) {
    const parts = timeString.split(':');
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10),
      seconds: parseInt(parts[2] || '0', 10)
    };
  };

  /**
   * Genera los slots de tiempo para una fecha específica
   * @param {Date} date - Fecha para generar slots
   * @param {Array} bookedSlots - Array de slots ya reservados [{start, end}]
   * @returns {Array} Array de slots disponibles
   */
  DoctorAvailability.prototype.generateSlots = function(date, bookedSlots = []) {
    const slots = [];
    const start = this.parseTime(this.startTime);
    const end = this.parseTime(this.endTime);

    let currentHour = start.hours;
    let currentMinute = start.minutes;

    while (true) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Avanzar al siguiente slot
      currentMinute += this.slotDuration;
      while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour++;
      }

      // Verificar si excede el horario de fin
      if (currentHour > end.hours || (currentHour === end.hours && currentMinute > end.minutes)) {
        break;
      }

      const slotEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Verificar si está reservado
      const isBooked = bookedSlots.some(booked => {
        return booked.start === slotStart || booked.end === slotEnd ||
               (booked.start < slotEnd && booked.end > slotStart);
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isBooked,
        duration: this.slotDuration,
        date: date.toISOString().split('T')[0],
        consultationType: this.consultationType,
        location: this.locationName
      });
    }

    return slots;
  };

  /**
   * Formato legible del horario
   */
  DoctorAvailability.prototype.getScheduleString = function() {
    const day = this.getDayName();
    const start = this.startTime.substring(0, 5);
    const end = this.endTime.substring(0, 5);
    return `${day}: ${start} - ${end}`;
  };

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Obtiene toda la disponibilidad de un doctor
   */
  DoctorAvailability.getByDoctor = async function(doctorProfileId, includeInactive = false) {
    const where = { doctorProfileId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.findAll({
      where,
      order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
    });
  };

  /**
   * Obtiene disponibilidad para un día específico
   */
  DoctorAvailability.getByDay = async function(doctorProfileId, dayOfWeek) {
    return await this.findAll({
      where: {
        doctorProfileId,
        dayOfWeek,
        isActive: true
      },
      order: [['startTime', 'ASC']]
    });
  };

  /**
   * Verifica si hay conflicto de horario
   */
  DoctorAvailability.hasConflict = async function(doctorProfileId, dayOfWeek, startTime, endTime, excludeId = null) {
    const where = {
      doctorProfileId,
      dayOfWeek,
      isActive: true,
      [Op.or]: [
        // El nuevo horario empieza durante uno existente
        {
          startTime: { [Op.lte]: startTime },
          endTime: { [Op.gt]: startTime }
        },
        // El nuevo horario termina durante uno existente
        {
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gte]: endTime }
        },
        // El nuevo horario contiene completamente a uno existente
        {
          startTime: { [Op.gte]: startTime },
          endTime: { [Op.lte]: endTime }
        }
      ]
    };

    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const conflict = await this.findOne({ where });
    return conflict !== null;
  };

  /**
   * Establece la disponibilidad semanal completa
   * Reemplaza todos los horarios existentes
   */
  DoctorAvailability.setWeeklySchedule = async function(doctorProfileId, scheduleData) {
    const transaction = await sequelize.transaction();

    try {
      // Desactivar horarios existentes (soft delete)
      await this.update(
        { isActive: false },
        {
          where: { doctorProfileId },
          transaction
        }
      );

      // Crear nuevos horarios
      const newSchedules = [];
      for (const schedule of scheduleData) {
        // Validar conflictos dentro del mismo día
        const sameDaySchedules = scheduleData.filter(
          s => s.dayOfWeek === schedule.dayOfWeek && s !== schedule
        );

        for (const other of sameDaySchedules) {
          if (schedule.startTime < other.endTime && schedule.endTime > other.startTime) {
            throw new Error(`Conflicto de horario en ${this.DAY_NAMES[schedule.dayOfWeek]}`);
          }
        }

        const created = await this.create({
          doctorProfileId,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration || 30,
          locationName: schedule.locationName,
          locationAddress: schedule.locationAddress,
          consultationType: schedule.consultationType || 'presencial',
          maxPatients: schedule.maxPatients,
          notes: schedule.notes,
          isActive: true
        }, { transaction });

        newSchedules.push(created);
      }

      await transaction.commit();
      return newSchedules;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Obtiene slots disponibles para una fecha
   */
  DoctorAvailability.getAvailableSlots = async function(doctorProfileId, date) {
    const dayOfWeek = date.getDay();

    const availabilities = await this.getByDay(doctorProfileId, dayOfWeek);

    if (availabilities.length === 0) {
      return [];
    }

    // TODO: Obtener citas existentes para esta fecha
    // const Appointment = sequelize.models.Appointment;
    // const bookedSlots = await Appointment.findAll({...});

    const allSlots = [];
    for (const availability of availabilities) {
      const slots = availability.generateSlots(date, []);
      allSlots.push(...slots);
    }

    return allSlots;
  };

  /**
   * Obtiene resumen semanal de disponibilidad
   */
  DoctorAvailability.getWeeklySummary = async function(doctorProfileId) {
    const availabilities = await this.getByDoctor(doctorProfileId);

    const summary = {};
    for (let i = 0; i < 7; i++) {
      const dayAvails = availabilities.filter(a => a.dayOfWeek === i);
      summary[i] = {
        dayName: this.DAY_NAMES[i],
        dayNameShort: this.DAY_NAMES_SHORT[i],
        available: dayAvails.length > 0,
        schedules: dayAvails.map(a => ({
          start: a.startTime.substring(0, 5),
          end: a.endTime.substring(0, 5),
          location: a.locationName,
          type: a.consultationType
        }))
      };
    }

    return summary;
  };

  return DoctorAvailability;
};
