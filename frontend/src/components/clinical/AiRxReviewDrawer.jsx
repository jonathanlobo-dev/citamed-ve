/**
 * AiRxReviewDrawer.jsx - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Panel de Revisión de Récipe Médico con IA
 */

import { useState, useEffect } from 'react';
import { Pill, AlertTriangle, CheckCircle2, Edit2, Loader2, X } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';

export default function AiRxReviewDrawer({
  open,
  onClose,
  rxProposal = {},
  loading = false,
  error = null,
  onApply
}) {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [indications, setIndications] = useState('');
  const [applyIndications, setApplyIndications] = useState(true);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  useEffect(() => {
    if (open) {
      const initialItems = (rxProposal.items || []).map((it) => ({ ...it }));
      setItems(initialItems);
      setSelectedItems(initialItems.map(() => true));
      setIndications(rxProposal.indications || '');
      setApplyIndications(Boolean(rxProposal.indications));
      setEditingIndex(null);
      setResponsibilityAccepted(false);
    }
  }, [open, rxProposal]);

  const handleFieldChange = (idx, field, val) => {
    setItems((prev) => {
      const u = [...prev];
      u[idx] = { ...u[idx], [field]: val };
      return u;
    });
  };

  const handleConfirm = () => {
    if (!responsibilityAccepted) return;
    const selected = items.filter((_, idx) => selectedItems[idx]);
    if (onApply) {
      onApply({
        items: selected,
        indications: applyIndications ? indications.trim() : ''
      });
    }
    onClose();
  };

  const warnings = rxProposal.warnings || [];

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Revisar Propuesta de Récipe Médico"
      width="max-w-xl"
    >
      <div className="space-y-5 pb-16">
        {/* AVISO FIJO */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold">Aviso médico y legal obligatorio</p>
            <p className="leading-relaxed">
              Función experimental de asistencia. La IA puede equivocarse u omitir datos.
              Revisa todo antes de aplicarlo: el diagnóstico, los medicamentos y las dosis
              son responsabilidad exclusiva del médico tratante.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <X className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <p className="font-bold">Observaciones del procesador:</p>
            <ul className="list-disc list-inside">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Estructurando prescripción médica...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-lg">
            No se identificaron medicamentos en el texto procesado.
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Pill className="w-4 h-4 text-purple-600" /> Medicamentos Propuestos ({items.length})
            </h4>

            {items.map((item, idx) => (
              <div
                key={idx}
                className={`p-3 border rounded-lg space-y-2 transition ${
                  selectedItems[idx]
                    ? 'bg-purple-50/30 border-purple-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedItems[idx])}
                      onChange={(e) =>
                        setSelectedItems((prev) => {
                          const u = [...prev];
                          u[idx] = e.target.checked;
                          return u;
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Medicamento #{idx + 1}: {item.medication || 'Sin nombre'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setEditingIndex(editingIndex === idx ? null : idx)}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {editingIndex === idx ? 'Cerrar edición' : 'Editar'}
                  </button>
                </div>

                {editingIndex === idx ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white rounded border border-slate-200 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Medicamento</label>
                      <input
                        type="text"
                        value={item.medication}
                        onChange={(e) => handleFieldChange(idx, 'medication', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Presentación</label>
                      <input
                        type="text"
                        value={item.presentation}
                        onChange={(e) => handleFieldChange(idx, 'presentation', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Dosis</label>
                      <input
                        type="text"
                        value={item.dose}
                        onChange={(e) => handleFieldChange(idx, 'dose', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Frecuencia</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => handleFieldChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Duración</label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleFieldChange(idx, 'duration', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-0.5">Instrucciones</label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => handleFieldChange(idx, 'instructions', e.target.value)}
                        className="w-full px-2 py-1 border rounded text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700 bg-white/70 p-2 rounded">
                    <div><span className="text-slate-400 text-[10px] block">Presentación:</span> {item.presentation || '—'}</div>
                    <div><span className="text-slate-400 text-[10px] block">Dosis:</span> {item.dose || '—'}</div>
                    <div><span className="text-slate-400 text-[10px] block">Frecuencia:</span> {item.frequency || '—'}</div>
                    <div><span className="text-slate-400 text-[10px] block">Duración:</span> {item.duration || '—'}</div>
                    <div className="col-span-2"><span className="text-slate-400 text-[10px] block">Instrucciones:</span> {item.instructions || '—'}</div>
                  </div>
                )}
              </div>
            ))}

            {indications && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyIndications}
                    onChange={(e) => setApplyIndications(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span>Indicaciones generales del récipe</span>
                </label>
                <p className="text-xs text-slate-700 pl-6 whitespace-pre-wrap">{indications}</p>
              </div>
            )}
          </div>
        )}

        {/* PIE DE PÁGINA: RESPONSABILIDAD Y APLICAR */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <label className="flex items-start gap-2.5 p-3 bg-slate-100 rounded-lg border border-slate-300 cursor-pointer text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={responsibilityAccepted}
              onChange={(e) => setResponsibilityAccepted(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
            />
            <span>
              Revisé la propuesta y asumo la responsabilidad de los datos que aplico.
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!responsibilityAccepted || items.length === 0}
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Aplicar seleccionados
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
