/**
 * DoctorExperience Model - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Historial de experiencia laboral del médico
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorExperience = sequelize.define('DoctorExperience', {
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

    position: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El cargo es requerido' },
        len: {
          args: [3, 200],
          msg: 'El cargo debe tener entre 3 y 200 caracteres'
        }
      },
      comment: 'Cargo o posición (Ej: Jefe de Cardiología, Médico Residente)'
    },

    institution: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La institución es requerida' }
      },
      comment: 'Hospital, clínica o institución'
    },

    institutionType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'institution_type',
      validate: {
        isIn: {
          args: [['hospital_publico', 'hospital_privado', 'clinica', 'consultorio', 'centro_medico', 'universidad', 'laboratorio', 'otro']],
          msg: 'Tipo de institución inválido'
        }
      },
      comment: 'Tipo de institución'
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Ciudad donde trabajó'
    },

    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Venezuela',
      comment: 'País'
    },

    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'start_date',
      validate: {
        isDate: { msg: 'Fecha de inicio inválida' },
        isNotFuture(value) {
          if (new Date(value) > new Date()) {
            throw new Error('La fecha de inicio no puede ser futura');
          }
        }
      },
      comment: 'Fecha de inicio del empleo'
    },

    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
      validate: {
        isDate: { msg: 'Fecha de fin inválida' },
        isAfterStart(value) {
          if (value && new Date(value) < new Date(this.startDate)) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
        }
      },
      comment: 'Fecha de fin (null si es trabajo actual)'
    },

    isCurrent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_current',
      comment: 'Indica si es el trabajo actual'
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La descripción no puede exceder 2000 caracteres'
        }
      },
      comment: 'Descripción de responsabilidades y funciones'
    },

    achievements: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Logros destacados en este puesto'
    }

  }, {
    tableName: 'doctor_experience',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['is_current'] },
      { fields: ['start_date'] }
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Calcula la duración del empleo en meses
   */
  DoctorExperience.prototype.getDurationMonths = function() {
    const end = this.endDate ? new Date(this.endDate) : new Date();
    const start = new Date(this.startDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 +
                   (end.getMonth() - start.getMonth());
    return Math.max(0, months);
  };

  /**
   * Calcula la duración en años (redondeado)
   */
  DoctorExperience.prototype.getDurationYears = function() {
    return Math.round(this.getDurationMonths() / 12 * 10) / 10;
  };

  /**
   * Formato legible del período
   */
  DoctorExperience.prototype.getPeriodString = function() {
    const start = new Date(this.startDate);
    const startStr = start.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });

    if (this.isCurrent || !this.endDate) {
      return `${startStr} - Presente`;
    }

    const end = new Date(this.endDate);
    const endStr = end.toLocaleDateString('es-VE', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  /**
   * Formato legible de duración
   */
  DoctorExperience.prototype.getDurationString = function() {
    const months = this.getDurationMonths();
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
    }

    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }

    return `${years} ${years === 1 ? 'año' : 'años'} y ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  };

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Obtiene toda la experiencia de un doctor ordenada cronológicamente
   */
  DoctorExperience.getByDoctor = async function(doctorProfileId) {
    return await this.findAll({
      where: { doctorProfileId },
      order: [
        ['isCurrent', 'DESC'],
        ['endDate', 'DESC NULLS FIRST'],
        ['startDate', 'DESC']
      ]
    });
  };

  /**
   * Obtiene el trabajo actual
   */
  DoctorExperience.getCurrentPosition = async function(doctorProfileId) {
    return await this.findOne({
      where: { doctorProfileId, isCurrent: true }
    });
  };

  /**
   * Agrega experiencia laboral
   * Si es trabajo actual, desmarca otros como no actuales
   */
  DoctorExperience.addExperience = async function(doctorProfileId, data) {
    const transaction = await sequelize.transaction();

    try {
      // Si es trabajo actual, desmarcar otros
      if (data.isCurrent) {
        await this.update(
          { isCurrent: false },
          {
            where: { doctorProfileId, isCurrent: true },
            transaction
          }
        );
      }

      const experience = await this.create({
        doctorProfileId,
        ...data,
        isCurrent: data.isCurrent || !data.endDate
      }, { transaction });

      await transaction.commit();
      return experience;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Actualiza experiencia laboral
   */
  DoctorExperience.updateExperience = async function(id, doctorProfileId, data) {
    const transaction = await sequelize.transaction();

    try {
      const experience = await this.findOne({
        where: { id, doctorProfileId },
        transaction
      });

      if (!experience) {
        throw new Error('Experiencia no encontrada');
      }

      // Si se marca como actual, desmarcar otros
      if (data.isCurrent && !experience.isCurrent) {
        await this.update(
          { isCurrent: false },
          {
            where: {
              doctorProfileId,
              isCurrent: true,
              id: { [Op.ne]: id }
            },
            transaction
          }
        );
      }

      // Si se establece endDate, ya no es trabajo actual
      if (data.endDate) {
        data.isCurrent = false;
      }

      await experience.update(data, { transaction });
      await transaction.commit();
      return experience;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Elimina experiencia laboral
   */
  DoctorExperience.deleteExperience = async function(id, doctorProfileId) {
    const experience = await this.findOne({
      where: { id, doctorProfileId }
    });

    if (!experience) {
      throw new Error('Experiencia no encontrada');
    }

    await experience.destroy();
    return true;
  };

  /**
   * Calcula el total de años de experiencia
   */
  DoctorExperience.calculateTotalYears = async function(doctorProfileId) {
    const experiences = await this.getByDoctor(doctorProfileId);

    let totalMonths = 0;
    for (const exp of experiences) {
      totalMonths += exp.getDurationMonths();
    }

    return Math.round(totalMonths / 12);
  };

  /**
   * Cuenta registros de experiencia
   */
  DoctorExperience.countByDoctor = async function(doctorProfileId) {
    return await this.count({ where: { doctorProfileId } });
  };

  return DoctorExperience;
};
