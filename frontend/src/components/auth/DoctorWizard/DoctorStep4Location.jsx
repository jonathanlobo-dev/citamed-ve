/**
 * DoctorStep4Location - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 4: Ubicación y horarios
 * - Dirección del consultorio
 * - Ciudad y Estado
 * - Días disponibles
 * - Horario de atención
 */

import { motion } from 'framer-motion';
import { MapPin, Building2, Clock, AlertCircle } from 'lucide-react';

const VENEZUELAN_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
  'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

const WEEKDAYS = [
  { value: 'monday', label: 'Lunes', short: 'L' },
  { value: 'tuesday', label: 'Martes', short: 'M' },
  { value: 'wednesday', label: 'Miércoles', short: 'X' },
  { value: 'thursday', label: 'Jueves', short: 'J' },
  { value: 'friday', label: 'Viernes', short: 'V' },
  { value: 'saturday', label: 'Sábado', short: 'S' },
  { value: 'sunday', label: 'Domingo', short: 'D' }
];

function DoctorStep4Location({ formData, updateField, errors, setFieldErrors, onNext, onPrev }) {
  // Toggle día seleccionado
  const toggleDay = (day) => {
    const currentDays = formData.availableDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    updateField('availableDays', newDays);
  };

  const validateStep = () => {
    const newErrors = {};

    // Dirección
    if (!formData.consultationAddress?.trim()) {
      newErrors.consultationAddress = 'Dirección es requerida';
    } else if (formData.consultationAddress.trim().length < 10) {
      newErrors.consultationAddress = 'Dirección muy corta';
    }

    // Ciudad
    if (!formData.city?.trim()) {
      newErrors.city = 'Ciudad es requerida';
    }

    // Estado
    if (!formData.state) {
      newErrors.state = 'Estado es requerido';
    }

    // Días disponibles
    if (!formData.availableDays || formData.availableDays.length === 0) {
      newErrors.availableDays = 'Seleccione al menos un día';
    }

    // Horarios
    if (!formData.startTime) {
      newErrors.startTime = 'Hora de inicio es requerida';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'Hora de fin es requerida';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'La hora de fin debe ser posterior a la de inicio';
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
        <h2 className="text-2xl font-bold text-gray-800">Ubicación y horarios</h2>
        <p className="text-gray-600 mt-2">Dónde y cuándo atiende a sus pacientes</p>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección del consultorio
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <textarea
            value={formData.consultationAddress || ''}
            onChange={(e) => updateField('consultationAddress', e.target.value)}
            rows={2}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2
              ${errors.consultationAddress ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            placeholder="Av. Principal, Centro Médico XYZ, Piso 3, Consultorio 305"
          />
        </div>
        {errors.consultationAddress && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.consultationAddress}
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
              <AlertCircle className="h-4 w-4" />
              {errors.city}
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
              <AlertCircle className="h-4 w-4" />
              {errors.state}
            </p>
          )}
        </div>
      </div>

      {/* Días disponibles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Días de atención
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const isSelected = (formData.availableDays || []).includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${isSelected
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <span className="hidden sm:inline">{day.label}</span>
                <span className="sm:hidden">{day.short}</span>
              </button>
            );
          })}
        </div>
        {errors.availableDays && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.availableDays}
          </p>
        )}
      </div>

      {/* Horarios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horario de atención
            <span className="text-red-500">*</span>
          </span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="time"
              value={formData.startTime || ''}
              onChange={(e) => updateField('startTime', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.startTime ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.startTime}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="time"
              value={formData.endTime || ''}
              onChange={(e) => updateField('endTime', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2
                ${errors.endTime ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary/20 focus:border-primary'}`}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.endTime}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Acepta visitas a domicilio */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.acceptsHomeVisits || false}
            onChange={(e) => updateField('acceptsHomeVisits', e.target.checked)}
            className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-gray-700">Ofrezco visitas a domicilio</span>
        </label>
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

export default DoctorStep4Location;
