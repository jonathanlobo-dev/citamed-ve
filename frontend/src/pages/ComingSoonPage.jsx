import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Home } from 'lucide-react';
import Navbar from '../components/common/Navbar/Navbar';

function ComingSoonPage() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="inline-block mb-6"
          >
            <Construction className="w-24 h-24 text-primary mx-auto" />
          </motion.div>

          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Próximamente
          </h1>

          <p className="text-gray-600 text-lg mb-2 max-w-md mx-auto">
            Esta funcionalidad está en desarrollo y estará disponible muy pronto.
          </p>

          <p className="text-gray-400 text-sm mb-8">
            Ruta: <code className="bg-gray-200 px-2 py-1 rounded">{location.pathname}</code>
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Home className="w-5 h-5" />
              Inicio
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ComingSoonPage;
