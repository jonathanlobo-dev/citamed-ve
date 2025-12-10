import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, FileText, Settings } from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';
import Button from '../components/common/button/button';

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: 'Nueva Cita',
      description: 'Agenda una consulta médica',
      action: () => navigate('/modulo/agendamiento')
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Mis Citas',
      description: 'Ver citas programadas',
      action: () => {}
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Historial',
      description: 'Ver historial médico',
      action: () => {}
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: 'Configuración',
      description: 'Ajustes de cuenta',
      action: () => {}
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Bienvenido, {user?.name}
          </h1>
          <p className="text-gray-600 mb-8">
            Gestiona tu salud desde un solo lugar
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={action.action}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4">
                  {action.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {action.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Próximas Citas
            </h2>
            <p className="text-gray-600">
              No tienes citas programadas. 
              <Button
                variant="link"
                className="ml-2"
                onClick={() => navigate('/modulo/agendamiento')}
              >
                Agenda tu primera cita
              </Button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardPage;
