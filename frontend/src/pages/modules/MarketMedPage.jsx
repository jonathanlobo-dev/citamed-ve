import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../../components/common/Navbar/Navbar';
import { ShoppingCart, FileText, Building2, Percent, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/button/button';

function MarketMedPage() {
  const navigate = useNavigate();
  const features = [
    { icon: <FileText className="w-8 h-8" />, title: 'Recetas Digitales Verificadas', description: 'Sistema de recetas electrónicas con firma digital del médico y verificación en farmacias.' },
    { icon: <FileText className="w-8 h-8" />, title: 'Órdenes de Laboratorio', description: 'Envía órdenes médicas directamente a laboratorios certificados de la red.' },
    { icon: <Building2 className="w-8 h-8" />, title: 'Red de Farmacias Certificadas', description: 'Accede a una red nacional de farmacias verificadas con precios competitivos.' },
    { icon: <Percent className="w-8 h-8" />, title: 'Sistema de Referidos 3%', description: 'Los médicos ganan 3% de comisión por cada compra generada desde sus recetas.' }
  ];
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="bg-gradient-to-br from-[#00BFA6] via-[#0B2D4A] to-[#0B2D4A] py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <div className="text-6xl mb-6">🛒</div>
            <div className="inline-block px-6 py-2 rounded-full bg-accent text-white font-bold mb-6">PRÓXIMAMENTE</div>
            <h1 className="text-6xl lg:text-7xl font-extrabold mb-6 text-white">MarketMed</h1>
            <p className="text-2xl lg:text-3xl mb-8 text-white/90 max-w-3xl mx-auto">Marketplace médico completo. Farmacias, laboratorios e insumos. Médicos ganan 3% por referido.</p>
            <Button variant="outline" size="xl" className="bg-white/10 hover:bg-white/20 text-white border-white/30" onClick={() => navigate('/registro')}>Únete a la Lista de Espera</Button>
          </motion.div>
        </div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      </div>
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-5xl font-extrabold mb-4"><span className="gradient-text">Un Ecosistema Completo</span></h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="glass rounded-2xl p-8">
                <div className="text-secondary mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
            <ShoppingCart className="w-20 h-20 text-secondary mx-auto mb-6" />
            <h2 className="text-4xl font-extrabold mb-6"><span className="gradient-text">Beneficios para Médicos</span></h2>
            <p className="text-xl text-gray-600 mb-8">Genera ingresos pasivos con el sistema de referidos del 3%. Cada receta que emites puede convertirse en una fuente adicional de ingresos.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
export default MarketMedPage;
