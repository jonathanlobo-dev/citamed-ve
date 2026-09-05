import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar/Navbar';
import { DollarSign, Shield, CreditCard, TrendingUp, ArrowLeft, Lock } from 'lucide-react';
import Button from '../../components/common/Button/button';

function CitamedPagaPage() {
  const navigate = useNavigate();
  const features = [
    { icon: <Shield className="w-8 h-8" />, title: 'Sistema de Escrow Seguro', description: 'El dinero se retiene de forma segura hasta que el servicio médico sea completado satisfactoriamente.' },
    { icon: <CreditCard className="w-8 h-8" />, title: 'Múltiples Pasarelas de Pago', description: 'Acepta pagos con tarjetas, transferencias, Zelle, PayPal y criptomonedas.' },
    { icon: <TrendingUp className="w-8 h-8" />, title: 'Financiamiento 0% Interés', description: 'Pacientes pueden financiar procedimientos médicos sin intereses. Médicos reciben pago completo.' },
    { icon: <DollarSign className="w-8 h-8" />, title: 'Pago Garantizado 100%', description: 'Los médicos tienen garantía de cobro una vez completado el servicio médico.' }
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-br from-[#FB8C00] via-[#F57C00] to-[#E65100] py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <div className="text-6xl mb-6">💰</div>
            <div className="inline-block px-6 py-2 rounded-full bg-primary text-white font-bold mb-6">PRÓXIMAMENTE</div>
            <h1 className="text-6xl lg:text-7xl font-extrabold mb-6 text-white">Citamed Paga</h1>
            <p className="text-2xl lg:text-3xl mb-8 text-white/90 max-w-3xl mx-auto">Sistema de escrow y financiamiento. Pago garantizado para médicos, financiamiento 0% para pacientes.</p>
            <Button variant="outline" size="xl" className="bg-white/10 hover:bg-white/20 text-white border-white/30" onClick={() => navigate('/registro')}>Únete a la Lista de Espera</Button>
          </motion.div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4"><span className="gradient-text">Seguridad Financiera Total</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="glass rounded-2xl p-8">
                <div className="text-accent mb-4">{feature.icon}</div>
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
              <Lock className="w-20 h-20 text-accent mb-6" />
              <h2 className="text-4xl font-extrabold mb-6"><span className="gradient-text">Para Médicos</span></h2>
              <p className="text-xl text-gray-600 mb-6">Recibe tu pago garantizado una vez completado el servicio. Sin riesgo de impagos, sin gestión de cobranzas.</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3"><span className="text-accent mt-1">✓</span><span>Pago garantizado al 100%</span></li>
                <li className="flex items-start gap-3"><span className="text-accent mt-1">✓</span><span>Fondos liberados automáticamente</span></li>
                <li className="flex items-start gap-3"><span className="text-accent mt-1">✓</span><span>Sin gestión de cobranzas</span></li>
              </ul>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <TrendingUp className="w-20 h-20 text-secondary mb-6" />
              <h2 className="text-4xl font-extrabold mb-6"><span className="gradient-text">Para Pacientes</span></h2>
              <p className="text-xl text-gray-600 mb-6">Financia tu tratamiento sin intereses. Paga en cuotas cómodas mientras el médico recibe el pago completo de inmediato.</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3"><span className="text-secondary mt-1">✓</span><span>Financiamiento 0% interés</span></li>
                <li className="flex items-start gap-3"><span className="text-secondary mt-1">✓</span><span>Aprobación instantánea</span></li>
                <li className="flex items-start gap-3"><span className="text-secondary mt-1">✓</span><span>Cuotas flexibles</span></li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default CitamedPagaPage;
