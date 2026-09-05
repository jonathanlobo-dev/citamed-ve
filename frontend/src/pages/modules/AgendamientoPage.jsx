import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Bell, History, ArrowLeft, CheckCircle } from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import Button from '../../components/common/Button/button';

function AgendamientoPage() {
  const navigate = useNavigate();
  const features = [
    { icon: <Calendar className="w-8 h-8" />, title: 'Turnos Virtuales en Tiempo Real', description: 'Sistema inteligente que te asigna un turno virtual y te notifica cuando es tu momento de ser atendido.' },
    { icon: <Bell className="w-8 h-8" />, title: 'Notificaciones Automáticas', description: 'Recibe alertas por SMS, email y push cuando se acerque tu turno. Nunca más perderás una cita.' },
    { icon: <History className="w-8 h-8" />, title: 'Historial de Citas', description: 'Accede a todo tu historial médico, recetas previas y seguimiento de tratamientos en un solo lugar.' },
    { icon: <Clock className="w-8 h-8" />, title: 'Recordatorios Inteligentes', description: 'El sistema aprende tus patrones y te recuerda tus citas con anticipación perfecta.' }
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-br from-[#0B2D4A] via-[#1565C0] to-[#1976D2]">
        <section className="relative py-32 overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
              <div className="text-6xl mb-6">📅</div>
              <div className="inline-block px-6 py-2 rounded-full bg-green-500 text-white font-bold mb-6">ACTIVO - MÓDULO PRINCIPAL</div>
              <h1 className="text-6xl lg:text-7xl font-extrabold mb-6 text-white">Agendamiento Inteligente</h1>
              <p className="text-2xl lg:text-3xl mb-8 text-white/90 max-w-3xl mx-auto">Olvídate de las largas esperas. Sistema inteligente de turnos que te avisa cuando es tu momento.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="secondary" size="xl" className="bg-white hover:bg-gray-100 text-primary" onClick={() => navigate('/directorio')}>Buscar Médico y Agendar Cita</Button>
                <Button variant="outline" size="xl" className="bg-white/10 hover:bg-white/20 text-white border-white/30" onClick={() => navigate(-1)}>Volver al Dashboard</Button>
              </div>
            </motion.div>
          </div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        </section>
      </div>
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4"><span className="gradient-text">Características Principales</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="glass rounded-2xl p-8">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <CheckCircle className="w-20 h-20 text-primary mb-6" />
              <h2 className="text-4xl font-extrabold mb-6"><span className="gradient-text">Cómo Funciona</span></h2>
              <ol className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">1.</span><span><strong>Busca tu médico</strong> - Encuentra especialistas por nombre, especialidad o ubicación</span></li>
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">2.</span><span><strong>Solicita tu turno</strong> - El sistema te asigna un turno virtual en tiempo real</span></li>
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">3.</span><span><strong>Recibe notificaciones</strong> - Te avisamos cuando se acerque tu momento</span></li>
                <li className="flex items-start gap-3"><span className="text-primary font-bold mt-1">4.</span><span><strong>Asiste a tu cita</strong> - Sin esperas innecesarias en salas de espera</span></li>
              </ol>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-white">
              <h3 className="text-3xl font-bold mb-6">Beneficios para Médicos</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3"><span className="text-accent text-2xl">✓</span><span>Optimiza tu agenda automáticamente</span></li>
                <li className="flex items-start gap-3"><span className="text-accent text-2xl">✓</span><span>Reduce ausencias con recordatorios automáticos</span></li>
                <li className="flex items-start gap-3"><span className="text-accent text-2xl">✓</span><span>Gestiona emergencias sin caos en sala de espera</span></li>
                <li className="flex items-start gap-3"><span className="text-accent text-2xl">✓</span><span>Dashboard completo con estadísticas en tiempo real</span></li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default AgendamientoPage;
