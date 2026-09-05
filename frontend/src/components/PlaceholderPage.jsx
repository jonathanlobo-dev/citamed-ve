import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction, AlertCircle } from 'lucide-react';
import Navbar from './common/Navbar/Navbar';
import Button from './common/Button/button';

/**
 * PlaceholderPage - Componente Reutilizable
 *
 * Página profesional para módulos en desarrollo
 * Muestra un mensaje claro y permite regresar al dashboard
 *
 * Props:
 * - title: Título del módulo
 * - description: Descripción de la funcionalidad
 * - icon: Componente de icono (opcional)
 * - backPath: Ruta para el botón "Volver" (opcional, por defecto usa navigate(-1))
 * - estimatedDate: Fecha estimada de disponibilidad (opcional)
 * - features: Array de características que tendrá el módulo (opcional)
 */
function PlaceholderPage({
  title = 'Módulo en Desarrollo',
  description = 'Esta funcionalidad estará disponible próximamente',
  icon: Icon = Construction,
  backPath,
  estimatedDate,
  features = []
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center mb-6">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Icon className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-8">
              {description}
            </p>

            {/* Alert Box */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="text-left">
                  <h3 className="font-bold text-blue-900 mb-2">
                    Funcionalidad en Desarrollo
                  </h3>
                  <p className="text-blue-800 text-sm">
                    Estamos trabajando en esta función para ofrecerte la mejor experiencia posible.
                    {estimatedDate && ` Fecha estimada de lanzamiento: ${estimatedDate}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Features List */}
            {features.length > 0 && (
              <div className="text-left bg-gray-50 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-gray-900 mb-4 text-center">
                  Características que incluirá este módulo:
                </h3>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleBack}
                icon={<ArrowLeft />}
                iconPosition="left"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-gray-500 text-sm">
              Si tienes sugerencias o necesitas más información, contáctanos a{' '}
              <a href="mailto:soporte@citamed.ve" className="text-primary hover:underline font-medium">
                soporte@citamed.ve
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default PlaceholderPage;
