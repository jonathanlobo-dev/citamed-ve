/**
 * TwoFactorSettings - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Componente de configuración 2FA con 3 estados:
 * - initial: 2FA desactivado, botón para activar
 * - setup: Mostrando QR, esperando verificación
 * - enabled: 2FA activo, opciones de gestión
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useTwoFactor, SETUP_STATUS } from '../../hooks/useTwoFactor';
import CodeInput from '../verification/CodeInput';
import Button from '../common/Button/button';
import toast from 'react-hot-toast';

/**
 * Componente de configuración 2FA
 */
function TwoFactorSettings() {
  const {
    status,
    error,
    loading,
    twoFactorStatus,
    setupData,
    isEnabled,
    isLoading,
    isReady,
    isSuccess,
    fetchStatus,
    generateSecret,
    enable,
    disable,
    regenerateBackupCodes,
    reset
  } = useTwoFactor({ autoFetchStatus: true });

  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(true);

  // Iniciar setup de 2FA
  const handleStartSetup = useCallback(async () => {
    try {
      await generateSecret();
    } catch (err) {
      toast.error('Error al generar código QR');
    }
  }, [generateSecret]);

  // Verificar código y activar 2FA
  const handleVerifyCode = useCallback(async (code) => {
    const result = await enable(code);
    if (result.success) {
      toast.success('Autenticación de dos factores activada');
    }
  }, [enable]);

  // Desactivar 2FA
  const handleDisable = useCallback(async (e) => {
    e.preventDefault();
    const result = await disable(password);
    if (result.success) {
      setShowDisableModal(false);
      setPassword('');
      toast.success('Autenticación de dos factores desactivada');
    } else {
      toast.error(result.message || 'Error al desactivar 2FA');
    }
  }, [disable, password]);

  // Regenerar backup codes
  const handleRegenerate = useCallback(async (e) => {
    e.preventDefault();
    const result = await regenerateBackupCodes(password);
    if (result.success) {
      setShowRegenerateModal(false);
      setPassword('');
      setShowBackupCodes(true);
      toast.success('Códigos de respaldo regenerados');
    } else {
      toast.error(result.message || 'Error al regenerar códigos');
    }
  }, [regenerateBackupCodes, password]);

  // Copiar clave manual
  const handleCopyKey = useCallback(() => {
    if (setupData.manualEntryKey) {
      navigator.clipboard.writeText(setupData.manualEntryKey);
      setCopied(true);
      toast.success('Clave copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [setupData.manualEntryKey]);

  // Descargar backup codes como archivo
  const handleDownloadCodes = useCallback(() => {
    const codes = setupData.backupCodes.join('\n');
    const content = `CITAMED.VE - Códigos de Respaldo 2FA
======================================
Fecha: ${new Date().toLocaleDateString('es-VE')}

Guarda estos códigos en un lugar seguro.
Cada código solo puede usarse una vez.

${codes}

======================================
Si pierdes estos códigos y no tienes acceso
a tu aplicación de autenticación, no podrás
acceder a tu cuenta.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'citamed-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Códigos descargados');
  }, [setupData.backupCodes]);

  // Renderizar estado inicial (2FA desactivado)
  const renderInitialState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-100 rounded-xl">
          <ShieldOff className="w-8 h-8 text-gray-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Autenticación de Dos Factores
          </h3>
          <p className="text-gray-600 mt-1">
            Añade una capa extra de seguridad a tu cuenta usando una aplicación de autenticación.
          </p>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={handleStartSetup}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Activar 2FA
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Renderizar estado de setup (QR code)
  const renderSetupState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <QrCode className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Configurar Autenticación
          </h3>
          <p className="text-gray-600 text-sm">
            Escanea el código QR con tu aplicación de autenticación
          </p>
        </div>
      </div>

      {/* QR Code */}
      {setupData.qrCode && (
        <div className="flex justify-center">
          <div className="p-4 bg-white border-2 border-gray-200 rounded-xl">
            <img
              src={setupData.qrCode}
              alt="Código QR para 2FA"
              className="w-48 h-48"
            />
          </div>
        </div>
      )}

      {/* Manual Entry Key */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-2">
          ¿No puedes escanear? Ingresa esta clave manualmente:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded border border-gray-200 font-mono text-sm break-all">
            {setupData.manualEntryKey}
          </code>
          <button
            onClick={handleCopyKey}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copiar clave"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Compatible Apps */}
      <div className="text-center text-sm text-gray-500">
        Compatible con: Google Authenticator, Microsoft Authenticator, Authy
      </div>

      {/* Verification Input */}
      <div className="space-y-4">
        <p className="text-center font-medium text-gray-700">
          Ingresa el código de 6 dígitos de tu aplicación:
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <CodeInput
          length={6}
          onComplete={handleVerifyCode}
          disabled={status === SETUP_STATUS.VERIFYING}
          loading={status === SETUP_STATUS.VERIFYING}
          error={status === SETUP_STATUS.ERROR}
          autoFocus={false}
        />
      </div>

      {/* Cancel Button */}
      <div className="pt-4 border-t border-gray-100">
        <Button
          variant="outline"
          onClick={reset}
          className="w-full"
          disabled={isLoading}
        >
          Cancelar
        </Button>
      </div>
    </motion.div>
  );

  // Renderizar backup codes después de activar
  const renderBackupCodes = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl border border-green-200 shadow-sm space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">
            ¡2FA Activado Exitosamente!
          </h3>
          <p className="text-green-700 text-sm">
            Guarda estos códigos de respaldo en un lugar seguro
          </p>
        </div>
      </div>

      {/* Backup Codes */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Importante</p>
            <p className="text-sm text-amber-700">
              Estos códigos son tu único respaldo si pierdes acceso a tu aplicación de autenticación.
              Cada código solo puede usarse una vez.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
          {setupData.backupCodes.map((code, idx) => (
            <div
              key={idx}
              className="bg-white px-3 py-2 rounded border border-amber-200 text-center"
            >
              {code}
            </div>
          ))}
        </div>
      </div>

      {/* Download Button */}
      <Button
        variant="outline"
        onClick={handleDownloadCodes}
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        Descargar Códigos
      </Button>

      {/* Continue Button */}
      <Button
        variant="primary"
        onClick={() => fetchStatus()}
        className="w-full"
      >
        Continuar
      </Button>
    </motion.div>
  );

  // Renderizar estado habilitado
  const renderEnabledState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bg-white rounded-xl border border-green-200 shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-100 rounded-xl">
          <ShieldCheck className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            Autenticación de Dos Factores
          </h3>
          <p className="text-green-600 font-medium mt-1">
            Activada desde {new Date(twoFactorStatus.activatedAt).toLocaleDateString('es-VE')}
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Códigos de respaldo disponibles: {twoFactorStatus.backupCodesRemaining}
          </p>

          {/* Warning if low backup codes */}
          {twoFactorStatus.backupCodesRemaining <= 3 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">
                Te quedan pocos códigos de respaldo. Considera regenerarlos.
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRegenerateModal(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerar Códigos
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDisableModal(true)}
            >
              <ShieldOff className="w-4 h-4 mr-2" />
              Desactivar 2FA
            </Button>
          </div>
        </div>
      </div>

      {/* Disable Modal */}
      <AnimatePresence>
        {showDisableModal && (
          <PasswordModal
            title="Desactivar 2FA"
            description="Ingresa tu contraseña para desactivar la autenticación de dos factores"
            confirmText="Desactivar"
            confirmVariant="danger"
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSubmit={handleDisable}
            onClose={() => {
              setShowDisableModal(false);
              setPassword('');
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Regenerate Modal */}
      <AnimatePresence>
        {showRegenerateModal && (
          <PasswordModal
            title="Regenerar Códigos de Respaldo"
            description="Esto invalidará tus códigos de respaldo actuales. Ingresa tu contraseña para continuar."
            confirmText="Regenerar Códigos"
            confirmVariant="primary"
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            onSubmit={handleRegenerate}
            onClose={() => {
              setShowRegenerateModal(false);
              setPassword('');
            }}
            loading={loading}
          />
        )}
      </AnimatePresence>

      {/* Show new backup codes after regeneration */}
      {setupData.backupCodes.length > 0 && showBackupCodes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Nuevos Códigos de Respaldo</h4>
            <button
              onClick={() => setShowBackupCodes(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {setupData.backupCodes.map((code, idx) => (
              <div
                key={idx}
                className="bg-white px-3 py-2 rounded border border-gray-200 text-center"
              >
                {code}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCodes}
            className="w-full mt-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Códigos
          </Button>
        </motion.div>
      )}
    </motion.div>
  );

  // Render principal
  if (loading && status === SETUP_STATUS.IDLE) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Cargando...</span>
      </div>
    );
  }

  if (isSuccess && setupData.backupCodes.length > 0) {
    return renderBackupCodes();
  }

  if (isEnabled) {
    return renderEnabledState();
  }

  if (isReady || status === SETUP_STATUS.VERIFYING || status === SETUP_STATUS.ERROR) {
    return renderSetupState();
  }

  return renderInitialState();
}

/**
 * Modal de contraseña para acciones sensibles
 */
function PasswordModal({
  title,
  description,
  confirmText,
  confirmVariant = 'primary',
  password,
  setPassword,
  showPassword,
  setShowPassword,
  onSubmit,
  onClose,
  loading
}) {
  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4"
      >
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Lock className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
                type="button"
              >
                Cancelar
              </Button>
              <Button
                variant={confirmVariant}
                type="submit"
                className="flex-1"
                disabled={loading || !password}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  confirmText
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
}

export default TwoFactorSettings;
