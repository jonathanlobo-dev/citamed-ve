/**
 * ProviderStep3Services - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 3: Categoría y servicios
 * - Tipo de proveedor
 * - Descripción
 * - Productos/servicios principales
 */

import { motion } from 'framer-motion';
import { Tag, FileText, Package, AlertCircle } from 'lucide-react';

const PROVIDER_TYPES = [
  { value: 'Farmacia', icon: '💊', description: 'Venta de medicamentos y productos de salud' },
  { value: 'Laboratorio clínico', icon: '🔬', description: 'Análisis clínicos y pruebas de laboratorio' },
  { value: 'Insumos médicos', icon: '🩺', description: 'Equipos e insumos para uso médico' },
  { value: 'Servicios de salud', icon: '🏥', description: 'Servicios de atención médica especializados' },
  { value: 'Clínica', icon: '🏨', description: 'Centro de atención médica ambulatoria' },
  { value: 'Hospital', icon: '🏥', description: 'Centro de atención médica con hospitalización' },
  { value: 'Centro de Diagnóstico', icon: '📋', description: 'Diagnóstico por imágenes y estudios' },
  { value: 'Otro', icon: '➕', description: 'Otro tipo de proveedor de salud' }
];

function ProviderStep3Services({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  const validateStep = () => {
    const newErrors = {};

    if (!formData.providerType) {
      newErrors.providerType = 'Tipo de proveedor es requerido';
    }

    // Descripción es opcional pero si existe, verificar longitud
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Descripción no puede exceder 2000 caracteres';
    }

    // Productos principales es opcional
    if (formData.mainProducts && formData.mainProducts.length > 2000) {
      newErrors.mainProducts = 'Productos principales no puede exceder 2000 caracteres';
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
        <h2 className="text-2xl font-bold text-gray-800">Categoría y servicios</h2>
        <p className="text-gray-600 mt-2">Describe tu negocio y servicios</p>
      </div>

      {/* Tipo de proveedor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tipo de proveedor <span className="text-red-500">*</span>
          </span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROVIDER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('providerType', type.value)}
              className={`p-4 border rounded-lg text-left transition-all
                ${formData.providerType === type.value
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <p className="font-medium text-gray-800">{type.value}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        {errors.providerType && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.providerType}
          </p>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Descripción de la empresa
            <span className="text-gray-400">(opcional)</span>
          </span>
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.description ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          placeholder="Describe brevemente tu empresa, trayectoria, servicios destacados..."
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.description}
            </p>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-500">
            {(formData.description || '').length}/2000
          </span>
        </div>
      </div>

      {/* Productos/Servicios principales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Productos o servicios principales
            <span className="text-gray-400">(opcional)</span>
          </span>
        </label>
        <textarea
          value={formData.mainProducts || ''}
          onChange={(e) => updateField('mainProducts', e.target.value)}
          rows={3}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.mainProducts ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          placeholder="Ej: Medicamentos genéricos, vacunas, pruebas de laboratorio, equipos médicos..."
        />
        <div className="flex justify-between mt-1">
          {errors.mainProducts ? (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.mainProducts}
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Lista los principales productos o servicios que ofreces
            </p>
          )}
          <span className="text-xs text-gray-500">
            {(formData.mainProducts || '').length}/2000
          </span>
        </div>
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

export default ProviderStep3Services;
