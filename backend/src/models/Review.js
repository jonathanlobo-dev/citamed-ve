/**
 * Review Model - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Reviews de pacientes hacia medicos con 5 dimensiones de calificacion
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Review = sequelize.define('Review', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    appointmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: 'appointment_id',
      references: {
        model: 'appointments',
        key: 'id'
      },
      comment: 'Solo 1 review por cita'
    },

    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id',
      references: {
        model: 'doctor_profiles',
        key: 'id'
      }
    },

    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },

    // ═══════════════════════════════════════════════════════════════
    // CALIFICACIONES POR DIMENSION (1-5)
    // ═══════════════════════════════════════════════════════════════

    overallRating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'overall_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Calificacion general 1-5'
    },

    punctualityRating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'punctuality_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Puntualidad del medico 1-5'
    },

    treatmentRating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'treatment_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Trato y amabilidad 1-5'
    },

    clarityRating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'clarity_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Claridad en explicaciones 1-5'
    },

    facilitiesRating: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'facilities_rating',
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Instalaciones y consultorio 1-5'
    },

    // ═══════════════════════════════════════════════════════════════
    // COMENTARIOS
    // ═══════════════════════════════════════════════════════════════

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000]
      },
      comment: 'Comentario opcional del paciente'
    },

    wouldRecommend: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'would_recommend',
      comment: 'Recomendaria a este medico?'
    },

    // ═══════════════════════════════════════════════════════════════
    // VERIFICACION
    // ═══════════════════════════════════════════════════════════════

    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_verified',
      comment: 'Review de cita verificada'
    },

    wasEdited: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'was_edited'
    },

    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at'
    },

    // ═══════════════════════════════════════════════════════════════
    // RESPUESTA DEL MEDICO
    // ═══════════════════════════════════════════════════════════════

    doctorReply: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'doctor_reply',
      validate: {
        len: [0, 500]
      }
    },

    doctorRepliedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'doctor_replied_at'
    },

    // ═══════════════════════════════════════════════════════════════
    // MODERACION
    // ═══════════════════════════════════════════════════════════════

    isFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_flagged'
    },

    flagReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'flag_reason'
    },

    isHidden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_hidden'
    }
  }, {
    tableName: 'reviews',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['patient_id'] },
      { fields: ['appointment_id'], unique: true },
      { fields: ['overall_rating'] },
      { fields: ['created_at'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // INSTANCE METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcula el promedio de las 5 dimensiones
   */
  Review.prototype.getAverageRating = function() {
    const sum = this.overallRating + this.punctualityRating +
                this.treatmentRating + this.clarityRating + this.facilitiesRating;
    return (sum / 5).toFixed(2);
  };

  /**
   * Verifica si el review es reciente (menos de 30 dias)
   */
  Review.prototype.isRecent = function() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.createdAt > thirtyDaysAgo;
  };

  /**
   * Verifica si el usuario puede editar este review
   * Solo dentro de 7 dias y por autor original
   */
  Review.prototype.canEdit = function(userId) {
    if (this.patientId !== userId) return false;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.createdAt > sevenDaysAgo;
  };

  /**
   * Obtiene datos formateados para mostrar
   */
  Review.prototype.getDisplayData = function() {
    return {
      id: this.id,
      ratings: {
        overall: this.overallRating,
        punctuality: this.punctualityRating,
        treatment: this.treatmentRating,
        clarity: this.clarityRating,
        facilities: this.facilitiesRating,
        average: this.getAverageRating()
      },
      comment: this.comment,
      wouldRecommend: this.wouldRecommend,
      isVerified: this.isVerified,
      hasReply: !!this.doctorReply,
      doctorReply: this.doctorReply,
      doctorRepliedAt: this.doctorRepliedAt,
      wasEdited: this.wasEdited,
      isRecent: this.isRecent(),
      createdAt: this.createdAt
    };
  };

  // ═══════════════════════════════════════════════════════════════
  // STATIC METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene reviews de un doctor con filtros y paginacion
   */
  Review.getByDoctor = async function(doctorProfileId, filters = {}, pagination = {}) {
    const { User } = sequelize.models;
    const { rating, verified, hasComment, sortBy = 'recent' } = filters;
    const { page = 1, limit = 10 } = pagination;

    const where = {
      doctorProfileId,
      isHidden: false
    };

    if (rating) where.overallRating = rating;
    if (verified !== undefined) where.isVerified = verified;
    if (hasComment) where.comment = { [sequelize.Sequelize.Op.ne]: null };

    let order;
    switch (sortBy) {
      case 'rating_high':
        order = [['overall_rating', 'DESC'], ['created_at', 'DESC']];
        break;
      case 'rating_low':
        order = [['overall_rating', 'ASC'], ['created_at', 'DESC']];
        break;
      case 'helpful':
        order = [['created_at', 'DESC']]; // TODO: sort by helpful votes
        break;
      case 'recent':
      default:
        order = [['created_at', 'DESC']];
    }

    const { count, rows } = await this.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order,
      limit,
      offset: (page - 1) * limit
    });

    return {
      reviews: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  };

  /**
   * Obtiene estadisticas de reviews de un doctor
   */
  Review.getStats = async function(doctorProfileId) {
    const reviews = await this.findAll({
      where: {
        doctorProfileId,
        isHidden: false,
        isVerified: true
      },
      attributes: [
        'overallRating',
        'punctualityRating',
        'treatmentRating',
        'clarityRating',
        'facilitiesRating',
        'wouldRecommend'
      ]
    });

    if (reviews.length === 0) {
      return {
        average: 0,
        total: 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        dimensions: {
          punctuality: 0,
          treatment: 0,
          clarity: 0,
          facilities: 0
        },
        wouldRecommendPercent: 0
      };
    }

    // Calcular promedios
    const totals = reviews.reduce((acc, r) => {
      acc.overall += r.overallRating;
      acc.punctuality += r.punctualityRating;
      acc.treatment += r.treatmentRating;
      acc.clarity += r.clarityRating;
      acc.facilities += r.facilitiesRating;
      acc.recommend += r.wouldRecommend ? 1 : 0;
      acc.breakdown[r.overallRating]++;
      return acc;
    }, {
      overall: 0, punctuality: 0, treatment: 0, clarity: 0, facilities: 0,
      recommend: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    });

    const count = reviews.length;

    return {
      average: (totals.overall / count).toFixed(2),
      total: count,
      breakdown: totals.breakdown,
      dimensions: {
        punctuality: (totals.punctuality / count).toFixed(2),
        treatment: (totals.treatment / count).toFixed(2),
        clarity: (totals.clarity / count).toFixed(2),
        facilities: (totals.facilities / count).toFixed(2)
      },
      wouldRecommendPercent: Math.round((totals.recommend / count) * 100)
    };
  };

  /**
   * Verifica si un paciente puede dejar review para una cita
   */
  Review.canReview = async function(appointmentId, patientId) {
    const { Appointment } = sequelize.models;

    // Verificar que la cita existe
    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) {
      return { canReview: false, reason: 'Cita no encontrada' };
    }

    // Verificar que el paciente es el de la cita
    if (appointment.patientId !== patientId) {
      return { canReview: false, reason: 'No tienes permiso para esta cita' };
    }

    // Verificar que la cita esta completada
    if (appointment.status !== 'completed') {
      return { canReview: false, reason: 'La cita aun no ha sido completada' };
    }

    // Verificar que la cita ya ocurrio
    if (new Date(appointment.appointmentDate) > new Date()) {
      return { canReview: false, reason: 'La cita aun no ha ocurrido' };
    }

    // Verificar que no existe review
    const existingReview = await this.findOne({ where: { appointmentId } });
    if (existingReview) {
      return { canReview: false, reason: 'Ya existe una resena para esta cita' };
    }

    return { canReview: true, reason: null };
  };

  return Review;
};
