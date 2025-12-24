/**
 * ReviewCard Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Tarjeta de review individual
 */

import React, { useState } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Flag,
  MessageSquare,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  MoreVertical
} from 'lucide-react';
import reviewsService from '../../services/reviewsService';

/**
 * Tarjeta de review individual
 * @param {Object} props
 * @param {Object} props.review - Datos del review
 * @param {boolean} props.showDoctorReply - Mostrar respuesta del médico
 * @param {boolean} props.showHelpfulVotes - Mostrar botones de voto
 * @param {boolean} props.canVote - Si el usuario puede votar
 * @param {boolean} props.canEdit - Si el usuario puede editar
 * @param {boolean} props.canDelete - Si el usuario puede eliminar
 * @param {boolean} props.canReply - Si puede responder (médico)
 * @param {boolean} props.canFlag - Si puede reportar
 * @param {function} props.onVote - Callback al votar
 * @param {function} props.onEdit - Callback al editar
 * @param {function} props.onDelete - Callback al eliminar
 * @param {function} props.onReply - Callback al responder
 * @param {function} props.onFlag - Callback al reportar
 */
const ReviewCard = ({
  review,
  showDoctorReply = true,
  showHelpfulVotes = true,
  canVote = true,
  canEdit = false,
  canDelete = false,
  canReply = false,
  canFlag = true,
  onVote,
  onEdit,
  onDelete,
  onReply,
  onFlag,
  className = ''
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!review) return null;

  const {
    id,
    patient,
    overallRating,
    punctualityRating,
    treatmentRating,
    clarityRating,
    facilitiesRating,
    comment,
    wouldRecommend,
    isVerified,
    wasEdited,
    createdAt,
    doctorReply,
    doctorRepliedAt,
    helpfulVotes,
    userVote
  } = review;

  /**
   * Nombre del paciente formateado
   */
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName?.charAt(0)}.`
    : 'Paciente anónimo';

  /**
   * Fecha formateada
   */
  const formattedDate = reviewsService.formatRelativeDate(createdAt);

  /**
   * Maneja voto útil
   */
  const handleVote = async (isHelpful) => {
    if (!canVote || !onVote) return;
    setSubmitting(true);
    await onVote(id, isHelpful);
    setSubmitting(false);
  };

  /**
   * Maneja envío de respuesta
   */
  const handleReplySubmit = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmitting(true);
    const result = await onReply(id, replyText);
    if (result.success) {
      setShowReplyForm(false);
      setReplyText('');
    }
    setSubmitting(false);
  };

  /**
   * Maneja reporte
   */
  const handleFlagSubmit = async () => {
    if (!flagReason.trim() || !onFlag) return;
    setSubmitting(true);
    const result = await onFlag(id, flagReason);
    if (result.success) {
      setShowFlagModal(false);
      setFlagReason('');
    }
    setSubmitting(false);
  };

  /**
   * Renderiza estrellas de rating
   */
  const renderStars = (rating, size = 'w-4 h-4') => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
            <span className="text-teal-700 font-semibold">
              {patient?.firstName?.charAt(0) || 'P'}
            </span>
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{patientName}</span>
              {isVerified && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Verificado
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formattedDate}
              {wasEdited && <span>(editado)</span>}
            </div>
          </div>
        </div>

        {/* Rating principal */}
        <div className="flex flex-col items-end">
          {renderStars(overallRating)}
          <span className="text-sm font-medium text-gray-700 mt-0.5">
            {overallRating}/5
          </span>
        </div>
      </div>

      {/* Ratings por dimensión */}
      <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-gray-100">
        {[
          { label: 'Puntualidad', value: punctualityRating },
          { label: 'Trato', value: treatmentRating },
          { label: 'Claridad', value: clarityRating },
          { label: 'Instalaciones', value: facilitiesRating }
        ].map(dim => (
          <div key={dim.label} className="text-center">
            <div className="text-xs text-gray-500">{dim.label}</div>
            <div className="flex justify-center mt-1">
              {renderStars(dim.value, 'w-3 h-3')}
            </div>
          </div>
        ))}
      </div>

      {/* Comentario */}
      {comment && (
        <p className="text-gray-700 mb-3">{comment}</p>
      )}

      {/* Recomendación */}
      {wouldRecommend !== undefined && (
        <div className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs mb-3
          ${wouldRecommend
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'}
        `}>
          {wouldRecommend ? (
            <>
              <ThumbsUp className="w-3 h-3" />
              Recomienda este médico
            </>
          ) : (
            <>
              <ThumbsDown className="w-3 h-3" />
              No recomienda este médico
            </>
          )}
        </div>
      )}

      {/* Respuesta del médico */}
      {showDoctorReply && doctorReply && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span className="font-medium text-sm text-teal-700">
              Respuesta del médico
            </span>
            {doctorRepliedAt && (
              <span className="text-xs text-gray-500">
                {reviewsService.formatRelativeDate(doctorRepliedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-700">{doctorReply}</p>
        </div>
      )}

      {/* Formulario de respuesta */}
      {canReply && !doctorReply && showReplyForm && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={3}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {replyText.length}/500 caracteres
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReplyForm(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleReplySubmit}
                disabled={!replyText.trim() || submitting}
                className="px-3 py-1 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Responder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer con acciones */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        {/* Votos útiles */}
        {showHelpfulVotes && (
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">¿Te fue útil?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote(true)}
                disabled={!canVote || submitting}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs
                  ${userVote?.isHelpful === true
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                <ThumbsUp className="w-3 h-3" />
                {helpfulVotes?.helpful || 0}
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={!canVote || submitting}
                className={`
                  flex items-center gap-1 px-2 py-1 rounded text-xs
                  ${userVote?.isHelpful === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                `}
              >
                <ThumbsDown className="w-3 h-3" />
                {helpfulVotes?.notHelpful || 0}
              </button>
            </div>
          </div>
        )}

        {/* Menú de acciones */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {canReply && !doctorReply && (
                <button
                  onClick={() => { setShowReplyForm(true); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Responder
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => { onEdit && onEdit(review); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => { onDelete && onDelete(id); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              )}
              {canFlag && (
                <button
                  onClick={() => { setShowFlagModal(true); setShowMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Reportar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de reporte */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Reportar reseña
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, indica el motivo del reporte:
            </p>
            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Describe por qué consideras inapropiada esta reseña..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowFlagModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleFlagSubmit}
                disabled={flagReason.length < 10 || submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Reportar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
