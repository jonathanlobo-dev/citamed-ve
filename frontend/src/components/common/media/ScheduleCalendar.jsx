/**
 * ScheduleCalendar Component - CITAMED.VE
 * Calendario visual para gestión de disponibilidad médica
 * Interfaz intuitiva estilo Google Calendar
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  X,
  Check,
  Copy,
  Trash2,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';

const DAYS = [
  { id: 0, name: 'Domingo', short: 'Dom', initial: 'D' },
  { id: 1, name: 'Lunes', short: 'Lun', initial: 'L' },
  { id: 2, name: 'Martes', short: 'Mar', initial: 'M' },
  { id: 3, name: 'Miércoles', short: 'Mié', initial: 'M' },
  { id: 4, name: 'Jueves', short: 'Jue', initial: 'J' },
  { id: 5, name: 'Viernes', short: 'Vie', initial: 'V' },
  { id: 6, name: 'Sábado', short: 'Sáb', initial: 'S' }
];

const TIME_SLOTS = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${h.toString().padStart(2, '0')}:30`);
}

const SLOT_DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 20, label: '20 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' }
];

/**
 * Props:
 * @param {Array} schedule - Array de horarios por día
 * @param {function} onScheduleChange - Callback con nuevo schedule
 * @param {number} slotDuration - Duración del slot en minutos
 * @param {function} onSlotDurationChange - Callback para cambiar duración
 * @param {boolean} loading - Estado de carga
 * @param {boolean} disabled - Deshabilitar interacción
 */
