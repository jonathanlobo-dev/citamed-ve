/**
 * CodeInput - CITAMED.VE
 * M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Componente de entrada para código de verificación de 6 dígitos
 * - 6 inputs individuales
 * - Auto-avance al siguiente
 * - Soporte para paste
 * - Estados visuales (error, éxito, cargando)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Componente CodeInput
 * @param {Object} props
 * @param {number} [props.length=6] - Número de dígitos
 * @param {Function} props.onComplete - Callback cuando se completa el código
 * @param {Function} [props.onChange] - Callback en cada cambio
 * @param {boolean} [props.disabled=false] - Deshabilitar inputs
 * @param {boolean} [props.loading=false] - Mostrar estado de carga
 * @param {boolean} [props.error=false] - Mostrar estado de error
 * @param {boolean} [props.success=false] - Mostrar estado de éxito
 * @param {boolean} [props.autoFocus=true] - Auto-focus al primer input
 * @param {string} [props.errorMessage] - Mensaje de error a mostrar
 */
function CodeInput({
  length = 6,
  onComplete,
  onChange,
  disabled = false,
  loading = false,
  error = false,
  success = false,
  autoFocus = true,
  errorMessage
}) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  // Focus en primer input al montar
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Notificar cambios
  useEffect(() => {
    const code = values.join('');
    onChange?.(code);

    if (code.length === length && !values.includes('')) {
      onComplete?.(code);
    }
  }, [values, length, onChange, onComplete]);

  // Reset al cambiar error state
  useEffect(() => {
    if (error) {
      // Shake animation se maneja con CSS
    }
  }, [error]);

  /**
   * Manejar cambio en input
   */
  const handleChange = useCallback((index, e) => {
    const value = e.target.value;

    // Solo aceptar dígitos
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    // Auto-avanzar al siguiente input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [values, length]);

  /**
   * Manejar tecla presionada
   */
  const handleKeyDown = useCallback((index, e) => {
    // Backspace - ir al anterior si está vacío
    if (e.key === 'Backspace') {
      if (!values[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
      } else {
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
      }
    }

    // Flechas izquierda/derecha
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [values, length]);

  /**
   * Manejar paste
   */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');

    // Extraer solo dígitos
    const digits = pastedData.replace(/\D/g, '').slice(0, length);

    if (digits) {
      const newValues = Array(length).fill('');
      digits.split('').forEach((digit, idx) => {
        if (idx < length) {
          newValues[idx] = digit;
        }
      });
      setValues(newValues);

      // Focus en el último dígito completado o el siguiente vacío
      const focusIndex = Math.min(digits.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }, [length]);

  /**
   * Limpiar todos los valores
   */
  const clear = useCallback(() => {
    setValues(Array(length).fill(''));
    inputRefs.current[0]?.focus();
  }, [length]);

  // Determinar clases de borde según estado
  const getBorderClass = (index) => {
    if (disabled) return 'border-gray-200 bg-gray-50';
    if (success) return 'border-green-500 bg-green-50';
    if (error) return 'border-red-500 bg-red-50';
    if (values[index]) return 'border-primary bg-primary/5';
    return 'border-gray-300 hover:border-gray-400';
  };

  return (
    <div className="space-y-3">
      {/* Container de inputs */}
      <motion.div
        className="flex justify-center gap-2 sm:gap-3"
        animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {Array(length).fill(null).map((_, index) => (
          <div key={index} className="relative">
            <input
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={values[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={disabled || loading || success}
              aria-label={`Dígito ${index + 1} de ${length}`}
              className={`
                w-10 h-12 sm:w-12 sm:h-14
                text-center text-xl sm:text-2xl font-bold
                border-2 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary/30
                transition-all duration-200
                ${getBorderClass(index)}
                ${disabled || loading || success ? 'cursor-not-allowed' : ''}
              `}
            />

            {/* Indicador de posición actual */}
            {!disabled && !loading && !success && !values[index] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-x-0 bottom-2 flex justify-center"
              >
                <div className="w-4 h-0.5 bg-gray-300 rounded" />
              </motion.div>
            )}
          </div>
        ))}
      </motion.div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Verificando...</span>
        </div>
      )}

      {/* Success message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 text-green-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">Verificado correctamente</span>
        </motion.div>
      )}

      {/* Error message */}
      {error && errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-sm text-red-600"
        >
          {errorMessage}
        </motion.p>
      )}

      {/* Exponer clear method via ref si es necesario */}
    </div>
  );
}

// Export para uso imperativo si es necesario
export { CodeInput };
export default CodeInput;
