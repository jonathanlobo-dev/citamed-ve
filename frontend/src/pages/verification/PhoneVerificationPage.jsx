/**
 * PhoneVerificationPage - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Página de verificación de teléfono (SMS)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, SkipForward, Edit2 } from 'lucide-react';
import { VerificationCard } from '../../components/verification';
import { useAuth } from '../../context/AuthContext';

function PhoneVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  // Obtener datos de params o del contexto
  const userId = searchParams.get('userId') || user?.id;
  const initialPhone = searchParams.get('phone') || user?.phone || '';
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  // Inicializar teléfono
  useEffect(() => {
    if (initialPhone) {
      setPhoneNumber(initialPhone);
    } else {
      setEditingPhone(true); // Si no hay teléfono, mostrar input
    }
  }, [initialPhone]);

  // Verificar si ya está verificado
  useEffect(() => {
    if (user?.phoneVerified) {
      navigate(returnTo);
    }
  }, [user, navigate, returnTo]);

  // Validar formato de teléfono venezolano
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    // Formato: 04XX-XXXXXXX o +58 4XX-XXXXXXX
    const regex = /^(0?4[0-9]{2}[0-9]{7}|58[4][0-9]{2}[0-9]{7})$/;
    return regex.test(cleaned);
  };

  // Formatear teléfono para mostrar
  const formatPhoneDisplay = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }
    if (cleaned.length === 10 && cleaned.startsWith('4')) {
      return `0${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return phone;
  };

  // Si no hay userId, redirigir
  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sesión no encontrada
          </h2>
          <p className="text-gray-600 mb-6">
            Por favor inicia sesión nuevamente.
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
   * Manejar confirmación de número de teléfono
   */
  const handlePhoneConfirm = () => {
    if (!validatePhone(phoneNumber)) {
      setPhoneError('Ingresa un número de teléfono válido (ej: 0414-1234567)');
      return;
    }
    setPhoneError('');
    setEditingPhone(false);
  };

  /**
   * Manejar verificación exitosa
   */
  const handleSuccess = async () => {
    if (refreshUser) {
      await refreshUser();
    }

    setTimeout(() => {
      navigate(returnTo);
    }, 1500);
  };

  /**
   * Manejar "omitir"
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

      {/* Phone Input or Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {editingPhone ? (
          // Phone number input form
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verifica tu teléfono
              </h2>
              <p className="text-gray-600">
                Ingresa tu número de teléfono para recibir un código por SMS
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setPhoneError('');
                    }}
                    placeholder="0414-1234567"
                    className={`
                      w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                      ${phoneError
                        ? 'border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }
                    `}
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-red-600">{phoneError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Formato: 0414-1234567 o +58-414-1234567
                </p>
              </div>

              <button
                onClick={handlePhoneConfirm}
                className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg
                         hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                         transition-colors duration-200"
              >
                Continuar
              </button>
            </div>
          </div>
        ) : (
          // Verification card with confirmed phone
          <div>
            <VerificationCard
              type="phone"
              userId={parseInt(userId)}
              phoneNumber={phoneNumber}
              onSuccess={handleSuccess}
              autoSend={true}
            />

            {/* Edit phone number */}
            <div className="max-w-md mx-auto mt-4 text-center">
              <button
                onClick={() => setEditingPhone(true)}
                className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 mx-auto transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Cambiar número ({formatPhoneDisplay(phoneNumber)})
              </button>
            </div>
          </div>
        )}
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
          La verificación de teléfono es opcional
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
              ¿Omitir verificación de teléfono?
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Sin verificar tu teléfono, no recibirás recordatorios de citas por SMS.
              Puedes verificarlo más tarde desde tu perfil.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSkip}
                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default PhoneVerificationPage;
