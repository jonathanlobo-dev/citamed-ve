/**
 * PatientAllergy Model - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Alergias del paciente con severidad y reacciones
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const PatientAllergy = sequelize.define('PatientAllergy', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patientProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_profile_id',
      references: {
        model: 'patient_profiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    allergyType: {
      type: DataTypes.ENUM('medication', 'food', 'environmental', 'other'),
      allowNull: false,
      field: 'allergy_type',
      comment: 'Tipo de alergia'
    },
    allergen: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [2, 200],
          msg: 'El alérgeno debe tener entre 2 y 200 caracteres'
        }
      },
      comment: 'Nombre del alérgeno'
    },
    severity: {
      type: DataTypes.ENUM('mild', 'moderate', 'severe', 'life_threatening'),
      allowNull: false,
      comment: 'Severidad de la alergia'
    },
    reaction: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La descripción de la reacción no puede exceder 2000 caracteres'
        }
      },
      comment: 'Descripción de la reacción alérgica'
    },
    diagnosedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'diagnosed_date',
      validate: {
        isDate: true,
        isBefore: {
          args: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          msg: 'La fecha de diagnóstico no puede ser futura'
        }
      },
      comment: 'Fecha de diagnóstico'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Las notas no pueden exceder 2000 caracteres'
        }
      },
      comment: 'Notas adicionales'
    }
  }, {
    tableName: 'patient_allergies',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['patient_profile_id'] },
      { fields: ['patient_profile_id', 'allergy_type'] },
      { fields: ['severity'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INSTANCIA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifica si es alergia de amenaza vital
   */
  PatientAllergy.prototype.isLifeThreatening = function() {
    return this.severity === 'life_threatening';
  };

  /**
   * Formatea la alergia para display
   */
  PatientAllergy.prototype.toSummary = function() {
    return {
      id: this.id,
      allergyType: this.allergyType,
      allergen: this.allergen,
      severity: this.severity,
      reaction: this.reaction,
      isLifeThreatening: this.isLifeThreatening()
    };
  };

  /**
   * Obtiene el color de severidad para UI
   */
  PatientAllergy.prototype.getSeverityColor = function() {
    const colors = {
      'mild': 'yellow',
      'moderate': 'orange',
      'severe': 'red',
      'life_threatening': 'darkred'
    };
    return colors[this.severity] || 'gray';
  };

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene alergias de un paciente
   */
  PatientAllergy.getByPatient = async function(patientProfileId) {
    return await this.findAll({
      where: { patientProfileId },
      order: [
        [sequelize.literal("severity = 'life_threatening' DESC")],
        [sequelize.literal("severity = 'severe' DESC")],
        ['allergen', 'ASC']
      ]
    });
  };

  /**
   * Obtiene alergias que amenazan la vida
   */
  PatientAllergy.getLifeThreateningAllergies = async function(patientProfileId) {
    return await this.findAll({
      where: {
        patientProfileId,
        severity: 'life_threatening'
      }
    });
  };

  /**
   * Obtiene alergias a medicamentos
   */
  PatientAllergy.getMedicationAllergies = async function(patientProfileId) {
    return await this.findAll({
      where: {
        patientProfileId,
        allergyType: 'medication'
      },
      order: [['severity', 'DESC']]
    });
  };

  /**
   * Verifica si el paciente tiene alergia a un medicamento específico
   */
  PatientAllergy.checkMedicationAllergy = async function(patientProfileId, medicationName) {
    const allergies = await this.findAll({
      where: {
        patientProfileId,
        allergyType: 'medication',
        allergen: { [Op.iLike]: `%${medicationName}%` }
      }
    });
    return allergies.length > 0 ? allergies : null;
  };

  /**
   * Agrega una alergia
   */
  PatientAllergy.addAllergy = async function(patientProfileId, data) {
    // Verificar duplicados
    const existing = await this.findOne({
      where: {
        patientProfileId,
        allergen: { [Op.iLike]: data.allergen }
      }
    });

    if (existing) {
      throw new Error('Ya existe una alergia registrada para este alérgeno');
    }

    const allergy = await this.create({
      patientProfileId,
      ...data
    });

    return allergy;
  };

  /**
   * Actualiza una alergia
   */
  PatientAllergy.updateAllergy = async function(id, patientProfileId, data) {
    const allergy = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!allergy) {
      throw new Error('Alergia no encontrada o no pertenece al paciente');
    }

    await allergy.update(data);
    return allergy;
  };

  /**
   * Elimina una alergia
   */
  PatientAllergy.deleteAllergy = async function(id, patientProfileId) {
    const allergy = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!allergy) {
      throw new Error('Alergia no encontrada o no pertenece al paciente');
    }

    await allergy.destroy();
    return true;
  };

  /**
   * Obtiene resumen de alergias críticas para mostrar a médicos
   */
  PatientAllergy.getCriticalSummary = async function(patientProfileId) {
    const allergies = await this.findAll({
      where: {
        patientProfileId,
        severity: { [Op.in]: ['severe', 'life_threatening'] }
      },
      order: [['severity', 'DESC']]
    });

    return allergies.map(a => ({
      allergen: a.allergen,
      type: a.allergyType,
      severity: a.severity,
      reaction: a.reaction
    }));
  };

  return PatientAllergy;
};
