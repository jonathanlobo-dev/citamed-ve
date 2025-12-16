/**
 * DoctorStep3Professional - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 3: Información profesional
 * - Número MPPS
 * - Especialidad
 * - Universidad
 * - Año de graduación
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, GraduationCap, Building, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../../services/api';

function DoctorStep3Professional({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);

  // Cargar especialidades
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        if (response.data.success) {
          setSpecialties(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      } finally {
        setLoadingSpecialties(false);
      }
    };
    fetchSpecialties();
  }, []);

  const validateStep = () => {
    const newErrors = {};

    // MPPS
    if (!formData.mppsNumber?.trim()) {
      newErrors.mppsNumber = 'Número MPPS es requerido';
    } else if (!/^[A-Z0-9-]{5,20}$/i.test(formData.mppsNumber.trim())) {
      newErrors.mppsNumber = 'Formato de MPPS no válido';
    }

    // Especialidad
    if (!formData.specialtyId) {
      newErrors.specialtyId = 'Especialidad es requerida';
    }

    // Universidad
    if (!formData.university?.trim()) {
      newErrors.university = 'Universidad es requerida';
    } else if (formData.university.trim().length < 5) {
      newErrors.university = 'Nombre de universidad muy corto';
    }

    // Año de graduación
    if (!formData.graduationYear) {
      newErrors.graduationYear = 'Año de graduación es requerido';
    } else {
      const year = parseInt(formData.graduationYear);
      const currentYear = new Date().getFullYear();
      if (year < 1950 || year > currentYear) {
        newErrors.graduationYear = `Año debe estar entre 1950 y ${currentYear}`;
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

  // Generar opciones de años
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1950; year--) {
    yearOptions.push(year);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Información profesional</h2>
        <p className="text-gray-600 mt-2">Credenciales y formación académica</p>
      </div>

      {/* Número MPPS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número MPPS
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.mppsNumber || ''}
            onChange={(e) => updateField('mppsNumber', e.target.value.toUpperCase())}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.mppsNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Ej: MPPS-12345"
          />
        </div>
        {errors.mppsNumber && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.mppsNumber}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Ministerio del Poder Popular para la Salud
        </p>
      </div>

      {/* Especialidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Especialidad
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          {loadingSpecialties ? (
            <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando especialidades...
            </div>
          ) : (
            <select
              value={formData.specialtyId || ''}
              onChange={(e) => updateField('specialtyId', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 appearance-none
                ${errors.specialtyId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            >
              <option value="">Seleccionar especialidad...</option>
              {specialties.map((spec) => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {errors.specialtyId && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.specialtyId}
          </p>
        )}
      </div>

      {/* Universidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Universidad
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.university || ''}
            onChange={(e) => updateField('university', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.university ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Universidad Central de Venezuela"
          />
        </div>
        {errors.university && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.university}
          </p>
        )}
      </div>

      {/* Año de graduación */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Año de graduación
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={formData.graduationYear || ''}
            onChange={(e) => updateField('graduationYear', e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 appearance-none
              ${errors.graduationYear ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
          >
            <option value="">Seleccionar año...</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        {errors.graduationYear && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.graduationYear}
          </p>
        )}
      </div>

      {/* Subespecialidades (opcional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subespecialidades
          <span className="text-gray-400 ml-1">(opcional)</span>
        </label>
        <textarea
          value={formData.subspecialties || ''}
          onChange={(e) => updateField('subspecialties', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Ej: Cirugía laparoscópica, Oncología"
        />
        <p className="mt-1 text-xs text-gray-500">
          Separe múltiples subespecialidades con comas
        </p>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-700">
          <strong>Importante:</strong> El número MPPS será verificado con el Ministerio del Poder Popular
          para la Salud antes de aprobar su cuenta.
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

export default DoctorStep3Professional;
