/**
 * ForgotPasswordPage - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Página para solicitar recuperación de contraseña
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, RefreshCw, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import Button from '../../components/common/Button/button';
import { usePasswordRecovery, RECOVERY_STEPS } from '../../hooks/usePasswordRecovery';
import toast from 'react-hot-toast';
import TurnstileWidget from '../../components/common/TurnstileWidget';

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
    verifyCode,
    resetPassword,
    validatePasswordStrength,
    reset
  } = usePasswordRecovery();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      toast.error('El código tiene 6 dígitos');
      return;
    }
    const result = await verifyCode(code);
    if (!result.valid) toast.error(result.message || 'Código incorrecto');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordStrength(newPassword).valid) {
      setPasswordError('La contraseña no cumple los requisitos');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    setPasswordError('');
    const result = await resetPassword(newPassword, confirmPassword);
    if (result.success) toast.success('Contraseña actualizada');
    else toast.error(result.message || 'Error al cambiar contraseña');
  };

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
      toast.success('Solicitud enviada. Revisa tu correo');

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
    if (step === RECOVERY_STEPS.SUCCESS) {
      return (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Listo!</h2>
          <p className="text-gray-600 mb-6">Tu contraseña se cambió. Ya puedes iniciar sesión con la nueva.</p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/login')}>
            Iniciar sesión
          </Button>
        </div>
      );
    }

    if (step === RECOVERY_STEPS.RESET) {
      return (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva contraseña</h2>
            <p className="text-gray-600 text-sm">Para <strong className="break-all">{email}</strong></p>
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">Nueva contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrengthIndicator password={newPassword} showRequirements={true} />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">Repite la contraseña</label>
            <input
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            />
          </div>
          {(passwordError || error) && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {passwordError || error}
            </p>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Cambiar contraseña'}
          </Button>
        </form>
      );
    }

    if (step === RECOVERY_STEPS.SENT || step === RECOVERY_STEPS.VERIFY) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Revisa tu correo!
          </h2>

          <p className="text-gray-600 mb-6">
            Si hay una cuenta con <strong className="break-all">{email}</strong>, te llegará un código de 6 dígitos. Escríbelo aquí o abre el enlace del correo.
          </p>
          <button
            type="button"
            onClick={() => { reset(); setCode(''); }}
            className="text-primary hover:underline text-sm -mt-4 mb-6"
          >
            ¿Escribiste mal el correo? Corrígelo
          </button>

          <form onSubmit={handleVerifyCode} className="space-y-4 mb-6 text-left">
            <label htmlFor="recovery-code" className="block text-sm font-medium text-gray-700">
              Código de verificación
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="recovery-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.4em] font-semibold focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="000000"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? 'Verificando...' : 'Verificar código'}
            </Button>
          </form>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              El código vence en 1 hora. Si no lo ves, revisa la carpeta de spam.
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

          <TurnstileWidget />

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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPasswordPage;
