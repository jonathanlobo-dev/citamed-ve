/**
 * ProviderStep2Company - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 2: Datos de la empresa
 * - Nombre comercial
 * - RIF
 * - Razón social
 * - Representante legal
 * - Teléfono comercial
 * - Email de contacto
 */

import { motion } from 'framer-motion';
import { Building2, FileText, User, Phone, Mail, AlertCircle } from 'lucide-react';

function ProviderStep2Company({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  const handleRifChange = (e) => {
    let value = e.target.value.toUpperCase();
    // Permitir solo formato RIF: J-12345678-9
    value = value.replace(/[^JGVEP0-9-]/g, '');
    updateField('rif', value);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    updateField('commercialPhone', value);
  };

  const validateStep = () => {
    const newErrors = {};

    // Nombre comercial
    if (!formData.companyName?.trim()) {
      newErrors.companyName = 'Nombre comercial es requerido';
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = 'Nombre muy corto';
    }

    // RIF
    if (!formData.rif?.trim()) {
      newErrors.rif = 'RIF es requerido';
    } else if (!/^[JGVEP]-?\d{8,9}-?\d?$/i.test(formData.rif)) {
      newErrors.rif = 'Formato: J-12345678-9';
    }

    // Razón social
    if (!formData.legalName?.trim()) {
      newErrors.legalName = 'Razón social es requerida';
    }

    // Representante legal
    if (!formData.legalRepresentative?.trim()) {
      newErrors.legalRepresentative = 'Representante legal es requerido';
    }

    // Teléfono comercial
    if (!formData.commercialPhone?.trim()) {
      newErrors.commercialPhone = 'Teléfono comercial es requerido';
    } else if (!/^(0212|0251|0261|0241|0243|0412|0414|0416|0424|0426)\d{7}$/.test(formData.commercialPhone)) {
      newErrors.commercialPhone = 'Teléfono venezolano válido';
    }

    // Email de contacto
    if (!formData.contactEmail?.trim()) {
      newErrors.contactEmail = 'Email de contacto es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email no es válido';
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
        <h2 className="text-2xl font-bold text-gray-800">Datos de la empresa</h2>
        <p className="text-gray-600 mt-2">Información legal y de contacto</p>
      </div>

      {/* Nombre comercial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre comercial <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.companyName || ''}
            onChange={(e) => updateField('companyName', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.companyName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Farmacia San José"
          />
        </div>
        {errors.companyName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.companyName}
          </p>
        )}
      </div>

      {/* RIF */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          RIF <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.rif || ''}
            onChange={handleRifChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.rif ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="J-12345678-9"
          />
        </div>
        {errors.rif && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.rif}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Registro de Información Fiscal</p>
      </div>

      {/* Razón social */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Razón social <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.legalName || ''}
          onChange={(e) => updateField('legalName', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.legalName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          placeholder="Inversiones Farmacéuticas San José, C.A."
        />
        {errors.legalName && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.legalName}
          </p>
        )}
      </div>

      {/* Representante legal */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Representante legal <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.legalRepresentative || ''}
            onChange={(e) => updateField('legalRepresentative', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.legalRepresentative ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Juan Carlos Pérez"
          />
        </div>
        {errors.legalRepresentative && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.legalRepresentative}
          </p>
        )}
      </div>

      {/* Teléfono comercial y Email de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono comercial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.commercialPhone || ''}
              onChange={handlePhoneChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.commercialPhone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="02121234567"
            />
          </div>
          {errors.commercialPhone && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.commercialPhone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email de contacto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.contactEmail || ''}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.contactEmail ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="contacto@empresa.com"
            />
          </div>
          {errors.contactEmail && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" /> {errors.contactEmail}
            </p>
          )}
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

export default ProviderStep2Company;
