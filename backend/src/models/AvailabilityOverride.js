/**
 * AvailabilityOverride Model - CITAMED.VE
 * M03 - Gestion de Agenda Medico
 *
 * Permite a los medicos definir excepciones a su horario regular:
 * - Dias no disponibles (vacaciones, conferencias, etc.)
 * - Horarios especiales para fechas especificas
 * - Feriados
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const AvailabilityOverride = sequelize.define('AvailabilityOverride', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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

    overrideDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'override_date',
      comment: 'Fecha especifica del override'
    },

    overrideType: {
      type: DataTypes.ENUM(
        'unavailable',    // No disponible todo el dia
        'custom_hours',   // Horario personalizado
        'holiday',        // Feriado (opcional)
        'vacation',       // Vacaciones
        'emergency_only'  // Solo emergencias
      ),
      allowNull: false,
      field: 'override_type'
    },

    // Para horarios personalizados
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'start_time',
      comment: 'Hora de inicio (solo para custom_hours)'
    },

    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: 'end_time',
      comment: 'Hora de fin (solo para custom_hours)'
    },

    slotDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'slot_duration',
      comment: 'Duracion de citas en minutos (solo para custom_hours)'
    },

    maxPatients: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_patients',
      comment: 'Maximo de pacientes para este dia'
    },

    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razon del override (vacaciones, conferencia, etc.)'
    },

    isRecurringYearly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_recurring_yearly',
      comment: 'Si es un feriado que se repite cada anio'
    },

    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by',
      comment: 'Usuario que creo el override'
    }

  }, {
    tableName: 'availability_overrides',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['override_date'] },
      { fields: ['doctor_profile_id', 'override_date'], unique: true },
      { fields: ['override_type'] }
    ]
  });

  // ========================================
  // METODOS ESTATICOS
  // ========================================

  /**
   * Verificar si hay override para una fecha
   */
  AvailabilityOverride.getForDate = async function(doctorProfileId, date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    return await this.findOne({
      where: {
        doctorProfileId,
        overrideDate: dateStr
      }
    });
  };

  /**
   * Verificar disponibilidad considerando overrides
   */
  AvailabilityOverride.isAvailable = async function(doctorProfileId, date) {
    const override = await this.getForDate(doctorProfileId, date);

    if (!override) {
      return { available: true, hasOverride: false };
    }

    if (override.overrideType === 'unavailable' ||
        override.overrideType === 'vacation' ||
        override.overrideType === 'holiday') {
      return {
        available: false,
        hasOverride: true,
        reason: override.reason,
        type: override.overrideType
      };
    }

    if (override.overrideType === 'custom_hours') {
      return {
        available: true,
        hasOverride: true,
        customHours: {
          startTime: override.startTime,
          endTime: override.endTime,
          slotDuration: override.slotDuration
        },
        reason: override.reason
      };
    }

    if (override.overrideType === 'emergency_only') {
      return {
        available: true,
        hasOverride: true,
        emergencyOnly: true,
        reason: override.reason
      };
    }

    return { available: true, hasOverride: true };
  };

  /**
   * Obtener overrides para un rango de fechas
   */
  AvailabilityOverride.getForDateRange = async function(doctorProfileId, startDate, endDate) {
    return await this.findAll({
      where: {
        doctorProfileId,
        overrideDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['overrideDate', 'ASC']]
    });
  };

  /**
   * Crear override de vacaciones
   */
  AvailabilityOverride.createVacation = async function(doctorProfileId, startDate, endDate, reason, createdBy) {
    const overrides = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const [override] = await this.findOrCreate({
        where: {
          doctorProfileId,
          overrideDate: dateStr
        },
        defaults: {
          overrideType: 'vacation',
          reason,
          createdBy
        }
      });

      overrides.push(override);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return overrides;
  };

  /**
   * Cancelar override
   */
  AvailabilityOverride.cancelOverride = async function(doctorProfileId, date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    const deleted = await this.destroy({
      where: {
        doctorProfileId,
        overrideDate: dateStr
      }
    });

    return deleted > 0;
  };

  /**
   * Obtener calendario mensual con overrides
   */
  AvailabilityOverride.getMonthCalendar = async function(doctorProfileId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const overrides = await this.getForDateRange(
      doctorProfileId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const calendar = {};
    for (const override of overrides) {
      calendar[override.overrideDate] = {
        type: override.overrideType,
        reason: override.reason,
        customHours: override.overrideType === 'custom_hours' ? {
          startTime: override.startTime,
          endTime: override.endTime,
          slotDuration: override.slotDuration
        } : null
      };
    }

    return calendar;
  };

  /**
   * Validaciones antes de crear
   */
  AvailabilityOverride.beforeCreate(async (instance) => {
    // Si es custom_hours, validar que tenga horarios
    if (instance.overrideType === 'custom_hours') {
      if (!instance.startTime || !instance.endTime) {
        throw new Error('custom_hours requiere startTime y endTime');
      }
    }
  });

  return AvailabilityOverride;
};
