/**
 * ResetPasswordPage - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Página para restablecer contraseña con token
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Shield
} from 'lucide-react';
import Button from '../../components/common/Button/button';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { usePasswordRecovery, RECOVERY_STEPS } from '../../hooks/usePasswordRecovery';
import toast from 'react-hot-toast';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const {
    step,
    loading,
    error,
    email,
    tokenValid,
    verifyToken,
    resetPassword,
    validatePasswordStrength,
    reset,
    setStep
  } = usePasswordRecovery({ initialToken: tokenFromUrl });

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(true);

  // Verificar token al cargar
  useEffect(() => {
    if (tokenFromUrl) {
      setIsVerifying(true);
      verifyToken(tokenFromUrl).finally(() => {
        setIsVerifying(false);
      });
    } else {
      setIsVerifying(false);
      setStep(RECOVERY_STEPS.ERROR);
    }
  }, [tokenFromUrl, verifyToken, setStep]);

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    const passwordCheck = validatePasswordStrength(formData.newPassword);

    if (!formData.newPassword) {
      errors.newPassword = 'La contraseña es requerida';
    } else if (!passwordCheck.valid) {
      errors.newPassword = 'La contraseña no cumple los requisitos';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await resetPassword(formData.newPassword, formData.confirmPassword);

    if (result.success) {
      toast.success('Contraseña actualizada exitosamente');
    } else {
      toast.error(result.message || 'Error al cambiar contraseña');
    }
  };

  // Manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Verificando token
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando enlace...</p>
        </motion.div>
      </div>
    );
  }

  // Token inválido o error
  if (step === RECOVERY_STEPS.ERROR || tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enlace Inválido
            </h2>

            <p className="text-gray-600 mb-6">
              {error || 'El enlace de recuperación ha expirado o ya fue utilizado.'}
            </p>

            <Button
              variant="primary"
              onClick={() => navigate('/forgot-password')}
              className="w-full mb-4"
            >
              Solicitar Nuevo Enlace
            </Button>

            <button
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Éxito
  if (step === RECOVERY_STEPS.SUCCESS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Contraseña Actualizada!
            </h2>

            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>

            <Button
              variant="primary"
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Ir a Iniciar Sesión
            </Button>

            <p className="mt-4 text-xs text-gray-500">
              Serás redirigido automáticamente en 5 segundos...
            </p>

            {/* Auto-redirect */}
            {setTimeout(() => navigate('/login'), 5000) && null}
          </div>
        </motion.div>
      </div>
    );
  }

  // Formulario de nueva contraseña
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nueva Contraseña
            </h1>
            <p className="text-gray-600">
              Crea una nueva contraseña segura para tu cuenta
              {email && <span className="block text-sm font-medium mt-1">{email}</span>}
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
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  formErrors.newPassword ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    formErrors.newPassword
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.newPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.newPassword}
                </motion.p>
              )}

              {/* Indicador de fortaleza */}
              {formData.newPassword && (
                <div className="mt-3">
                  <PasswordStrengthIndicator
                    password={formData.newPassword}
                    showRequirements={true}
                  />
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  formErrors.confirmPassword ? 'text-red-400' : 'text-gray-400'
                }`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                    formErrors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200 bg-red-50'
                      : formData.confirmPassword && formData.confirmPassword === formData.newPassword
                        ? 'border-green-300 focus:ring-green-200 bg-green-50'
                        : 'border-gray-300 focus:ring-primary'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600"
                >
                  {formErrors.confirmPassword}
                </motion.p>
              )}
              {!formErrors.confirmPassword && formData.confirmPassword && formData.confirmPassword === formData.newPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-green-600 flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Las contraseñas coinciden
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || !validatePasswordStrength(formData.newPassword).valid}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Actualizando...
                </span>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ResetPasswordPage;
