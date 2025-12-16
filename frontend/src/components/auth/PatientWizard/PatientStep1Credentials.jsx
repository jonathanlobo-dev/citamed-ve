/**
 * PatientStep1Credentials - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 1: Credenciales de acceso
 * - Email (con verificación de disponibilidad)
 * - Password (con indicador de fortaleza)
 * - Confirmar password
 * - Aceptar términos
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { debounce } from 'lodash';
import authService from '../../../services/authService';

/**
 * Evalúa la fortaleza de la contraseña
 * @param {string} password
 * @returns {{ score: number, label: string, color: string }}
 */
function evaluatePasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Débil', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Media', color: 'bg-yellow-500' };
  return { score, label: 'Fuerte', color: 'bg-green-500' };
}

/**
 * Componente Paso 1: Credenciales
 */
function PatientStep1Credentials({ formData, updateField, errors, setFieldErrors, onNext }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(null);

  // Verificar disponibilidad de email con debounce
  const checkEmailAvailability = useCallback(
    debounce(async (email) => {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailAvailable(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const response = await authService.checkEmail(email);
        setEmailAvailable(response.data.available);
        if (!response.data.available) {
          setFieldErrors({ ...errors, email: 'Este email ya está registrado' });
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 500),
    [errors, setFieldErrors]
  );

  // Manejar cambio de email
  const handleEmailChange = (e) => {
    const email = e.target.value;
    updateField('email', email);
    setEmailAvailable(null);
    checkEmailAvailability(email);
  };

  // Validar paso actual
  const validateStep = () => {
    const newErrors = {};

    // Email
    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email no es válido';
    } else if (emailAvailable === false) {
      newErrors.email = 'Este email ya está registrado';
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Contraseña debe tener mínimo 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe contener mayúscula, minúscula y número';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Debe confirmar la contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Accept terms
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Debe aceptar los términos y condiciones';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar siguiente paso
  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const passwordStrength = formData.password ? evaluatePasswordStrength(formData.password) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Crea tu cuenta</h2>
        <p className="text-gray-600 mt-2">
          Ingresa tus credenciales de acceso
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.email || ''}
            onChange={handleEmailChange}
            className={`
              w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.email
                ? 'border-red-500 focus:ring-red-200'
                : emailAvailable === true
                  ? 'border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }
            `}
            placeholder="tu@email.com"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingEmail && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
            {!checkingEmail && emailAvailable === true && (
              <Check className="h-5 w-5 text-green-500" />
            )}
            {!checkingEmail && emailAvailable === false && (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={formData.password || ''}
            onChange={(e) => updateField('password', e.target.value)}
            className={`
              w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.password
                ? 'border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }
            `}
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Password strength indicator */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded ${
                    i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${
              passwordStrength.score <= 2 ? 'text-red-600' :
              passwordStrength.score <= 4 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              Fortaleza: {passwordStrength.label}
            </p>
          </div>
        )}

        {errors.password && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.password}
          </p>
        )}

        <p className="mt-1 text-xs text-gray-500">
          Debe contener mayúscula, minúscula y número
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword || ''}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            className={`
              w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.confirmPassword
                ? 'border-red-500 focus:ring-red-200'
                : formData.confirmPassword && formData.password === formData.confirmPassword
                  ? 'border-green-500 focus:ring-green-200'
                  : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
              }
            `}
            placeholder="Repite tu contraseña"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
            <Check className="h-4 w-4" />
            Las contraseñas coinciden
          </p>
        )}
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Accept Terms */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptTerms || false}
            onChange={(e) => updateField('acceptTerms', e.target.checked)}
            className="mt-1 h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-600">
            Acepto los{' '}
            <a href="/terminos" className="text-primary hover:underline" target="_blank">
              Términos y Condiciones
            </a>{' '}
            y la{' '}
            <a href="/privacidad" className="text-primary hover:underline" target="_blank">
              Política de Privacidad
            </a>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.acceptTerms}
          </p>
        )}
      </div>

      {/* Next Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleNext}
          disabled={checkingEmail}
          className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          Continuar
        </button>
      </div>
    </motion.div>
  );
}

export default PatientStep1Credentials;
