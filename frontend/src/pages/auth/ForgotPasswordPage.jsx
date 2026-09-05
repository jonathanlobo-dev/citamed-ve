/**
 * ForgotPasswordPage - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Página para solicitar recuperación de contraseña
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import Button from '../../components/common/Button/button';
import { usePasswordRecovery, RECOVERY_STEPS } from '../../hooks/usePasswordRecovery';
import toast from 'react-hot-toast';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    step,
    loading,
    error,
    email,
    cooldown,
    canResend,
    requestReset,
    resendEmail,
    goToCodeVerification,
    reset
  } = usePasswordRecovery();

  const [inputEmail, setInputEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validar email
  const validateEmail = (value) => {
    if (!value) {
      setEmailError('El email es requerido');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('Ingresa un email válido');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Enviar solicitud
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(inputEmail)) {
      return;
    }

    const result = await requestReset(inputEmail);

    if (result.success) {
      toast.success('Te enviamos instrucciones a tu email');

      // En modo desarrollo, mostrar código
      if (result.devCode) {
        toast.success(`Código de desarrollo: ${result.devCode}`, { duration: 10000 });
      }
    } else {
      toast.error(result.message || 'Error al enviar email');
    }
  };

  // Reenviar email
  const handleResend = async () => {
    const result = await resendEmail();
    if (result.success) {
      toast.success('Email reenviado');
    }
  };

  // Renderizar según paso
  const renderContent = () => {
    if (step === RECOVERY_STEPS.SENT) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Revisa tu correo!
          </h2>

          <p className="text-gray-600 mb-6">
            Enviamos instrucciones a <strong>{email}</strong> para restablecer tu contraseña.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Nota:</strong> El enlace expira en 1 hora. Revisa tu carpeta de spam si no lo encuentras.
            </p>
          </div>

          {/* Reenviar */}
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">
              ¿No recibiste el email?
            </p>

            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || loading}
              className="w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </span>
              ) : !canResend ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reenviar en {cooldown}s
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reenviar email
                </span>
              )}
            </Button>

            <button
              onClick={goToCodeVerification}
              className="text-primary hover:underline text-sm"
            >
              Ingresar código manualmente
            </button>
          </div>

          {/* Volver */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </motion.div>
      );
    }

    // Formulario de email
    return (
      <>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-primary mb-2">
            CITAMED<span className="text-accent">.VE</span>
          </h1>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="text-gray-600">
            Ingresa tu email y te enviaremos instrucciones para restablecerla.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                emailError ? 'text-red-400' : 'text-gray-400'
              }`} />
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => {
                  setInputEmail(e.target.value);
                  if (emailError) validateEmail(e.target.value);
                }}
                onBlur={() => validateEmail(inputEmail)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                  emailError
                    ? 'border-red-300 focus:ring-red-200 bg-red-50'
                    : 'border-gray-300 focus:ring-primary'
                }`}
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
            {emailError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </motion.p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </span>
            ) : (
              'Enviar Instrucciones'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-primary font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a iniciar sesión
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
