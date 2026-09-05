/**
 * LANDING PAGE - CITAMED.VE
 * Página principal profesional con explicación clara del ecosistema
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/common/Navbar/Navbar';
import ModuleCard from '../components/common/ModuleCard/ModuleCard';
import Button, { Icons } from '../components/common/Button/button';
import { Calendar, Video, ShoppingCart, DollarSign, Users, Shield, TrendingUp, Heart, Search, Stethoscope } from 'lucide-react';
import axios from 'axios';

function LandingPage() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  useEffect(() => {
    // Fetch specialties for the search
    axios.get('http://localhost:5000/api/specialties')
      .then(response => {
        if (response.data.success) {
          setSpecialties(response.data.data);
        }
      })
      .catch(err => console.error('Error loading specialties:', err));
  }, []);

  const handleSearchDoctor = () => {
    if (selectedSpecialty) {
      navigate(`/directorio?specialty=${encodeURIComponent(selectedSpecialty)}`);
    } else {
      navigate('/directorio');
    }
  };

  const modules = [
    {
      id: 'agendamiento',
      icon: '📅',
      title: 'Agendamiento Inteligente',
      description: 'Sistema inteligente de turnos que elimina las esperas.',
      gradient: 'linear-gradient(135deg, #0B2D4A 0%, #1565C0 100%)',
      components: ['Turnos virtuales', 'Notificaciones', 'Historial', 'Recordatorios'],
      status: 'active',
      route: '/modulo/agendamiento'
    },
    {
      id: 'telemedicina',
      icon: '💻',
      title: 'Telemedicina',
      description: 'Consultas médicas desde cualquier lugar con videollamadas HD.',
      gradient: 'linear-gradient(135deg, #00BFA6 0%, #00796B 100%)',
      components: ['Videollamadas HD', 'Chat seguro', 'Archivos médicos', 'Cobro automático'],
      status: 'soon',
      route: '/modulo/telemedicina'
    },
    {
      id: 'marketmed',
      icon: '🛒',
      title: 'MarketMed',
      description: 'Marketplace médico. Médicos ganan 3% por referido.',
      gradient: 'linear-gradient(135deg, #00BFA6 0%, #0B2D4A 100%)',
      components: ['Recetas digitales', 'Laboratorios', 'Farmacias', 'Referidos 3%'],
      status: 'soon',
      route: '/modulo/marketmed'
    },
    {
      id: 'citamed-paga',
      icon: '💰',
      title: 'Citamed Paga',
      description: 'Escrow y financiamiento. Pago garantizado 100%.',
      gradient: 'linear-gradient(135deg, #FB8C00 0%, #E65100 100%)',
      components: ['Escrow seguro', 'Múltiples pagos', 'Financiamiento 0%', 'Pago garantizado'],
      status: 'soon',
      route: '/modulo/citamed-paga'
    }
  ];

  const benefits = [
    {
      title: 'Para Pacientes',
      icon: <Users className="w-12 h-12" />,
      color: 'text-secondary',
      items: [
        'Agenda citas sin esperas',
        'Consultas por videollamada',
        'Compra medicamentos con descuento',
        'Financia tratamientos sin interés'
      ]
    },
    {
      title: 'Para Médicos',
      icon: <Heart className="w-12 h-12" />,
      color: 'text-primary',
      items: [
        'Gestiona tu agenda inteligentemente',
        'Cobra automáticamente',
        'Genera ingresos pasivos (3%)',
        'Pago garantizado 100%'
      ]
    },
    {
      title: 'Para Proveedores',
      icon: <TrendingUp className="w-12 h-12" />,
      color: 'text-accent',
      items: [
        'Accede a red de médicos',
        'Recibe órdenes directas',
        'Visibilidad en marketplace',
        'Comisión competitiva'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary pt-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse-slow"></div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-5xl mx-auto"
          >
            <h1 className="text-6xl lg:text-8xl font-extrabold mb-6 text-white">
              CITAMED<span className="text-accent">.VE</span>
            </h1>
            <p className="text-3xl lg:text-4xl mb-4 text-white font-bold">
              El Ecosistema de Salud Digital para Venezuela
            </p>
            <p className="text-xl lg:text-2xl mb-12 text-white/80 max-w-3xl mx-auto leading-relaxed">
              Plataforma integral que conecta pacientes, médicos y proveedores.
              <span className="font-bold text-white"> Agendamiento inteligente, telemedicina, marketplace médico y sistema de pagos</span> todo en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
              <Button
                variant="secondary"
                size="xl"
                icon={<Icons.User />}
                onClick={() => navigate('/registro?role=patient')}
              >
                Soy Paciente
              </Button>
              <Button
                variant="outline"
                size="xl"
                icon={<Icons.Doctor />}
                onClick={() => navigate('/registro?role=doctor')}
                className="bg-white hover:bg-gray-50 text-primary border-white"
              >
                Soy Médico
              </Button>
              <Button
                variant="primary"
                size="xl"
                icon={<Icons.Store />}
                onClick={() => navigate('/registro?role=provider')}
                className="bg-accent hover:bg-accent-dark"
              >
                Soy Proveedor
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DOCTOR SEARCH SECTION */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-8">
              <Stethoscope className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-4xl font-extrabold mb-4 text-gray-900">
                Encuentra tu <span className="gradient-text">Médico Ideal</span>
              </h2>
              <p className="text-lg text-gray-600">
                Busca especialistas verificados en toda Venezuela
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 shadow-xl border border-primary/10">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Specialty Selector */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-gray-900 font-medium appearance-none cursor-pointer bg-white"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                      backgroundSize: '1.5rem'
                    }}
                  >
                    <option value="">Todas las especialidades</option>
                    {specialties.map((spec) => (
                      <option key={spec.id} value={spec.name}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Search className="w-5 h-5" />}
                  onClick={handleSearchDoctor}
                  className="md:w-auto w-full px-8 shadow-lg hover:shadow-xl"
                >
                  Buscar Médico
                </Button>
              </div>

              {/* Quick Specialty Links */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3 font-medium">Especialidades populares:</p>
                <div className="flex flex-wrap gap-2">
                  {specialties.slice(0, 6).map((spec) => (
                    <button
                      key={spec.id}
                      onClick={() => {
                        setSelectedSpecialty(spec.name);
                        setTimeout(() => handleSearchDoctor(), 100);
                      }}
                      className="px-4 py-2 bg-white border border-primary/20 rounded-full text-sm font-medium text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {spec.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section id="beneficios" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-extrabold mb-4">
              <span className="gradient-text">Una Plataforma, Múltiples Beneficios</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              CITAMED.VE es más que una aplicación médica. Es un ecosistema completo diseñado para mejorar la experiencia de todos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-8 hover:shadow-2xl transition-all duration-300"
              >
                <div className={`${benefit.color} mb-6 flex justify-center`}>
                  {benefit.icon}
                </div>
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-900">
                  {benefit.title}
                </h3>
                <ul className="space-y-3">
                  {benefit.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-accent mt-1">✓</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES SECTION */}
      <section id="modulos" className="relative py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-extrabold mb-4">
              <span className="gradient-text">Los 4 Módulos</span> de CITAMED.VE
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada módulo está diseñado para resolver un problema específico del sector salud en Venezuela.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {modules.map((module, index) => (
              <div
                key={module.id}
                onClick={() => navigate(module.route)}
                className="cursor-pointer"
              >
                <ModuleCard
                  icon={module.icon}
                  title={module.title}
                  description={module.description}
                  gradient={module.gradient}
                  components={module.components}
                  status={module.status}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-extrabold mb-4">
              <span className="gradient-text">Preguntas Frecuentes</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todo lo que necesitas saber sobre CITAMED.VE
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: '¿Qué es CITAMED.VE?',
                a: 'CITAMED.VE es el ecosistema de salud digital más completo de Venezuela. Conectamos pacientes, médicos y proveedores en una sola plataforma con agendamiento, telemedicina, marketplace médico y sistema de pagos.'
              },
              {
                q: '¿Cómo me registro como médico?',
                a: 'Click en "Soy Médico", completa tus datos profesionales incluyendo tu número de matrícula y especialidad. Una vez verificada tu información, tu perfil estará activo en el directorio médico.'
              },
              {
                q: '¿Los pagos son seguros?',
                a: 'Sí. Utilizamos Citamed Paga, nuestro sistema de escrow que garantiza el 100% de tus pagos. Los fondos se liberan solo cuando se completa la consulta o servicio.'
              },
              {
                q: '¿Puedo agendar citas sin esperar en cola?',
                a: 'Exacto. Nuestro sistema de turnos virtuales elimina las esperas. Recibes notificaciones cuando te toca tu cita y puedes gestionar todo desde tu celular.'
              },
              {
                q: '¿Cómo funciona la telemedicina?',
                a: 'Agendas una videoconsulta con tu médico, pagas de forma segura, y te conectas por videollamada HD desde cualquier lugar. El médico puede compartir archivos médicos y recetas digitales.'
              },
              {
                q: '¿Qué es el MarketMed?',
                a: 'Es nuestro marketplace médico donde encuentras farmacias, laboratorios y servicios de salud con descuentos. Los médicos ganan 3% por cada referido.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-700 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-white">
              ¿Listo para transformar la salud digital en Venezuela?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Únete a CITAMED.VE y forma parte del futuro de la atención médica
            </p>
            <Button
              variant="secondary"
              size="xl"
              onClick={() => navigate('/registro')}
              className="bg-white text-primary hover:bg-gray-100"
            >
              Crear Cuenta Gratis
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                CITAMED<span className="text-accent">.VE</span>
              </h3>
              <p className="text-gray-400">
                El ecosistema de salud digital más completo de Venezuela
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Módulos</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/modulo/agendamiento')}>Agendamiento</li>
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/modulo/telemedicina')}>Telemedicina</li>
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/modulo/marketmed')}>MarketMed</li>
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/modulo/citamed-paga')}>Citamed Paga</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Acceso</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/login')}>Iniciar Sesión</li>
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/registro')}>Registrarse</li>
                <li className="hover:text-white cursor-pointer" onClick={() => navigate('/directorio')}>Directorio Médico</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2025 CITAMED.VE - Todos los derechos reservados</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
