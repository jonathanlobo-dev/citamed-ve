import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader, Star, MapPin, Calendar, DollarSign, Award, Users, Filter, ChevronDown, X } from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import Button from '../components/common/button/button';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const specialtyFromURL = searchParams.get('specialty');
    if (specialtyFromURL) {
      setSelectedSpecialty(specialtyFromURL);
    }
    fetchInitialData();
  }, [searchParams]);

  useEffect(() => {
    if (doctors.length > 0) {
      filterDoctors();
    }
  }, [selectedSpecialty, selectedCity, priceRange, searchQuery]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [specialtiesRes, doctorsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/specialties'),
        axios.get('http://localhost:5000/api/doctors')
      ]);

      if (specialtiesRes.data.success) {
        setSpecialties(specialtiesRes.data.data);
      }

      if (doctorsRes.data.success) {
        const doctorData = doctorsRes.data.data;
        setDoctors(doctorData);
        setFilteredDoctors(doctorData);

        // Extract unique cities
        const uniqueCities = [...new Set(doctorData.map(d => d.city).filter(Boolean))];
        setCities(uniqueCities.sort());

        if (doctorsRes.data.total > 0) {
          toast.success(`${doctorsRes.data.total} médicos verificados disponibles`);
        }
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

    // Filter by specialty
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor =>
        doctor.subSpecialty?.toLowerCase().includes(selectedSpecialty.toLowerCase())
      );
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(doctor =>
        doctor.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Filter by price range
    if (priceRange !== 'all' && priceRange) {
      filtered = filtered.filter(doctor => {
        const fee = doctor.consultationFee || 0;
        switch(priceRange) {
          case 'low': return fee < 30;
          case 'medium': return fee >= 30 && fee < 60;
          case 'high': return fee >= 60;
          default: return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(doctor =>
        doctor.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.subSpecialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.city?.toLowerCase().includes(searchQuery.toLowerCase())
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Cargando directorio médico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-primary via-primary-light to-secondary py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4 text-center">
              Directorio Médico
            </h1>
            <p className="text-xl text-white/90 mb-8 text-center">
              Los mejores especialistas médicos verificados de Venezuela
            </p>

            {/* SEARCH BAR */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, especialidad o ciudad..."
                  className="w-full pl-14 pr-4 py-5 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-accent shadow-2xl"
                />
              </div>
            </div>

            {/* FILTERS ROW */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Specialty Dropdown */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Especialidad</label>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    <option value="">Todas las especialidades</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.name}>
                        {specialty.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Dropdown */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Ciudad</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    <option value="">Todas las ciudades</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Dropdown */}
                <div>
                  <label className="block text-white/90 text-sm font-medium mb-2">Rango de Precio</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                  >
                    <option value="all">Todos los precios</option>
                    <option value="low">Menos de $30</option>
                    <option value="medium">$30 - $60</option>
                    <option value="high">Más de $60</option>
                  </select>
                </div>
              </div>

              {/* Active Filters & Results */}
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <p className="text-white font-semibold">
                    {filteredDoctors.length} médico{filteredDoctors.length !== 1 ? 's' : ''} encontrado{filteredDoctors.length !== 1 ? 's' : ''}
                  </p>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-all"
                    >
                      <X className="w-4 h-4" />
                      Limpiar filtros ({activeFiltersCount})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOCTORS GRID */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {filteredDoctors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Users className="w-32 h-32 text-gray-300 mx-auto mb-6" />
              <h3 className="text-3xl font-bold text-gray-700 mb-4">
                {doctors.length === 0
                  ? '¡Pronto tendremos médicos disponibles!'
                  : 'No encontramos médicos con estos criterios'}
              </h3>
              <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                {doctors.length === 0
                  ? 'Estamos incorporando los mejores especialistas de Venezuela. Regresa pronto para ver nuestro directorio completo.'
                  : 'Intenta ajustar los filtros para ver más opciones disponibles.'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="primary" size="lg" onClick={clearFilters}>
                  Ver todos los médicos
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                >
                  {/* DOCTOR HEADER */}
                  <div className="bg-gradient-to-br from-primary to-secondary p-6 text-white relative">
                    <div className="text-center">
                      {doctor.profilePhoto ? (
                        <img
                          src={doctor.profilePhoto}
                          alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                          className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover mx-auto mb-3"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                          {doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-1">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h3>
                      <p className="text-sm text-white/90 flex items-center justify-center gap-1">
                        <Award className="w-4 h-4" />
                        {doctor.subSpecialty || 'Medicina General'}
                      </p>
                    </div>
                  </div>

                  {/* DOCTOR INFO */}
                  <div className="p-5 space-y-3">
                    {/* Experience */}
                    {doctor.experienceYears > 0 && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {doctor.experienceYears} años de experiencia
                        </span>
                      </div>
                    )}

                    {/* Location */}
                    {doctor.city && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          {doctor.city}{doctor.state ? `, ${doctor.state}` : ''}
                        </span>
                      </div>
                    )}

                    {/* Fee */}
                    {doctor.consultationFee > 0 && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <DollarSign className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold">
                          ${doctor.consultationFee} por consulta
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      variant="primary"
                      className="w-full mt-4"
                      onClick={() => navigate(`/agendar/${doctor.id}`)}
                    >
                      Agendar Cita
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default DirectorioMedicoPage;
