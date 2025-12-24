/**
 * TwoFactorLoginModal - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Modal para verificación 2FA durante el login
 * - Solicita código de 6 dígitos
 * - Soporte para backup codes
 * - Animaciones y feedback visual
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, Key, AlertCircle, Loader2 } from 'lucide-react';
import CodeInput from '../verification/CodeInput';
import Button from '../common/button/button';

/**
 * Modal de verificación 2FA
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Function} props.onVerify - Callback con el código verificado
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.error - Mensaje de error
 */
function TwoFactorLoginModal({
  isOpen,
  onClose,
  onVerify,
  loading = false,
  error = null
}) {
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [localError, setLocalError] = useState(null);

  // Limpiar estado al cerrar
  const handleClose = useCallback(() => {
    setUseBackupCode(false);
    setBackupCode('');
    setLocalError(null);
    onClose();
  }, [onClose]);

  // Manejar código TOTP completado
  const handleCodeComplete = useCallback((code) => {
    setLocalError(null);
    onVerify(code);
  }, [onVerify]);

  // Manejar envío de backup code
  const handleBackupSubmit = useCallback((e) => {
    e.preventDefault();

    // Validar formato backup code (8 caracteres hex)
    const cleanCode = backupCode.trim().toUpperCase();
    if (!/^[A-F0-9]{8}$/.test(cleanCode)) {
      setLocalError('El código de respaldo debe tener 8 caracteres');
      return;
    }

    setLocalError(null);
    onVerify(cleanCode);
  }, [backupCode, onVerify]);

  // Alternar entre TOTP y backup code
  const toggleBackupMode = useCallback(() => {
    setUseBackupCode(!useBackupCode);
    setBackupCode('');
    setLocalError(null);
  }, [useBackupCode]);

  const displayError = error || localError;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white relative">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Shield className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Verificación en Dos Pasos</h2>
                    <p className="text-white/80 text-sm">
                      {useBackupCode
                        ? 'Ingresa tu código de respaldo'
                        : 'Ingresa el código de tu aplicación'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error message */}
                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{displayError}</span>
                  </motion.div>
                )}

                {!useBackupCode ? (
                  /* TOTP Code Input */
                  <div className="space-y-6">
                    <p className="text-center text-gray-600">
                      Abre tu aplicación de autenticación y escribe el código de 6 dígitos
                    </p>

                    <CodeInput
                      length={6}
                      onComplete={handleCodeComplete}
                      disabled={loading}
                      loading={loading}
                      error={!!displayError}
                      errorMessage={null}
                      autoFocus={true}
                    />

                    {loading && (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Verificando...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Backup Code Input */
                  <form onSubmit={handleBackupSubmit} className="space-y-6">
                    <p className="text-center text-gray-600">
                      Ingresa uno de tus códigos de respaldo de 8 caracteres
                    </p>

                    <div>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={backupCode}
                          onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                          placeholder="XXXXXXXX"
                          maxLength={8}
                          disabled={loading}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-center text-xl font-mono tracking-widest uppercase"
                          autoFocus
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Los códigos de respaldo solo se pueden usar una vez
                      </p>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={loading || backupCode.length !== 8}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Verificando...
                        </span>
                      ) : (
                        'Verificar Código de Respaldo'
                      )}
                    </Button>
                  </form>
                )}

                {/* Toggle backup mode */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={toggleBackupMode}
                    className="w-full text-center text-sm text-primary hover:underline"
                    disabled={loading}
                  >
                    {useBackupCode
                      ? 'Usar código de aplicación'
                      : '¿No tienes acceso a tu aplicación? Usa un código de respaldo'
                    }
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default TwoFactorLoginModal;
