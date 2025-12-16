/**
 * ProviderStep4Location - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 4: Ubicación y cobertura
 * - Dirección principal
 * - Ciudad y Estado
 * - Zonas de cobertura
 * - Múltiples sedes
 */

import { motion } from 'framer-motion';
import { MapPin, Building2, Globe, Store, AlertCircle } from 'lucide-react';

const VENEZUELAN_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
  'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

function ProviderStep4Location({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  const validateStep = () => {
    const newErrors = {};

    // Dirección principal
    if (!formData.mainAddress?.trim()) {
      newErrors.mainAddress = 'Dirección principal es requerida';
    } else if (formData.mainAddress.trim().length < 10) {
      newErrors.mainAddress = 'Dirección muy corta';
    }

    // Ciudad
    if (!formData.city?.trim()) {
      newErrors.city = 'Ciudad es requerida';
    }

    // Estado
    if (!formData.state) {
      newErrors.state = 'Estado es requerido';
    }

    // Si tiene múltiples sedes, validar cantidad
    if (formData.hasMultipleLocations && formData.locationCount) {
      const count = parseInt(formData.locationCount);
      if (isNaN(count) || count < 1 || count > 1000) {
        newErrors.locationCount = 'Cantidad de sedes debe ser entre 1 y 1000';
      }
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Ubicación y cobertura</h2>
        <p className="text-gray-600 mt-2">Dónde encontrarte y zonas de servicio</p>
      </div>

      {/* Dirección principal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Dirección principal <span className="text-red-500">*</span>
          </span>
        </label>
        <textarea
          value={formData.mainAddress || ''}
          onChange={(e) => updateField('mainAddress', e.target.value)}
          rows={2}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.mainAddress ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          placeholder="Av. Principal, Centro Comercial XYZ, Local 15, Piso 1"
        />
        {errors.mainAddress && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.mainAddress}
          </p>
        )}
      </div>

      {/* Ciudad y Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ciudad <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.city ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="Caracas"
            />
          </div>
          {errors.city && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.city}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.state || ''}
            onChange={(e) => updateField('state', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 appearance-none
              ${errors.state ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          >
            <option value="">Seleccionar estado...</option>
            {VENEZUELAN_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          {errors.state && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.state}
            </p>
          )}
        </div>
      </div>

      {/* Zonas de cobertura */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Zonas de cobertura
            <span className="text-gray-400">(opcional)</span>
          </span>
        </label>
        <textarea
          value={formData.coverageZones || ''}
          onChange={(e) => updateField('coverageZones', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Ej: Gran Caracas, Valles del Tuy, Los Teques..."
        />
        <p className="mt-1 text-xs text-gray-500">
          Áreas geográficas donde ofrece sus servicios o realiza entregas
        </p>
      </div>

      {/* Múltiples sedes */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.hasMultipleLocations || false}
            onChange={(e) => {
              updateField('hasMultipleLocations', e.target.checked);
              if (!e.target.checked) {
                updateField('locationCount', '');
              }
            }}
            className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="flex items-center gap-2 text-gray-700">
            <Store className="h-5 w-5 text-primary" />
            Tenemos múltiples sedes o sucursales
          </span>
        </label>

        {formData.hasMultipleLocations && (
          <div className="ml-8">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad de sedes
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.locationCount || ''}
              onChange={(e) => updateField('locationCount', e.target.value)}
              className={`w-full max-w-xs px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                ${errors.locationCount ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="Número de sedes"
            />
            {errors.locationCount && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" /> {errors.locationCount}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Podrá agregar las direcciones de cada sede después del registro
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="pt-4 flex gap-4">
        <button type="button" onClick={onPrev}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 transition-colors">
          Anterior
        </button>
        <button type="button" onClick={handleNext}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 transition-colors">
          Continuar
        </button>
      </div>
    </motion.div>
  );
}

export default ProviderStep4Location;
