/**
 * AiRxTextDrawer.jsx - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Panel para generar récipe a partir de texto libre
 */

import { useState } from 'react';
import { Pill, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';

export default function AiRxTextDrawer({
  open,
  onClose,
  onSubmitText,
  loading = false,
  error = null
}) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmitText(text.trim());
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Generar Récipe desde Texto con IA"
      width="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-16">
        <p className="text-xs text-slate-600 leading-relaxed">
          Escribe o pega el tratamiento médico sugerido. La IA extraerá los medicamentos,
          dosis, frecuencias e indicaciones para estructurarlos en la receta oficial.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Texto del tratamiento
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            placeholder="Ej: Indicar Amoxicilina de 500mg, tomar 1 cápsula cada 8 horas por 7 días con abundante agua. Agregar Ibuprofeno 400mg cada 8 horas si hay dolor o fiebre por 3 días."
            className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary leading-relaxed"
            disabled={loading}
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Procesando récipe...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Estructurar Récipe
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </SideDrawer>
  );
}
