/**
 * DoctorStep5Pricing - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 5: Tarifas y servicios
 * - Precio consulta presencial
 * - Precio teleconsulta
 * - Precio visita a domicilio
 * - Seguros aceptados
 */

import { motion } from 'framer-motion';
import { DollarSign, Video, Home, Shield, AlertCircle } from 'lucide-react';

const INSURANCE_OPTIONS = [
  'Seguros Caracas',
  'Seguros La Seguridad',
  'Seguros Mercantil',
  'Seguros Venezuela',
  'Mapfre',
  'Qualitas',
  'Multinacional de Seguros',
  'Seguros Altamira',
  'Seguros Horizonte',
  'Otro'
];

function DoctorStep5Pricing({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  // Toggle seguro seleccionado
  const toggleInsurance = (insurance) => {
    const current = formData.acceptedInsurances ? formData.acceptedInsurances.split(',').map(s => s.trim()).filter(Boolean) : [];
    const newInsurances = current.includes(insurance)
      ? current.filter(i => i !== insurance)
      : [...current, insurance];
    updateField('acceptedInsurances', newInsurances.join(', '));
  };

  const isInsuranceSelected = (insurance) => {
    if (!formData.acceptedInsurances) return false;
    return formData.acceptedInsurances.split(',').map(s => s.trim()).includes(insurance);
  };

  const validateStep = () => {
    const newErrors = {};

    // Precio consulta (opcional pero si está, debe ser válido)
    if (formData.priceConsultation) {
      const price = parseFloat(formData.priceConsultation);
      if (isNaN(price) || price < 0) {
        newErrors.priceConsultation = 'Precio no válido';
      }
    }

    // Precio teleconsulta (opcional)
    if (formData.priceTeleconsultation) {
      const price = parseFloat(formData.priceTeleconsultation);
      if (isNaN(price) || price < 0) {
        newErrors.priceTeleconsultation = 'Precio no válido';
      }
    }

    // Precio visita domicilio (solo si acepta visitas)
    if (formData.acceptsHomeVisits && formData.priceHomeVisit) {
      const price = parseFloat(formData.priceHomeVisit);
      if (isNaN(price) || price < 0) {
        newErrors.priceHomeVisit = 'Precio no válido';
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
        <h2 className="text-2xl font-bold text-gray-800">Tarifas y servicios</h2>
        <p className="text-gray-600 mt-2">Configure sus precios y métodos de pago</p>
      </div>

      {/* Precio consulta presencial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Consulta presencial (USD)
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.priceConsultation || ''}
            onChange={(e) => updateField('priceConsultation', e.target.value)}
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.priceConsultation ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="30.00"
          />
        </div>
        {errors.priceConsultation && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.priceConsultation}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Deje en blanco si prefiere definirlo después
        </p>
      </div>

      {/* Precio teleconsulta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-600" />
            Teleconsulta (USD)
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.priceTeleconsultation || ''}
            onChange={(e) => updateField('priceTeleconsultation', e.target.value)}
            className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.priceTeleconsultation ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="25.00"
          />
        </div>
        {errors.priceTeleconsultation && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.priceTeleconsultation}
          </p>
        )}
      </div>

      {/* Precio visita a domicilio (solo si lo ofrece) */}
      {formData.acceptsHomeVisits && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <span className="flex items-center gap-2">
              <Home className="h-4 w-4 text-orange-600" />
              Visita a domicilio (USD)
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.priceHomeVisit || ''}
              onChange={(e) => updateField('priceHomeVisit', e.target.value)}
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.priceHomeVisit ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="50.00"
            />
          </div>
          {errors.priceHomeVisit && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.priceHomeVisit}
            </p>
          )}
        </div>
      )}

      {/* Acepta seguros */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={formData.acceptsInsurance || false}
            onChange={(e) => {
              updateField('acceptsInsurance', e.target.checked);
              if (!e.target.checked) {
                updateField('acceptedInsurances', '');
              }
            }}
            className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="flex items-center gap-2 text-gray-700">
            <Shield className="h-5 w-5 text-primary" />
            Acepto seguros médicos
          </span>
        </label>

        {formData.acceptsInsurance && (
          <div className="ml-8 space-y-3">
            <p className="text-sm text-gray-600">Seleccione los seguros que acepta:</p>
            <div className="flex flex-wrap gap-2">
              {INSURANCE_OPTIONS.map((insurance) => (
                <button
                  key={insurance}
                  type="button"
                  onClick={() => toggleInsurance(insurance)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${isInsuranceSelected(insurance)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {insurance}
                </button>
              ))}
            </div>
            {formData.acceptedInsurances && (
              <p className="text-sm text-gray-500">
                Seguros seleccionados: {formData.acceptedInsurances}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Métodos de pago adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Métodos de pago aceptados
          <span className="text-gray-400 ml-1">(opcional)</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {['Efectivo', 'Tarjeta', 'Transferencia', 'Zelle', 'PayPal', 'Pago Móvil'].map((method) => {
            const current = formData.paymentMethods ? formData.paymentMethods.split(',').map(s => s.trim()) : [];
            const isSelected = current.includes(method);
            return (
              <label key={method} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {
                    const newMethods = isSelected
                      ? current.filter(m => m !== method)
                      : [...current, method];
                    updateField('paymentMethods', newMethods.filter(Boolean).join(', '));
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-700">{method}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>Consejo:</strong> Los precios pueden ser modificados después del registro
          desde su panel de configuración.
        </p>
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

export default DoctorStep5Pricing;
