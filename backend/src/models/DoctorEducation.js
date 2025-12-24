/**
 * DoctorEducation Model - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Historial educativo del médico
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorEducation = sequelize.define('DoctorEducation', {
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

    degree: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El título es requerido' },
        len: {
          args: [3, 200],
          msg: 'El título debe tener entre 3 y 200 caracteres'
        }
      },
      comment: 'Título obtenido (Ej: Médico Cirujano, Especialista en Cardiología)'
    },

    fieldOfStudy: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'field_of_study',
      comment: 'Campo de estudio o especialización'
    },

    institution: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La institución es requerida' }
      },
      comment: 'Universidad o institución educativa'
    },

    institutionCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'institution_city',
      comment: 'Ciudad de la institución'
    },

    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Venezuela',
      comment: 'País de la institución'
    },

    startYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'start_year',
      validate: {
        min: {
          args: [1950],
          msg: 'El año de inicio debe ser mayor a 1950'
        },
        max: {
          args: [new Date().getFullYear()],
          msg: 'El año de inicio no puede ser futuro'
        }
      },
      comment: 'Año de inicio de estudios'
    },

    endYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'end_year',
      validate: {
        isValidEndYear(value) {
          if (value && value < this.startYear) {
            throw new Error('El año de fin debe ser mayor o igual al año de inicio');
          }
          if (value && value > new Date().getFullYear() + 10) {
            throw new Error('El año de fin no puede ser tan lejano');
          }
        }
      },
      comment: 'Año de graduación (null si en curso)'
    },

    isInProgress: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_in_progress',
      comment: 'Indica si el estudio está en curso'
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: 'La descripción no puede exceder 1000 caracteres'
        }
      },
      comment: 'Descripción adicional, logros, tesis, etc.'
    },

    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'document_url',
      validate: {
        isUrl: {
          msg: 'URL del documento inválida'
        }
      },
      comment: 'URL del documento de verificación (diploma, certificado)'
    },

    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
      comment: 'Indica si el documento ha sido verificado por CITAMED'
    }

  }, {
    tableName: 'doctor_education',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['end_year'] }
    ]
  });

  // ========================================
  // MÉTODOS DE INSTANCIA
  // ========================================

  /**
   * Calcula la duración de los estudios en años
   */
  DoctorEducation.prototype.getDuration = function() {
    if (!this.endYear) {
      return new Date().getFullYear() - this.startYear;
    }
    return this.endYear - this.startYear;
  };

  /**
   * Verifica si está en progreso
   */
  DoctorEducation.prototype.isCurrentlyInProgress = function() {
    return this.isInProgress || !this.endYear;
  };

  /**
   * Formato legible del período
   */
  DoctorEducation.prototype.getPeriodString = function() {
    if (this.isCurrentlyInProgress()) {
      return `${this.startYear} - Presente`;
    }
    return `${this.startYear} - ${this.endYear}`;
  };

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Obtiene toda la educación de un doctor ordenada cronológicamente
   */
  DoctorEducation.getByDoctor = async function(doctorProfileId) {
    return await this.findAll({
      where: { doctorProfileId },
      order: [
        ['endYear', 'DESC NULLS FIRST'],
        ['startYear', 'DESC']
      ]
    });
  };

  /**
   * Agrega un registro de educación
   */
  DoctorEducation.addEducation = async function(doctorProfileId, data) {
    return await this.create({
      doctorProfileId,
      ...data,
      isInProgress: !data.endYear
    });
  };

  /**
   * Actualiza un registro de educación
   * Verifica que pertenezca al doctor
   */
  DoctorEducation.updateEducation = async function(id, doctorProfileId, data) {
    const education = await this.findOne({
      where: { id, doctorProfileId }
    });

    if (!education) {
      throw new Error('Registro de educación no encontrado');
    }

    // Si se establece endYear, ya no está en progreso
    if (data.endYear) {
      data.isInProgress = false;
    }

    return await education.update(data);
  };

  /**
   * Elimina un registro de educación
   * Verifica que pertenezca al doctor
   */
  DoctorEducation.deleteEducation = async function(id, doctorProfileId) {
    const education = await this.findOne({
      where: { id, doctorProfileId }
    });

    if (!education) {
      throw new Error('Registro de educación no encontrado');
    }

    await education.destroy();
    return true;
  };

  /**
   * Cuenta registros de educación de un doctor
   */
  DoctorEducation.countByDoctor = async function(doctorProfileId) {
    return await this.count({ where: { doctorProfileId } });
  };

  /**
   * Obtiene el título más reciente (presumiblemente el más alto)
   */
  DoctorEducation.getHighestDegree = async function(doctorProfileId) {
    return await this.findOne({
      where: { doctorProfileId },
      order: [
        ['endYear', 'DESC NULLS FIRST'],
        ['startYear', 'DESC']
      ]
    });
  };

  return DoctorEducation;
};
