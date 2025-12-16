/**
 * ProviderStep5Confirmation - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 5: Confirmación
 * - Resumen de todos los datos
 * - Checkbox de confirmación
 * - Envío final
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Building2, FileText, User, Phone, Tag, Package,
  MapPin, Globe, Store, Check, Edit2, Loader2, AlertCircle
} from 'lucide-react';

function SummaryField({ icon: Icon, label, value, iconColor = 'text-gray-400' }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

function ProviderStep5Confirmation({
  formData,
  errors,
  setFieldErrors,
  onPrev,
  onSubmit,
  isSubmitting,
  goToStep
}) {
  const [confirmInfo, setConfirmInfo] = useState(false);

  const handleSubmit = async () => {
    if (!confirmInfo) {
      setFieldErrors({ confirmInfo: 'Debe confirmar que la información es correcta' });
      return;
    }
    setFieldErrors({});
    await onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Confirma tus datos</h2>
        <p className="text-gray-600 mt-2">Revisa que toda la información sea correcta</p>
      </div>

      {/* Sección: Credenciales */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Credenciales</h3>
          <button type="button" onClick={() => goToStep(1)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4">
          <SummaryField icon={Mail} label="Correo electrónico" value={formData.email} iconColor="text-blue-500" />
        </div>
      </div>

      {/* Sección: Datos de la empresa */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Datos de la empresa</h3>
          <button type="button" onClick={() => goToStep(2)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryField icon={Building2} label="Nombre comercial" value={formData.companyName} iconColor="text-orange-500" />
          <SummaryField icon={FileText} label="RIF" value={formData.rif} iconColor="text-purple-500" />
          <SummaryField icon={Building2} label="Razón social" value={formData.legalName} />
          <SummaryField icon={User} label="Representante legal" value={formData.legalRepresentative} />
          <SummaryField icon={Phone} label="Teléfono comercial" value={formData.commercialPhone} iconColor="text-green-500" />
          <SummaryField icon={Mail} label="Email de contacto" value={formData.contactEmail} iconColor="text-blue-500" />
        </div>
      </div>

      {/* Sección: Categoría y servicios */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Categoría y servicios</h3>
          <button type="button" onClick={() => goToStep(3)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 space-y-4">
          <SummaryField icon={Tag} label="Tipo de proveedor" value={formData.providerType} iconColor="text-orange-500" />
          {formData.description && (
            <SummaryField icon={FileText} label="Descripción" value={formData.description} />
          )}
          {formData.mainProducts && (
            <SummaryField icon={Package} label="Productos/servicios principales" value={formData.mainProducts} iconColor="text-teal-500" />
          )}
        </div>
      </div>

      {/* Sección: Ubicación */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Ubicación y cobertura</h3>
          <button type="button" onClick={() => goToStep(4)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 space-y-4">
          <SummaryField icon={MapPin} label="Dirección principal" value={formData.mainAddress} iconColor="text-red-500" />
          <div className="grid grid-cols-2 gap-4">
            <SummaryField icon={Building2} label="Ciudad" value={formData.city} />
            <SummaryField icon={MapPin} label="Estado" value={formData.state} />
          </div>
          {formData.coverageZones && (
            <SummaryField icon={Globe} label="Zonas de cobertura" value={formData.coverageZones} iconColor="text-blue-500" />
          )}
          {formData.hasMultipleLocations && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Store className="h-4 w-4 text-primary" />
              <span>{formData.locationCount || 'Varias'} sedes/sucursales</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmación */}
      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmInfo}
            onChange={(e) => {
              setConfirmInfo(e.target.checked);
              if (e.target.checked) setFieldErrors({});
            }}
            className="mt-1 h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            Confirmo que toda la información proporcionada es correcta y verdadera.
            Entiendo que mi cuenta quedará en estado de <strong>revisión</strong> hasta que el equipo
            de CITAMED.VE verifique la documentación de mi empresa (RIF, permisos sanitarios, etc.).
          </span>
        </label>
        {errors.confirmInfo && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.confirmInfo}
          </p>
        )}
      </div>

      {/* Error de envío */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {errors.submit}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-4 flex gap-4">
        <button type="button" onClick={onPrev} disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Anterior
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting || !confirmInfo}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Registrando...</>
          ) : (
            <><Check className="h-5 w-5" /> Completar registro</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default ProviderStep5Confirmation;
