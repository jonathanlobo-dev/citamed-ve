/**
 * ClinicCard Component - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clinicas
 *
 * Tarjeta de presentacion de clinica para listados
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaUserMd,
  FaCheckCircle,
  FaClock,
  FaChevronRight,
  FaHospital,
  FaClinicMedical,
  FaStethoscope,
  FaFlask,
  FaTooth,
  FaEye,
  FaWheelchair
} from 'react-icons/fa';

const ClinicCard = ({ clinic, variant = 'default' }) => {
  const mainLocation = clinic.locations?.find(l => l.isMain) || clinic.locations?.[0];

  const getOrganizationIcon = (type) => {
    const icons = {
      'hospital': FaHospital,
      'clinica_privada': FaClinicMedical,
      'centro_diagnostico': FaStethoscope,
      'laboratorio': FaFlask,
      'centro_odontologico': FaTooth,
      'centro_oftalmologico': FaEye,
      'centro_rehabilitacion': FaWheelchair,
      'consultorio_medico': FaBuilding
    };
    const Icon = icons[type] || FaBuilding;
    return <Icon className="w-5 h-5" />;
  };

  const getOrganizationLabel = (type) => {
    const labels = {
      'hospital': 'Hospital',
      'clinica_privada': 'Clinica Privada',
      'centro_diagnostico': 'Centro de Diagnostico',
      'laboratorio': 'Laboratorio',
      'centro_odontologico': 'Centro Odontologico',
      'centro_oftalmologico': 'Centro Oftalmologico',
      'centro_rehabilitacion': 'Centro de Rehabilitacion',
      'consultorio_medico': 'Consultorio Medico',
      'otro': 'Otro'
    };
    return labels[type] || type;
  };

  if (variant === 'compact') {
    return (
      <Link to={`/clinics/${clinic.id}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={clinic.commercialName}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                {getOrganizationIcon(clinic.organizationType)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 truncate">{clinic.commercialName}</h3>
                {clinic.isVerified && (
                  <FaCheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </div>
              {mainLocation && (
                <p className="text-sm text-gray-500 truncate">
                  {mainLocation.city}, {mainLocation.state}
                </p>
              )}
            </div>

            <FaChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to={`/clinics/${clinic.id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
      >
        {/* Cover Image */}
        <div className="relative h-40 bg-gradient-to-br from-blue-500 to-blue-600">
          {clinic.coverImageUrl && (
            <img
              src={clinic.coverImageUrl}
              alt={clinic.commercialName}
              className="w-full h-full object-cover"
            />
          )}

          {/* Logo */}
          <div className="absolute -bottom-6 left-4">
            {clinic.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt={clinic.commercialName}
                className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center border-4 border-white shadow-lg text-white">
                {getOrganizationIcon(clinic.organizationType)}
              </div>
            )}
          </div>

          {/* Verified Badge */}
          {clinic.isVerified && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-blue-600">
              <FaCheckCircle className="w-3 h-3" />
              Verificada
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pt-8">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{clinic.commercialName}</h3>
              <p className="text-sm text-gray-500">{getOrganizationLabel(clinic.organizationType)}</p>
            </div>
          </div>

          {/* Description */}
          {clinic.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{clinic.description}</p>
          )}

          {/* Location */}
          {mainLocation && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
              <span>{mainLocation.city}, {mainLocation.state}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <FaUserMd className="w-4 h-4 text-blue-500" />
              <span>{clinic.totalDoctors || 0} medicos</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <FaBuilding className="w-4 h-4 text-green-500" />
              <span>{clinic.totalLocations || 0} sedes</span>
            </div>
          </div>

          {/* Phone */}
          {mainLocation?.phone && (
            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
              <FaPhone className="w-4 h-4 text-gray-400" />
              <span>{mainLocation.phone}</span>
            </div>
          )}

          {/* Amenities */}
          {mainLocation && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mainLocation.hasEmergency && (
                <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">Emergencias</span>
              )}
              {mainLocation.hasPharmacy && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">Farmacia</span>
              )}
              {mainLocation.hasLaboratory && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full">Laboratorio</span>
              )}
              {mainLocation.hasParking && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">Estacionamiento</span>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
};

export default ClinicCard;
