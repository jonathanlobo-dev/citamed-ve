import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Calendar,
  Users,
  Heart,
  FileText,
  TrendingUp,
  DollarSign,
  Video,
  MessageSquare,
  Settings,
  BarChart3,
  Stethoscope,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import useDoctorProfile from '../hooks/useDoctorProfile';

function DashboardMedico() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, completeness, fetchMyProfile, fetchCompleteness } = useDoctorProfile();

  useEffect(() => {
    fetchMyProfile();
    fetchCompleteness();
  }, [fetchMyProfile, fetchCompleteness]);

  const modules = [
    {
      title: 'Estado Actual',
      icon: Activity,
      description: 'Resumen de tu jornada médica y estadísticas del día',
      path: '/medico/estado-actual',
      color: 'from-blue-500 to-blue-600',
      badge: 'En Vivo'
    },
    {
      title: 'Sala de Espera',
      icon: Clock,
      description: 'Pacientes en espera - Gestión en tiempo real',
      path: '/medico/sala-espera',
      color: 'from-purple-500 to-purple-600',
      badge: 'Tiempo Real'
    },
    {
      title: 'Mi Agenda',
      icon: Calendar,
      description: 'Calendario de consultas y disponibilidad',
      path: '/medico/agenda',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Mis Pacientes',
      icon: Users,
      description: 'Directorio completo de pacientes atendidos',
      path: '/medico/pacientes',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Fidelización',
      icon: Heart,
      description: 'Programa de seguimiento y retención de pacientes',
      path: '/medico/fidelizacion',
      color: 'from-pink-500 to-pink-600',
      badge: 'Nuevo'
    },
    {
      title: 'Historias Clínicas',
      icon: FileText,
      description: 'Acceso a historiales médicos completos',
      path: '/medico/historias-clinicas',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      title: 'Estadísticas',
      icon: TrendingUp,
      description: 'Métricas de rendimiento y análisis de consultas',
      path: '/medico/estadisticas',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Facturación',
      icon: DollarSign,
      description: 'Gestión de pagos, honorarios y reportes',
      path: '/medico/facturacion',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Telemedicina',
      icon: Video,
      description: 'Consultas virtuales por videollamada',
      path: '/modulo/telemedicina',
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Mensajería',
      icon: MessageSquare,
      description: 'Comunicación segura con pacientes',
      path: '/medico/mensajeria',
      color: 'from-teal-500 to-teal-600',
      badge: 'Seguro'
    },
    {
      title: 'Mi Perfil Médico',
      icon: Stethoscope,
      description: 'Gestiona tu perfil profesional, especialidades y credenciales',
      path: '/medico/perfil/editar',
      color: 'from-teal-500 to-teal-600',
      badge: 'Importante'
    },
    {
      title: 'Reportes',
      icon: BarChart3,
      description: 'Informes médicos y reportes estadísticos',
      path: '/medico/reportes',
      color: 'from-violet-500 to-violet-600'
    },
    {
      title: 'Configuración',
      icon: Settings,
      description: 'Ajustes de consultorio y preferencias',
      path: '/medico/configuracion',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const firstName = user?.profile?.firstName || user?.firstName || 'Doctor';
  const specialty = user?.profile?.specialty || user?.specialty || 'Medicina General';

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
            Hola, Dr. {firstName}
          </h1>
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            {specialty} • Panel Médico Profesional
          </p>
        </motion.div>

        {/* Stats Cards - Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Perfil Completo - Dato Real */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => navigate('/medico/perfil/editar')}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium">Perfil</p>
                <p className="text-3xl font-bold">{completeness?.percentage || 0}%</p>
                <p className="text-teal-100 text-xs">Completo</p>
              </div>
              {completeness?.percentage === 100 ? (
                <CheckCircle className="w-12 h-12 text-teal-200" />
              ) : (
                <AlertCircle className="w-12 h-12 text-teal-200 opacity-50" />
              )}
            </div>
          </motion.div>

          {/* Rating - Dato Real */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Rating</p>
                <p className="text-3xl font-bold">
                  {profile?.averageRating ? parseFloat(profile.averageRating).toFixed(1) : '—'}
                </p>
                <p className="text-amber-100 text-xs">
                  {profile?.totalReviews || 0} reseñas
                </p>
              </div>
              <Star className="w-12 h-12 text-amber-200" />
            </div>
          </motion.div>

          {/* Citas - Próximamente */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              Próximamente
            </div>
            <div className="flex items-center justify-between opacity-70">
              <div>
                <p className="text-gray-100 text-sm font-medium">Citas Hoy</p>
                <p className="text-3xl font-bold">—</p>
                <p className="text-gray-100 text-xs">Pacientes</p>
              </div>
              <Calendar className="w-12 h-12 text-gray-200 opacity-50" />
            </div>
          </motion.div>

          {/* Ingresos - Próximamente */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-2 right-2 bg-white/20 text-xs px-2 py-0.5 rounded-full">
              Próximamente
            </div>
            <div className="flex items-center justify-between opacity-70">
              <div>
                <p className="text-gray-100 text-sm font-medium">Ingresos</p>
                <p className="text-3xl font-bold">—</p>
                <p className="text-gray-100 text-xs">Este mes</p>
              </div>
              <DollarSign className="w-12 h-12 text-gray-200 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
                className="cursor-pointer relative"
                onClick={() => navigate(module.path)}
              >
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300 h-full">
                  {/* Badge */}
                  {module.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-2 py-1 rounded-full">
                        {module.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
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

export default DashboardMedico;
