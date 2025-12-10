import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Shield, Check, Phone, Mail, ChevronRight, Heart, Users, TrendingUp } from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import Button from '../components/common/button/button';

function SegurosPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Tipos de seguros
  const tiposSeguros = ['Salud', 'Vida', 'HCM', 'Dental', 'Oftalmológico'];

  // Placeholder data - esto se conectará con el backend más adelante
  const seguros = [];

  const filteredSeguros = seguros.filter(seguro => {
    const matchesSearch = seguro.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         seguro.tipo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || seguro.tipo === selectedType;
    return matchesSearch && matchesType;
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
            <Shield className="w-20 h-20 text-white mx-auto mb-6" />
            <h1 className="text-5xl lg:text-6xl font-extrabold text-white mb-4">
              Seguros Afiliados
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Trabaja con las principales aseguradoras de Venezuela
            </p>

            {/* SEARCH BAR */}
            <div className="max-w-2xl mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o tipo de seguro..."
                  className="w-full pl-14 pr-4 py-4 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-accent shadow-lg"
                />
              </div>
            </div>

            {/* TYPE FILTER */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedType('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedType === ''
                      ? 'bg-white text-primary shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Todos los seguros
                </button>
                {tiposSeguros.map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setSelectedType(tipo)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedType === tipo
                        ? 'bg-white text-primary shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SEGUROS CONTENT */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          {/* INFO BANNER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-12 border border-primary/20"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Red de Seguros CITAMED.VE
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Estamos construyendo alianzas estratégicas con las principales aseguradoras del país.
              Próximamente tendrás acceso a:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Integración directa con aseguradoras</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Procesamiento automático de reembolsos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Verificación de cobertura en tiempo real</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent mt-1">✓</span>
                <span>Historial médico integrado con seguros</span>
              </li>
            </ul>
          </motion.div>

          {/* EMPTY STATE */}
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-16 h-16 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Próximamente: Red de Seguros
              </h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Estamos estableciendo convenios con las principales aseguradoras de Venezuela
                para ofrecerte un proceso de facturación y reembolso completamente automatizado.
                Tu experiencia médica será más fluida que nunca.
              </p>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h4 className="text-xl font-bold text-gray-900 mb-6">
                  ¿Eres una aseguradora?
                </h4>
                <p className="text-gray-600 mb-6">
                  Únete al ecosistema de salud digital más innovador de Venezuela
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    variant="primary"
                    size="lg"
                    icon={<Mail className="w-5 h-5" />}
                    onClick={() => window.location.href = 'mailto:alianzas@citamed.ve'}
                  >
                    Contactar Alianzas
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

              {/* BENEFITS FOR INSURERS */}
              <div className="mt-16">
                <h4 className="text-2xl font-bold text-gray-900 mb-8">
                  Beneficios para Aseguradoras
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <h5 className="font-bold text-gray-900 mb-2">Acceso a Red Médica</h5>
                    <p className="text-sm text-gray-600">
                      Conecta con miles de médicos y clínicas certificadas en toda Venezuela
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <h5 className="font-bold text-gray-900 mb-2">Procesamiento Automático</h5>
                    <p className="text-sm text-gray-600">
                      Sistema automatizado de verificación de cobertura y reembolsos
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <h5 className="font-bold text-gray-900 mb-2">Mejor Experiencia</h5>
                    <p className="text-sm text-gray-600">
                      Mejora la satisfacción de tus afiliados con un proceso digital fluido
                    </p>
                  </div>
                </div>
              </div>

              {/* BENEFITS FOR USERS */}
              <div className="mt-16">
                <h4 className="text-2xl font-bold text-gray-900 mb-8">
                  Para Usuarios con Seguro
                </h4>
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h5 className="font-bold text-gray-900 mb-1">Verificación Instantánea</h5>
                        <p className="text-sm text-gray-600">
                          Verifica tu cobertura en segundos antes de agendar
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h5 className="font-bold text-gray-900 mb-1">Sin Papeleo</h5>
                        <p className="text-sm text-gray-600">
                          Olvídate de formularios físicos y trámites engorrosos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h5 className="font-bold text-gray-900 mb-1">Reembolsos Automáticos</h5>
                        <p className="text-sm text-gray-600">
                          Procesa tus reembolsos de forma digital y rápida
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h5 className="font-bold text-gray-900 mb-1">Historial Centralizado</h5>
                        <p className="text-sm text-gray-600">
                          Todo tu historial médico y facturas en un solo lugar
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SegurosPage;
