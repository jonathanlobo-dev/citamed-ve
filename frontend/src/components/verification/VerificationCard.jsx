/**
 * VerificationCard - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Componente reutilizable para verificación de email o teléfono
 * Incluye: envío de código, entrada de código, reenvío con cooldown
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield
} from 'lucide-react';
import CodeInput from './CodeInput';
import { useVerification, VERIFICATION_STATUS } from '../../hooks/useVerification';

/**
 * VerificationCard Component
 * @param {Object} props
 * @param {string} props.type - 'email' o 'phone'
 * @param {number} props.userId - ID del usuario
 * @param {string} [props.email] - Email del usuario (para mostrar)
 * @param {string} [props.phoneNumber] - Número de teléfono
 * @param {Function} [props.onSuccess] - Callback al verificar exitosamente
 * @param {Function} [props.onBack] - Callback para volver atrás
 * @param {boolean} [props.autoSend=false] - Enviar código automáticamente al montar
 */
function VerificationCard({
  type = 'email',
  userId,
  email,
  phoneNumber,
  onSuccess,
  onBack,
  autoSend = false
}) {
  const [codeValue, setCodeValue] = useState('');

  const {
    status,
    error,
    attemptsRemaining,
    isIdle,
    isSending,
    isSent,
    isVerifying,
    isVerified,
    cooldown,
    sendCode,
    verifyCode,
    resendCode
  } = useVerification({
    type,
    userId,
    phoneNumber,
    onSuccess: (response) => {
      onSuccess?.(response);
    }
  });

  // Auto-enviar código al montar si está configurado
  useEffect(() => {
    if (autoSend && isIdle && userId) {
      sendCode();
    }
  }, [autoSend, isIdle, userId, sendCode]);

  // Config por tipo
  const config = {
    email: {
      icon: Mail,
      title: 'Verifica tu correo',
      subtitle: email ? `Enviamos un código a ${email}` : 'Te enviaremos un código de verificación',
      sendButtonText: 'Enviar código',
      successTitle: 'Correo verificado',
      successMessage: 'Tu dirección de correo ha sido verificada correctamente.'
    },
    phone: {
      icon: Phone,
      title: 'Verifica tu teléfono',
      subtitle: phoneNumber ? `Enviamos un SMS a ${phoneNumber}` : 'Te enviaremos un SMS con el código',
      sendButtonText: 'Enviar SMS',
      successTitle: 'Teléfono verificado',
      successMessage: 'Tu número de teléfono ha sido verificado correctamente.'
    }
  };

  const { icon: Icon, title, subtitle, sendButtonText, successTitle, successMessage } = config[type];

  /**
   * Manejar envío inicial de código
   */
  const handleSendCode = async () => {
    await sendCode();
  };

  /**
   * Manejar código completo
   */
  const handleCodeComplete = async (code) => {
    await verifyCode(code);
  };

  /**
   * Manejar reenvío
   */
  const handleResend = async () => {
    setCodeValue('');
    await resendCode();
  };

  // Renderizar estado de éxito
  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </motion.div>

          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {successTitle}
          </h2>
          <p className="text-gray-600 mb-6">
            {successMessage}
          </p>

          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-primary text-white font-semibold rounded-lg
                       hover:bg-primary/90 transition-colors"
            >
              Continuar
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {title}
        </h2>
        <p className="text-gray-600">
          {isSent ? subtitle : (type === 'email' ? 'Verificaremos tu correo electrónico' : 'Verificaremos tu número de teléfono')}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Estado inicial - Botón para enviar código */}
        {isIdle && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {type === 'email'
                  ? 'Te enviaremos un código de 6 dígitos a tu correo electrónico para confirmar tu identidad.'
                  : 'Te enviaremos un código de 6 dígitos por SMS para confirmar tu número de teléfono.'}
              </p>
            </div>

            <button
              onClick={handleSendCode}
              disabled={isSending}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg
                       hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                sendButtonText
              )}
            </button>
          </motion.div>
        )}

        {/* Estado enviando */}
        {isSending && (
          <motion.div
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">
              {type === 'email' ? 'Enviando correo...' : 'Enviando SMS...'}
            </p>
          </motion.div>
        )}

        {/* Estado código enviado - Entrada de código */}
        {isSent && (
          <motion.div
            key="sent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Código input */}
            <CodeInput
              length={6}
              onComplete={handleCodeComplete}
              onChange={setCodeValue}
              loading={isVerifying}
              error={!!error}
              errorMessage={error}
              disabled={isVerifying}
            />

            {/* Intentos restantes */}
            {attemptsRemaining !== null && attemptsRemaining <= 3 && (
              <p className="text-center text-sm text-amber-600">
                {attemptsRemaining} {attemptsRemaining === 1 ? 'intento restante' : 'intentos restantes'}
              </p>
            )}

            {/* Botón de reenvío */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">
                ¿No recibiste el código?
              </p>

              {cooldown.isActive ? (
                <p className="text-sm text-gray-400">
                  Reenviar en <span className="font-mono font-bold text-primary">{cooldown.formattedTime}</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80
                           font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reenviar código
                </button>
              )}
            </div>

            {/* Nota sobre código en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-50 rounded-lg p-3 mt-4">
                <p className="text-xs text-yellow-800 text-center">
                  <strong>Modo desarrollo:</strong> Usa el código <span className="font-mono font-bold">123456</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error global */}
      {error && isIdle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Botón volver */}
      {onBack && !isVerified && (
        <button
          onClick={onBack}
          className="mt-6 w-full py-2 text-gray-600 hover:text-gray-800
                   flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      )}
    </motion.div>
  );
}

export default VerificationCard;
