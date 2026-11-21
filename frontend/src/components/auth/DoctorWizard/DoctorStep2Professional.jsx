/**
 * DoctorStep2Professional - CITAMED.VE
 * Registro corto del médico
 *
 * Paso 2 (final): número MPPS y especialidad, verificación anti robots y envío.
 * Consultorio, horarios, precios, foto y documentos se completan después desde
 * la tarjeta "Prepara tu consultorio" del panel.
 */

import { motion } from 'framer-motion';
import TurnstileWidget from '../../common/TurnstileWidget';
import { Award, GraduationCap, AlertCircle, Loader2, Check } from 'lucide-react';

function DoctorStep2Professional({
  formData,
  updateField,
  errors,
  setFieldErrors,
  onPrev,
  onSubmit,
  isSubmitting,
  specialties = null
}) {
  const validateStep = () => {
    const newErrors = {};
    if (!formData.mppsNumber?.trim()) {
      newErrors.mppsNumber = 'Número MPPS es requerido';
    } else if (!/^[A-Z0-9-]{5,20}$/i.test(formData.mppsNumber.trim())) {
      newErrors.mppsNumber = 'Formato de MPPS no válido';
    }
    if (!formData.specialtyId) {
      newErrors.specialtyId = 'Elige tu especialidad';
    }
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateStep()) await onSubmit();
  };

  const inputClass = (field) => `w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
    ${errors[field] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Datos profesionales</h2>
        <p className="text-gray-600 mt-2">Con esto verificamos que eres médico</p>
      </div>

      {/* Número MPPS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número MPPS<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={formData.mppsNumber || ''}
            onChange={(e) => updateField('mppsNumber', e.target.value.toUpperCase())}
            className={inputClass('mppsNumber')}
            placeholder="Ej: MPPS-12345"
          />
        </div>
        {errors.mppsNumber && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.mppsNumber}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Ministerio del Poder Popular para la Salud</p>
      </div>

      {/* Especialidad */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Especialidad<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          {specialties === null ? (
            <div className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando especialidades...
            </div>
          ) : specialties.length === 0 ? (
            <div className="w-full pl-10 pr-4 py-3 border border-amber-300 bg-amber-50 rounded-lg text-sm text-amber-700">
              No pudimos cargar las especialidades. Revisa tu conexión y recarga la página.
            </div>
          ) : (
            <select
              value={formData.specialtyId || ''}
              onChange={(e) => updateField('specialtyId', e.target.value)}
              className={`${inputClass('specialtyId')} appearance-none bg-white`}
            >
              <option value="">Seleccionar especialidad...</option>
              {specialties.map((spec) => (
                <option key={spec.id} value={spec.id}>{spec.name}</option>
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

      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <p className="text-sm text-teal-700">
          Después de crear tu cuenta te enviaremos un código al correo. Luego, desde tu panel,
          preparas tu consultorio paso a paso: horarios, precio, foto y documentos.
        </p>
      </div>

      <TurnstileWidget />

      <div className="pt-4 flex gap-4">
        <button type="button" onClick={onPrev} disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Anterior
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Creando cuenta...</>
          ) : (
            <><Check className="h-5 w-5" /> Crear cuenta</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default DoctorStep2Professional;
