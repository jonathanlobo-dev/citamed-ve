import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  FileText,
  Activity,
  Pill,
  ShoppingCart,
  DollarSign,
  Video,
  User,
  Search
} from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';

function DashboardPaciente() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      title: 'Buscar Médicos',
      icon: Search,
      description: 'Encuentra especialistas y consulta sus perfiles',
      path: '/directorio',
      color: 'from-teal-500 to-teal-600'
    },
    {
      title: 'Agendar Nueva Cita',
      icon: Calendar,
      description: 'Reserva tu próxima consulta médica',
      path: '/modulo/agendamiento',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Sala de Espera Virtual',
      icon: Clock,
      description: 'Visualiza tu turno en tiempo real con "Las Sillitas"',
      path: '/paciente/sala-espera',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Mis Citas',
      icon: FileText,
      description: 'Historial y próximas citas médicas',
      path: '/paciente/mis-citas',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Mi Historia Clínica',
      icon: Activity,
      description: 'Accede a tu historia médica completa',
      path: '/paciente/historia-clinica',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Mis Recetas',
      icon: Pill,
      description: 'Recetas médicas y prescripciones',
      path: '/paciente/recetas',
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'MARKETMED',
      icon: ShoppingCart,
      description: 'Compra medicamentos y productos de salud',
      path: '/modulo/marketmed',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Citamed Paga',
      icon: DollarSign,
      description: 'Gestiona tus pagos y facturación',
      path: '/modulo/citamed-paga',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Telemedicina',
      icon: Video,
      description: 'Consultas médicas por videollamada',
      path: '/modulo/telemedicina',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Mi Perfil',
      icon: User,
      description: 'Actualiza tu información personal',
      path: '/paciente/perfil',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const firstName = user?.profile?.firstName || user?.firstName || 'Usuario';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-primary mb-2">
            Hola, {firstName}
          </h1>
          <p className="text-gray-600 text-lg">
            Bienvenido a tu panel de paciente
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="cursor-pointer"
                onClick={() => navigate(module.path)}
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {module.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DashboardPaciente;
