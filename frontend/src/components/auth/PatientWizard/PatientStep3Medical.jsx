/**
 * PatientStep3Medical - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 3: Información médica
 * - Alergias (opcional)
 * - Condiciones crónicas (opcional)
 * - Tipo de sangre
 * - Contacto de emergencia
 */

import { motion } from 'framer-motion';
import { Heart, Droplet, AlertTriangle, Phone, User, AlertCircle } from 'lucide-react';

const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'unknown', label: 'No sé' }
];

/**
 * Componente Paso 3: Información Médica
 */
function PatientStep3Medical({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  // Formatear teléfono venezolano
  const handleEmergencyPhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    updateField('emergencyContactPhone', value);
  };

  // Validar paso actual
  const validateStep = () => {
    const newErrors = {};

    // Tipo de sangre
    if (!formData.bloodType) {
      newErrors.bloodType = 'Tipo de sangre es requerido';
    }

    // Contacto de emergencia - Nombre
    if (!formData.emergencyContactName?.trim()) {
      newErrors.emergencyContactName = 'Nombre del contacto es requerido';
    } else if (formData.emergencyContactName.trim().length < 2) {
      newErrors.emergencyContactName = 'Nombre debe tener al menos 2 caracteres';
    }

    // Contacto de emergencia - Teléfono
    if (!formData.emergencyContactPhone?.trim()) {
      newErrors.emergencyContactPhone = 'Teléfono del contacto es requerido';
    } else if (!/^(0412|0414|0416|0424|0426|0212|0251|0261|0241|0243)\d{7}$/.test(formData.emergencyContactPhone)) {
      newErrors.emergencyContactPhone = 'Teléfono venezolano válido';
    }

    // Alergias - validación opcional (solo longitud)
    if (formData.allergies && formData.allergies.length > 1000) {
      newErrors.allergies = 'Máximo 1000 caracteres';
    }

    // Condiciones - validación opcional (solo longitud)
    if (formData.chronicConditions && formData.chronicConditions.length > 1000) {
      newErrors.chronicConditions = 'Máximo 1000 caracteres';
    }

    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar siguiente paso
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
        <h2 className="text-2xl font-bold text-gray-800">Información médica</h2>
        <p className="text-gray-600 mt-2">
          Información importante para tu atención médica
        </p>
      </div>

      {/* Alergias */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Alergias conocidas
            <span className="text-gray-400 font-normal">(opcional)</span>
          </span>
        </label>
        <textarea
          value={formData.allergies || ''}
          onChange={(e) => updateField('allergies', e.target.value)}
          rows={3}
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.allergies
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
            }
          `}
          placeholder="Ej: Penicilina, Mariscos, Látex..."
        />
        {errors.allergies && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.allergies}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Incluye medicamentos, alimentos y otras sustancias
        </p>
      </div>

      {/* Condiciones crónicas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            Condiciones crónicas
            <span className="text-gray-400 font-normal">(opcional)</span>
          </span>
        </label>
        <textarea
          value={formData.chronicConditions || ''}
          onChange={(e) => updateField('chronicConditions', e.target.value)}
          rows={3}
          className={`
            w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
            ${errors.chronicConditions
              ? 'border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
            }
          `}
          placeholder="Ej: Diabetes, Hipertensión, Asma..."
        />
        {errors.chronicConditions && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.chronicConditions}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enfermedades o condiciones que requieren seguimiento
        </p>
      </div>

      {/* Tipo de sangre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-red-600" />
            Tipo de sangre
          </span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {BLOOD_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => updateField('bloodType', type.value)}
              className={`
                py-2 px-3 border rounded-lg text-sm font-medium transition-colors
                ${formData.bloodType === type.value
                  ? 'border-red-500 bg-red-50 text-red-600'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
                }
                ${type.value === 'unknown' ? 'col-span-3 sm:col-span-1' : ''}
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
        {errors.bloodType && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.bloodType}
          </p>
        )}
      </div>

      {/* Contacto de emergencia */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <h3 className="font-medium text-gray-800 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Contacto de emergencia
        </h3>
        <p className="text-sm text-gray-600">
          Persona a contactar en caso de emergencia médica
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={formData.emergencyContactName || ''}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                  ${errors.emergencyContactName
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }
                `}
                placeholder="María Pérez"
              />
            </div>
            {errors.emergencyContactName && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.emergencyContactName}
              </p>
            )}
          </div>

          {/* Teléfono del contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={formData.emergencyContactPhone || ''}
                onChange={handleEmergencyPhoneChange}
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                  ${errors.emergencyContactPhone
                    ? 'border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                  }
                `}
                placeholder="04241234567"
              />
            </div>
            {errors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.emergencyContactPhone}
              </p>
            )}
          </div>
        </div>

        {/* Relación (opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relación
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <select
            value={formData.emergencyContactRelation || ''}
            onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Seleccionar...</option>
            <option value="spouse">Esposo/a</option>
            <option value="parent">Padre/Madre</option>
            <option value="child">Hijo/a</option>
            <option value="sibling">Hermano/a</option>
            <option value="friend">Amigo/a</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200
                     transition-colors duration-200"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                     transition-colors duration-200"
        >
          Continuar
        </button>
      </div>
    </motion.div>
  );
}

export default PatientStep3Medical;
