/**
 * DoctorAgendaPage - CITAMED.VE
 * Semana 3 - Agenda del médico
 *
 * Página para que el médico configure su disponibilidad semanal:
 * días de atención, bloques horarios, duración de la consulta y
 * tipo de consulta. Guarda vía POST /doctors/me/availability.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Plus, X, Save, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import doctorService from '../../services/doctorService';

// Orden de display: Lunes → Domingo (dayOfWeek: 0=Domingo, 1=Lunes, ..., 6=Sábado)
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];

const SLOT_DURATION_OPTIONS = [15, 20, 30, 45, 60];

const CONSULTATION_TYPE_OPTIONS = ['presencial', 'telemedicina', 'domicilio', 'mixto'];

const buildInitialDays = () =>
  DISPLAY_DAYS.map((dayOfWeek) => ({
    dayOfWeek,
    enabled: false,
    blocks: []
  }));

/**
 * Fila de un día: interruptor atiende/no atiende + bloques horarios
 */
function DayRow({ day, onToggle, onAddBlock, onRemoveBlock, onUpdateBlock }) {
  return (
    <div className={`rounded-lg border p-4 transition-colors
      ${day.enabled ? 'border-primary/30 bg-primary/5' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={day.enabled}
              onChange={onToggle}
              aria-label={`Atiende ${day.dayName}`}
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full
              after:content-[''] after:absolute after:top-0.5 after:left-0.5
              after:bg-white after:rounded-full after:h-5 after:w-5
              after:transition-all after:shadow
              peer-checked:bg-primary peer-checked:after:translate-x-5" />
          </label>
          <span className="font-medium text-gray-800">{day.dayName}</span>
          {!day.enabled && <span className="text-sm text-gray-400">No atiende</span>}
        </div>
        {day.enabled && (
          <button
            type="button"
            onClick={onAddBlock}
            className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80"
          >
            <Plus className="h-4 w-4" /> Agregar bloque
          </button>
        )}
      </div>

      {day.enabled && (
        <div className="mt-3 space-y-2">
          {day.blocks.length === 0 && (
            <p className="text-sm text-gray-500">
              Sin bloques de horario. Agrega uno para atender este día.
            </p>
          )}
          {day.blocks.map((block, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  type="time"
                  value={block.startTime}
                  onChange={(e) => onUpdateBlock(index, 'startTime', e.target.value)}
                  className="text-sm text-gray-800 focus:outline-none"
                  aria-label="Hora de inicio"
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  value={block.endTime}
                  onChange={(e) => onUpdateBlock(index, 'endTime', e.target.value)}
                  className="text-sm text-gray-800 focus:outline-none"
                  aria-label="Hora de fin"
                />
              </div>
              <button
                type="button"
                onClick={() => onRemoveBlock(index)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Quitar bloque"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorAgendaPage() {
  const [days, setDays] = useState(() =>
    buildInitialDays().map((day) => ({
      ...day,
      dayName: doctorService.getDayName(day.dayOfWeek)
    }))
  );
  const [slotDuration, setSlotDuration] = useState(30);
  const [consultationType, setConsultationType] = useState('presencial');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadAgenda = async () => {
      try {
        // 1. Perfil propio → doctorProfileId
        const profileResponse = await doctorService.getMyProfile();
        const profile = profileResponse.data;

        // 2. Disponibilidad actual → precargar el editor
        const availabilityResponse = await doctorService.getAvailability(profile.id);
        const summary = availabilityResponse.data;

        setDays((prevDays) =>
          prevDays.map((day) => {
            const daySummary = summary?.[day.dayOfWeek];
            if (daySummary?.available && Array.isArray(daySummary.schedules)) {
              return {
                ...day,
                enabled: true,
                blocks: daySummary.schedules
                  .filter((s) => s.start && s.end)
                  .map((s) => ({ startTime: s.start, endTime: s.end }))
              };
            }
            return day;
          })
        );

        // El resumen público no expone slotDuration/consultationType;
        // se recuperan de la disponibilidad activa del propio perfil
        const activeAvailability = profile.availability || [];
        if (activeAvailability.length > 0) {
          const first = activeAvailability[0];
          if (first.slotDuration) setSlotDuration(first.slotDuration);
          if (first.consultationType) setConsultationType(first.consultationType);
        }
      } catch (err) {
        console.error('Error cargando agenda:', err);
        setError(err.response?.data?.message || 'Error al cargar tu agenda. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    loadAgenda();
  }, []);

  const updateDay = (dayOfWeek, updater) => {
    setDays((prevDays) =>
      prevDays.map((day) => (day.dayOfWeek === dayOfWeek ? updater(day) : day))
    );
    setSuccess(null);
  };

  const handleToggle = (dayOfWeek) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      enabled: !day.enabled,
      blocks: !day.enabled && day.blocks.length === 0
        ? [{ startTime: '08:00', endTime: '12:00' }]
        : day.blocks
    }));
  };

  const handleAddBlock = (dayOfWeek) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      blocks: [...day.blocks, { startTime: '14:00', endTime: '17:00' }]
    }));
  };

  const handleRemoveBlock = (dayOfWeek, blockIndex) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      blocks: day.blocks.filter((_, i) => i !== blockIndex)
    }));
  };

  const handleUpdateBlock = (dayOfWeek, blockIndex, field, value) => {
    updateDay(dayOfWeek, (day) => ({
      ...day,
      blocks: day.blocks.map((b, i) => (i === blockIndex ? { ...b, [field]: value } : b))
    }));
  };

  /**
   * Arma el array `schedules` del contrato:
   * un elemento por bloque, con su dayOfWeek
   */
  const buildSchedules = () => {
    const schedules = [];

    for (const day of days) {
      if (!day.enabled) continue;

      for (const block of day.blocks) {
        if (!block.startTime || !block.endTime) {
          throw new Error(`Completa las horas de todos los bloques de ${day.dayName}`);
        }
        if (block.endTime <= block.startTime) {
          throw new Error(`La hora de fin debe ser mayor a la de inicio en ${day.dayName}`);
        }
        schedules.push({
          dayOfWeek: day.dayOfWeek,
          startTime: block.startTime,
          endTime: block.endTime,
          slotDuration: parseInt(slotDuration, 10),
          consultationType
        });
      }

      const sorted = [...day.blocks].sort((a, b) =>
        (a.startTime || '').localeCompare(b.startTime || '')
      );
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          throw new Error(`Los bloques de ${day.dayName} se solapan. Ajusta las horas.`);
        }
      }
    }

    if (schedules.length === 0) {
      throw new Error('Activa al menos un día y agrega un bloque de horario antes de guardar.');
    }

    return schedules;
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    let schedules;
    try {
      schedules = buildSchedules();
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setSaving(true);
    try {
      const response = await doctorService.setAvailability(schedules);
      if (response.success) {
        setSuccess(response.message || 'Disponibilidad guardada exitosamente');
      } else {
        setError(response.message || 'Error al guardar la disponibilidad');
      }
    } catch (err) {
      console.error('Error guardando agenda:', err);
      setError(err.response?.data?.message || 'Error al guardar la disponibilidad. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-gray-600">Cargando tu agenda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Mi Agenda
          </h1>
          <p className="text-gray-600 mt-2">
            Configura los días y horas en que atiendes. Los pacientes verán
            esta disponibilidad al agendar sus citas.
          </p>
        </motion.div>

        {/* Banners de estado */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              {error}
            </p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
              {success}
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 space-y-6"
        >
          {/* Duración de la consulta (global) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duración de la consulta
            </label>
            <div className="flex flex-wrap gap-2">
              {SLOT_DURATION_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setSlotDuration(option); setSuccess(null); }}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors
                    ${parseInt(slotDuration, 10) === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                >
                  {option} min
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de consulta (global) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de consulta
            </label>
            <div className="flex flex-wrap gap-2">
              {CONSULTATION_TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setConsultationType(option); setSuccess(null); }}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors
                    ${consultationType === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
                >
                  {doctorService.formatConsultationType(option)}
                </button>
              ))}
            </div>
          </div>

          {/* Días de atención */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-700">Días de atención</h2>
            {days.map((day) => (
              <DayRow
                key={day.dayOfWeek}
                day={day}
                onToggle={() => handleToggle(day.dayOfWeek)}
                onAddBlock={() => handleAddBlock(day.dayOfWeek)}
                onRemoveBlock={(index) => handleRemoveBlock(day.dayOfWeek, index)}
                onUpdateBlock={(index, field, value) => handleUpdateBlock(day.dayOfWeek, index, field, value)}
              />
            ))}
          </div>

          {/* Guardar */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg
              hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="h-5 w-5" /> Guardar disponibilidad</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default DoctorAgendaPage;
