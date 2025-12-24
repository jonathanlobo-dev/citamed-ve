/**
 * ReviewForm Component - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Formulario para escribir o editar review
 */

import React, { useState, useEffect } from 'react';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  X,
  CheckCircle,
  Loader2
} from 'lucide-react';
import StarRating from './StarRating';

/**
 * Formulario de review
 * @param {Object} props
 * @param {Object} props.initialData - Datos iniciales (para edición)
 * @param {Object} props.appointment - Datos de la cita
 * @param {Object} props.doctor - Datos del médico
 * @param {function} props.onSubmit - Callback al enviar
 * @param {function} props.onCancel - Callback al cancelar
 * @param {boolean} props.loading - Estado de carga
 * @param {boolean} props.isEditing - Si es modo edición
 */
const ReviewForm = ({
  initialData = null,
  appointment = null,
  doctor = null,
  onSubmit,
  onCancel,
  loading = false,
  isEditing = false,
  className = ''
}) => {
  // Estado del formulario
  const [ratings, setRatings] = useState({
    overall: initialData?.overallRating || 0,
    punctuality: initialData?.punctualityRating || 0,
    treatment: initialData?.treatmentRating || 0,
    clarity: initialData?.clarityRating || 0,
    facilities: initialData?.facilitiesRating || 0
  });

  const [comment, setComment] = useState(initialData?.comment || '');
  const [wouldRecommend, setWouldRecommend] = useState(
    initialData?.wouldRecommend !== undefined ? initialData.wouldRecommend : true
  );
  const [errors, setErrors] = useState({});

  /**
   * Actualiza un rating específico
   */
  const handleRatingChange = (dimension, value) => {
    setRatings(prev => ({ ...prev, [dimension]: value }));
    // Limpiar error si existía
    if (errors[dimension]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[dimension];
        return newErrors;
      });
    }
  };

  /**
   * Valida el formulario
   */
  const validateForm = () => {
    const newErrors = {};

    // Validar ratings
    const ratingDimensions = ['overall', 'punctuality', 'treatment', 'clarity', 'facilities'];
    ratingDimensions.forEach(dim => {
      if (!ratings[dim] || ratings[dim] < 1 || ratings[dim] > 5) {
        newErrors[dim] = 'Selecciona una calificación';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const reviewData = {
      appointmentId: appointment?.id,
      overallRating: ratings.overall,
      punctualityRating: ratings.punctuality,
      treatmentRating: ratings.treatment,
      clarityRating: ratings.clarity,
      facilitiesRating: ratings.facilities,
      comment: comment.trim() || null,
      wouldRecommend
    };

    if (onSubmit) {
      onSubmit(reviewData);
    }
  };

  /**
   * Calcula el promedio de ratings
   */
  const averageRating = () => {
    const values = Object.values(ratings).filter(v => v > 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  /**
   * Verifica si el formulario está completo
   */
  const isComplete = () => {
    return Object.values(ratings).every(r => r >= 1 && r <= 5);
  };

  /**
   * Labels de las dimensiones
   */
  const ratingLabels = {
    overall: {
      label: 'Calificación general',
      description: '¿Cómo fue tu experiencia en general?'
    },
    punctuality: {
      label: 'Puntualidad',
      description: '¿El médico te atendió a tiempo?'
    },
    treatment: {
      label: 'Trato y amabilidad',
      description: '¿Cómo fue el trato del médico?'
    },
    clarity: {
      label: 'Claridad en explicaciones',
      description: '¿El médico explicó bien tu condición y tratamiento?'
    },
    facilities: {
      label: 'Instalaciones',
      description: '¿Cómo estaba el consultorio?'
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {isEditing ? 'Editar reseña' : 'Escribe una reseña'}
            </h3>
            {doctor && (
              <p className="text-sm text-gray-600 mt-1">
                Dr. {doctor.firstName} {doctor.lastName}
                {appointment && ` - Cita del ${new Date(appointment.appointmentDate).toLocaleDateString()}`}
              </p>
            )}
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Calificación general (destacada) */}
        <div className="bg-teal-50 rounded-lg p-4 text-center">
          <h4 className="font-medium text-gray-800 mb-2">
            {ratingLabels.overall.description}
          </h4>
          <div className="flex justify-center mb-2">
            <StarRating
              value={ratings.overall}
              onChange={(value) => handleRatingChange('overall', value)}
              size="xl"
            />
          </div>
          {errors.overall && (
            <p className="text-sm text-red-500">{errors.overall}</p>
          )}
          <div className="text-2xl font-bold text-teal-700 mt-2">
            {ratings.overall > 0 ? `${ratings.overall}/5` : '-'}
          </div>
        </div>

        {/* Ratings por dimensión */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['punctuality', 'treatment', 'clarity', 'facilities'].map(dim => (
            <div
              key={dim}
              className={`
                p-3 rounded-lg border
                ${errors[dim] ? 'border-red-300 bg-red-50' : 'border-gray-200'}
              `}
            >
              <div className="mb-2">
                <span className="font-medium text-gray-700">
                  {ratingLabels[dim].label}
                </span>
                <p className="text-xs text-gray-500">
                  {ratingLabels[dim].description}
                </p>
              </div>
              <StarRating
                value={ratings[dim]}
                onChange={(value) => handleRatingChange(dim, value)}
                size="md"
              />
              {errors[dim] && (
                <p className="text-xs text-red-500 mt-1">{errors[dim]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Comentario */}
        <div>
          <label className="block font-medium text-gray-700 mb-2">
            Comentario (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos más sobre tu experiencia..."
            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
            rows={4}
            maxLength={1000}
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500">
              {comment.length}/1000 caracteres
            </span>
          </div>
        </div>

        {/* Recomendación */}
        <div>
          <label className="block font-medium text-gray-700 mb-3">
            ¿Recomendarías a este médico?
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setWouldRecommend(true)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all
                ${wouldRecommend
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}
              `}
            >
              <ThumbsUp className={`w-5 h-5 ${wouldRecommend ? 'fill-green-500' : ''}`} />
              Sí, lo recomiendo
            </button>
            <button
              type="button"
              onClick={() => setWouldRecommend(false)}
              className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all
                ${!wouldRecommend
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}
              `}
            >
              <ThumbsDown className={`w-5 h-5 ${!wouldRecommend ? 'fill-red-500' : ''}`} />
              No lo recomiendo
            </button>
          </div>
        </div>

        {/* Resumen antes de enviar */}
        {isComplete() && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">Resumen de tu reseña</span>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center text-sm">
              {Object.entries(ratings).map(([dim, value]) => (
                <div key={dim}>
                  <div className="text-lg font-bold text-gray-800">{value}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {ratingLabels[dim].label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <span className="text-sm text-gray-600">Promedio: </span>
              <span className="text-lg font-bold text-teal-700">
                {averageRating()}/5
              </span>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!isComplete() || loading}
            className="
              flex items-center gap-2 px-6 py-2
              bg-teal-600 text-white rounded-lg
              hover:bg-teal-700
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {isEditing ? 'Actualizar reseña' : 'Publicar reseña'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;
