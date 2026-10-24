/**
 * AssistantPortalPage.jsx - CITAMED.VE
 * Portal principal de la asistente (/asistente)
 * Visualización de invitaciones pendientes, selector de médico activo y accesos permitidos
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  Stethoscope,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Lock,
  Loader2
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import AssistantDoctorBanner from '../../components/assistant/AssistantDoctorBanner';
import assistantService from '../../services/assistantService';
import toast from 'react-hot-toast';

export default function AssistantPortalPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState([]);
  const [activeDoctorId, setActiveDoctorId] = useState(
    localStorage.getItem('citamed_acting_doctor_id') || ''
  );
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await assistantService.getMyDoctors();
      const all = res.data || [];
      setLinks(all);

      const active = all.filter((l) => l.status === 'active');
      const savedId = localStorage.getItem('citamed_acting_doctor_id');
      const matched = active.find((l) => String(l.doctorId) === String(savedId));

      if (matched) {
        setActiveDoctorId(String(matched.doctorId));
      } else if (active.length > 0) {
        setActiveDoctorId(String(active[0].doctorId));
        localStorage.setItem('citamed_acting_doctor_id', String(active[0].doctorId));
        localStorage.setItem(
          'citamed_acting_doctor_permissions',
          JSON.stringify({
            canAgenda: active[0].canAgenda,
            canPayments: active[0].canPayments,
            canVoidReceipts: active[0].canVoidReceipts
          })
        );
      } else {
        setActiveDoctorId('');
        localStorage.removeItem('citamed_acting_doctor_id');
        localStorage.removeItem('citamed_acting_doctor_permissions');
      }
    } catch (err) {
      console.error('Error al cargar médicos de la asistente:', err);
      toast.error('No se pudieron cargar tus vinculaciones médicas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const activeLinks = links.filter((l) => l.status === 'active');
  const pendingLinks = links.filter((l) => l.status === 'pending');

  const currentActiveLink = activeLinks.find(
    (l) => String(l.doctorId) === String(activeDoctorId)
  );

  const handleAcceptInvitation = async (linkId) => {
    setActionLoading(true);
    try {
      await assistantService.acceptInvitation(linkId);
      toast.success('Invitación aceptada exitosamente');
      await fetchDoctors();
      // Recargar para sincronizar cabeceras y banner
      window.location.reload();
    } catch (err) {
      console.error('Error al aceptar invitación:', err);
      toast.error(err.response?.data?.message || 'No se pudo aceptar la invitación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineInvitation = async (linkId) => {
    if (!window.confirm('¿Seguro que deseas rechazar esta invitación?')) return;

    setActionLoading(true);
    try {
      await assistantService.declineInvitation(linkId);
      toast.success('Invitación rechazada');
      await fetchDoctors();
    } catch (err) {
      console.error('Error al rechazar invitación:', err);
      toast.error(err.response?.data?.message || 'No se pudo rechazar la invitación');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />
      <AssistantDoctorBanner />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ENCABEZADO */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                Panel de Asistente
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Gestiona las agendas, salas de espera y cobros de los médicos con los que colaboras.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Cargando tus vinculaciones médicas...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* INVITACIONES PENDIENTES */}
            {pendingLinks.length > 0 && (
              <section className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-base font-bold text-amber-900">
                    Invitaciones pendientes ({pendingLinks.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingLinks.map((link) => {
                    const doc = link.doctor || {};
                    const specialty = doc.doctorProfile?.specialty?.name;
                    const clinic = doc.doctorProfile?.clinicName;

                    return (
                      <div
                        key={link.id}
                        className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">
                                Dr(a). {doc.firstName} {doc.lastName}
                              </h3>
                              {specialty && (
                                <p className="text-xs text-primary font-medium mt-0.5">
                                  {specialty}
                                </p>
                              )}
                              {clinic && (
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>{clinic}</span>
                                </p>
                              )}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              Pendiente
                            </span>
                          </div>

                          {/* Permisos propuestos */}
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                              Permisos que te otorga:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  link.canAgenda
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {link.canAgenda ? '✓ Agenda y Sala' : '✕ Sin agenda'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  link.canPayments
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {link.canPayments ? '✓ Cobros' : '✕ Sin cobros'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  link.canVoidReceipts
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {link.canVoidReceipts ? '✓ Anular recibos' : '✕ Sin anulación'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Botones Aceptar / Rechazar */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleDeclineInvitation(link.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          >
                            Rechazar
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAcceptInvitation(link.id)}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition shadow-xs"
                          >
                            Aceptar invitación
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* MÉDICO ACTIVO SELECCIONADO */}
            {currentActiveLink ? (
              <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                        {currentActiveLink.doctor?.firstName?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black text-slate-900">
                            Dr(a). {currentActiveLink.doctor?.firstName}{' '}
                            {currentActiveLink.doctor?.lastName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Activo
                          </span>
                        </div>
                        <p className="text-xs text-primary font-semibold mt-0.5">
                          {currentActiveLink.doctor?.doctorProfile?.specialty?.name ||
                            'Especialidad médica'}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      {currentActiveLink.doctor?.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{currentActiveLink.doctor.email}</span>
                        </p>
                      )}
                      {currentActiveLink.doctor?.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{currentActiveLink.doctor.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Permisos concedidos con este médico */}
                  <div className="pt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 mr-2">
                      Permisos asignados:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentActiveLink.canAgenda
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {currentActiveLink.canAgenda ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Agenda y Citas
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentActiveLink.canPayments
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 line-through'
                      }`}
                    >
                      {currentActiveLink.canPayments ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      Cobros y Recibos
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        currentActiveLink.canVoidReceipts
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {currentActiveLink.canVoidReceipts ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {currentActiveLink.canVoidReceipts
                        ? 'Anular recibos'
                        : 'Sin permiso de anular'}
                    </span>
                  </div>
                </div>

                {/* ACCESOS RÁPIDOS */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wide text-xs">
                    Módulos de trabajo
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Tarjeta Mi Agenda */}
                    <div
                      onClick={() =>
                        currentActiveLink.canAgenda && navigate('/medico/agenda')
                      }
                      className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                        currentActiveLink.canAgenda
                          ? 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md cursor-pointer group'
                          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-700 mb-3">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition">
                          Mi Agenda
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Consulta citas programadas, confirma o reprograma turnos de pacientes.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            currentActiveLink.canAgenda ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {currentActiveLink.canAgenda ? 'Abrir agenda →' : 'No autorizado'}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta Sala de Espera */}
                    <div
                      onClick={() =>
                        currentActiveLink.canAgenda && navigate('/medico/sala-espera')
                      }
                      className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                        currentActiveLink.canAgenda
                          ? 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md cursor-pointer group'
                          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 mb-3">
                          <Clock className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition">
                          Sala de Espera
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Llama pacientes en tiempo real y registra su llegada al consultorio.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            currentActiveLink.canAgenda ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {currentActiveLink.canAgenda ? 'Abrir sala →' : 'No autorizado'}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta Cobros */}
                    <div
                      onClick={() =>
                        currentActiveLink.canPayments && navigate('/medico/cobros')
                      }
                      className={`rounded-xl border p-5 transition flex flex-col justify-between ${
                        currentActiveLink.canPayments
                          ? 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md cursor-pointer group'
                          : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center justify-center text-yellow-700 mb-3">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition">
                          Cobros y Recibos
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Valida pagos móviles o transferencias y emite recibos oficiales.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            currentActiveLink.canPayments ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {currentActiveLink.canPayments ? 'Abrir cobros →' : 'No autorizado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              /* ESTADO VACÍO: SIN MÉDICO ACTIVO */
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
                  <Stethoscope className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Sin médicos vinculados todavía
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Pídele al médico que te envíe una invitación desde su panel con tu correo electrónico.
                  Cuando la recibas, podrás aceptarla aquí para comenzar a colaborar.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
