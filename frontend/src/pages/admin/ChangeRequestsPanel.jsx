/**
 * ChangeRequestsPanel - CITAMED.VE
 * Pestaña "Solicitudes" del panel de superadministración: cambios de nombre, cédula y MPPS
 * que las personas piden con un motivo. El admin aprueba (se aplica el dato) o rechaza con una nota.
 */

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import adminService from '../../services/adminService';

const FIELD_LABEL = { firstName: 'Nombre', lastName: 'Apellido', identificationNumber: 'Cédula', mppsNumber: 'Número de MPPS' };
const ROLE_LABEL = { patient: 'Paciente', doctor: 'Médico', provider: 'Proveedor', assistant: 'Asistente' };
const FILTERS = [['pending', 'Pendientes'], ['approved', 'Aprobadas'], ['rejected', 'Rechazadas'], ['all', 'Todas']];

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none';

function formatDate(value) {
  try {
    return new Date(value).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '';
  }
}

export default function ChangeRequestsPanel() {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState({ requests: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getChangeRequests({ status });
      setData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudieron cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const open = (request) => { setSelected(request); setNote(''); setError(''); };

  const decide = async (decision) => {
    if (decision === 'rejected' && note.trim().length < 5) {
      setError('Explica brevemente por qué se rechaza');
      return;
    }
    setBusy(true); setError('');
    try {
      await adminService.reviewChangeRequest(selected.id, { decision, note });
      toast.success(decision === 'approved' ? 'Cambio aplicado' : 'Solicitud rechazada');
      setSelected(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo resolver la solicitud');
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filtrar solicitudes">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={status === value}
            onClick={() => setStatus(value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${status === value ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : data.requests.length === 0 ? (
        <p className="text-gray-500 text-sm bg-white rounded-xl border border-gray-100 p-6 text-center">No hay solicitudes en esta vista.</p>
      ) : (
        <ul className="space-y-3">
          {data.requests.map((r) => (
            <li key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.email : 'Usuario'}
                  <span className="ml-2 text-xs font-medium text-gray-500">{ROLE_LABEL[r.user?.role] || ''}</span>
                </p>
                <p className="text-sm text-gray-700">
                  {FIELD_LABEL[r.field] || r.field}: <span className="line-through text-gray-400">{r.currentValue || 'sin dato'}</span> → <strong>{r.requestedValue}</strong>
                </p>
                <p className="text-xs text-gray-500">{formatDate(r.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                {r.status === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full"><Clock className="w-3.5 h-3.5" aria-hidden="true" /> Pendiente</span>}
                {r.status === 'approved' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Aprobada</span>}
                {r.status === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 bg-red-100 px-2.5 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" aria-hidden="true" /> Rechazada</span>}
                <button type="button" onClick={() => open(r)} className="text-sm font-semibold text-primary hover:underline">
                  {r.status === 'pending' ? 'Revisar' : 'Ver'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SideDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Solicitud de cambio"
        subtitle={selected ? `${FIELD_LABEL[selected.field] || selected.field}` : ''}
        footer={selected?.status === 'pending' ? (
          <div className="flex justify-end gap-3">
            <button type="button" disabled={busy} onClick={() => decide('rejected')} className="px-5 py-2.5 font-semibold rounded-xl border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50">
              Rechazar
            </button>
            <button type="button" disabled={busy} onClick={() => decide('approved')} className="px-5 py-2.5 font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-50">
              Aprobar y aplicar
            </button>
          </div>
        ) : null}
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="text-gray-500">Persona</p>
              <p className="font-semibold text-gray-900">
                {`${selected.user?.firstName || ''} ${selected.user?.lastName || ''}`.trim()} ({ROLE_LABEL[selected.user?.role] || selected.user?.role})
              </p>
              <p className="text-gray-600 break-all">{selected.user?.email}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-500">Cambio pedido</p>
              <p><span className="line-through text-gray-400">{selected.currentValue || 'sin dato'}</span> → <strong>{selected.requestedValue}</strong></p>
            </div>
            <div className="text-sm">
              <p className="text-gray-500">Motivo</p>
              <p className="text-gray-900 whitespace-pre-wrap">{selected.reason}</p>
            </div>
            {selected.status === 'pending' ? (
              <label className="block text-sm">
                <span className="block font-medium text-gray-700 mb-1">Nota para la persona (obligatoria si rechazas)</span>
                <textarea rows={3} maxLength={500} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            ) : (
              <div className="text-sm">
                <p className="text-gray-500">Resuelta el {formatDate(selected.reviewedAt)}</p>
                {selected.reviewNote && <p className="text-gray-900 whitespace-pre-wrap">{selected.reviewNote}</p>}
              </div>
            )}
            {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            {selected.status === 'pending' && (
              <p className="text-xs text-gray-500">Verifica el cambio con los documentos de la persona antes de aprobar. Queda registrado en auditoría.</p>
            )}
          </div>
        )}
      </SideDrawer>
    </div>
  );
}
