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
  Users, Check, ChevronLeft, ChevronRight, XCircle, Phone, Mail, Building2
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
        const profile = await doctorService.getMyProfile();
        if (!profile || !profile.id) {
          throw new Error('No se pudo identificar el perfil del médico.');
        }

        const summary = await doctorService.getWeeklySummary(profile.id);
        const summaryDays = summary.days || [];

        setDays(
          DISPLAY_DAYS.map((dayOfWeek) => {
            const dayData = summaryDays.find((d) => d.dayOfWeek === dayOfWeek);
            const dayName = doctorService.getDayName(dayOfWeek);
            if (!dayData || !dayData.hasAvailability) {
              return { dayOfWeek, dayName, enabled: false, blocks: [] };
            }
            return {
              dayOfWeek,
              dayName,
              enabled: true,
              blocks: (dayData.slots || []).map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime
              }))
            };
          })
        );

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
        setLoadingAvailability(false);
      }
    };

    loadAgenda();
  }, []);

  // Cargar citas para la fecha seleccionada
  const fetchAppointments = async (dateStr) => {
    try {
      setLoadingAppointments(true);
      const response = await appointmentService.getDoctorToday(dateStr);
      const list = response.data || [];
      setAppointments(list);
      setPendingCount(list.filter((a) => a.status === 'pending').length);
    } catch (err) {
      console.error('Error cargando citas del médico:', err);
      toast.error('No pudimos cargar las citas para esta fecha');
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments(selectedDate);
    }
  }, [activeTab, selectedDate]);

  // Manejo de Aprobación de Pre-Cita
  const handleConfirmAppointment = async (id) => {
    try {
      await appointmentService.confirm(id);
      toast.success('¡Cita confirmada exitosamente!');
      fetchAppointments(selectedDate);
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
      fetchAppointments(selectedDate);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error(err.response?.data?.message || 'Error al cancelar la cita');
    }
  };

  // Navegación de días para citas
  const changeDateByDays = (delta) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const curr = new Date(year, month - 1, day);
    curr.setDate(curr.getDate() + delta);
    setSelectedDate(formatLocalDate(curr));
  };

  const setDateToToday = () => {
    setSelectedDate(formatLocalDate(new Date()));
  };

  const setDateToTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatLocalDate(d));
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
            {/* Control de Fecha */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between">
                <button
                  type="button"
                  onClick={() => changeDateByDays(-1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="text-center sm:text-left">
                  <div className="font-bold text-gray-800 text-base sm:text-lg">
                    {(() => {
                      const [y, m, d] = selectedDate.split('-').map(Number);
                      const dt = new Date(y, m - 1, d);
                      return dt.toLocaleDateString('es-VE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {selectedDate === formatLocalDate(new Date()) ? '• Hoy' : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => changeDateByDays(1)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={setDateToToday}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    selectedDate === formatLocalDate(new Date())
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={setDateToTomorrow}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition"
                >
                  Mañana
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Listado de Citas */}
            {loadingAppointments ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Cargando citas de la fecha...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  Sin citas para esta fecha
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                  No hay pacientes agendados ni solicitudes pendientes para este día.
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
                  const isPending = apt.status === 'pending';
                  const isConfirmed = apt.status === 'confirmed';
                  const isCancelled = apt.status.startsWith('cancelled');

                  return (
                    <div
                      key={apt.id}
                      className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${
                        isPending
                          ? 'border-amber-300 bg-amber-50/20'
                          : isConfirmed
                          ? 'border-green-200 hover:shadow-md'
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
                              {isCancelled && (
                                <span className="px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-semibold">
                                  ✗ Cancelada
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
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
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
                          {isConfirmed && (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate('/medico/sala-espera')}
                                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition flex items-center gap-1.5"
                              >
                                <Users className="w-4 h-4" />
                                Sala de Espera
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
    </div>
  );
}

export default DoctorAgendaPage;
