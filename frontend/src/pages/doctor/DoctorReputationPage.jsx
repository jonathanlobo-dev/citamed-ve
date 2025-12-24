/**
 * DoctorReputationPage - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Dashboard de reputacion para medicos
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import useDoctorReputation from '../../hooks/useDoctorReputation';
import {
  ReputationBadge,
  StarRating,
  RatingBreakdown,
  ReviewCard,
  ReviewsList,
  ReputationProgress,
  DoctorReputationCard
} from '../../components/reviews';
import {
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  Target,
  ChevronRight,
  RefreshCw,
  Filter,
  ThumbsUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorReputationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewsFilter, setReviewsFilter] = useState({
    rating: null,
    sortBy: 'recent'
  });

  const {
    reputation,
    stats,
    reviews,
    progress,
    loading,
    loadingStats,
    loadingReviews,
    loadingProgress,
    submitting,
    levelName,
    badgeClasses,
    fetchMyStats,
    fetchMyReviews,
    fetchReputationProgress,
    replyToReview,
    reviewsPagination,
    refreshAll
  } = useDoctorReputation({
    isDoctor: true,
    autoFetch: true
  });

  // Cargar reviews cuando cambian filtros
  useEffect(() => {
    fetchMyReviews(reviewsFilter, { page: 1, limit: 10 });
  }, [reviewsFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handler para responder a review
  const handleReplyToReview = async (reviewId, reply) => {
    const result = await replyToReview(reviewId, reply);
    return result;
  };

  // Handler para cambiar pagina de reviews
  const handlePageChange = (newPage) => {
    fetchMyReviews(reviewsFilter, { page: newPage, limit: 10 });
  };

  // Handler para refrescar datos
  const handleRefresh = async () => {
    toast.loading('Actualizando datos...', { id: 'refresh' });
    await refreshAll();
    toast.success('Datos actualizados', { id: 'refresh' });
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu reputacion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mi Reputacion</h1>
            <p className="text-gray-600 mt-1">
              Gestiona tus resenas y sigue tu progreso
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Tarjeta de Reputacion Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Nivel Actual */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${badgeClasses.bg}`}>
                  <Award className={`w-8 h-8 ${badgeClasses.text}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nivel Actual</p>
                  <h2 className={`text-2xl font-bold ${badgeClasses.text}`}>
                    {levelName}
                  </h2>
                </div>
              </div>

              {/* Progreso hacia siguiente nivel */}
              {progress && progress.nextLevel && (
                <ReputationProgress progress={progress} />
              )}
            </div>

            {/* Stats Resumen */}
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Star className="w-4 h-4" />
                  <span className="text-sm">Rating Promedio</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.average?.toFixed(1) || '0.0'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Total Resenas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Recomendacion</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.wouldRecommendPercent || 0}%
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Citas Completadas</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {reputation?.totalAppointments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Resumen', icon: TrendingUp },
                { id: 'reviews', label: 'Resenas', icon: MessageSquare },
                { id: 'breakdown', label: 'Desglose', icon: Target }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Insights y recomendaciones */}
                {progress?.insights && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recomendaciones para Mejorar
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {progress.insights.recommendations?.map((rec, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"
                        >
                          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm text-blue-800">{rec.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fortalezas */}
                {progress?.insights?.strengths?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Tus Fortalezas
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {progress.insights.strengths.map((strength, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full"
                        >
                          <Star className="w-4 h-4 fill-green-500" />
                          <span className="text-sm font-medium">{strength.name}</span>
                          <span className="text-sm">({strength.rating})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tendencia reciente */}
                {progress?.insights?.trend && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Tendencia Ultimos 30 Dias
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className={`
                        flex items-center gap-1 text-lg font-semibold
                        ${progress.insights.trend.direction === 'improving' ? 'text-green-600' :
                          progress.insights.trend.direction === 'declining' ? 'text-red-600' :
                          'text-gray-600'}
                      `}>
                        <TrendingUp className={`w-5 h-5 ${
                          progress.insights.trend.direction === 'declining' ? 'rotate-180' : ''
                        }`} />
                        {progress.insights.trend.recentAverage?.toFixed(1) || 'N/A'}
                      </div>
                      <span className="text-sm text-gray-500">
                        basado en {progress.insights.trend.recentCount} resenas
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Reviews */}
            {activeTab === 'reviews' && (
              <div>
                {/* Filtros */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={reviewsFilter.rating || ''}
                      onChange={(e) => setReviewsFilter(prev => ({
                        ...prev,
                        rating: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Todas las estrellas</option>
                      <option value="5">5 estrellas</option>
                      <option value="4">4 estrellas</option>
                      <option value="3">3 estrellas</option>
                      <option value="2">2 estrellas</option>
                      <option value="1">1 estrella</option>
                    </select>
                  </div>

                  <select
                    value={reviewsFilter.sortBy}
                    onChange={(e) => setReviewsFilter(prev => ({
                      ...prev,
                      sortBy: e.target.value
                    }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="recent">Mas recientes</option>
                    <option value="rating_high">Mayor rating</option>
                    <option value="rating_low">Menor rating</option>
                  </select>
                </div>

                {/* Lista de Reviews */}
                {loadingReviews ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Aun no tienes resenas. Apareceran aqui despues de tus consultas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(review => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        canReply={true}
                        canVote={false}
                        canFlag={false}
                        onReply={handleReplyToReview}
                      />
                    ))}

                    {/* Paginacion */}
                    {reviewsPagination.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <button
                          onClick={() => handlePageChange(reviewsPagination.page - 1)}
                          disabled={reviewsPagination.page <= 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                          Pagina {reviewsPagination.page} de {reviewsPagination.totalPages}
                        </span>
                        <button
                          onClick={() => handlePageChange(reviewsPagination.page + 1)}
                          disabled={reviewsPagination.page >= reviewsPagination.totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Breakdown */}
            {activeTab === 'breakdown' && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Distribucion de estrellas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribucion de Calificaciones
                  </h3>
                  <RatingBreakdown breakdown={stats?.breakdown} total={stats?.total} />
                </div>

                {/* Rating por dimension */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Calificacion por Aspecto
                  </h3>
                  <div className="space-y-4">
                    {[
                      { key: 'punctuality', label: 'Puntualidad' },
                      { key: 'treatment', label: 'Trato al Paciente' },
                      { key: 'clarity', label: 'Claridad en Explicaciones' },
                      { key: 'facilities', label: 'Instalaciones' }
                    ].map(dim => (
                      <div key={dim.key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{dim.label}</span>
                        <div className="flex items-center gap-2">
                          <StarRating
                            rating={stats?.dimensions?.[dim.key] || 0}
                            size="sm"
                          />
                          <span className="text-sm font-medium text-gray-700 w-8">
                            {stats?.dimensions?.[dim.key]?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Requisitos de Niveles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Niveles de Reputacion
          </h3>
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { level: 'new', name: 'Nuevo', appointments: '0-50', rating: '-', color: 'gray' },
              { level: 'bronze', name: 'Bronce', appointments: '51-200', rating: '4.0+', color: 'amber' },
              { level: 'silver', name: 'Plata', appointments: '201-500', rating: '4.3+', color: 'slate' },
              { level: 'gold', name: 'Oro', appointments: '501-1000', rating: '4.5+', color: 'yellow' },
              { level: 'platinum', name: 'Platino', appointments: '1000+', rating: '4.7+', color: 'purple' }
            ].map(lvl => (
              <div
                key={lvl.level}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${reputation?.reputationLevel === lvl.level
                    ? `border-${lvl.color}-500 bg-${lvl.color}-50`
                    : 'border-gray-200 bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Award className={`w-5 h-5 text-${lvl.color}-600`} />
                  <span className="font-semibold text-gray-900">{lvl.name}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Citas: {lvl.appointments}</p>
                  <p>Rating: {lvl.rating}</p>
                </div>
                {reputation?.reputationLevel === lvl.level && (
                  <div className="mt-2 text-xs font-medium text-teal-600">
                    Nivel Actual
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReputationPage;
