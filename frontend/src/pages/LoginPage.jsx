import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button/button';
import TwoFactorLoginModal from '../components/auth/TwoFactorLoginModal';
import toast from 'react-hot-toast';

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWith2FA, getDashboardPath } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Estado para 2FA
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState(null);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'El correo es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Ingresa un correo válido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'La contraseña es obligatoria';
        } else if (value.length < 6) {
          newErrors.password = 'Mínimo 6 caracteres';
        } else {
          delete newErrors.password;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailValid = validateField('email', formData.email);
    const passwordValid = validateField('password', formData.password);

    if (!emailValid || !passwordValid) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        // Verificar si requiere 2FA
        if (result.requires2FA) {
          setTempUserId(result.userId);
          setRequires2FA(true);
          setLoading(false);
          return;
        }

        const userRole = result.user.role;
        const dashboardPath = getDashboardPath(userRole);
        toast.success('¡Bienvenido de vuelta!');
        setTimeout(() => {
          navigate(dashboardPath);
        }, 1000);
      } else {
        const errorMessage = result.message || 'Error al iniciar sesión';
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error en login:', error);
      const errorMessage = error.response?.data?.message || 'Error de conexión con el servidor';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar verificación 2FA
  const handle2FAVerify = useCallback(async (code) => {
    setTwoFactorLoading(true);
    setTwoFactorError(null);

    try {
      const result = await loginWith2FA(tempUserId, code);

      if (result.success) {
        setRequires2FA(false);
        setTempUserId(null);
        const userRole = result.user.role;
        const dashboardPath = getDashboardPath(userRole);
        toast.success('¡Bienvenido de vuelta!');
        setTimeout(() => {
          navigate(dashboardPath);
        }, 1000);
      } else {
        setTwoFactorError(result.message || 'Código inválido');
      }
    } catch (error) {
      console.error('Error en 2FA:', error);
      setTwoFactorError('Error al verificar código');
    } finally {
      setTwoFactorLoading(false);
    }
  }, [tempUserId, loginWith2FA, getDashboardPath, navigate]);

  // Cerrar modal 2FA
  const handle2FAClose = useCallback(() => {
    setRequires2FA(false);
    setTempUserId(null);
    setTwoFactorError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al inicio
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary mb-2">
              CITAMED<span className="text-accent">.VE</span>
            </h1>
            <p className="text-gray-600">Iniciar Sesión</p>
          </div>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error de autenticación</p>
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.email ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.email ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.password ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center gap-1"
                >
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </motion.p>
              )}
              <div className="mt-2 text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="text-primary font-semibold hover:underline"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Modal de verificación 2FA */}
      <TwoFactorLoginModal
        isOpen={requires2FA}
        onClose={handle2FAClose}
        onVerify={handle2FAVerify}
        loading={twoFactorLoading}
        error={twoFactorError}
      />
    </div>
  );
}

export default LoginPage;
