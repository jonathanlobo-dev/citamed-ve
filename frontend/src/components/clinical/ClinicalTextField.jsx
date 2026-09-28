import { useRef, useEffect } from 'react';
import { Mic, Square, Sparkles, Loader2 } from 'lucide-react';
import useSpeechDictation from '../../hooks/useSpeechDictation';

/**
 * ClinicalTextField - Campo de texto para notas clínicas con dictado por voz y corrección con IA
 * Soporta dictado continuo con Web Speech API en español de Venezuela ('es-VE')
 * y auto-ajuste de altura (D8).
 *
 * @param {string} label - Etiqueta visible
 * @param {string} id - ID del campo
 * @param {string} value - Valor actual
 * @param {Function} onChange - Manejador de cambio
 * @param {string} [placeholder] - Texto placeholder
 * @param {number} [rows=3] - Filas mínimas del textarea
 * @param {boolean} [readOnly=false] - Modo solo lectura
 * @param {string} [hint] - Texto de ayuda o aclaración
 * @param {string} [className] - Clases CSS adicionales
 * @param {Function} [onImprove] - Callback para mejorar redacción con IA (D5)
 * @param {boolean} [improving=false] - Estado de carga al mejorar
 */
export default function ClinicalTextField({
  label,
  id,
  value = '',
  onChange,
  placeholder,
  rows = 3,
  readOnly = false,
  hint,
  className = '',
  onImprove = null,
  improving = false
}) {
  const textareaRef = useRef(null);

  const handleTranscript = (text) => {
    if (readOnly) return;
    const current = value ? value.trim() : '';
    const updated = current ? `${current} ${text}` : text;
    onChange({ target: { value: updated } });
  };

  const { isSupported, isListening, toggleListening } =
    useSpeechDictation(handleTranscript);

  // Auto-ajuste de altura (D8)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500;
    const scrollH = el.scrollHeight;
    el.style.height = `${Math.min(scrollH, maxHeight)}px`;
  }, [value]);

  return (
    <div className={`clinical-field-group ${className}`}>
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <label htmlFor={id} className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          {label}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Botón Corregir con IA (D5) */}
          {onImprove && !readOnly && (
            <button
              type="button"
              disabled={!value || !value.trim() || improving}
              onClick={() => onImprove(value)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              title="Mejorar redacción ortográfica y gramatical con IA"
            >
              {improving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                  <span>Corrigiendo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Corregir</span>
                </>
              )}
            </button>
          )}

          {/* Botón Dictar por voz */}
          {isSupported && !readOnly && (
            <div className="flex items-center gap-1.5">
              {isListening && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block"></span>
                  Escuchando...
                </span>
              )}
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
                title={isListening ? 'Detener dictado' : 'Dictar por voz'}
                aria-label={isListening ? 'Detener dictado' : 'Iniciar dictado por voz'}
              >
                {isListening ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Detener</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    <span>Dictar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          style={{ minHeight: `${rows * 1.6 + 1}rem`, maxHeight: '60vh', overflowY: 'auto' }}
          className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 transition focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            readOnly
              ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed'
              : isListening
              ? 'border-rose-400 bg-rose-50/20'
              : 'border-slate-300 bg-white hover:border-slate-400 focus:border-primary'
          }`}
        />
      </div>

      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
