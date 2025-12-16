/**
 * DoctorStep2Personal - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 2: Datos personales del médico
 * - Nombre y apellido
 * - Cédula
 * - Fecha de nacimiento
 * - Género
 * - Teléfono
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, CreditCard, Calendar, Phone, AlertCircle, Check, X, Loader2 } from 'lucide-react';
import { debounce } from 'lodash';
import authService from '../../../services/authService';

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decir' }
];

function DoctorStep2Personal({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  const [checkingCedula, setCheckingCedula] = useState(false);
  const [cedulaAvailable, setCedulaAvailable] = useState(null);

  const checkCedulaAvailability = useCallback(
    debounce(async (cedula) => {
      if (!cedula || cedula.length < 6) {
        setCedulaAvailable(null);
        return;
      }

      setCheckingCedula(true);
      try {
        const response = await authService.checkCedula(cedula);
        setCedulaAvailable(response.data.available);
        if (!response.data.available) {
          setFieldErrors({ ...errors, identificationNumber: 'Esta cédula ya está registrada' });
        }
      } catch (error) {
        console.error('Error checking cedula:', error);
        setCedulaAvailable(null);
      } finally {
        setCheckingCedula(false);
      }
    }, 500),
    [errors, setFieldErrors]
  );

  const handleCedulaChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^VE0-9-]/g, '');
    updateField('identificationNumber', value);
    setCedulaAvailable(null);
    checkCedulaAvailability(value);
  };

  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    updateField('phone', value);
  };

  const validateStep = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Nombre es requerido';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Nombre debe tener al menos 2 caracteres';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Apellido es requerido';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Apellido debe tener al menos 2 caracteres';
    }

    if (!formData.identificationNumber?.trim()) {
      newErrors.identificationNumber = 'Cédula es requerida';
    } else if (!/^[VE]-?\d{6,9}$/i.test(formData.identificationNumber)) {
      newErrors.identificationNumber = 'Formato: V-12345678 o E-12345678';
    } else if (cedulaAvailable === false) {
      newErrors.identificationNumber = 'Esta cédula ya está registrada';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 24) {
        newErrors.dateOfBirth = 'Debe tener al menos 24 años para registrarse como médico';
      } else if (age > 100) {
        newErrors.dateOfBirth = 'Fecha de nacimiento no válida';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Género es requerido';
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = 'Teléfono es requerido';
    } else if (!/^(0412|0414|0416|0424|0426)\d{7}$/.test(formData.phone)) {
      newErrors.phone = 'Teléfono venezolano válido (04XX-XXXXXXX)';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  const calculateAge = () => {
    if (!formData.dateOfBirth) return null;
    const birthDate = new Date(formData.dateOfBirth);
    const today = new Date();
    return Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
  };

  const age = calculateAge();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Datos personales</h2>
        <p className="text-gray-600 mt-2">Información personal del médico</p>
      </div>

      {/* Nombre y Apellido */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => updateField('firstName', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
              placeholder="Juan"
            />
          </div>
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.firstName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Pérez"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Cédula */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de Identidad</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.identificationNumber || ''}
            onChange={handleCedulaChange}
            className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.identificationNumber ? 'border-red-500 focus:ring-red-200'
                : cedulaAvailable === true ? 'border-green-500 focus:ring-green-200'
                : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="V-12345678"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checkingCedula && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
            {!checkingCedula && cedulaAvailable === true && <Check className="h-5 w-5 text-green-500" />}
            {!checkingCedula && cedulaAvailable === false && <X className="h-5 w-5 text-red-500" />}
          </div>
        </div>
        {errors.identificationNumber && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.identificationNumber}
          </p>
        )}
      </div>

      {/* Fecha de nacimiento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => updateField('dateOfBirth', e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 24)).toISOString().split('T')[0]}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          />
        </div>
        {age !== null && age >= 24 && (
          <p className="mt-1 text-sm text-gray-600">{age} años</p>
        )}
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.dateOfBirth}
          </p>
        )}
      </div>

      {/* Género */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Género</label>
        <div className="grid grid-cols-2 gap-3">
          {GENDERS.map((gender) => (
            <button
              key={gender.value}
              type="button"
              onClick={() => updateField('gender', gender.value)}
              className={`py-3 px-4 border rounded-lg text-sm font-medium transition-colors
                ${formData.gender === gender.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
            >
              {gender.label}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.gender}
          </p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono celular</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={handlePhoneChange}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="04121234567"
          />
        </div>
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.phone}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="pt-4 flex gap-4">
        <button type="button" onClick={onPrev}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 transition-colors">
          Anterior
        </button>
        <button type="button" onClick={handleNext} disabled={checkingCedula}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Continuar
        </button>
      </div>
    </motion.div>
  );
}

export default DoctorStep2Personal;
