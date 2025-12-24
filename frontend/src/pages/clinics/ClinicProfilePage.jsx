/**
 * ClinicProfilePage - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clinicas
 *
 * Pagina de perfil publico de una clinica
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import clinicsService from '../../services/clinicsService';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaUserMd,
  FaCheckCircle,
  FaClock,
  FaParking,
  FaAmbulance,
  FaPrescriptionBottleAlt,
  FaFlask,
  FaXRay,
  FaWheelchair,
  FaChevronRight,
  FaHospital,
  FaClinicMedical,
  FaStethoscope,
  FaTooth,
  FaEye,
  FaStar,
  FaWhatsapp,
  FaImages,
  FaList,
  FaCalendarAlt,
  FaBed,
  FaDoorOpen
} from 'react-icons/fa';

const ClinicProfilePage = () => {
  const { clinicId } = useParams();
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadClinic();
  }, [clinicId]);

  const loadClinic = async () => {
    try {
      setLoading(true);
      const result = await clinicsService.getClinicFull(clinicId);
      if (result.success) {
        setClinic(result.data);
        if (result.data.locations?.length > 0) {
          setSelectedLocation(result.data.locations.find(l => l.isMain) || result.data.locations[0]);
        }
      } else {
        toast.error('Clinica no encontrada');
      }
    } catch (error) {
      console.error('Error loading clinic:', error);
      toast.error('Error al cargar la clinica');
    } finally {
      setLoading(false);
    }
  };

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
    return <Icon className="w-6 h-6" />;
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

  const formatSchedule = (openingHours) => {
    if (!openingHours) return null;
    const days = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miercoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sabado',
      sunday: 'Domingo'
    };
    return Object.entries(days).map(([key, label]) => ({
      day: label,
      hours: openingHours[key] || 'Cerrado'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaBuilding className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Clinica no encontrada</h2>
          <Link to="/clinics" className="text-blue-600 hover:underline mt-2 inline-block">
            Ver directorio de clinicas
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Informacion', icon: FaBuilding },
    { id: 'doctors', label: 'Medicos', icon: FaUserMd },
    { id: 'services', label: 'Servicios', icon: FaList },
    { id: 'locations', label: 'Sedes', icon: FaMapMarkerAlt },
    { id: 'gallery', label: 'Galeria', icon: FaImages }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-blue-600 to-blue-800">
        {clinic.coverImageUrl && (
          <img
            src={clinic.coverImageUrl}
            alt={clinic.commercialName}
            className="w-full h-full object-cover opacity-50"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Clinic Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-6xl mx-auto flex items-end gap-6">
            {/* Logo */}
            <div className="flex-shrink-0">
              {clinic.logoUrl ? (
                <img
                  src={clinic.logoUrl}
                  alt={clinic.commercialName}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white shadow-xl"
                />
              ) : (
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: clinic.primaryColor || '#2563EB' }}
                >
                  {getOrganizationIcon(clinic.organizationType)}
                </div>
              )}
            </div>

            {/* Name and Details */}
            <div className="flex-1 text-white pb-2">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-4xl font-bold">{clinic.commercialName}</h1>
                {clinic.isVerified && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-sm">
                    <FaCheckCircle className="w-4 h-4" />
                    Verificada
                  </div>
                )}
              </div>
              <p className="text-white/80 text-lg">{getOrganizationLabel(clinic.organizationType)}</p>
              {selectedLocation && (
                <p className="text-white/70 flex items-center gap-2 mt-1">
                  <FaMapMarkerAlt className="w-4 h-4" />
                  {selectedLocation.city}, {selectedLocation.state}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="hidden md:flex gap-6 pb-2">
              <div className="text-center text-white">
                <div className="text-2xl font-bold">{clinic.totalDoctors || 0}</div>
                <div className="text-sm text-white/70">Medicos</div>
              </div>
              <div className="text-center text-white">
                <div className="text-2xl font-bold">{clinic.totalLocations || 0}</div>
                <div className="text-sm text-white/70">Sedes</div>
              </div>
              <div className="text-center text-white">
                <div className="text-2xl font-bold">{clinic.totalServices || 0}</div>
                <div className="text-sm text-white/70">Servicios</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div
              key="info"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {/* Main Info */}
              <div className="md:col-span-2 space-y-6">
                {/* Description */}
                {clinic.description && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Acerca de</h2>
                    <p className="text-gray-600 whitespace-pre-line">{clinic.description}</p>
                  </div>
                )}

                {/* Mission & Vision */}
                {(clinic.mission || clinic.vision) && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    {clinic.mission && (
                      <div className="mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Mision</h3>
                        <p className="text-gray-600">{clinic.mission}</p>
                      </div>
                    )}
                    {clinic.vision && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Vision</h3>
                        <p className="text-gray-600">{clinic.vision}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Location Details */}
                {selectedLocation && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedLocation.isMain ? 'Sede Principal' : selectedLocation.name}
                      </h2>
                      {clinic.locations?.length > 1 && (
                        <select
                          value={selectedLocation.id}
                          onChange={(e) => setSelectedLocation(clinic.locations.find(l => l.id === parseInt(e.target.value)))}
                          className="text-sm border rounded-lg px-3 py-1.5"
                        >
                          {clinic.locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                              {loc.isMain ? 'Sede Principal' : loc.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-3 mb-4">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-900">{selectedLocation.addressLine1}</p>
                        {selectedLocation.addressLine2 && (
                          <p className="text-gray-600">{selectedLocation.addressLine2}</p>
                        )}
                        <p className="text-gray-600">
                          {selectedLocation.city}, {selectedLocation.state} {selectedLocation.postalCode}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {selectedLocation.phone && (
                        <a
                          href={`tel:${selectedLocation.phone}`}
                          className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                        >
                          <FaPhone className="w-4 h-4" />
                          {selectedLocation.phone}
                        </a>
                      )}
                      {selectedLocation.whatsapp && (
                        <a
                          href={`https://wa.me/${selectedLocation.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-green-600 hover:text-green-700"
                        >
                          <FaWhatsapp className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                      {selectedLocation.email && (
                        <a
                          href={`mailto:${selectedLocation.email}`}
                          className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                        >
                          <FaEnvelope className="w-4 h-4" />
                          {selectedLocation.email}
                        </a>
                      )}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedLocation.hasEmergency && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
                          <FaAmbulance className="w-4 h-4" />
                          Emergencias 24h
                        </span>
                      )}
                      {selectedLocation.hasPharmacy && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                          <FaPrescriptionBottleAlt className="w-4 h-4" />
                          Farmacia
                        </span>
                      )}
                      {selectedLocation.hasLaboratory && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm">
                          <FaFlask className="w-4 h-4" />
                          Laboratorio
                        </span>
                      )}
                      {selectedLocation.hasImaging && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
                          <FaXRay className="w-4 h-4" />
                          Imagenologia
                        </span>
                      )}
                      {selectedLocation.hasParking && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                          <FaParking className="w-4 h-4" />
                          Estacionamiento
                        </span>
                      )}
                      {selectedLocation.wheelchairAccessible && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm">
                          <FaWheelchair className="w-4 h-4" />
                          Acceso silla de ruedas
                        </span>
                      )}
                    </div>

                    {/* Capacity */}
                    <div className="flex gap-6 text-sm text-gray-600">
                      {selectedLocation.totalConsultationRooms > 0 && (
                        <div className="flex items-center gap-2">
                          <FaDoorOpen className="w-4 h-4 text-gray-400" />
                          {selectedLocation.totalConsultationRooms} consultorios
                        </div>
                      )}
                      {selectedLocation.totalBeds > 0 && (
                        <div className="flex items-center gap-2">
                          <FaBed className="w-4 h-4 text-gray-400" />
                          {selectedLocation.totalBeds} camas
                        </div>
                      )}
                    </div>

                    {/* Map */}
                    {selectedLocation.latitude && selectedLocation.longitude && (
                      <div className="mt-4">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedLocation.latitude},${selectedLocation.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <FaMapMarkerAlt className="w-4 h-4" />
                          Ver en Google Maps
                          <FaChevronRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Schedule */}
                {selectedLocation?.openingHours && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaClock className="w-4 h-4 text-blue-600" />
                      Horario de Atencion
                    </h3>
                    <div className="space-y-2">
                      {formatSchedule(selectedLocation.openingHours)?.map(({ day, hours }) => (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="text-gray-600">{day}</span>
                          <span className={hours === 'Cerrado' ? 'text-gray-400' : 'text-gray-900 font-medium'}>
                            {hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Contacto</h3>
                  <div className="space-y-3">
                    {clinic.email && (
                      <a
                        href={`mailto:${clinic.email}`}
                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                      >
                        <FaEnvelope className="w-4 h-4" />
                        {clinic.email}
                      </a>
                    )}
                    {clinic.phone && (
                      <a
                        href={`tel:${clinic.phone}`}
                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                      >
                        <FaPhone className="w-4 h-4" />
                        {clinic.phone}
                      </a>
                    )}
                    {clinic.website && (
                      <a
                        href={clinic.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 hover:text-blue-600"
                      >
                        <FaGlobe className="w-4 h-4" />
                        Sitio web
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'doctors' && (
            <motion.div
              key="doctors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Nuestro Equipo Medico</h2>

              {clinic.locations?.some(loc => loc.doctors?.length > 0) ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clinic.locations?.flatMap(loc =>
                    loc.doctors?.map(assignment => (
                      <Link
                        key={assignment.id}
                        to={`/directorio/${assignment.doctor?.id}`}
                        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-4">
                          {assignment.doctor?.doctorProfile?.profilePhoto ? (
                            <img
                              src={assignment.doctor.doctorProfile.profilePhoto}
                              alt={`Dr. ${assignment.doctor.firstName}`}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                              <FaUserMd className="w-8 h-8 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Dr. {assignment.doctor?.firstName} {assignment.doctor?.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {assignment.doctor?.doctorProfile?.specialty || 'Medicina General'}
                            </p>
                            {assignment.doctor?.doctorProfile?.averageRating > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <FaStar className="w-3 h-3 text-yellow-500" />
                                <span className="text-sm text-gray-600">
                                  {assignment.doctor.doctorProfile.averageRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <FaUserMd className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay medicos registrados aun</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Servicios Disponibles</h2>
              <p className="text-gray-500 text-center py-12">Proximamente: Lista de servicios</p>
            </motion.div>
          )}

          {activeTab === 'locations' && (
            <motion.div
              key="locations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Nuestras Sedes</h2>

              {clinic.locations?.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {clinic.locations.map(location => (
                    <div
                      key={location.id}
                      className="bg-white rounded-xl p-6 shadow-sm border-2 border-transparent hover:border-blue-100 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {location.isMain ? 'Sede Principal' : location.name}
                          </h3>
                          <p className="text-sm text-gray-500">{location.city}, {location.state}</p>
                        </div>
                        {location.isMain && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                            Principal
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-4">
                        {location.addressLine1}
                        {location.addressLine2 && <>, {location.addressLine2}</>}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {location.hasEmergency && (
                          <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">Emergencias</span>
                        )}
                        {location.hasPharmacy && (
                          <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded">Farmacia</span>
                        )}
                        {location.hasLaboratory && (
                          <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded">Laboratorio</span>
                        )}
                      </div>

                      <div className="flex gap-4 text-sm">
                        {location.phone && (
                          <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <FaPhone className="w-3 h-3" />
                            Llamar
                          </a>
                        )}
                        {location.latitude && location.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FaMapMarkerAlt className="w-3 h-3" />
                            Ver mapa
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <FaMapMarkerAlt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay sedes registradas</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Galeria de Imagenes</h2>

              {clinic.images?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {clinic.images.map(image => (
                    <motion.div
                      key={image.id}
                      whileHover={{ scale: 1.02 }}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.title || 'Imagen de la clinica'}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl">
                  <FaImages className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No hay imagenes disponibles</p>
                </div>
              )}

              {/* Image Modal */}
              <AnimatePresence>
                {selectedImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0.9 }}
                      className="max-w-4xl w-full"
                      onClick={e => e.stopPropagation()}
                    >
                      <img
                        src={selectedImage.imageUrl}
                        alt={selectedImage.title || 'Imagen'}
                        className="w-full rounded-xl"
                      />
                      {selectedImage.title && (
                        <p className="text-white text-center mt-4">{selectedImage.title}</p>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClinicProfilePage;
