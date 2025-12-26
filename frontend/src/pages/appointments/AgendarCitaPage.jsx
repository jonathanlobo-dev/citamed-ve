/**
 * AgendarCitaPage - CITAMED.VE
 * M03 - Agendar Cita con Doctor
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  MapPin,
  Star,
  Loader,
  Users,
  Timer
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import api from '../../services/api';
import './AgendarCitaPage.css';

const AgendarCitaPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reason, setReason] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newAppointmentId, setNewAppointmentId] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null); // Info de cola virtual

  // Nota: ProtectedRoute ya maneja la autenticacion, no necesitamos redirect aquí

  // Fetch doctor data
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/doctors/${doctorId}`);
        setDoctor(response.data.data);
      } catch (err) {
        console.error('Error fetching doctor:', err);
        setError('No pudimos cargar la informacion del doctor.');
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Fetch available slots when date is selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !doctorId) return;

      try {
        setLoadingSlots(true);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await appointmentService.getAvailableSlots(doctorId, dateStr);
        // Extraer solo las horas únicas de los slots
        const slots = response.data?.slots || [];
        const uniqueSlots = [...new Set(slots.map(s => s.start))].sort();
        setAvailableSlots(uniqueSlots);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, doctorId]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    const startPadding = firstDay.getDay();

    // Padding for previous month
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, disabled: true });
    }

    // Days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isPast = date < today;

      days.push({
        day,
        date,
        disabled: isPast || isWeekend,
        isToday: date.toDateString() === today.toDateString(),
        isSelected: selectedDate?.toDateString() === date.toDateString()
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot || !doctorId || !doctor) return;

    try {
      setBookingInProgress(true);

      const appointmentData = {
        doctorId: doctor.userId || doctor.user?.id,  // ID del usuario doctor
        doctorProfileId: parseInt(doctorId),          // ID del perfil (de la URL)
        appointmentDate: selectedDate.toISOString().split('T')[0],
        appointmentTime: selectedSlot,
        reasonForVisit: reason || 'Consulta general',
        appointmentType: 'first_consultation'
      };

      const response = await appointmentService.create(appointmentData);
      setNewAppointmentId(response.data.id);
      // Guardar info de cola si existe
      if (response.data.queueInfo) {
        setQueueInfo(response.data.queueInfo);
      }
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error booking appointment:', err);
      alert(err.response?.data?.message || 'No pudimos agendar tu cita. Intenta de nuevo.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/directorio')}
            className="text-primary underline"
          >
            Volver al directorio
          </button>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Cita Agendada Exitosamente
            </h2>
            <p className="text-gray-600 mb-2">
              Tu cita con Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
            </p>
            <p className="text-gray-600 mb-4">
              {selectedDate?.toLocaleDateString('es-VE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })} a las {selectedSlot}
            </p>

            {/* Info de Cola Virtual */}
            {queueInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200"
              >
                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Tu Posicion en la Cola Virtual
                </h3>
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">#{queueInfo.position}</div>
                    <div className="text-xs text-blue-700">Posicion</div>
                  </div>
                  {queueInfo.appointmentsAhead > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">{queueInfo.appointmentsAhead}</div>
                      <div className="text-xs text-indigo-700">Antes de ti</div>
                    </div>
                  )}
                  {queueInfo.estimatedWaitMinutes > 0 && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 flex items-center justify-center gap-1">
                        <Timer className="w-5 h-5" />
                        {queueInfo.estimatedWaitMinutes}
                      </div>
                      <div className="text-xs text-purple-700">Min. espera est.</div>
                    </div>
                  )}
                </div>
                {queueInfo.position === 1 && (
                  <p className="text-xs text-green-700 mt-3 font-medium">
                    Eres el primero en la lista del dia
                  </p>
                )}
              </motion.div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/paciente/mis-citas')}
                className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition"
              >
                Ver Mis Citas
              </button>
              {newAppointmentId && (
                <button
                  onClick={() => navigate(`/sala-espera/${newAppointmentId}`)}
                  className="w-full border border-primary text-primary py-3 rounded-lg hover:bg-primary/5 transition"
                >
                  Ir a Sala de Espera Virtual
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header with Doctor Info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-primary mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Volver
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {doctor?.user?.firstName?.[0]}{doctor?.user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Agendar Cita con Dr. {doctor?.user?.firstName} {doctor?.user?.lastName}
              </h1>
              <p className="text-gray-600">{doctor?.specialty?.name || 'Medicina General'}</p>
              <div className="flex items-center gap-4 mt-2">
                {doctor?.averageRating && (
                  <div className="flex items-center text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-gray-600">{doctor.averageRating}</span>
                  </div>
                )}
                {doctor?.consultationFee && (
                  <span className="text-green-600 font-medium">
                    ${doctor.consultationFee}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Selecciona una Fecha
            </h2>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((item, index) => (
                <button
                  key={index}
                  disabled={item.disabled || !item.day}
                  onClick={() => item.date && handleDateSelect(item.date)}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm transition
                    ${!item.day ? 'invisible' : ''}
                    ${item.disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary/10'}
                    ${item.isToday ? 'border-2 border-primary' : ''}
                    ${item.isSelected ? 'bg-primary text-white' : ''}
                  `}
                >
                  {item.day}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Time Slots */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Selecciona una Hora
            </h2>

            {!selectedDate ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Selecciona una fecha para ver horarios disponibles</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No hay horarios disponibles para esta fecha</p>
                <p className="text-sm mt-2">Intenta con otra fecha</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => handleSlotSelect(slot)}
                      className={`
                        py-3 px-4 rounded-lg text-center transition
                        ${selectedSlot === slot
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-primary/10'}
                      `}
                    >
                      {slot}
                    </button>
                  ))}
                </div>

                {selectedSlot && (
                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la consulta (opcional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Describe brevemente el motivo de tu consulta..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                      rows={3}
                    />

                    <button
                      onClick={handleBookAppointment}
                      disabled={bookingInProgress}
                      className="w-full mt-4 bg-primary text-white py-4 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {bookingInProgress ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Agendando...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Confirmar Cita
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgendarCitaPage;
