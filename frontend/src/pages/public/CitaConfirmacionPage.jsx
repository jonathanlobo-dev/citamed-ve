/**
 * CitaConfirmacionPage.jsx - CITAMED.VE
 * Semana 9 / Bloque C - Página pública de confirmación/cancelación de citas (/cita/:token)
 * 
 * Reglas:
 * - Página pública accesible desde enlaces de WhatsApp.
 * - Sin modales: panel lateral (SideDrawer) para cancelación.
 * - Fechas sin hora sin new Date().
 * - Español neutro venezolano (tú), sin guiones largos. Marca CitaMed.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Building,
  ArrowRight,
  Loader2,
  ShieldCheck,
  X
} from 'lucide-react';
import publicService from '../../services/publicService';
import toast from 'react-hot-toast';

// Función segura de formateo de fecha sin new Date() para fechas sin hora (YYYY-MM-DD)
function formatDateWithoutTime(dateStr) {
  if (!dateStr) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr));
  if (!match) return String(dateStr);
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${day} de ${months[month]} de ${year}`;
}

// Función segura de formateo de hora 12h
function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = String(timeStr).split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr || '00'} ${ampm}`;
}

export default function CitaConfirmacionPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Panel lateral (SideDrawer) para cancelación
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadAppointment() {
      try {
        setLoading(true);
        setError(null);
        const res = await publicService.getAppointmentByToken(token);
        if (isMounted) {
          if (res.success && res.data) {
            setAppointment(res.data);
          } else {
            setError(res.message || 'No se encontró la cita especificada.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message || 'El enlace de confirmación no es válido o ha expirado.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (token) {
      loadAppointment();
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Manejar confirmación de asistencia
  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const res = await publicService.confirmAppointment(token, 'whatsapp');
      if (res.success) {
        toast.success('¡Asistencia confirmada exitosamente!');
        setAppointment((prev) => ({
          ...prev,
          status: 'confirmed',
          confirmedVia: 'whatsapp'
        }));
      } else {
        toast.error(res.message || 'No se pudo confirmar la cita.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  // Manejar cancelación desde el SideDrawer
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await publicService.cancelAppointment(token, cancelReason);
      if (res.success) {
        toast.success('Tu cita ha sido cancelada.');
        setAppointment((prev) => ({
          ...prev,
          status: 'cancelled_patient'
        }));
        setDrawerOpen(false);
      } else {
        toast.error(res.message || 'No se pudo cancelar la cita.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cancelar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Verificando datos de tu cita...</p>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Enlace no disponible</h1>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          {error || 'El enlace de confirmación no es válido o la cita ya fue procesada.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
        >
          Ir a CitaMed
        </button>
      </div>
    );
  }

  const isConfirmed = appointment.status === 'confirmed';
  const isCancelled =
    appointment.status === 'cancelled_patient' || appointment.status === 'cancelled_doctor';
  const isPending = appointment.status === 'pending';
  const canInteract = appointment.canConfirmOrCancel && !isCancelled;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Encabezado */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              C
            </div>
            <span className="font-bold text-lg text-primary tracking-tight">CitaMed</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            Confirmación
          </span>
        </div>
      </header>

      {/* Contenido Principal (390 px friendly) */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Saludo personalizado */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-xl font-bold text-slate-900">
            ¡Hola, {appointment.patientFirstName}!
          </h1>
          <p className="text-xs text-slate-600">
            Por favor confirma si podrás asistir a tu próxima consulta médica.
          </p>
        </div>

        {/* Estado actual */}
        {isConfirmed ? (
          <div className="p-4 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-teal-900">¡Asistencia Confirmada!</h2>
              <p className="text-xs text-teal-700 mt-0.5">
                Has confirmado que asistirás a tu cita. El médico y su equipo te esperan en el consultorio.
              </p>
            </div>
          </div>
        ) : isCancelled ? (
          <div className="p-4 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-rose-900">Cita Cancelada</h2>
              <p className="text-xs text-rose-700 mt-0.5">
                Esta cita médica ha sido cancelada. Si deseas reagendar, puedes comunicarte con el consultorio o ingresar a CitaMed.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">Confirmación Pendiente</h2>
              <p className="text-xs text-amber-700 mt-0.5">
                Agradecemos confirmes con anticipación para asegurar tu turno de atención.
              </p>
            </div>
          </div>
        )}

        {/* Tarjeta de Información de la Cita */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          {/* Especialista */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
              {appointment.doctorPhoto ? (
                <img
                  src={appointment.doctorPhoto}
                  alt={appointment.doctorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Stethoscope className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                {appointment.specialty}
              </span>
              <h3 className="text-base font-bold text-slate-900 truncate">
                {appointment.doctorName}
              </h3>
              {appointment.doctorSlug && (
                <button
                  type="button"
                  onClick={() => navigate(`/dr/${appointment.doctorSlug}`)}
                  className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 mt-0.5"
                >
                  Ver perfil del médico →
                </button>
              )}
            </div>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Fecha</span>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {formatDateWithoutTime(appointment.appointmentDate)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Hora</span>
              </div>
              <p className="text-xs font-bold text-slate-800 leading-snug">
                {formatTime12h(appointment.appointmentTime)}
              </p>
            </div>
          </div>

          {/* Lugar de atención */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Lugar de atención</span>
            </div>
            <p className="text-xs font-bold text-slate-800">
              {appointment.clinicName}
            </p>
            {appointment.clinicAddress && (
              <p className="text-[11px] text-slate-600">{appointment.clinicAddress}</p>
            )}
            {appointment.city && (
              <p className="text-[11px] text-slate-500">{appointment.city}</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        {canInteract && (
          <div className="space-y-2 pt-2">
            {!isConfirmed && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Confirmar asistencia</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              disabled={actionLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-rose-600 border border-rose-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>No podré ir (Cancelar cita)</span>
            </button>
          </div>
        )}

        {/* Recordatorio amigable */}
        <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>
            Te sugerimos llegar 10 minutos antes de tu hora programada. Recuerda llevar tus estudios o antecedentes médicos si los posees.
          </p>
        </div>
      </main>

      {/* SideDrawer: Cancelación con motivo opcional (Sin modales) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay oscuro */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel lateral derecho */}
          <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-base text-slate-900">Cancelar cita médica</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-5 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800">
                  ¿Estás seguro de que deseas cancelar tu cita? Esta acción liberará tu turno para otros pacientes.
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700">
                    Motivo de la cancelación (opcional)
                  </label>
                  <textarea
                    id="cancel-reason"
                    rows={3}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Ejemplo: Imprevisto familiar o laboral, reagendaré pronto..."
                    className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Sí, cancelar mi cita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  disabled={actionLoading}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Volver atrás
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