const ScheduleCalendar = ({
  schedule = [],
  onScheduleChange,
  slotDuration = 30,
  onSlotDurationChange,
  loading = false,
  disabled = false,
  className = ''
}) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [copySource, setCopySource] = useState(null);

  // Convertir schedule array a objeto indexado por día
  const scheduleByDay = useMemo(() => {
    const byDay = {};
    DAYS.forEach(day => {
      byDay[day.id] = schedule.find(s => s.dayOfWeek === day.id) || null;
    });
    return byDay;
  }, [schedule]);

  // Calcular slots por día
  const getSlotCount = (daySchedule) => {
    if (!daySchedule || !daySchedule.startTime || !daySchedule.endTime) return 0;

    const start = timeToMinutes(daySchedule.startTime);
    const end = timeToMinutes(daySchedule.endTime);
    const duration = daySchedule.slotDuration || slotDuration;

    return Math.floor((end - start) / duration);
  };

  // Convertir tiempo a minutos
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Formatear tiempo
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // Manejar click en día
  const handleDayClick = (day) => {
    if (disabled) return;

    const currentSchedule = scheduleByDay[day.id];
    setSelectedDay(day);
    setEditingSchedule(currentSchedule ? { ...currentSchedule } : {
      dayOfWeek: day.id,
      isActive: false,
      startTime: '08:00',
      endTime: '17:00',
      slotDuration: slotDuration
    });
  };

  // Guardar horario del día
  const handleSaveDay = () => {
    if (!editingSchedule) return;

    const newSchedule = schedule.filter(s => s.dayOfWeek !== editingSchedule.dayOfWeek);

    if (editingSchedule.isActive) {
      newSchedule.push(editingSchedule);
    }

    // Ordenar por día
    newSchedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    if (onScheduleChange) {
      onScheduleChange(newSchedule);
    }

    setSelectedDay(null);
    setEditingSchedule(null);
  };

  // Copiar horario a otros días
  const handleCopyTo = (targetDays) => {
    if (!copySource) return;

    const sourceSchedule = scheduleByDay[copySource];
    if (!sourceSchedule) return;

    let newSchedule = [...schedule];

    targetDays.forEach(dayId => {
      // Remover horario existente
      newSchedule = newSchedule.filter(s => s.dayOfWeek !== dayId);
      // Agregar copia
      newSchedule.push({
        ...sourceSchedule,
        dayOfWeek: dayId
      });
    });

    // Ordenar
    newSchedule.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    if (onScheduleChange) {
      onScheduleChange(newSchedule);
    }

    setCopySource(null);
  };

  // Limpiar día
  const handleClearDay = (dayId) => {
    const newSchedule = schedule.filter(s => s.dayOfWeek !== dayId);
    if (onScheduleChange) {
      onScheduleChange(newSchedule);
    }
  };

  // Obtener color del día según estado
  const getDayColor = (daySchedule) => {
    if (!daySchedule || !daySchedule.isActive) {
      return 'bg-gray-100 text-gray-400';
    }
    return 'bg-primary text-white';
  };

  return (
    <div className={className}>
      {/* Header con duración de slot */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-800">
            Horario Semanal
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Duración de cita:</span>
          <select
            value={slotDuration}
            onChange={(e) => onSlotDurationChange?.(Number(e.target.value))}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            {SLOT_DURATIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vista de semana */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {DAYS.map(day => {
          const daySchedule = scheduleByDay[day.id];
          const isActive = daySchedule?.isActive;
          const slots = getSlotCount(daySchedule);

          return (
            <motion.div
              key={day.id}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              className={`
                relative rounded-xl p-4 cursor-pointer transition-all
                ${isActive
                  ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${copySource === day.id ? 'ring-2 ring-accent ring-offset-2' : ''}
              `}
              onClick={() => handleDayClick(day)}
            >
              {/* Nombre del día */}
              <div className="text-center mb-3">
                <p className={`text-xs font-medium ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                  {day.short}
                </p>
                <p className="text-lg font-bold">{day.initial}</p>
              </div>

              {/* Horario */}
              {isActive ? (
                <div className="space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <Sun className="w-3 h-3" />
                    <span>{formatTime(daySchedule.startTime)}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-xs">
                    <Moon className="w-3 h-3" />
                    <span>{formatTime(daySchedule.endTime)}</span>
                  </div>
                  <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-1">
                    {slots} citas
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Plus className="w-5 h-5 mx-auto text-gray-300" />
                  <p className="text-xs mt-1 text-gray-400">Sin horario</p>
                </div>
              )}

              {/* Botones de acción (hover) */}
              {!disabled && isActive && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCopySource(copySource === day.id ? null : day.id);
                    }}
                    className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
                    title="Copiar a otros días"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Panel de copiar */}
      <AnimatePresence>
        {copySource !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-accent/10 border border-accent rounded-xl p-4 mb-4"
          >
            <p className="text-sm text-gray-700 mb-3">
              Copiar horario de <strong>{DAYS[copySource].name}</strong> a:
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.filter(d => d.id !== copySource).map(day => (
                <button
                  key={day.id}
                  onClick={() => handleCopyTo([day.id])}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-accent hover:text-white hover:border-accent transition-colors"
                >
                  {day.short}
                </button>
              ))}
              <button
                onClick={() => handleCopyTo([1, 2, 3, 4, 5])}
                className="px-3 py-1 bg-accent text-white rounded-lg text-sm hover:bg-accent/80 transition-colors"
              >
                Lun - Vie
              </button>
              <button
                onClick={() => setCopySource(null)}
                className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resumen */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <strong className="text-gray-800">{schedule.filter(s => s.isActive).length}</strong> días con horario configurado
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Haz clic en un día para editar su horario
            </p>
          </div>
          {schedule.length > 0 && !disabled && (
            <button
              onClick={() => onScheduleChange?.([])}
              className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar todo
            </button>
          )}
        </div>
      </div>

      {/* Modal de edición de día */}
      <AnimatePresence>
        {selectedDay && editingSchedule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedDay.name}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Toggle activo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
                <span className="font-medium text-gray-700">
                  {editingSchedule.isActive ? 'Día laborable' : 'Día libre'}
                </span>
                <button
                  onClick={() => setEditingSchedule({
                    ...editingSchedule,
                    isActive: !editingSchedule.isActive
                  })}
                  className={`
                    relative w-14 h-8 rounded-full transition-colors
                    ${editingSchedule.isActive ? 'bg-primary' : 'bg-gray-300'}
                  `}
                >
                  <motion.div
                    animate={{ x: editingSchedule.isActive ? 24 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Horarios (solo si está activo) */}
              <AnimatePresence>
                {editingSchedule.isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Hora de inicio
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={editingSchedule.startTime}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              startTime: e.target.value
                            })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {TIME_SLOTS.map(time => (
                              <option key={time} value={time}>{formatTime(time)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Hora de fin
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <select
                            value={editingSchedule.endTime}
                            onChange={(e) => setEditingSchedule({
                              ...editingSchedule,
                              endTime: e.target.value
                            })}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {TIME_SLOTS.filter(t => t > editingSchedule.startTime).map(time => (
                              <option key={time} value={time}>{formatTime(time)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Preview de citas */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <p className="text-sm text-gray-600">
                        Con estos horarios tendrás aproximadamente
                        <strong className="text-primary mx-1">
                          {getSlotCount(editingSchedule)}
                        </strong>
                        citas de {editingSchedule.slotDuration || slotDuration} minutos.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDay}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduleCalendar;
