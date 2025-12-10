import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Phone, Clock, Star, Building2, ChevronRight } from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import Button from '../components/common/button/button';

function ClinicasPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Placeholder data - esto se conectará con el backend más adelante
  const clinicas = [
    {
      id: 1,
      nombre: 'Clínica Ejemplo',
      ciudad: 'Caracas',
      estado: 'Distrito Capital',
      direccion: 'Av. Principal, Urbanización El Rosal',
      telefono: '+58 212-555-0100',
      horario: 'Lun-Vie: 8:00 AM - 6:00 PM',
      especialidades: ['Cardiología', 'Pediatría', 'Medicina General'],
      rating: 4.5,
      totalReviews: 128,
      imagen: null,
      servicios: ['Consultas', 'Laboratorio', 'Rayos X', 'Emergencias 24/7']
    }
  ];

  const ciudades = ['Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Maturín'];

  const filteredClinicas = clinicas.filter(clinica => {
    const matchesSearch = clinica.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clinica.ciudad.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         clinica.especialidades.some(esp => esp.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = !selectedCity || clinica.ciudad === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-primary via-primary-light to-secondary py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Building2 className="w-20 h-20 text-white mx-auto mb-6" />
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
              Clínicas Afiliadas
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Red de centros médicos certificados en toda Venezuela
            </p>

            {/* SEARCH BAR */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, ciudad o especialidad..."
                  className="w-full pl-14 pr-4 py-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-accent shadow-lg"
                />
              </div>
            </div>

            {/* CITY FILTER */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedCity('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCity === ''
                      ? 'bg-white text-primary shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Todas las ciudades
                </button>
                {ciudades.map((ciudad) => (
                  <button
                    key={ciudad}
                    onClick={() => setSelectedCity(ciudad)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCity === ciudad
                        ? 'bg-white text-primary shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {ciudad}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CLINICAS CONTENT */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* INFO BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              Red de Clínicas CITAMED.VE
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nuestra red de clínicas afiliadas está en construcción. Próximamente tendrás acceso a:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Centros médicos certificados en todo el país</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Horarios extendidos y atención 24/7</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Descuentos especiales para usuarios CITAMED</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Sistema integrado de citas y pagos</span>
              </li>
            </ul>
          </motion.div>

          {/* EMPTY STATE */}
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Próximamente: Red de Clínicas
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Estamos trabajando para traerte la red de clínicas más completa de Venezuela.
                Nuestro equipo está certificando centros médicos de excelencia en todo el país
                para ofrecerte atención de calidad cerca de ti.
              </p>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="text-xl font-bold text-gray-900 mb-6">
                  ¿Tienes una clínica y quieres afiliarte?
                </h4>
                <p className="text-gray-600 mb-6">
                  Únete a la red de salud digital más innovadora de Venezuela
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => navigate('/registro?role=provider')}
                  >
                    Afiliar mi Clínica
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/')}
                  >
                    Volver al Inicio
                  </Button>
                </div>
              </div>

              {/* BENEFITS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-2">Certificación</h5>
                  <p className="text-sm text-gray-600">
                    Proceso riguroso de verificación y certificación de calidad
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-2">Cobertura Nacional</h5>
                  <p className="text-sm text-gray-600">
                    Red de clínicas en todas las principales ciudades del país
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h5 className="font-bold text-gray-900 mb-2">Atención Integrada</h5>
                  <p className="text-sm text-gray-600">
                    Sistema unificado de citas, pagos y historial médico
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ClinicasPage;
