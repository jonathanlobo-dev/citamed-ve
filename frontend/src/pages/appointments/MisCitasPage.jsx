/**
 * MisCitasPage - CITAMED.VE
 * M03 - Mis Citas del Paciente
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Users,
  Timer,
  CalendarClock,
  MessageCircle,
  Phone,
  Star,
  FileText,
  Navigation
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import appointmentService from '../../services/appointmentService';
import toast from 'react-hot-toast';
import './MisCitasPage.css';

const MisCitasPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await appointmentService.getMyAppointments({ all: 'true' });
      setAppointments(response.data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('No pudimos cargar tus citas. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const parseAppointmentDateTime = (apt) => {
    if (!apt?.appointmentDate) return new Date(0);
    const datePart = String(apt.appointmentDate).split('T')[0];
    const timePart = apt.appointmentTime || '23:59:59';
    const [y, m, d] = datePart.split('-').map(Number);
    const [h, min, s] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, h || 0, min || 0, s || 0);
  };

  const getStatusConfig = (status, queueStatus) => {
    // Si la cita fue cancelada o reprogramada, no mostrar estado de cola
    const isInactiveStatus = ['cancelled', 'cancelled_patient', 'cancelled_doctor', 'rescheduled', 'completed', 'no_show'].includes(status);

    if (queueStatus && !isInactiveStatus) {
      const queueConfigs = {
        scheduled: {
          label: '📋 En Cola',
          color: 'bg-blue-100 text-blue-800 border border-blue-300',
          icon: Users
        },
        waiting: {
          label: '⏳ En Espera',
          color: 'bg-amber-100 text-amber-800 border border-amber-300',
          icon: Clock
        },
        called: {
          label: '📢 ¡Es tu Turno!',
          color: 'bg-green-100 text-green-800 border border-green-400',
          icon: AlertCircle,
          animate: true
        },
        in_consultation: {
          label: '👨‍⚕️ En Consulta',
          color: 'bg-purple-100 text-purple-800 border border-purple-400',
          icon: CheckCircle
        }
      };

      if (queueConfigs[queueStatus]) {
        return queueConfigs[queueStatus];
      }
    }

    const configs = {
      pending: {
        label: '⏳ Pendiente',
        color: 'bg-yellow-50 text-yellow-700 border border-yellow-300',
        icon: Clock
      },
      confirmed: {
        label: '✓ Confirmada',
        color: 'bg-blue-50 text-blue-700 border border-blue-300',
        icon: CheckCircle
      },
      scheduled: {
        label: '📅 Programada',
        color: 'bg-indigo-50 text-indigo-700 border border-indigo-300',
        icon: Calendar
      },
      completed: {
        label: '✓ Consulta finalizada',
        color: 'bg-green-50 text-green-700 border border-green-300',
        icon: CheckCircle
      },
      rescheduled: {
        label: '🔄 Reprogramada',
        color: 'bg-amber-100 text-amber-800 border border-amber-300',
        icon: CalendarClock
      },
      in_progress: {
        label: '👨‍⚕️ En Consulta',
        color: 'bg-purple-100 text-purple-800 border border-purple-400',
        icon: CheckCircle
      },
      cancelled: {
        label: '✗ Cancelada',
        color: 'bg-red-50 text-red-600 border border-red-300',
        icon: XCircle
      },
      cancelled_patient: {
        label: '✗ Cancelada por Paciente',
        color: 'bg-red-50 text-red-600 border border-red-300',
        icon: XCircle
      },
      cancelled_doctor: {
        label: '✗ Cancelada por Médico',
        color: 'bg-red-50 text-red-600 border border-red-300',
        icon: XCircle
      },
      no_show: {
        label: '⚠️ No Asistió',
        color: 'bg-orange-50 text-orange-700 border border-orange-300',
        icon: AlertCircle
      }
    };

    return configs[status] || configs.pending;
  };

  const filterAppointments = (appointments, targetFilter = filter) => {
    const now = new Date();

    switch (targetFilter) {
      case 'upcoming':
        return appointments.filter(apt =>
          parseAppointmentDateTime(apt) >= now &&
          !['cancelled', 'cancelled_patient', 'cancelled_doctor', 'completed', 'no_show', 'rescheduled'].includes(apt.status)
        );
      case 'past':
        return appointments.filter(apt =>
          apt.status === 'completed' ||
          (parseAppointmentDateTime(apt) < now && !['cancelled', 'cancelled_patient', 'cancelled_doctor', 'rescheduled'].includes(apt.status))
        );
      case 'cancelled':
        return appointments.filter(apt =>
          ['cancelled', 'cancelled_patient', 'cancelled_doctor', 'rescheduled'].includes(apt.status)
        );
      default:
        return appointments;
    }
  };

  const handleGoToWaitingRoom = (appointmentId) => {
    navigate(`/sala-espera/${appointmentId}`);
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('¿Estás seguro de cancelar esta cita?')) return;

    try {
      await appointmentService.cancel(appointmentId, 'Cancelada por el paciente');
      toast.success('Cita cancelada');
      fetchAppointments();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error('No pudimos cancelar la cita. Por favor intenta de nuevo.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const cleanDateStr = typeof dateStr === 'string' ? dateStr.split('T')[0] : '';
    const todayCaracas = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' }).format(new Date());
    return cleanDateStr === todayCaracas;
  };

  const canEnterWaitingRoom = (appointment) => {
    if (['cancelled', 'cancelled_patient', 'cancelled_doctor', 'rescheduled', 'completed', 'no_show'].includes(appointment.status)) {
      return false;
    }
    // Cita de hoy confirmada o con turno activo
    return isToday(appointment.appointmentDate) && (
      appointment.status === 'confirmed' ||
      ['checked_in', 'waiting', 'called', 'in_consultation'].includes(appointment.queueStatus)
    );
  };

  const filteredAppointments = filterAppointments(appointments);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-primary mb-2">
            Mis Citas
          </h1>
          <p className="text-gray-600 text-lg">
            Gestiona y visualiza tus citas medicas
          </p>
        </motion.div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'all', label: 'Todas', count: appointments.length },
            { key: 'upcoming', label: 'Proximas', count: filterAppointments(appointments, 'upcoming').length },
            { key: 'past', label: 'Pasadas', count: filterAppointments(appointments, 'past').length },
            { key: 'cancelled', label: 'Canceladas', count: filterAppointments(appointments, 'cancelled').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                filter === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                filter === key ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
          <button
            onClick={fetchAppointments}
            className="ml-auto px-4 py-2 rounded-full bg-white text-gray-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchAppointments}
              className="mt-2 text-red-600 underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAppointments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No tienes citas {filter !== 'all' ? 'en esta categoria' : ''}
            </h3>
            <p className="text-gray-500 mb-6">
              Busca un medico y agenda tu primera cita
            </p>
            <button
              onClick={() => navigate('/directorio')}
              className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition"
            >
              Buscar Medicos
            </button>
          </motion.div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appointment, index) => {
            const statusConfig = getStatusConfig(appointment.status, appointment.queueStatus);
            const StatusIcon = statusConfig.icon;
            const todayAppointment = isToday(appointment.appointmentDate);

            return (
              <motion.div
                key={appointment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl shadow-md overflow-hidden border ${
                  todayAppointment ? 'border-primary' : 'border-gray-100'
                }`}
              >
                {todayAppointment && (
                  <div className="bg-primary text-white px-4 py-1 text-sm font-medium">
                    Cita de Hoy
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    {/* Doctor Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {appointment.doctor?.firstName?.[0] || 'D'}
                        {appointment.doctor?.lastName?.[0] || 'R'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.doctorProfile?.specialty?.name || 'Medicina General'}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${statusConfig.color} ${statusConfig.animate ? 'animate-pulse' : ''}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span>{appointment.appointmentTime}</span>
                    </div>
                    {(appointment.clinic || appointment.clinicLocation || appointment.locationAddress) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="truncate">
                          <strong>{appointment.clinic?.commercialName || appointment.clinicLocation?.name || 'Consultorio Médico'}</strong>
                          {appointment.clinicLocation?.addressLine1 && ` · ${appointment.clinicLocation.addressLine1}`}
                          {appointment.clinicLocation?.city && ` (${appointment.clinicLocation.city})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Queue Position Info */}
                  {appointment.queuePosition && !['cancelled', 'cancelled_patient', 'cancelled_doctor', 'rescheduled', 'completed', 'no_show'].includes(appointment.status) && (
                    <div className="mt-4 flex items-center gap-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg px-4 py-3 border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm text-indigo-800">
                          <strong>Posicion #{appointment.queuePosition}</strong>
                          {appointment.queuePosition === 1 && ' - Primero en la cola'}
                        </span>
                      </div>
                      {appointment.queuePosition > 1 && (
                        <div className="flex items-center gap-2 text-blue-700">
                          <Timer className="w-4 h-4" />
                          <span className="text-sm">
                            {appointment.queuePosition - 1} persona(s) antes de ti
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    {/* Indicador de cita reprogramada */}
                    {appointment.status === 'rescheduled' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-lg font-medium">
                        <CalendarClock className="w-4 h-4 text-amber-600" />
                        Esta cita fue transferida a una nueva fecha y hora
                      </span>
                    )}

                    {/* Botón principal: Sala de Espera para citas confirmadas de hoy */}
                    {canEnterWaitingRoom(appointment) && (
                      <button
                        onClick={() => handleGoToWaitingRoom(appointment.id)}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-semibold"
                      >
                        <Users className="w-4 h-4" />
                        Ir a Sala de Espera
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Cita de hoy pending: Esperando confirmación del médico */}
                    {isToday(appointment.appointmentDate) && appointment.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-300 px-3 py-2 rounded-lg font-medium">
                        <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        Esperando confirmación del médico
                      </span>
                    )}

                    {/* Reprogramar cita */}
                    {['pending', 'scheduled', 'confirmed'].includes(appointment.status) && (
                      <button
                        onClick={() => navigate(`/agendar/${appointment.doctorProfile?.id || appointment.doctorProfileId}?reschedule=${appointment.id}`)}
                        className="flex items-center gap-2 border border-blue-300 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                      >
                        <CalendarClock className="w-4 h-4" />
                        Reprogramar
                      </button>
                    )}

                    {/* Cancelar cita */}
                    {['pending', 'scheduled', 'confirmed'].includes(appointment.status) && (
                      <button
                        onClick={() => handleCancelAppointment(appointment.id)}
                        className="flex items-center gap-2 border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}

                    {/* Contactar doctor - siempre visible para citas activas */}
                    {!['cancelled', 'no_show'].includes(appointment.status) && appointment.doctor?.phone && (
                      <a
                        href={`https://wa.me/${appointment.doctor.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-green-300 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}

                    {/* Calificar cita completada */}
                    {appointment.status === 'completed' && !appointment.patientRating && (
                      <button
                        onClick={() => navigate(`/calificar/${appointment.id}`)}
                        className="flex items-center gap-2 bg-yellow-100 text-yellow-700 border border-yellow-300 px-4 py-2 rounded-lg hover:bg-yellow-200 transition"
                      >
                        <Star className="w-4 h-4" />
                        Calificar Consulta
                      </button>
                    )}

                    {/* Ver receta/documentos si hay */}
                    {appointment.status === 'completed' && appointment.prescriptionUrl && (
                      <a
                        href={appointment.prescriptionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-purple-300 text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Receta
                      </a>
                    )}

                    {/* Ver perfil del doctor */}
                    <button
                      onClick={() => navigate(`/doctor/${appointment.doctorProfile?.id || appointment.doctorProfileId}`)}
                      className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <User className="w-4 h-4" />
                      Ver Doctor
                    </button>

                    {/* Cómo llegar - si hay ubicación */}
                    {appointment.locationAddress && (
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(appointment.locationAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Navigation className="w-4 h-4" />
                        Cómo Llegar
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MisCitasPage;
