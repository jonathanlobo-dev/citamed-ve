import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Loader, Star, MapPin, Calendar, Award, Users, X, Video,
  Building2, CheckCircle, SlidersHorizontal, Phone, Clock, Heart,
  Shield, Stethoscope, ChevronRight, Sparkles
} from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import searchService from '../services/searchService';
import toast from 'react-hot-toast';

// Componente de tarjeta de doctor premium
const DoctorCard = ({ doctor, index, onViewProfile, onSchedule }) => {
  const hasRating = parseFloat(doctor.average_rating) > 0;
  const hasPhoto = doctor.profile_photo;
  const primarySpecialty = doctor.specialties_text?.[0] || 'Medicina General';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500"
    >
      {/* Gradient overlay superior */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500" />

      {/* Badge verificado */}
      {doctor.is_verified && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
            <Shield className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-bold text-teal-700">Verificado</span>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="relative pt-16 px-6 pb-6">
        {/* Foto de perfil */}
        <div className="relative mx-auto w-28 h-28 -mt-24 mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full animate-pulse opacity-20" />
          {hasPhoto ? (
            <img
              src={doctor.profile_photo}
              alt={`Dr(a). ${doctor.full_name}`}
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 border-4 border-white shadow-xl flex items-center justify-center ${hasPhoto ? 'hidden' : ''}`}
          >
            <span className="text-3xl font-bold text-white">
              {doctor.full_name?.charAt(0)?.toUpperCase() || 'D'}
            </span>
          </div>

          {/* Indicador de disponibilidad */}
          {doctor.accepts_new_patients && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Nombre y especialidad */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
            Dr(a). {doctor.full_name}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-500" />
            <p className="text-teal-600 font-medium">{primarySpecialty}</p>
          </div>
        </div>

        {/* Rating y reseñas */}
        {hasRating ? (
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-amber-700">
                {parseFloat(doctor.average_rating).toFixed(1)}
              </span>
            </div>
            <span className="text-gray-500 text-sm">
              {doctor.total_reviews} reseña{doctor.total_reviews !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-4 text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Nuevo en CITAMED</span>
          </div>
        )}

        {/* Información clave para el paciente */}
        <div className="space-y-3 mb-5">
          {/* Ubicación */}
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-red-500" />
            </div>
            <span className="text-sm font-medium truncate">
              {doctor.city ? `${doctor.city}${doctor.state ? `, ${doctor.state}` : ''}` : 'Ubicación no especificada'}
            </span>
          </div>

          {/* Horario/Disponibilidad */}
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-sm font-medium">
              {doctor.has_availability ? (
                <span className="text-green-600">Disponible para citas</span>
              ) : (
                <span className="text-gray-400">Sin horario definido</span>
              )}
            </span>
          </div>

          {/* Experiencia */}
          {doctor.years_of_experience > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-sm font-medium">
                {doctor.years_of_experience} años de experiencia
              </span>
            </div>
          )}

          {/* Precios */}
          <div className="flex items-center gap-3 pt-1">
            {parseFloat(doctor.consultation_price_in_person) > 0 && (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-700">
                  ${parseFloat(doctor.consultation_price_in_person).toFixed(0)}
                </span>
              </div>
            )}
            {parseFloat(doctor.consultation_price_online) > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg">
                <Video className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-bold text-purple-700">
                  ${parseFloat(doctor.consultation_price_online).toFixed(0)}
                </span>
              </div>
            )}
            {!parseFloat(doctor.consultation_price_in_person) && !parseFloat(doctor.consultation_price_online) && (
              <span className="text-sm text-gray-400 italic">Precio a consultar</span>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewProfile(doctor.doctor_id)}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            Ver Perfil
          </button>
          <button
            onClick={() => onSchedule(doctor.doctor_id)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
          >
            <Calendar className="w-4 h-4" />
            Agendar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Componente de estado vacío
const EmptyState = ({ hasFilters, onClearFilters, totalDoctors }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center py-20 px-4"
  >
    <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
      <Users className="w-16 h-16 text-gray-400" />
    </div>
    <h3 className="text-2xl font-bold text-gray-800 mb-3">
      {totalDoctors === 0
        ? '¡Pronto tendremos médicos disponibles!'
        : 'No encontramos médicos con estos criterios'}
    </h3>
    <p className="text-gray-600 max-w-md mx-auto mb-8">
      {totalDoctors === 0
        ? 'Estamos incorporando los mejores especialistas de Venezuela. Regresa pronto.'
        : 'Intenta ajustar los filtros para ver más opciones.'}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all"
      >
        <X className="w-5 h-5" />
        Limpiar filtros
      </button>
    )}
  </motion.div>
);

function DirectorioMedicoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const specialtyFromURL = searchParams.get('specialty');
    const queryFromURL = searchParams.get('q');
    const cityFromURL = searchParams.get('city');

    if (specialtyFromURL) setSelectedSpecialty(specialtyFromURL);
    if (queryFromURL) setSearchQuery(queryFromURL);
    if (cityFromURL) setSelectedCity(cityFromURL);

    fetchInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (doctors.length > 0) filterDoctors();
  }, [selectedSpecialty, selectedCity, priceRange, searchQuery, doctors]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [specialtiesRes, searchRes] = await Promise.all([
        searchService.getSpecialties(),
        searchService.searchDoctors({ limit: 100 })
      ]);

      if (specialtiesRes.success) setSpecialties(specialtiesRes.data);

      if (searchRes.success) {
        const doctorData = searchRes.data.doctors;
        setDoctors(doctorData);
        setFilteredDoctors(doctorData);
        const uniqueCities = [...new Set(doctorData.map(d => d.city).filter(Boolean))];
        setCities(uniqueCities.sort());
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Error conectando con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (selectedSpecialty) {
      filtered = filtered.filter(doctor =>
        doctor.specialties_text?.some(s =>
          s.toLowerCase().includes(selectedSpecialty.toLowerCase())
        )
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(doctor =>
        doctor.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (priceRange !== 'all') {
      filtered = filtered.filter(doctor => {
        const fee = parseFloat(doctor.consultation_price_in_person) || 0;
        switch(priceRange) {
          case 'low': return fee > 0 && fee < 30;
          case 'medium': return fee >= 30 && fee < 60;
          case 'high': return fee >= 60;
          default: return true;
        }
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.full_name?.toLowerCase().includes(query) ||
        doctor.specialties_text?.some(s => s.toLowerCase().includes(query)) ||
        doctor.city?.toLowerCase().includes(query)
      );
    }

    setFilteredDoctors(filtered);
  };

  const clearFilters = () => {
    setSelectedSpecialty('');
    setSelectedCity('');
    setPriceRange('all');
    setSearchQuery('');
  };

  const activeFiltersCount = [selectedSpecialty, selectedCity, priceRange !== 'all'].filter(Boolean).length;

  const handleViewProfile = (doctorId) => navigate(`/doctor/${doctorId}`);
  const handleSchedule = (doctorId) => {
    toast('Sistema de citas próximamente disponible', { icon: '🗓️' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-teal-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Stethoscope className="w-10 h-10 text-white animate-pulse" />
              </div>
            </div>
            <p className="text-gray-600 text-lg font-medium">Cargando directorio médico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* HERO SECTION PREMIUM */}
      <section className="relative overflow-hidden">
        {/* Background con patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto"
          >
            {/* Título */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
                Directorio Médico
              </h1>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Encuentra los mejores especialistas verificados de Venezuela
              </p>
            </div>

            {/* Barra de búsqueda premium */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-2xl" />
              <div className="relative p-2">
                <div className="flex items-center bg-white rounded-xl shadow-2xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, especialidad o ciudad..."
                      className="w-full pl-14 pr-4 py-5 text-lg rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent"
                    />
                  </div>
                  <button
                    onClick={() => navigate('/buscar')}
                    className="hidden md:flex items-center gap-2 px-6 py-4 mr-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    Avanzada
                  </button>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white/95 backdrop-blur text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer shadow-lg"
              >
                <option value="">Todas las especialidades</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white/95 backdrop-blur text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer shadow-lg"
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white/95 backdrop-blur text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer shadow-lg"
              >
                <option value="all">Todos los precios</option>
                <option value="low">Menos de $30</option>
                <option value="medium">$30 - $60</option>
                <option value="high">Más de $60</option>
              </select>
            </div>

            {/* Resultados y limpiar filtros */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-5 py-2.5">
                  <span className="text-white font-bold text-lg">
                    {filteredDoctors.length}
                  </span>
                  <span className="text-white/90 ml-2">
                    médico{filteredDoctors.length !== 1 ? 's' : ''} encontrado{filteredDoctors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                    Limpiar ({activeFiltersCount})
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Wave decorativa */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="url(#gradient)"
            />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f9fafb" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#f9fafb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>

      {/* GRID DE MÉDICOS */}
      <section className="py-16 -mt-8 relative z-10">
        <div className="container mx-auto px-4 lg:px-8">
          {filteredDoctors.length === 0 ? (
            <EmptyState
              hasFilters={activeFiltersCount > 0}
              onClearFilters={clearFilters}
              totalDoctors={doctors.length}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredDoctors.map((doctor, index) => (
                <DoctorCard
                  key={doctor.doctor_id}
                  doctor={doctor}
                  index={index}
                  onViewProfile={handleViewProfile}
                  onSchedule={handleSchedule}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      {filteredDoctors.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Eres profesional de la salud?
            </h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Únete a CITAMED y conecta con miles de pacientes que buscan atención médica de calidad.
            </p>
            <button
              onClick={() => navigate('/registro?role=doctor')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl"
            >
              Registrarme como Médico
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default DirectorioMedicoPage;
