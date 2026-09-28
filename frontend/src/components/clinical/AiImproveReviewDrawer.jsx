/**
 * AiImproveReviewDrawer.jsx - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Panel de Revisión de Corrección de Redacción
 */

import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';

export default function AiImproveReviewDrawer({
  open,
  onClose,
  fieldName = 'Texto clínico',
  originalText = '',
  improvedText = '',
  onApply
}) {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (open) {
      setEditedText(improvedText || '');
    }
  }, [open, improvedText]);

  const handleApply = () => {
    if (onApply) {
      onApply(editedText);
    }
    onClose();
  };

  const handleReset = () => {
    setEditedText(improvedText || '');
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={`Corregir Redacción: ${fieldName}`}
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

        {/* COMPARATIVA ANTES / DESPUÉS */}
        <div className="space-y-4">
          <div>
            <span className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
              Antes (Texto original)
            </span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {originalText || <span className="italic text-slate-400">Texto vacío</span>}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Después (Propuesta de la IA)
              </span>
              {editedText !== improvedText && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar propuesta
                </button>
              )}
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={6}
              className="w-full p-3 bg-sky-50/50 border border-sky-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary leading-relaxed"
              placeholder="La propuesta aparecerá aquí..."
            />
          </div>
        </div>

        {/* ACCIONES */}
        <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
          <button
            type="button"
            disabled={!editedText.trim()}
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Aplicar corrección
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
    </SideDrawer>
  );
}
