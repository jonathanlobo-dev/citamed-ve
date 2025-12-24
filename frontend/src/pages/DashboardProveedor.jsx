import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Settings,
  Building2
} from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';

function DashboardProveedor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const modules = [
    {
      title: 'Mi Empresa',
      icon: Building2,
      description: 'Perfil completo de tu empresa y datos',
      path: '/proveedor/mi-empresa',
      color: 'from-teal-500 to-teal-600',
      badge: 'Nuevo'
    },
    {
      title: 'Mi Catálogo',
      icon: Package,
      description: 'Gestión de productos y servicios médicos',
      path: '/proveedor/catalogo',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Pedidos',
      icon: ShoppingCart,
      description: 'Órdenes recibidas y gestión de entregas',
      path: '/proveedor/pedidos',
      color: 'from-green-500 to-green-600',
      badge: 'Nuevos'
    },
    {
      title: 'Estadísticas de Ventas',
      icon: TrendingUp,
      description: 'Métricas de rendimiento y análisis de ventas',
      path: '/proveedor/estadisticas',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Clientes',
      icon: Users,
      description: 'Directorio de médicos y pacientes compradores',
      path: '/proveedor/clientes',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Configuración',
      icon: Settings,
      description: 'Ajustes de empresa y preferencias',
      path: '/proveedor/configuracion',
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const firstName = user?.name?.split(' ')[0] || user?.firstName || 'Proveedor';
  const companyName = user?.profile?.companyName || user?.companyName || 'Su Empresa';
  const providerType = user?.profile?.providerType || user?.providerType || 'Proveedor Médico';

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
          <p className="text-gray-600 text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {companyName} • {providerType}
          </p>
        </motion.div>

        {/* Stats Cards - Quick Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Productos</p>
                <p className="text-3xl font-bold">0</p>
                <p className="text-blue-100 text-xs">En catálogo</p>
              </div>
              <Package className="w-12 h-12 text-blue-200 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Pedidos</p>
                <p className="text-3xl font-bold">0</p>
                <p className="text-green-100 text-xs">Pendientes</p>
              </div>
              <ShoppingCart className="w-12 h-12 text-green-200 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Ventas</p>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-orange-100 text-xs">Este mes</p>
              </div>
              <TrendingUp className="w-12 h-12 text-orange-200 opacity-50" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Clientes</p>
                <p className="text-3xl font-bold">0</p>
                <p className="text-purple-100 text-xs">Activos</p>
              </div>
              <Users className="w-12 h-12 text-purple-200 opacity-50" />
            </div>
          </motion.div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
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

export default DashboardProveedor;
