/**
 * SalaEsperaPage - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA
 * Muestra las citas del dia con opcion de entrar a la sala de espera
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  Users,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  User,
  MapPin,
  Armchair
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import appointmentService from '../../services/appointmentService';

const SalaEsperaPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const fetchTodayAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getMyAppointments();

      // Filtrar solo citas de hoy
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = (response.data || []).filter(apt => {
        const aptDate = new Date(apt.appointmentDate).toISOString().split('T')[0];
        return aptDate === today && ['scheduled', 'confirmed', 'in_progress'].includes(apt.status);
      });

      setAppointments(todayAppointments);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('No pudimos cargar tus citas');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWaitingRoom = (appointmentId) => {
    navigate(`/sala-espera/${appointmentId}`);
  };

  const getStatusBadge = (status) => {
    const configs = {
      scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      in_progress: { label: 'En Curso', color: 'bg-purple-100 text-purple-800', icon: Clock }
    };
    return configs[status] || configs.scheduled;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 py-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }} />
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Armchair className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Sala de Espera Virtual
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Visualiza tu turno en tiempo real. Sin filas, sin esperas innecesarias.
            </p>
          </motion.div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" className="w-full">
            <path d="M0 100L1440 100L1440 0C1200 80 720 80 0 0L0 100Z" fill="white" fillOpacity="0.1"/>
          </svg>
        </div>
      </section>

      {/* Contenido Principal */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl">

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando tus citas de hoy...</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchTodayAppointments}
                className="mt-4 text-red-600 underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Sin citas hoy */}
          {!loading && !error && appointments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center"
            >
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-purple-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                No tienes citas para hoy
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Cuando tengas una cita programada para hoy, podras entrar a la sala de espera virtual y ver tu posicion en tiempo real.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/directorio')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  Buscar Medico
                </button>
                <button
                  onClick={() => navigate('/paciente/mis-citas')}
                  className="px-6 py-3 border border-purple-300 text-purple-700 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Ver Mis Citas
                </button>
              </div>
            </motion.div>
          )}

          {/* Citas de hoy */}
          {!loading && !error && appointments.length > 0 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">
                  Tus Citas de Hoy
                </h2>
                <p className="text-gray-600">
                  Selecciona una cita para entrar a la sala de espera
                </p>
              </div>

              {appointments.map((appointment, index) => {
                const status = getStatusBadge(appointment.status);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        {/* Info del Doctor */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                            {appointment.doctor?.firstName?.[0] || 'D'}
                            {appointment.doctor?.lastName?.[0] || 'R'}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">
                              Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                            </h3>
                            <p className="text-gray-500">
                              {appointment.doctorProfile?.specialty?.name || 'Medicina General'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </div>
                      </div>

                      {/* Detalles */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-5 h-5 text-purple-500" />
                          <span className="font-medium">{appointment.appointmentTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-5 h-5 text-purple-500" />
                          <span>Consulta #{appointment.appointmentNumber?.slice(-4) || '---'}</span>
                        </div>
                        {appointment.locationAddress && (
                          <div className="flex items-center gap-2 text-gray-600 col-span-2 md:col-span-1">
                            <MapPin className="w-5 h-5 text-purple-500" />
                            <span className="truncate">{appointment.locationAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Boton de entrar */}
                      <button
                        onClick={() => handleEnterWaitingRoom(appointment.id)}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg"
                      >
                        <Armchair className="w-6 h-6" />
                        Entrar a Sala de Espera
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Info adicional */}
              <div className="bg-purple-50 rounded-xl p-6 text-center">
                <p className="text-purple-800">
                  <strong>Consejo:</strong> Entra a la sala de espera 15 minutos antes de tu cita
                  para asegurar tu lugar en la cola virtual.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SalaEsperaPage;
