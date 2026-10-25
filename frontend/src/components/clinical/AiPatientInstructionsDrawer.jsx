/**
 * AiPatientInstructionsDrawer.jsx - CITAMED.VE
 * M03 / Semana 9 - Bloque D: Panel de Indicaciones para el Paciente con IA
 *
 * Genera y edita explicaciones claras, cálidas y comprensibles sobre el récipe,
 * sin alterar fármacos ni dosis, con límite de 250 palabras.
 */

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import aiService from '../../services/aiService';

export default function AiPatientInstructionsDrawer({
  open,
  onClose,
  initialInstructions = '',
  recipeItems = [],
  recipeIndications = '',
  appointmentId = null,
  onSave
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (initialInstructions && initialInstructions.trim()) {
        setText(initialInstructions);
      } else {
        setText('');
        // Si hay medicamentos, sugerir generar automáticamente
        if (recipeItems && recipeItems.some((it) => it.medication && it.medication.trim())) {
          handleGenerate();
        }
      }
    }
  }, [open, initialInstructions]);

  const countWords = (str) => {
    if (!str || !str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  };

  const handleGenerate = async () => {
    const validItems = (recipeItems || []).filter((it) => it.medication && it.medication.trim());
    if (validItems.length === 0) {
      setError('Debes ingresar al menos un medicamento en el récipe para generar indicaciones.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await aiService.patientInstructions({
        appointmentId,
        items: validItems,
        indications: recipeIndications || ''
      });
      if (res && res.instructions) {
        setText(res.instructions);
      } else {
        setError('No se recibió texto generado por el asistente de IA.');
      }
    } catch (err) {
      console.error('[AiPatientInstructionsDrawer] Error generando indicaciones:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al comunicarse con el asistente de IA. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (onSave) {
      onSave(text.trim());
    }
    onClose();
  };

  const words = countWords(text);
  const isWordCountHigh = words > 250;

  return (
    <SideDrawer
      isOpen={open}
      onClose={onClose}
      title="Indicaciones para el paciente (IA)"
      subtitle="Explicación clara y cálida del récipe para el paciente"
      size="md"
    >
      <div className="space-y-4 text-xs text-slate-700">
        {/* Banner de propósito */}
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold text-purple-900">
              Guía comprensible para el paciente
            </p>
            <p className="text-purple-800 text-[11px] leading-relaxed">
              Explica en lenguaje sencillo cómo tomar el tratamiento, precauciones y cuándo consultar de urgencia.
              No modifica fármacos ni dosificaciones. Se incluye en la página 2 del récipe oficial.
            </p>
          </div>
        </div>

        {/* Alerta de error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">No se pudo generar:</span>
              <p className="text-[11px] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Medicamentos incluidos en el récipe */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Medicamentos en este récipe:
            </span>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Generando...' : 'Regenerar con IA'}
            </button>
          </div>
          {recipeItems && recipeItems.filter((i) => i.medication && i.medication.trim()).length > 0 ? (
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
              {recipeItems
                .filter((i) => i.medication && i.medication.trim())
                .map((it, idx) => (
                  <li key={idx} className="truncate">
                    <strong>{it.medication}</strong>
                    {it.presentation && ` (${it.presentation})`}
                    {it.dose && ` · ${it.dose}`}
                    {it.frequency && ` · ${it.frequency}`}
                    {it.duration && ` · ${it.duration}`}
                  </li>
                ))}
            </ul>
          ) : (
            <p className="text-slate-400 italic text-[11px]">No hay medicamentos cargados en el récipe.</p>
          )}
        </div>

        {/* Textarea editable */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-800">
              Texto de las indicaciones (editable):
            </label>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isWordCountHigh
                  ? 'bg-amber-100 text-amber-800 font-semibold'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {words} / 250 palabras {isWordCountHigh && '(recomendado <= 250)'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 border border-purple-200 rounded-lg bg-purple-50/40 flex flex-col items-center justify-center gap-2 text-purple-700">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <p className="text-xs font-medium">Redactando indicaciones personalizadas con IA...</p>
              <span className="text-[10px] text-purple-500">
                Asegurando que dosis y medicamentos coincidan exactamente
              </span>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe o genera aquí las indicaciones claras y cálidas para el paciente..."
              rows={10}
              className="w-full p-3 text-sm text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:border-purple-500 bg-white leading-relaxed resize-y"
            />
          )}
        </div>

        {/* Botones de acción */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || !text.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Aprobar y guardar indicaciones
          </button>
        </div>
      </div>
    </SideDrawer>
  );
}
