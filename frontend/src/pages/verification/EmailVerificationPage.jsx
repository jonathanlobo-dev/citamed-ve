/**
 * EmailVerificationPage - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Página de verificación de email después del registro
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, SkipForward } from 'lucide-react';
import { VerificationCard } from '../../components/verification';
import { useAuth } from '../../context/AuthContext';

function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Obtener userId de params o del contexto de auth
  const userId = searchParams.get('userId') || user?.id;
  const email = searchParams.get('email') || user?.email;
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Verificar si ya está verificado
  useEffect(() => {
    if (user?.emailVerified) {
      navigate(returnTo);
    }
  }, [user, navigate, returnTo]);

  // Si no hay userId, redirigir a login
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sesión no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            No pudimos identificar tu cuenta. Por favor inicia sesión nuevamente.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  /**
   * Manejar verificación exitosa
   */
  const handleSuccess = async () => {
    // Refrescar datos del usuario
    if (refreshUser) {
      await refreshUser();
    }

    // Pequeño delay para mostrar mensaje de éxito
    setTimeout(() => {
      // Verificar si debe ir a verificación de teléfono
      const needsPhoneVerification = searchParams.get('verifyPhone') === 'true';

      if (needsPhoneVerification) {
        navigate(`/verificar/telefono?returnTo=${encodeURIComponent(returnTo)}`);
      } else {
        navigate(returnTo);
      }
    }, 1500);
  };

  /**
   * Manejar "omitir por ahora"
   */
  const handleSkip = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = () => {
    navigate(returnTo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-8 px-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
      </div>

      {/* Verification Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <VerificationCard
          type="email"
          userId={parseInt(userId)}
          email={email}
          onSuccess={handleSuccess}
          autoSend={true}
        />
      </motion.div>

      {/* Skip option */}
      <div className="max-w-md mx-auto mt-6 text-center">
        <button
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mx-auto transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Omitir por ahora
        </button>
        <p className="text-xs text-gray-400 mt-2">
          Podrás verificar tu correo más tarde desde tu perfil
        </p>
      </div>

      {/* Skip Confirmation Modal */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              ¿Omitir verificación?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Sin verificar tu correo, no podrás:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Recuperar tu contraseña
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Recibir confirmaciones de citas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                Acceder a todas las funciones
              </li>
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Omitir
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default EmailVerificationPage;
