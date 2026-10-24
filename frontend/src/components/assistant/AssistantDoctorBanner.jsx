/**
 * AssistantDoctorBanner.jsx - CITAMED.VE
 * Barra superior para la asistente: selector de médico activo y navegación rápida
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Stethoscope,
  Calendar,
  Clock,
  DollarSign,
  ChevronDown,
  UserCheck,
  AlertCircle,
  Home
} from 'lucide-react';
import assistantService from '../../services/assistantService';
import { useAuth } from '../../context/AuthContext';

export default function AssistantDoctorBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [activeDoctors, setActiveDoctors] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [currentPermissions, setCurrentPermissions] = useState({
    canAgenda: true,
    canPayments: true,
    canVoidReceipts: false
  });

  useEffect(() => {
    if (user?.role !== 'assistant') {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadDoctors = async () => {
      try {
        const res = await assistantService.getMyDoctors();
        if (!isMounted) return;

        const all = res.data || [];
        const active = all.filter((l) => l.status === 'active');
        const pending = all.filter((l) => l.status === 'pending');

        setActiveDoctors(active);
        setPendingCount(pending.length);

        if (active.length > 0) {
          const savedDoctorId = localStorage.getItem('citamed_acting_doctor_id');
          const matched = active.find((l) => String(l.doctorId) === String(savedDoctorId));

          if (matched) {
            setSelectedDoctorId(String(matched.doctorId));
            setCurrentPermissions({
              canAgenda: matched.canAgenda,
              canPayments: matched.canPayments,
              canVoidReceipts: matched.canVoidReceipts
            });
            localStorage.setItem(
              'citamed_acting_doctor_permissions',
              JSON.stringify({
                canAgenda: matched.canAgenda,
                canPayments: matched.canPayments,
                canVoidReceipts: matched.canVoidReceipts
              })
            );
          } else {
            // Asignar el primer médico activo por defecto
            const first = active[0];
            setSelectedDoctorId(String(first.doctorId));
            setCurrentPermissions({
              canAgenda: first.canAgenda,
              canPayments: first.canPayments,
              canVoidReceipts: first.canVoidReceipts
            });
            localStorage.setItem('citamed_acting_doctor_id', String(first.doctorId));
            localStorage.setItem(
              'citamed_acting_doctor_permissions',
              JSON.stringify({
                canAgenda: first.canAgenda,
                canPayments: first.canPayments,
                canVoidReceipts: first.canVoidReceipts
              })
            );
          }
        } else {
          localStorage.removeItem('citamed_acting_doctor_id');
          localStorage.removeItem('citamed_acting_doctor_permissions');
          setSelectedDoctorId('');
        }
      } catch (err) {
        console.error('Error al cargar médicos de la asistente:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDoctors();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDoctorChange = (newDoctorId) => {
    if (newDoctorId === selectedDoctorId) return;

    const link = activeDoctors.find((l) => String(l.doctorId) === String(newDoctorId));
    if (!link) return;

    localStorage.setItem('citamed_acting_doctor_id', String(newDoctorId));
    localStorage.setItem(
      'citamed_acting_doctor_permissions',
      JSON.stringify({
        canAgenda: link.canAgenda,
        canPayments: link.canPayments,
        canVoidReceipts: link.canVoidReceipts
      })
    );

    // Recargar la página actual para que todos los hooks y endpoints tomen el nuevo X-Acting-Doctor
    window.location.reload();
  };

  if (user?.role !== 'assistant') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between border-b border-slate-800">
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          Cargando contexto de médico...
        </span>
      </div>
    );
  }

  const currentDoctorLink = activeDoctors.find((l) => String(l.doctorId) === String(selectedDoctorId));
  const currentDoctor = currentDoctorLink?.doctor;
  const currentSpecialty = currentDoctor?.doctorProfile?.specialty?.name;

  return (
    <div className="bg-slate-900 text-white text-xs border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Selector de Médico Activo */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-teal-400 rounded-lg border border-slate-700 shrink-0 font-medium">
            <UserCheck className="w-4 h-4 text-teal-400" />
            <span>Trabajando con:</span>
          </div>

          {activeDoctors.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4" />
              <span>Sin médico activo vinculado</span>
            </div>
          ) : activeDoctors.length === 1 ? (
            <div className="flex items-center gap-2 font-semibold text-slate-100">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span>
                Dr(a). {currentDoctor?.firstName} {currentDoctor?.lastName}
              </span>
              {currentSpecialty && (
                <span className="text-slate-400 font-normal hidden sm:inline">
                  · {currentSpecialty}
                </span>
              )}
            </div>
          ) : (
            <div className="relative inline-block text-left w-full sm:w-auto">
              <select
                aria-label="Seleccionar médico para gestionar"
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-slate-800 border border-slate-700 text-white font-semibold text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer"
              >
                {activeDoctors.map((l) => (
                  <option key={l.doctorId} value={String(l.doctorId)}>
                    Dr(a). {l.doctor?.firstName} {l.doctor?.lastName}
                    {l.doctor?.doctorProfile?.specialty?.name ? ` (${l.doctor.doctorProfile.specialty.name})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Pestañas de Navegación Rápida de la Asistente */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/asistente')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
              location.pathname === '/asistente'
                ? 'bg-primary text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </button>

          {currentPermissions.canAgenda && (
            <>
              <button
                type="button"
                onClick={() => navigate('/medico/agenda')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                  location.pathname === '/medico/agenda'
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Agenda</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/medico/sala-espera')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                  location.pathname === '/medico/sala-espera'
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Sala de espera</span>
              </button>
            </>
          )}

          {currentPermissions.canPayments && (
            <button
              type="button"
              onClick={() => navigate('/medico/cobros')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium ${
                location.pathname === '/medico/cobros'
                  ? 'bg-primary text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cobros</span>
            </button>
          )}

          {pendingCount > 0 && location.pathname !== '/asistente' && (
            <button
              type="button"
              onClick={() => navigate('/asistente')}
              className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-bold text-[11px] hover:bg-amber-500/30 transition flex items-center gap-1"
            >
              <span>{pendingCount}</span>
              <span className="hidden sm:inline">invitación pendiente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
