/**
 * 🏥 CITAMED.VE - LANDING PAGE COMPLETA
 * Todas las 14 secciones en un solo archivo para desarrollo rápido
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import './styles/design-system.css';
import './App.css';
import Navbar from './components/layout/Navbar';
import Button, { Icons } from './components/common/button/button';
import Card from './components/common/card/card';
import WhatsAppButton from './components/common/whatsapp/WhatsAppButton';
import AppDownload from './components/common/appdownload/AppDownload';
import RoleSelector from './components/auth/RoleSelector';
import ModuleCard from './components/common/ModuleCard/ModuleCard';
import { authAPI } from './services/api';

function App() {
  const [activeTab, setActiveTab] = useState('panel-medico');
  
  // Estados para el formulario de registro
  const [registerData, setRegisterData] = useState({
    userType: '',
    fullName: '',
    email: '',
    password: '',
    phone: '',
  });

  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Mapeo de IDs del RoleSelector a roles del backend
  const roleMapping = {
    'patient': 'patient',
    'doctor': 'doctor',
    'clinic': 'clinic',
    'pharmacy': 'provider',
    'laboratory': 'provider',
    'insurer': 'insurer',
    'supplier': 'provider'
  };

  // Manejar cambios en inputs del formulario
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para el RoleSelector
  const handleRoleSelect = (roleId) => {
    const backendRole = roleMapping[roleId] || roleId;
    setRegisterData(prev => ({ 
      ...prev, 
      userType: backendRole,
      selectedRoleId: roleId
    }));
    console.log('🎯 Rol seleccionado:', roleId, '→ Backend:', backendRole);
  };

  // Manejar submit del formulario
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');
    
    try {
      if (!registerData.userType) {
        throw new Error('Por favor selecciona tu tipo de cuenta');
      }
      
      if (!registerData.fullName || !registerData.email || !registerData.password || !registerData.phone) {
        throw new Error('Por favor completa todos los campos');
      }
      
      if (registerData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }
      
      const dataToSend = {
        name: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        phone: registerData.phone,
        role: registerData.userType,
      };
      
      console.log('📤 Enviando registro:', dataToSend);
      
      const response = await authAPI.register(dataToSend);
      
      console.log('✅ Respuesta exitosa:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('citamed_token', response.data.token);
        localStorage.setItem('citamed_user', JSON.stringify(response.data.user));
      }
      
      setRegisterSuccess(true);
      
      setRegisterData({
        userType: '',
        fullName: '',
        email: '',
        password: '',
        phone: '',
      });
      
      setTimeout(() => {
        alert('¡Registro exitoso! Bienvenido a CITAMED.VE');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      
      if (error.response) {
        setRegisterError(error.response.data.message || 'Error al registrar usuario');
      } else if (error.request) {
        setRegisterError('Error de conexión. Verifica que el backend esté corriendo');
      } else {
        setRegisterError(error.message || 'Error al procesar el registro');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="app">
      {/* NAVBAR */}
      <Navbar />

      {/* SECCIÓN 1: HERO */}
      <section id="hero" className="hero">
        <div className="container hero-container">
          <h1 className="hero-title">
            CITAMED<span className="hero-accent">.VE</span>
          </h1>
          <p className="hero-subtitle-large">
            El Ecosistema de Salud Digital para Venezuela
          </p>
          <p className="hero-subtitle">
            Conectamos médicos, pacientes y proveedores en una plataforma integral que revoluciona la gestión médica con tecnología accesible y soluciones financieras innovadoras.
          </p>
          
          <div className="hero-actions">
            <Button variant="primary" size="xl" icon={<Icons.User />}>
              Soy Paciente
            </Button>
            <Button variant="outline" size="xl" icon={<Icons.Doctor />} 
              style={{ background: 'white', color: '#0B2D4A' }}>
              Soy Médico
            </Button>
            <Button variant="secondary" size="xl" icon={<Icons.Store />}>
              Soy Proveedor
            </Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN APP DOWNLOAD - PWA */}
      <AppDownload />

      {/* SECCIÓN 2: ¿PARA QUIÉN? */}
      <section id="para-quien" className="section-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">¿Para Quién es CITAMED.VE?</h2>
            <p className="section-lead">Identifica tu perfil y descubre cómo te ayudamos</p>
          </div>

          <div className="three-col-grid">
            <Card className="profile-card">
              <div className="profile-icon">👤</div>
              <h3 className="profile-title">¿ERES PACIENTE?</h3>
              <ul className="profile-benefits">
                <li>✅ Encuentra médicos confiables cerca de ti</li>
                <li>✅ Agenda en 2 minutos, ve tu turno en vivo</li>
                <li>✅ Recibe tu receta digital</li>
                <li>✅ Compra tus medicinas verificadas</li>
                <li>✅ Gana puntos en cada consulta</li>
              </ul>
              <Button variant="primary" fullWidth className="mt-3">
                Registrarme como Paciente
              </Button>
            </Card>

            <Card className="profile-card">
              <div className="profile-icon">👨‍⚕️</div>
              <h3 className="profile-title">¿ERES MÉDICO?</h3>
              <ul className="profile-benefits">
                <li>✅ Plataforma GRATIS para gestionar tu consultorio</li>
                <li>✅ Sala de espera virtual automática</li>
                <li>✅ 0% no-shows (confirmaciones WhatsApp)</li>
                <li>✅ Cobra seguro (Citamed Paga)</li>
                <li>✅ Gana 3% extra por cada receta</li>
              </ul>
              <Button variant="secondary" fullWidth className="mt-3">
                Registrarme como Médico
              </Button>
            </Card>

            <Card className="profile-card">
              <div className="profile-icon">🏪</div>
              <h3 className="profile-title">¿ERES FARMACIA O LAB?</h3>
              <ul className="profile-benefits">
                <li>✅ Recibe pedidos digitales verificados</li>
                <li>✅ Acceso a red de médicos</li>
                <li>✅ 0% falsificaciones de recetas</li>
                <li>✅ Sistema de pagos integrado</li>
                <li>✅ Aumenta tus ventas 40%</li>
              </ul>
              <Button variant="success" fullWidth className="mt-3">
                Unirme a MarketMed
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: PLAN DE FIDELIZACIÓN ⭐ */}
      <section id="fidelizacion" className="section-gradient">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading-white">🎁 Ganas Más Usando CITAMED.VE</h2>
            <p className="section-lead-white">
              Cada acción suma. Cada punto te acerca a premios y beneficios exclusivos.
            </p>
          </div>

          <div className="three-col-grid">
            <Card className="loyalty-card">
              <h3 className="loyalty-title">⭐ PACIENTES</h3>
              <div className="loyalty-section">
                <h4>Gana Puntos:</h4>
                <ul>
                  <li>🗓️ +50 puntos por cada cita que asistes</li>
                  <li>💊 +20 puntos por compra en MarketMed</li>
                  <li>📱 +100 puntos por referir un amigo</li>
                  <li>⏰ +10 puntos por llegar puntual</li>
                </ul>
              </div>
              <div className="loyalty-section">
                <h4>🎁 Canjea por:</h4>
                <ul>
                  <li>Descuentos en consultas</li>
                  <li>Cashback en medicinas</li>
                  <li>Consultas gratis</li>
                  <li>Exámenes de laboratorio</li>
                </ul>
              </div>
              <Button variant="primary" fullWidth>Ver Todos los Beneficios</Button>
            </Card>

            <Card className="loyalty-card">
              <h3 className="loyalty-title">💰 MÉDICOS</h3>
              <div className="loyalty-section">
                <h4>Gana Más:</h4>
                <ul>
                  <li>🎯 +3% por cada receta en MarketMed</li>
                  <li>📊 +5% bonus por &gt;100 citas/mes</li>
                  <li>⭐ +Bonos por ratings altos</li>
                  <li>💎 +Premios por volumen</li>
                </ul>
              </div>
              <div className="loyalty-section">
                <h4>🎁 Recompensas:</h4>
                <ul>
                  <li>Viajes médicos internacionales</li>
                  <li>Cursos de especialización</li>
                  <li>Equipamiento de consultorio</li>
                  <li>Seguros con descuento</li>
                </ul>
              </div>
              <Button variant="secondary" fullWidth>Ver Plan Médicos</Button>
            </Card>

            <Card className="loyalty-card">
              <h3 className="loyalty-title">📈 PROVEEDORES</h3>
              <div className="loyalty-section">
                <h4>Aumenta Ventas:</h4>
                <ul>
                  <li>💊 Acceso a 2,890 médicos</li>
                  <li>🔝 Featured en marketplace</li>
                  <li>💳 Descuentos en comisiones</li>
                  <li>📊 Analytics de ventas</li>
                </ul>
              </div>
              <div className="loyalty-section">
                <h4>🎁 Beneficios:</h4>
                <ul>
                  <li>Promociones destacadas</li>
                  <li>Publicidad gratis</li>
                  <li>Soporte prioritario</li>
                  <li>Capacitación digital</li>
                </ul>
              </div>
              <Button variant="success" fullWidth>Ver Plan Proveedores</Button>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 5: ¿CÓMO FUNCIONA? */}
      <section id="como-funciona" className="section-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">¿Cómo Funciona?</h2>
            <p className="section-lead">4 pasos simples para transformar tu experiencia médica</p>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-number">1</div>
              <div className="timeline-content">
                <h3>BUSCA</h3>
                <p>Tu médico cerca de ti por especialidad y ubicación</p>
              </div>
            </div>
            <div className="timeline-arrow">→</div>
            
            <div className="timeline-item">
              <div className="timeline-number">2</div>
              <div className="timeline-content">
                <h3>AGENDA</h3>
                <p>En 2 minutos tu cita. "Eres el turno #16"</p>
              </div>
            </div>
            <div className="timeline-arrow">→</div>
            
            <div className="timeline-item">
              <div className="timeline-number">3</div>
              <div className="timeline-content">
                <h3>ESPERA</h3>
                <p>Desde casa, 0 colas. Te avisamos cuando falta 1</p>
              </div>
            </div>
            <div className="timeline-arrow">→</div>
            
            <div className="timeline-item">
              <div className="timeline-number">4</div>
              <div className="timeline-content">
                <h3>RECIBE</h3>
                <p>Receta digital verificada. Compra en MarketMed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: LOS 4 MÓDULOS - ENTERPRISE DESIGN */}
      <section id="modulos" className="relative py-32 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 right-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl lg:text-6xl font-extrabold mb-6">
              <span className="gradient-text">Los 4 Módulos</span>
              <br />
              <span className="text-gray-900">de CITAMED.VE</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Una plataforma completa que revoluciona la experiencia de salud digital en Venezuela
            </p>
          </motion.div>

          {/* Modules grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <ModuleCard
              icon="📅"
              title="Agendamiento Inteligente"
              description="Olvídate de las largas esperas. Sistema inteligente de turnos que te avisa cuando es tu momento."
              gradient="linear-gradient(135deg, #0B2D4A 0%, #1565C0 100%)"
              components={[
                'Turnos virtuales en tiempo real',
                'Notificaciones automáticas',
                'Historial de citas',
                'Recordatorios inteligentes'
              ]}
              status="active"
              index={0}
            />

            <ModuleCard
              icon="💻"
              title="Telemedicina"
              description="Consultas médicas desde cualquier lugar. Videollamadas HD, chat seguro y cobro automático."
              gradient="linear-gradient(135deg, #00BFA6 0%, #00796B 100%)"
              components={[
                'Videollamadas HD encriptadas',
                'Chat en tiempo real',
                'Compartir archivos médicos',
                'Cobro automático integrado'
              ]}
              status="soon"
              index={1}
            />

            <ModuleCard
              icon="🛒"
              title="MarketMed"
              description="Marketplace médico completo. Farmacias, laboratorios e insumos. Médicos ganan 3% por referido."
              gradient="linear-gradient(135deg, #00BFA6 0%, #0B2D4A 100%)"
              components={[
                'Recetas digitales verificadas',
                'Órdenes de laboratorio',
                'Red de farmacias certificadas',
                'Sistema de referidos 3%'
              ]}
              status="soon"
              index={2}
            />

            <ModuleCard
              icon="💰"
              title="Citamed Paga"
              description="Sistema de escrow y financiamiento. Pago garantizado para médicos, financiamiento 0% para pacientes."
              gradient="linear-gradient(135deg, #FB8C00 0%, #E65100 100%)"
              components={[
                'Sistema de escrow seguro',
                'Múltiples pasarelas de pago',
                'Financiamiento 0% interés',
                'Pago garantizado 100%'
              ]}
              status="soon"
              index={3}
            />
          </div>
        </div>
      </section>

      {/* SECCIÓN 7: DEMO INTERACTIVA */}
      <section id="demo" className="section-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">🖥️ Ve CITAMED.VE en Acción</h2>
            <p className="section-lead">Explora la plataforma sin necesidad de registrarte</p>
          </div>

          <div className="demo-container">
            <div className="demo-tabs">
              <button 
                className={`demo-tab ${activeTab === 'panel-medico' ? 'active' : ''}`}
                onClick={() => setActiveTab('panel-medico')}
              >
                👨‍⚕️ Panel del Médico
              </button>
              <button 
                className={`demo-tab ${activeTab === 'sala-espera' ? 'active' : ''}`}
                onClick={() => setActiveTab('sala-espera')}
              >
                ⏰ Sala de Espera
              </button>
              <button 
                className={`demo-tab ${activeTab === 'telemedicina' ? 'active' : ''}`}
                onClick={() => setActiveTab('telemedicina')}
              >
                💻 Telemedicina
              </button>
              <button 
                className={`demo-tab ${activeTab === 'marketmed' ? 'active' : ''}`}
                onClick={() => setActiveTab('marketmed')}
              >
                🛒 MarketMed
              </button>
            </div>

            <div className="demo-content">
              {activeTab === 'panel-medico' && (
                <div className="demo-panel">
                  <h3>Panel del Médico</h3>
                  <div className="demo-stats-grid">
                    <div className="demo-stat-card">
                      <div className="demo-stat-number">24</div>
                      <div className="demo-stat-label">Citas Hoy</div>
                    </div>
                    <div className="demo-stat-card">
                      <div className="demo-stat-number">156</div>
                      <div className="demo-stat-label">Pacientes Total</div>
                    </div>
                    <div className="demo-stat-card">
                      <div className="demo-stat-number">$2,840</div>
                      <div className="demo-stat-label">Ingresos Mes</div>
                    </div>
                    <div className="demo-stat-card">
                      <div className="demo-stat-number">4.8★</div>
                      <div className="demo-stat-label">Rating</div>
                    </div>
                  </div>
                  <div className="demo-patients-list">
                    <h4>Próximos Pacientes:</h4>
                    <div className="demo-patient-card">
                      <div>
                        <strong>María González</strong><br/>
                        <small>Control - 10:00 AM</small>
                      </div>
                      <span className="demo-badge demo-badge-waiting">Esperando</span>
                    </div>
                    <div className="demo-patient-card">
                      <div>
                        <strong>Carlos Rodríguez</strong><br/>
                        <small>Primera vez - 10:30 AM</small>
                      </div>
                      <span className="demo-badge demo-badge-confirmed">Confirmado</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sala-espera' && (
                <div className="demo-panel">
                  <h3>Sala de Espera Virtual</h3>
                  <div className="waiting-room">
                    <div className="your-turn-card">
                      <h2>Eres el turno #16</h2>
                      <p className="turn-status">Faltan 8 personas antes que tú</p>
                      <p className="turn-estimate">Tiempo estimado: ~40 minutos</p>
                      <div className="turn-actions">
                        <Button variant="primary">Estoy en Camino</Button>
                        <Button variant="outline">Reprogramar</Button>
                      </div>
                    </div>
                    <div className="queue-visual">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="queue-person">👤</div>
                      ))}
                      <div className="queue-person queue-you">TÚ</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'telemedicina' && (
                <div className="demo-panel">
                  <h3>Telemedicina</h3>
                  <div className="telemedicine-interface">
                    <div className="video-placeholder">
                      <div className="video-box">📹 Video del Médico</div>
                      <div className="video-box-small">📹 Tu Video</div>
                    </div>
                    <div className="telemedicine-controls">
                      <Button variant="danger" icon={<Icons.X />}>Finalizar</Button>
                      <Button variant="primary">💬 Chat</Button>
                      <Button variant="secondary">📎 Compartir Archivos</Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'marketmed' && (
                <div className="demo-panel">
                  <h3>MarketMed - Marketplace Médico</h3>
                  <div className="marketplace-items">
                    <div className="marketplace-item-card">
                      <div className="marketplace-item-header">
                        <strong>💊 Farmacia Central</strong>
                        <span className="demo-badge demo-badge-verified">Verificado</span>
                      </div>
                      <p>Omeprazol 20mg x30</p>
                      <div className="marketplace-item-footer">
                        <strong>$15.00</strong>
                        <Button variant="success" size="sm">Comprar</Button>
                      </div>
                    </div>
                    <div className="marketplace-item-card">
                      <div className="marketplace-item-header">
                        <strong>🔬 Laboratorio Diagnóstico Plus</strong>
                        <span className="demo-badge demo-badge-verified">Verificado</span>
                      </div>
                      <p>Hemograma Completo</p>
                      <div className="marketplace-item-footer">
                        <strong>$25.00</strong>
                        <Button variant="success" size="sm">Agendar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="lead">¿Te gustó lo que viste?</p>
            <Button variant="primary" size="lg">Probar Ahora Gratis</Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 8: TESTIMONIOS */}
      <section id="testimonios" className="section-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">Lo Que Dicen Nuestros Usuarios</h2>
          </div>
          <div className="testimonials-grid">
            <Card className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Ya no pierdo horas en la sala de espera. Veo mi turno desde casa y llego justo a tiempo."
              </p>
              <p className="testimonial-author">- María González, Paciente</p>
            </Card>
            <Card className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "La sala de espera virtual cambió mi consultorio. Mis pacientes están felices y yo más organizado."
              </p>
              <p className="testimonial-author">- Dr. Carlos Pérez, Cardiólogo</p>
            </Card>
            <Card className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Nuestras ventas aumentaron 40% desde que estamos en MarketMed. Las recetas llegan verificadas."
              </p>
              <p className="testimonial-author">- Farmacia Central</p>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 9: FAQ */}
      <section id="faq" className="section-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">Preguntas Frecuentes</h2>
          </div>
          <div className="faq-container">
            <div className="faq-item">
              <h3 className="faq-question">¿Es gratis para pacientes?</h3>
              <p className="faq-answer">
                Sí, CITAMED.VE es 100% gratuito para pacientes. Solo pagas la consulta al médico.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">¿Cuánto cuesta para médicos?</h3>
              <p className="faq-answer">
                CITAMED.VE ofrece planes accesibles y escalables según el volumen de uso. Contáctanos para conocer el plan que mejor se adapte a tu práctica médica.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">¿Cómo funcionan los pagos?</h3>
              <p className="faq-answer">
                Aceptamos Pago Móvil, Zelle, USD efectivo, tarjetas y criptomonedas. El pago es seguro y garantizado.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">¿Es seguro?</h3>
              <p className="faq-answer">
                Sí, cumplimos con todas las normativas de protección de datos médicos. Tus datos están encriptados.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">¿Funciona en toda Venezuela?</h3>
              <p className="faq-answer">
                Sí, tenemos médicos en Caracas, Valencia, Maracaibo, Barquisimeto y principales ciudades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 10: NÚMEROS */}
      <section id="numeros" className="section-white">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-heading">CITAMED.VE en Números</h2>
          </div>
          <div className="stats-grid">
            <Card hover className="stat-card">
              <div className="stat-number">2,890</div>
              <div className="stat-label">Médicos Registrados</div>
            </Card>
            <Card hover className="stat-card">
              <div className="stat-number">150K</div>
              <div className="stat-label">Citas Agendadas</div>
            </Card>
            <Card hover className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfacción</div>
            </Card>
            <Card hover className="stat-card">
              <div className="stat-number">0 min</div>
              <div className="stat-label">Tiempo de Espera</div>
            </Card>
          </div>
        </div>
      </section>

      {/* SECCIÓN 11: CTA FINAL */}
      <section id="cta-final" className="section-gradient">
        <div className="container text-center">
          <h2 className="cta-title">¿Listo para Digitalizar tu Salud?</h2>
          <p className="cta-subtitle">
            Únete a los 2,890 médicos que ya están usando CITAMED.VE
          </p>
          <div className="cta-buttons">
            <Button variant="primary" size="xl">Registrarme GRATIS</Button>
            <Button variant="outline" size="xl" style={{ background: 'white', color: '#0B2D4A' }}>
              Agendar Demo
            </Button>
          </div>
        </div>
      </section>

      {/* SECCIÓN 12: REGISTRO - CONECTADO AL BACKEND */}
      <section id="registro" className="section-light">
        <div className="container">
          <Card className="register-card">
            <h3 className="register-title">Únete a la Revolución de la Salud Digital</h3>
            
            {/* Mensajes de error/éxito */}
            {registerError && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                borderRadius: '8px',
                color: '#c33'
              }}>
                ⚠️ {registerError}
              </div>
            )}
            
            {registerSuccess && (
              <div style={{
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: '#efe',
                border: '1px solid #cfc',
                borderRadius: '8px',
                color: '#3c3'
              }}>
                ✅ ¡Registro exitoso! Bienvenido a CITAMED.VE
              </div>
            )}
            
            <form className="register-form" onSubmit={handleRegisterSubmit}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <RoleSelector 
                  selectedRole={registerData.selectedRoleId || ''}
                  onRoleSelect={handleRoleSelect}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fullName">Nombre Completo *</label>
                <input 
                  type="text" 
                  id="fullName"
                  name="fullName"
                  className="form-input" 
                  placeholder="Dr. Juan Pérez"
                  value={registerData.fullName}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Correo Electrónico *</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  className="form-input" 
                  placeholder="nombre@ejemplo.com"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Contraseña * (mínimo 6 caracteres)</label>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  className="form-input" 
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  minLength="6"
                  disabled={registerLoading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Número de Teléfono *</label>
                <input 
                  type="tel" 
                  id="phone"
                  name="phone"
                  className="form-input" 
                  placeholder="+58 412 1234567"
                  value={registerData.phone}
                  onChange={handleRegisterChange}
                  required
                  disabled={registerLoading}
                />
              </div>
              
              <div className="form-info">
                <strong>Para médicos y proveedores:</strong> Planes accesibles y escalables.
                <br />
                <strong>Para pacientes:</strong> Uso completamente gratuito.
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" required disabled={registerLoading} />
                  <span>Acepto los términos y condiciones</span>
                </label>
              </div>
              
              <Button 
                variant="primary" 
                size="lg" 
                fullWidth 
                type="submit"
                disabled={registerLoading || !registerData.userType}
              >
                {registerLoading ? 'Creando cuenta...' : 
                 !registerData.userType ? 'Selecciona tu rol para continuar' : 
                 'Crear Cuenta'}
              </Button>
              
              <p className="form-footer">
                <small>¿Ya tienes cuenta? <a href="#login">Iniciar sesión</a></small>
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* SECCIÓN 13: FOOTER */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h5 className="footer-title">
                <span className="brand-text">CITAMED</span>
                <span className="brand-accent">.VE</span>
              </h5>
              <p className="footer-text">
                Conectando la salud en Venezuela a través de tecnología innovadora y accesible.
              </p>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-heading">Producto</h5>
              <ul className="footer-links">
                <li><a href="#modulos">Agendamiento</a></li>
                <li><a href="#modulos">Telemedicina</a></li>
                <li><a href="#modulos">MarketMed</a></li>
                <li><a href="#modulos">Citamed Paga</a></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-heading">Empresa</h5>
              <ul className="footer-links">
                <li><a href="#blog">Blog</a></li>
                <li><a href="#prensa">Prensa</a></li>
                <li><a href="#contacto">Contacto</a></li>
              </ul>
            </div>
            
            <div className="footer-col">
              <h5 className="footer-heading">Soporte</h5>
              <ul className="footer-links">
                <li><a href="#faq">Centro de Ayuda</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#terminos">Términos</a></li>
                <li><a href="#privacidad">Privacidad</a></li>
              </ul>
            </div>
          </div>
          
          <hr className="footer-divider" />
          
          <div className="footer-bottom">
            <p>© 2025 CITAMED.VE - Revolucionando la salud en Venezuela</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="Instagram">📷</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WHATSAPP BUTTON FLOTANTE */}
      <WhatsAppButton />
    </div>
  );
}

export default App;