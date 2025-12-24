/**
 * DoctorSearchCard Component - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Tarjeta de resultado de búsqueda de médico
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  MapPin,
  Award,
  CheckCircle,
  Clock,
  Video,
  Building2,
  MessageSquare,
  Calendar,
  ChevronRight,
  Shield,
  Gem,
  Crown
} from 'lucide-react';
import searchService from '../../services/searchService';

/**
 * Icono de nivel de reputación
 */
const ReputationIcon = ({ level }) => {
  const iconMap = {
    new: Star,
    bronze: Award,
    silver: Award,
    gold: Crown,
    platinum: Gem
  };
  const Icon = iconMap[level] || Star;
  const levelInfo = searchService.REPUTATION_LEVELS[level] || searchService.REPUTATION_LEVELS.new;

  return (
    <div className={`flex items-center gap-1 text-${levelInfo.color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{levelInfo.label}</span>
    </div>
  );
};

/**
 * Tarjeta de médico en resultados de búsqueda
 */
const DoctorSearchCard = ({ doctor, showDistance = false }) => {
  if (!doctor) return null;

  const {
    doctor_id,
    doctor_profile_id,
    full_name,
    specialties_text,
    city,
    state,
    consultation_price_online,
    consultation_price_in_person,
    years_of_experience,
    accepts_insurance,
    reputation_level,
    average_rating,
    total_reviews,
    is_verified,
    profile_photo,
    has_availability,
    next_available_date,
    distance
  } = doctor;

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDistance = (km) => {
    if (!km) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <Link
      to={`/doctor/${doctor_id}`}
      className="block bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-teal-300 transition-all duration-200"
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile_photo ? (
              <img
                src={profile_photo}
                alt={full_name}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {full_name?.charAt(0) || 'D'}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Nombre y verificación */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg truncate">
                  Dr(a). {full_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {is_verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Verificado
                    </span>
                  )}
                  <ReputationIcon level={reputation_level} />
                </div>
              </div>

              {/* Rating */}
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-bold text-gray-800">
                    {average_rating > 0 ? average_rating.toFixed(1) : 'Nuevo'}
                  </span>
                </div>
                {total_reviews > 0 && (
                  <span className="text-xs text-gray-500">
                    {total_reviews} reseña{total_reviews !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Especialidades */}
            {specialties_text && specialties_text.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {specialties_text.slice(0, 3).map((spec, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full"
                  >
                    {spec}
                  </span>
                ))}
                {specialties_text.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{specialties_text.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Ubicación y distancia */}
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{city || 'Venezuela'}{state ? `, ${state}` : ''}</span>
              </div>
              {showDistance && distance && (
                <span className="text-teal-600 font-medium">
                  {formatDistance(distance)}
                </span>
              )}
            </div>

            {/* Info adicional */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {years_of_experience > 0 && (
                <span>{years_of_experience} años exp.</span>
              )}
              {accepts_insurance && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Shield className="w-3 h-3" />
                  Acepta seguros
                </span>
              )}
              {has_availability && (
                <span className="flex items-center gap-1 text-green-600">
                  <Clock className="w-3 h-3" />
                  Disponible
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer con precios y acciones */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          {/* Precios */}
          <div className="flex items-center gap-4">
            {consultation_price_online && (
              <div className="flex items-center gap-1">
                <Video className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatPrice(consultation_price_online)}
                </span>
              </div>
            )}
            {consultation_price_in_person && (
              <div className="flex items-center gap-1">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  {formatPrice(consultation_price_in_person)}
                </span>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            <span className="text-teal-600 text-sm font-medium flex items-center gap-1">
              Ver perfil
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DoctorSearchCard;
