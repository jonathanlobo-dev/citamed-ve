/**
 * DoctorAgendaPage - CITAMED.VE
 * Semana 3 + Semana 4 - Mi Agenda Médica
 *
 * Pestaña 1: Citas y Pre-Citas (consultar pacientes, confirmar solicitudes, cancelar turnos)
 * Pestaña 2: Configurar Disponibilidad (días de atención, bloques horarios, duración)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Plus, X, Save, Loader2, AlertCircle, CheckCircle,
  Users, Check, ChevronLeft, ChevronRight, XCircle, Phone, Mail, Building2,
  CalendarRange, CalendarDays
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import doctorService from '../../services/doctorService';
import appointmentService from '../../services/appointmentService';
import toast from 'react-hot-toast';

// Orden de display: Lunes → Domingo (dayOfWeek: 0=Domingo, 1=Lunes, ..., 6=Sábado)
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6, 0];

const SLOT_DURATION_OPTIONS = [15, 20, 30, 45, 60];

const CONSULTATION_TYPE_OPTIONS = ['presencial', 'telemedicina', 'domicilio', 'mixto'];

const formatLocalDate = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para rango semanal (Lunes a Domingo)
const getWeekRange = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const curr = new Date(y, m - 1, d);
  const day = curr.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return [monday, sunday];
};

// Helper para obtener los 7 días de la semana
const getWeekDays = (dateStr) => {
  const [monday] = getWeekRange(dateStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

// Helper para rango mensual (inicio a fin de mes)
const getMonthRange = (dateStr) => {
  const [y, m] = dateStr.split('-').map(Number);
  const firstDay = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0);
  return [firstDay, lastDay];
};

// Helper para matriz del calendario mensual (35 o 42 celdas)
const getMonthCalendarDays = (dateStr) => {
  const [y, m] = dateStr.split('-').map(Number);
  const firstDayOfMonth = new Date(y, m - 1, 1);
  const lastDayOfMonth = new Date(y, m, 0);

  const firstDayWeekIndex = firstDayOfMonth.getDay();
  const padLeft = firstDayWeekIndex === 0 ? 6 : firstDayWeekIndex - 1; // Lunes = 0

  const calendarDays = [];

  for (let i = padLeft; i > 0; i--) {
    const d = new Date(y, m - 1, 1 - i);
    calendarDays.push({ date: d, isCurrentMonth: false, dateStr: formatLocalDate(d) });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(y, m - 1, i);
    calendarDays.push({ date: d, isCurrentMonth: true, dateStr: formatLocalDate(d) });
  }

  const remaining = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(y, m, i);
    calendarDays.push({ date: d, isCurrentMonth: false, dateStr: formatLocalDate(d) });
  }

  return calendarDays;
};

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
  const navigate = useNavigate();

  // Pestaña activa: 'appointments' (citas) o 'availability' (horarios)
  const [activeTab, setActiveTab] = useState('appointments');

  // Estado de Disponibilidad
  const [days, setDays] = useState(buildInitialDays);
  const [slotDuration, setSlotDuration] = useState(30);
  const [consultationType, setConsultationType] = useState('presencial');
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estado de Citas
  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Cargar disponibilidad semanal
  useEffect(() => {
    const loadAgenda = async () => {
      try {
        setLoadingAvailability(true);
        const profileRes = await doctorService.getMyProfile();
        const profile = profileRes?.data || profileRes;
        if (!profile || !profile.id) {
          throw new Error('No se pudo identificar el perfil del médico.');
        }

        const activeAvailability = (profile.availability || []).filter((a) => a.isActive !== false);

        setDays(
          DISPLAY_DAYS.map((dayOfWeek) => {
            const daySchedules = activeAvailability.filter((a) => a.dayOfWeek === dayOfWeek);
            const dayName = doctorService.getDayName(dayOfWeek);
            if (daySchedules.length === 0) {
              return { dayOfWeek, dayName, enabled: false, blocks: [] };
            }
            return {
              dayOfWeek,
              dayName,
              enabled: true,
              blocks: daySchedules.map((slot) => ({
                startTime: (slot.startTime || '08:00').substring(0, 5),
                endTime: (slot.endTime || '12:00').substring(0, 5)
              }))
            };
          })
        );

        if (activeAvailability.length > 0) {
          const first = activeAvailability[0];
          if (first.slotDuration) setSlotDuration(first.slotDuration);
          if (first.consultationType) setConsultationType(first.consultationType);
        }
      } catch (err) {
        console.error('Error cargando agenda:', err);
        setError(err.response?.data?.message || err.message || 'Error al cargar tu agenda. Intenta nuevamente.');
      } finally {
        setLoadingAvailability(false);
      }
    };

    loadAgenda();
  }, []);

  // Modo de visualización: 'day' (Día) | 'week' (Semana) | 'month' (Mes)
  const [viewMode, setViewMode] = useState('day');
  // Filtro para mostrar/ocultar citas canceladas y reprogramadas
  const [showCancelled, setShowCancelled] = useState(false);

  // Cargar citas según el modo de vista activo (día, semana o mes)
  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      let list = [];
      const queryParams = showCancelled ? { includeCancelled: 'true' } : {};

      if (viewMode === 'day') {
        const response = await appointmentService.getDoctorToday({ date: selectedDate, ...queryParams });
        list = response.data || [];
      } else if (viewMode === 'week') {
        const [start, end] = getWeekRange(selectedDate);
        const response = await appointmentService.getDoctorToday({
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
          ...queryParams
        });
        list = response.data || [];

        // Respaldo de compatibilidad: si la búsqueda por rango no devolvió citas
        // (por si el backend en Render aún no termina de desplegar el soporte de rango),
        // consultamos en paralelo los 7 días de la semana activa.
        if (list.length === 0) {
          const weekDaysList = getWeekDays(selectedDate).map((d) => formatLocalDate(d));
          const dailyResponses = await Promise.all(
            weekDaysList.map((d) =>
              appointmentService.getDoctorToday({ date: d, ...queryParams }).catch(() => ({ data: [] }))
            )
          );
          const fallbackList = dailyResponses.flatMap((r) => r.data || []);
          if (fallbackList.length > 0) {
            list = fallbackList;
          }
        }
      } else if (viewMode === 'month') {
        const [start, end] = getMonthRange(selectedDate);
        const response = await appointmentService.getDoctorToday({
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
          ...queryParams
        });
        list = response.data || [];
      }

      setAppointments(list);
      setPendingCount(list.filter((a) => a.status === 'pending').length);
    } catch (err) {
      console.error('Error cargando citas del médico:', err);
      toast.error('No pudimos cargar las citas para este período');
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab, selectedDate, viewMode, showCancelled]);

  // Manejo de Aprobación de Pre-Cita
  const handleConfirmAppointment = async (id) => {
    try {
      await appointmentService.confirm(id);
      toast.success('¡Cita confirmada exitosamente!');
      fetchAppointments();
    } catch (err) {
      console.error('Error confirming appointment:', err);
      toast.error(err.response?.data?.message || 'Error al confirmar la cita');
    }
  };

  // Manejo de Rechazo / Cancelación de Cita
  const handleCancelAppointment = async (id) => {
    const reason = window.prompt('Indica el motivo de la cancelación o rechazo:');
    if (reason === null) return;
    try {
      await appointmentService.cancel(id, reason.trim() || 'Cancelada por el consultorio médico');
      toast.success('Cita cancelada y turno liberado');
      fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error(err.response?.data?.message || 'Error al cancelar la cita');
    }
  };

  // Estado Modal de Completar Cita
  const [completeModal, setCompleteModal] = useState({
    open: false,
    appointmentId: null,
    patientName: '',
    doctorNotes: '',
    diagnosis: '',
    submitting: false
  });

  const handleOpenCompleteModal = (apt) => {
    setCompleteModal({
      open: true,
      appointmentId: apt.id,
      patientName: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim(),
      doctorNotes: apt.doctorNotes || '',
      diagnosis: apt.diagnosis || '',
      submitting: false
    });
  };

  const handleCloseCompleteModal = () => {
    setCompleteModal({
      open: false,
      appointmentId: null,
      patientName: '',
      doctorNotes: '',
      diagnosis: '',
      submitting: false
    });
  };

  const handleSubmitComplete = async (e) => {
    if (e) e.preventDefault();
    if (!completeModal.appointmentId) return;

    setCompleteModal((prev) => ({ ...prev, submitting: true }));
    try {
      await appointmentService.complete(completeModal.appointmentId, {
        doctorNotes: completeModal.doctorNotes.trim() || undefined,
        diagnosis: completeModal.diagnosis.trim() || undefined
      });
      toast.success('¡Consulta completada exitosamente!');
      handleCloseCompleteModal();
      fetchAppointments();
    } catch (err) {
      console.error('Error completing appointment:', err);
      toast.error(err.response?.data?.message || 'Error al completar la cita');
      setCompleteModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleMarkNoShow = async (id) => {
    if (!window.confirm('¿Marcar al paciente como no asistió a esta cita?')) return;
    try {
      await appointmentService.markNoShow(id);
      toast.success('Cita marcada como no asistió');
      fetchAppointments();
    } catch (err) {
      console.error('Error marking no show:', err);
      toast.error(err.response?.data?.message || 'Error al marcar como no asistió');
    }
  };

  // Navegación de fechas según el modo de visualización activo
  const changeDateByDelta = (delta) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const curr = new Date(year, month - 1, day);
    if (viewMode === 'day') {
      curr.setDate(curr.getDate() + delta);
    } else if (viewMode === 'week') {
      curr.setDate(curr.getDate() + (delta * 7));
    } else if (viewMode === 'month') {
      curr.setMonth(curr.getMonth() + delta);
    }
    setSelectedDate(formatLocalDate(curr));
  };

  const setDateToToday = () => {
    setSelectedDate(formatLocalDate(new Date()));
  };

  const getHeaderTitle = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (viewMode === 'day') {
      return dt.toLocaleDateString('es-VE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else if (viewMode === 'week') {
      const [start, end] = getWeekRange(selectedDate);
      const startStr = start.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: 'numeric' });
      return `Semana: ${startStr} – ${endStr}`;
    } else {
      return dt.toLocaleDateString('es-VE', {
        month: 'long',
        year: 'numeric'
      });
    }
  };

  // Métodos de disponibilidad
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

  const handleSaveAvailability = async () => {
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
        toast.success('Disponibilidad guardada');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Mi Agenda Médica
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus citas programadas y configura los horarios de atención para tus pacientes.
          </p>
        </motion.div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`pb-3 px-4 font-semibold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'appointments'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Clock className="w-5 h-5" />
            Citas Programadas
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`pb-3 px-4 font-semibold text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'availability'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Configurar Disponibilidad
          </button>
        </div>

        {/* CONTENIDO PESTAÑA 1: CITAS PROGRAMADAS */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            {/* Barra de Control de Vistas y Fecha */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Selector de Modo: Día / Semana / Mes */}
                <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold w-full sm:w-auto justify-center">
                  <button
                    type="button"
                    onClick={() => setViewMode('day')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      viewMode === 'day'
                        ? 'bg-white text-primary shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Día
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('week')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      viewMode === 'week'
                        ? 'bg-white text-primary shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <CalendarRange className="w-3.5 h-3.5" />
                    Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      viewMode === 'month'
                        ? 'bg-white text-primary shadow-sm font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Mes
                  </button>
                </div>

                {/* Botón de acceso rápido a fecha actual y filtro */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={setDateToToday}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition"
                  >
                    {viewMode === 'day' ? 'Hoy' : viewMode === 'week' ? 'Esta Semana' : 'Este Mes'}
                  </button>
                  {viewMode === 'day' && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition ml-auto sm:ml-0">
                    <input
                      type="checkbox"
                      checked={showCancelled}
                      onChange={(e) => setShowCancelled(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span>Ver canceladas / reprogramadas</span>
                  </label>
                </div>
              </div>

              {/* Navegación temporal (< Titulo >) */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => changeDateByDelta(-1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-base sm:text-lg capitalize">
                    {getHeaderTitle()}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {appointments.length} cita{appointments.length !== 1 ? 's' : ''} {showCancelled ? '(incluyendo historial)' : 'activas en este período'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => changeDateByDelta(1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Spinner de Carga */}
            {loadingAppointments && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Cargando citas de la agenda...</p>
              </div>
            )}

            {/* VISTA 1: DÍA (DETALLADA) */}
            {!loadingAppointments && viewMode === 'day' && (
              <>
                {appointments.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      Sin citas para este día
                    </h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                      No hay pacientes agendados ni solicitudes pendientes para esta fecha.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('availability')}
                      className="text-primary hover:underline text-sm font-semibold inline-flex items-center gap-1"
                    >
                      Ver disponibilidad configurada →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((apt) => {
                      const todayCaracasStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
                      const aptDateStr = typeof apt.appointmentDate === 'string'
                        ? apt.appointmentDate.split('T')[0]
                        : '';
                      const isAptToday = aptDateStr === todayCaracasStr;
                      const isPending = apt.status === 'pending';
                      const isConfirmed = apt.status === 'confirmed';
                      const isInProgress = apt.status === 'in-progress' || apt.status === 'in_consultation';
                      const isCompleted = apt.status === 'completed';
                      const isNoShow = apt.status === 'no_show' || apt.status === 'no-show';
                      const isCancelled = apt.status.startsWith('cancelled');
                      const isRescheduled = apt.status === 'rescheduled';

                      return (
                        <div
                          key={apt.id}
                          className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                            isPending
                              ? 'border-amber-300 bg-amber-50/20'
                              : isConfirmed || isInProgress
                              ? 'border-green-200 hover:shadow-md'
                              : isCompleted
                              ? 'border-teal-200 bg-teal-50/10'
                              : isRescheduled
                              ? 'border-purple-200 bg-purple-50/20 opacity-75'
                              : 'border-gray-200 opacity-75'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="bg-primary/10 text-primary p-3 rounded-xl flex flex-col items-center justify-center min-w-[70px]">
                                <Clock className="w-4 h-4 mb-1" />
                                <span className="font-bold text-sm">{apt.appointmentTime}</span>
                                <span className="text-[10px] text-gray-500">{apt.duration || 30} min</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h4 className="font-bold text-gray-900 text-lg">
                                    {apt.patient?.firstName} {apt.patient?.lastName}
                                  </h4>
                                  {isPending && (
                                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-bold animate-pulse">
                                      ⏳ Solicitud Pendiente
                                    </span>
                                  )}
                                  {isConfirmed && (
                                    <span className="px-2.5 py-0.5 bg-green-100 text-green-800 border border-green-300 rounded-full text-xs font-semibold">
                                      ✓ Confirmada
                                    </span>
                                  )}
                                  {isInProgress && (
                                    <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-xs font-semibold">
                                      👨‍⚕️ En Consulta
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 border border-teal-300 rounded-full text-xs font-semibold">
                                      ✓ Atendida / Completada
                                    </span>
                                  )}
                                  {isNoShow && (
                                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-xs font-semibold">
                                      ✗ No Asistió
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                                      ✗ Cancelada
                                    </span>
                                  )}
                                  {isRescheduled && (
                                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded-full text-xs font-semibold">
                                      🔄 Reprogramada a otra fecha
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm mb-2">
                                  <span className="font-medium text-gray-700">Motivo:</span> {apt.reasonForVisit || 'Consulta general'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                  {(apt.clinic || apt.clinicLocation || apt.locationAddress) && (
                                    <span className="flex items-center gap-1 text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded">
                                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                                      <span>{apt.clinic?.commercialName || apt.clinicLocation?.name || 'Consultorio Principal'}{apt.clinicLocation?.city ? ` · ${apt.clinicLocation.city}` : ''}</span>
                                    </span>
                                  )}
                                  {apt.patient?.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                                      {apt.patient.phone}
                                    </span>
                                  )}
                                  {apt.patient?.email && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                                      {apt.patient.email}
                                    </span>
                                  )}
                                </div>

                                {/* Detalle de notas médicas y diagnóstico si la cita está completada */}
                                {isCompleted && (apt.diagnosis || apt.doctorNotes) && (
                                  <div className="mt-2.5 p-3 bg-teal-50/60 rounded-lg border border-teal-100 text-xs text-gray-700 space-y-1">
                                    {apt.diagnosis && (
                                      <div>
                                        <span className="font-semibold text-teal-900">Diagnóstico:</span> {apt.diagnosis}
                                      </div>
                                    )}
                                    {apt.doctorNotes && (
                                      <div>
                                        <span className="font-semibold text-teal-900">Notas clínicas:</span> {apt.doctorNotes}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmAppointment(apt.id)}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                                  >
                                    <Check className="w-4 h-4" />
                                    Aceptar Cita
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelAppointment(apt.id)}
                                    className="px-3 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition flex items-center gap-1"
                                  >
                                    <X className="w-4 h-4" />
                                    Rechazar
                                  </button>
                                </>
                              )}
                              {(isConfirmed || isInProgress) && (
                                <>
                                  {isAptToday && (
                                    <button
                                      type="button"
                                      onClick={() => navigate('/medico/sala-espera')}
                                      className="px-3.5 py-2 bg-primary text-white hover:bg-primary/90 text-sm font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                                      title="Ir a atender a la Sala de Espera"
                                    >
                                      <Users className="w-4 h-4" />
                                      Atender
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCompleteModal(apt)}
                                    className="px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-sm font-semibold rounded-lg transition flex items-center gap-1.5"
                                    title="Finalizar y registrar notas de la consulta"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Completar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkNoShow(apt.id)}
                                    className="px-3 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-medium rounded-lg transition flex items-center gap-1"
                                    title="Marcar paciente como no asistió"
                                  >
                                    No asistió
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelAppointment(apt.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Cancelar cita"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* VISTA 2: SEMANA (7 COLUMNAS) */}
            {!loadingAppointments && viewMode === 'week' && (
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {getWeekDays(selectedDate).map((dayDate) => {
                  const dateStr = formatLocalDate(dayDate);
                  const dayApts = appointments.filter((a) => a.appointmentDate === dateStr);
                  const isToday = dateStr === formatLocalDate(new Date());
                  const dayName = dayDate.toLocaleDateString('es-VE', { weekday: 'short' });
                  const dayNum = dayDate.getDate();

                  return (
                    <div
                      key={dateStr}
                      className={`bg-white rounded-xl border p-3 flex flex-col transition-all min-h-[260px] ${
                        isToday ? 'border-primary/60 ring-1 ring-primary/20 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      {/* Header de Columna de Día */}
                      <div
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setViewMode('day');
                        }}
                        className="flex items-center justify-between border-b pb-2 mb-2 cursor-pointer hover:opacity-80 transition"
                        title="Clic para ver detalle de este día"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-gray-500 block">
                            {dayName}
                          </span>
                          <span className={`text-lg font-black ${isToday ? 'text-primary' : 'text-gray-800'}`}>
                            {dayNum}
                          </span>
                        </div>
                        {dayApts.length > 0 && (
                          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                            {dayApts.length}
                          </span>
                        )}
                      </div>

                      {/* Lista de citas de este día */}
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px]">
                        {dayApts.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-8">Sin citas</p>
                        ) : (
                          dayApts.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setViewMode('day');
                              }}
                              className={`p-2 rounded-lg border text-xs cursor-pointer transition hover:scale-[1.02] ${
                                apt.status === 'pending'
                                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                                  : apt.status === 'confirmed'
                                  ? 'bg-green-50 border-green-200 text-green-900'
                                  : apt.status === 'rescheduled'
                                  ? 'bg-purple-50 border-purple-200 text-purple-900 opacity-75'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 opacity-75 line-through'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span>{apt.appointmentTime}</span>
                                <span className="text-[10px]">
                                  {apt.status === 'pending'
                                    ? '⏳ Pendiente'
                                    : apt.status === 'confirmed'
                                    ? '✓ Confirmada'
                                    : apt.status === 'rescheduled'
                                    ? '🔄 Reprog.'
                                    : '✗ Cancelada'}
                                </span>
                              </div>
                              <p className="font-semibold truncate">
                                {apt.patient?.firstName} {apt.patient?.lastName}
                              </p>
                              {apt.clinic?.commercialName && (
                                <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                  {apt.clinic.commercialName}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISTA 3: MES (CUADRÍCULA CALENDARIO) */}
            {!loadingAppointments && viewMode === 'month' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                {/* Cabecera días de semana */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase text-gray-500 mb-2 py-2 border-b">
                  <span>Lun</span>
                  <span>Mar</span>
                  <span>Mié</span>
                  <span>Jue</span>
                  <span>Vie</span>
                  <span>Sáb</span>
                  <span>Dom</span>
                </div>

                {/* Cuadrícula de 35 o 42 celdas */}
                <div className="grid grid-cols-7 gap-1">
                  {getMonthCalendarDays(selectedDate).map((cell, idx) => {
                    const dayApts = appointments.filter((a) => a.appointmentDate === cell.dateStr);
                    const isToday = cell.dateStr === formatLocalDate(new Date());
                    const pendingCountInDay = dayApts.filter((a) => a.status === 'pending').length;

                    return (
                      <div
                        key={cell.dateStr + idx}
                        onClick={() => {
                          setSelectedDate(cell.dateStr);
                          setViewMode('day');
                        }}
                        className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-lg border transition cursor-pointer flex flex-col justify-between hover:border-primary/60 hover:bg-primary/5 ${
                          !cell.isCurrentMonth
                            ? 'bg-gray-50/50 border-gray-100 text-gray-300 opacity-50'
                            : isToday
                            ? 'bg-blue-50/50 border-primary/50'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                        title="Clic para ver detalle de este día"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                              isToday ? 'bg-primary text-white font-bold' : ''
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>
                          {pendingCountInDay > 0 && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                              title={`${pendingCountInDay} solicitud(es) pendiente(s)`}
                            />
                          )}
                        </div>

                        <div className="space-y-1 mt-1 overflow-hidden">
                          {dayApts.slice(0, 2).map((apt) => (
                            <div
                              key={apt.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                                apt.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : apt.status === 'rescheduled'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200 line-through opacity-70'
                                  : apt.status.startsWith('cancelled')
                                  ? 'bg-gray-100 text-gray-500 border border-gray-200 line-through opacity-70'
                                  : 'bg-green-100 text-green-800 border border-green-200'
                              }`}
                            >
                              {apt.appointmentTime} {apt.patient?.firstName || 'Cita'}
                            </div>
                          ))}
                          {dayApts.length > 2 && (
                            <div className="text-[9px] font-bold text-primary pl-1">
                              +{dayApts.length - 2} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENIDO PESTAÑA 2: CONFIGURAR DISPONIBILIDAD */}
        {activeTab === 'availability' && (
          <div>
            {loadingAvailability ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Cargando configuración de horarios...</p>
              </div>
            ) : (
              <>
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
                    onClick={handleSaveAvailability}
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Completar Cita */}
      {completeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-lg">
                Completar Consulta {completeModal.patientName ? `— ${completeModal.patientName}` : ''}
              </h3>
              <button
                type="button"
                onClick={handleCloseCompleteModal}
                disabled={completeModal.submitting}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitComplete}>
              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="agenda-diagnosis" className="block text-sm font-semibold text-gray-700 mb-1">
                    Diagnóstico (opcional)
                  </label>
                  <input
                    id="agenda-diagnosis"
                    type="text"
                    value={completeModal.diagnosis}
                    onChange={(e) => setCompleteModal((prev) => ({ ...prev, diagnosis: e.target.value }))}
                    disabled={completeModal.submitting}
                    placeholder="Ej. Rinofaringitis aguda, Control de rutina..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label htmlFor="agenda-notes" className="block text-sm font-semibold text-gray-700 mb-1">
                    Notas médicas / Observaciones clínicas (opcional)
                  </label>
                  <textarea
                    id="agenda-notes"
                    rows={4}
                    value={completeModal.doctorNotes}
                    onChange={(e) => setCompleteModal((prev) => ({ ...prev, doctorNotes: e.target.value }))}
                    disabled={completeModal.submitting}
                    placeholder="Evolución clínica, indicaciones generales o plan terapéutico..."
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseCompleteModal}
                  disabled={completeModal.submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={completeModal.submitting}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow transition flex items-center gap-1.5"
                >
                  {completeModal.submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Completar Consulta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAgendaPage;
