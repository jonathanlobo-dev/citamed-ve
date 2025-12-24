/**
 * ReviewHelpfulVote Model - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Votos de "Esta resena te fue util?" para reviews
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReviewHelpfulVote = sequelize.define('ReviewHelpfulVote', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    reviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'review_id',
      references: {
        model: 'reviews',
        key: 'id'
      }
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },

    isHelpful: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'is_helpful',
      comment: 'true = util, false = no util'
    }
  }, {
    tableName: 'review_helpful_votes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['review_id', 'user_id']
      },
      { fields: ['review_id'] },
      { fields: ['user_id'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // STATIC METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene conteo de votos para un review
   */
  ReviewHelpfulVote.getVoteCount = async function(reviewId) {
    const votes = await this.findAll({
      where: { reviewId },
      attributes: ['isHelpful']
    });

    return votes.reduce((acc, vote) => {
      if (vote.isHelpful) {
        acc.helpful++;
      } else {
        acc.notHelpful++;
      }
      return acc;
    }, { helpful: 0, notHelpful: 0 });
  };

  /**
   * Obtiene o crea voto de un usuario
   */
  ReviewHelpfulVote.vote = async function(reviewId, userId, isHelpful) {
    const [vote, created] = await this.findOrCreate({
      where: { reviewId, userId },
      defaults: { isHelpful }
    });

    if (!created && vote.isHelpful !== isHelpful) {
      vote.isHelpful = isHelpful;
      await vote.save();
    }

    return { vote, created };
  };

  /**
   * Elimina voto de un usuario
   */
  ReviewHelpfulVote.removeVote = async function(reviewId, userId) {
    const deleted = await this.destroy({
      where: { reviewId, userId }
    });
    return deleted > 0;
  };

  /**
   * Verifica si un usuario ya voto
   */
  ReviewHelpfulVote.hasVoted = async function(reviewId, userId) {
    const vote = await this.findOne({
      where: { reviewId, userId }
    });
    return vote ? { hasVoted: true, isHelpful: vote.isHelpful } : { hasVoted: false };
  };

  return ReviewHelpfulVote;
};
