/**
 * confirmar - CITAMED.VE
 * Ventana de confirmación propia (en lugar de window.confirm del navegador), igual que en NeosVet.
 * Uso: if (!(await confirmar({ titulo, mensaje, aceptar: 'Anular', peligro: true }))) return;
 * Se monta una sola vez con <ConfirmarHost /> en App.
 */
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

let mostrar = null;

export function confirmar(opciones) {
  const o = typeof opciones === 'string' ? { mensaje: opciones } : opciones;
  // Si por algo no está montada, se usa la del navegador para no perder la pregunta
  if (!mostrar) return Promise.resolve(window.confirm(o.mensaje));
  return new Promise((resolve) => mostrar({ ...o, responder: resolve }));
}

export function ConfirmarHost() {
  const [pedido, setPedido] = useState(null);
  const aceptarRef = useRef(null);
  const cancelarRef = useRef(null);

  useEffect(() => {
    mostrar = (p) => setPedido(p);
    return () => { mostrar = null; };
  }, []);

  const responder = (ok) => {
    pedido?.responder(ok);
    setPedido(null);
  };

  useEffect(() => {
    if (!pedido) return undefined;
    // En las de peligro el foco va a Cancelar: un Enter por accidente no borra nada
    (pedido.peligro ? cancelarRef : aceptarRef).current?.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); pedido.responder(false); setPedido(null); }
    };
    window.addEventListener('keydown', tecla, true);
    return () => window.removeEventListener('keydown', tecla, true);
  }, [pedido]);

  if (!pedido) return null;
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" onClick={() => responder(false)}>
      <div role="alertdialog" aria-modal="true" aria-label={pedido.titulo || pedido.mensaje} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pedido.peligro ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0">
            {pedido.titulo && <h3 className="font-semibold text-slate-900">{pedido.titulo}</h3>}
            <p className="text-sm text-slate-600 whitespace-pre-line">{pedido.mensaje}</p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button ref={cancelarRef} type="button" onClick={() => responder(false)} className="outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-100">
            {pedido.cancelar ?? 'Cancelar'}
          </button>
          <button ref={aceptarRef} type="button" onClick={() => responder(true)} className={`outline-none focus-visible:ring-2 focus-visible:ring-offset-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white ${pedido.peligro ? 'bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400/60' : 'bg-teal-600 hover:bg-teal-500 focus-visible:ring-teal-400/60'}`}>
            {pedido.aceptar ?? 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
}
