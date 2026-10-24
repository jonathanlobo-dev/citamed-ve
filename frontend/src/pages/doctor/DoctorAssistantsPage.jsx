/**
 * DoctorAssistantsPage.jsx - CITAMED.VE
 * Página para el médico: gestión e invitación de asistentes y control de permisos
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  Trash2,
  Loader2,
  Clock
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import assistantService from '../../services/assistantService';
import toast from 'react-hot-toast';

export default function DoctorAssistantsPage() {
  const [loading, setLoading] = useState(true);
  const [assistants, setAssistants] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Formulario de invitación
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    canAgenda: true,
    canPayments: true,
    canVoidReceipts: false
  });

  const fetchAssistants = useCallback(async () => {
    try {
      const res = await assistantService.getMyAssistants();
      setAssistants(res.data || []);
    } catch (err) {
      console.error('Error al cargar asistentes:', err);
      toast.error('No se pudo cargar la lista de asistentes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssistants();
  }, [fetchAssistants]);

  // Formato seguro de fecha (YYYY-MM-DD o ISO a DD/MM/YYYY)
  const formatDateSafe = (isoStr) => {
    if (!isoStr) return '';
    try {
      const datePart = String(isoStr).split('T')[0];
      const [y, m, d] = datePart.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
      return datePart;
    } catch {
      return String(isoStr);
    }
  };

  const handleOpenDrawer = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      canAgenda: true,
      canPayments: true,
      canVoidReceipts: false
    });
    setDrawerOpen(true);
  };

  const handleSubmitInvite = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error('Por favor introduce el correo de la asistente');
      return;
    }

    setSubmitting(true);
    try {
      await assistantService.inviteAssistant({
        email: formData.email.trim(),
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        permissions: {
          canAgenda: formData.canAgenda,
          canPayments: formData.canPayments,
          canVoidReceipts: formData.canVoidReceipts
        }
      });

      toast.success('Invitación enviada exitosamente');
      setDrawerOpen(false);
      await fetchAssistants();
    } catch (err) {
      console.error('Error al invitar asistente:', err);
      toast.error(err.response?.data?.message || 'Error al enviar la invitación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePermission = async (link, field, currentValue) => {
    const newValue = !currentValue;
    const newPerms = {
      canAgenda: field === 'canAgenda' ? newValue : link.canAgenda,
      canPayments: field === 'canPayments' ? newValue : link.canPayments,
      canVoidReceipts: field === 'canVoidReceipts' ? newValue : link.canVoidReceipts
    };

    // Si apaga pagos, automáticamente apaga anular recibos
    if (field === 'canPayments' && !newValue) {
      newPerms.canVoidReceipts = false;
    }

    setUpdatingId(link.id);
    try {
      await assistantService.updatePermissions(link.id, newPerms);
      toast.success('Permisos actualizados');
      // Actualizar estado local
      setAssistants((prev) =>
        prev.map((item) => (item.id === link.id ? { ...item, ...newPerms } : item))
      );
    } catch (err) {
      console.error('Error al actualizar permisos:', err);
      toast.error(err.response?.data?.message || 'No se pudieron actualizar los permisos');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRevoke = async (link) => {
    const name = link.assistant
      ? `${link.assistant.firstName || ''} ${link.assistant.lastName || ''}`.trim()
      : 'esta asistente';

    if (!window.confirm(`¿Seguro que deseas desvincular a ${name}? Ya no tendrá acceso a tu agenda ni cobros.`)) {
      return;
    }

    setUpdatingId(link.id);
    try {
      await assistantService.revokeAssistant(link.id);
      toast.success('Asistente desvinculada exitosamente');
      await fetchAssistants();
    } catch (err) {
      console.error('Error al desvincular asistente:', err);
      toast.error(err.response?.data?.message || 'Error al desvincular asistente');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrPending = assistants.filter((a) => a.status !== 'revoked');
  const revoked = assistants.filter((a) => a.status === 'revoked');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ENCABEZADO */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">
                Mi Asistente
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Invita a tu secretaria o asistente y define qué permisos tiene en tu consultorio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenDrawer}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invitar asistente</span>
          </button>
        </header>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Cargando asistentes...</p>
          </div>
        ) : assistants.length === 0 ? (
          /* ESTADO VACÍO */
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Aún no tienes asistentes vinculadas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-6">
              Invita a tu secretaria para que gestione tu agenda y valide cobros en tu nombre,
              manteniendo tus historias clínicas totalmente privadas.
            </p>
            <button
              type="button"
              onClick={handleOpenDrawer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-xl transition shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invitar mi primera asistente</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ASISTENTES ACTIVAS Y PENDIENTES */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Asistentes vinculadas ({activeOrPending.length})
              </h2>

              {activeOrPending.map((link) => {
                const asst = link.assistant || {};
                const fullName = `${asst.firstName || ''} ${asst.lastName || ''}`.trim() || 'Sin nombre asignado';
                const isPending = link.status === 'pending';
                const isUpdating = updatingId === link.id;

                return (
                  <div
                    key={link.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    {/* Información de la Asistente */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-base font-black text-slate-900">
                          {fullName}
                        </h3>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Invitación pendiente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Activa
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                        {asst.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {asst.email}
                          </span>
                        )}
                        {asst.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {asst.phone}
                          </span>
                        )}
                        {link.invitedAt && (
                          <span className="text-slate-400">
                            Invitada: {formatDateSafe(link.invitedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Interruptores de Permisos */}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5">
                      {/* Permiso Agenda */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          disabled={isUpdating}
                          checked={link.canAgenda}
                          onChange={() => handleTogglePermission(link, 'canAgenda', link.canAgenda)}
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                        />
                        <span>Agenda</span>
                      </label>

                      {/* Permiso Cobros */}
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          disabled={isUpdating}
                          checked={link.canPayments}
                          onChange={() => handleTogglePermission(link, 'canPayments', link.canPayments)}
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                        />
                        <span>Cobros</span>
                      </label>

                      {/* Permiso Anular Recibos */}
                      <label
                        className={`flex items-center gap-2 text-xs font-semibold select-none ${
                          link.canPayments
                            ? 'text-slate-700 cursor-pointer'
                            : 'text-slate-400 cursor-not-allowed opacity-60'
                        }`}
                        title={
                          !link.canPayments
                            ? 'Debes activar cobros para habilitar la anulación de recibos'
                            : 'Permite a la asistente anular recibos emitidos'
                        }
                      >
                        <input
                          type="checkbox"
                          disabled={isUpdating || !link.canPayments}
                          checked={link.canVoidReceipts}
                          onChange={() =>
                            handleTogglePermission(link, 'canVoidReceipts', link.canVoidReceipts)
                          }
                          className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                        />
                        <span>Anular recibos</span>
                      </label>

                      {/* Botón Desvincular */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleRevoke(link)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition ml-2"
                        title="Desvincular asistente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desvincular</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ASISTENTES DESVINCULADAS (HISTÓRICO) */}
            {revoked.length > 0 && (
              <div className="space-y-3 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Historial de asistentes desvinculadas ({revoked.length})
                </h3>
                <div className="space-y-2">
                  {revoked.map((link) => {
                    const asst = link.assistant || {};
                    const fullName = `${asst.firstName || ''} ${asst.lastName || ''}`.trim() || asst.email;

                    return (
                      <div
                        key={link.id}
                        className="bg-white/60 border border-slate-200/60 rounded-xl p-3.5 text-xs text-slate-500 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-700 mr-2">{fullName}</span>
                          <span>{asst.email}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          Desvinculada: {formatDateSafe(link.revokedAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PANEL LATERAL PARA INVITAR ASISTENTE */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Invitar Asistente"
      >
        <form onSubmit={handleSubmitInvite} className="space-y-5 p-4 sm:p-6 text-xs sm:text-sm">
          <p className="text-slate-600 leading-relaxed text-xs">
            Introduce el correo de tu secretaria o asistente. Si ya tiene cuenta en CitaMed, recibirá la invitación de inmediato. Si es nueva, se le enviará un correo para activar su acceso.
          </p>

          {/* Correo */}
          <div>
            <label className="block font-bold text-slate-800 text-xs mb-1.5">
              Correo electrónico <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="asistente@ejemplo.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Nombre (opcional)
              </label>
              <input
                type="text"
                placeholder="María"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 text-xs mb-1.5">
                Apellido (opcional)
              </label>
              <input
                type="text"
                placeholder="Pérez"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Interruptores de Permisos Iniciales */}
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <span className="block font-bold text-slate-900 text-xs">
              Permisos que deseas otorgar:
            </span>

            {/* Agenda */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={formData.canAgenda}
                onChange={(e) => setFormData({ ...formData, canAgenda: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              <div>
                <span className="block font-bold text-slate-900 text-xs">
                  Gestión de Agenda y Sala de Espera
                </span>
                <span className="text-[11px] text-slate-500">
                  Ver citas, confirmar o cancelar turnos, llamar pacientes y registrar su llegada.
                </span>
              </div>
            </label>

            {/* Cobros */}
            <label className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={formData.canPayments}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setFormData({
                    ...formData,
                    canPayments: checked,
                    canVoidReceipts: checked ? formData.canVoidReceipts : false
                  });
                }}
                className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              <div>
                <span className="block font-bold text-slate-900 text-xs">
                  Cobros y Validación de Pagos
                </span>
                <span className="text-[11px] text-slate-500">
                  Validar pagos móviles o transferencias, registrar pagos en efectivo y emitir recibos.
                </span>
              </div>
            </label>

            {/* Anular recibos */}
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                formData.canPayments
                  ? 'bg-slate-50 border-slate-200 cursor-pointer hover:bg-slate-100/70'
                  : 'bg-slate-100/50 border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <input
                type="checkbox"
                disabled={!formData.canPayments}
                checked={formData.canVoidReceipts}
                onChange={(e) =>
                  setFormData({ ...formData, canVoidReceipts: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
              <div>
                <span className="block font-bold text-slate-900 text-xs">
                  Anular Recibos Emitidos
                </span>
                <span className="text-[11px] text-slate-500">
                  Permite anular un recibo previamente emitido en caso de error o corrección.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Enviar invitación</span>
                </>
              )}
            </button>
          </div>
        </form>
      </SideDrawer>
    </div>
  );
}
