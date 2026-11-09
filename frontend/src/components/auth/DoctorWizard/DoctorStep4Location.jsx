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
import { SCHEDULE_PARTS } from '../../../config/scheduleBlocks';

const VENEZUELAN_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
  'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
];

const WEEKDAYS = [
  { value: 'monday', label: 'Lunes', short: 'L' },
  { value: 'tuesday', label: 'Martes', short: 'Ma' },
  { value: 'wednesday', label: 'Miércoles', short: 'Mi' },
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

  // Bloques elegidos (mañana, tarde, noche). startTime y endTime se derivan del primero al último,
  // porque el servidor los pide así; el detalle fino se afina en Mi agenda.
  const blocks = formData.scheduleBlocks || [];

  const saveBlocks = (next) => {
    const sorted = [...next].sort((a, b) => a.startTime.localeCompare(b.startTime));
    updateField('scheduleBlocks', sorted);
    updateField('startTime', sorted.length ? sorted[0].startTime : '');
    updateField('endTime', sorted.length ? sorted.reduce((max, b) => (b.endTime > max ? b.endTime : max), '') : '');
  };

  const togglePart = (part) => {
    const active = blocks.some((b) => b.key === part.key);
    saveBlocks(active
      ? blocks.filter((b) => b.key !== part.key)
      : [...blocks, { key: part.key, startTime: part.startTime, endTime: part.endTime }]);
  };

  const updateBlock = (key, field, value) => {
    saveBlocks(blocks.map((b) => (b.key === key ? { ...b, [field]: value } : b)));
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
    if (blocks.length === 0) {
      newErrors.startTime = 'Elige al menos un bloque: mañana, tarde o noche';
    } else if (blocks.some((b) => !b.startTime || !b.endTime || b.startTime >= b.endTime)) {
      newErrors.endTime = 'En cada bloque, la hora de fin debe ser posterior a la de inicio';
    } else {
      const ordered = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));
      if (ordered.some((b, i) => i > 0 && b.startTime < ordered[i - 1].endTime)) {
        newErrors.endTime = 'Los bloques no pueden solaparse';
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
        <div className="flex flex-wrap gap-2 mb-3">
          {SCHEDULE_PARTS.map((part) => {
            const active = blocks.some((b) => b.key === part.key);
            return (
              <button
                key={part.key}
                type="button"
                onClick={() => togglePart(part)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors
                  ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {part.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {blocks.map((block) => (
            <div key={block.key} className="grid grid-cols-[5rem_1fr_1fr] items-center gap-3">
              <span className="text-sm font-medium text-gray-600">
                {SCHEDULE_PARTS.find((p) => p.key === block.key)?.label}
              </span>
              <input
                type="time"
                value={block.startTime}
                onChange={(e) => updateBlock(block.key, 'startTime', e.target.value)}
                aria-label="Desde"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="time"
                value={block.endTime}
                onChange={(e) => updateBlock(block.key, 'endTime', e.target.value)}
                aria-label="Hasta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          ))}
        </div>
        {(errors.startTime || errors.endTime) && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.startTime || errors.endTime}
          </p>
        )}
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
