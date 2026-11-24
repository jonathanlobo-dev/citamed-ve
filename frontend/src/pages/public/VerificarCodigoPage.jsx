/**
 * VerificarCodigoPage - CITAMED.VE
 * Página que se imprime bajo el QR de récipes, informes, constancias y recibos
 * (app.citamedve.app/verificar). Quien no puede escanear el QR escribe aquí el código
 * del documento. Antes esa dirección daba "Esta página no existe" (QA 23/11).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function VerificarCodigoPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const clean = code.trim().replace(/\s+/g, '').toUpperCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (clean) navigate(`/verificar/${encodeURIComponent(clean)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#F2F6F8' }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        <span className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#E0F5F2', color: '#0D304B' }}>
          <ShieldCheck className="w-6 h-6" />
        </span>
        <h1 className="text-2xl font-bold" style={{ color: '#0D304B' }}>Verificar un documento</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escribe el código que aparece junto al QR del récipe, informe, constancia o recibo.
          Te diremos si es auténtico, quién lo emitió y si está vigente o anulado.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label htmlFor="verify-code" className="block text-sm font-medium text-slate-700">Código del documento</label>
          <input
            id="verify-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ej.: 4CD45F40FEBD1B50"
            autoComplete="off"
            autoCapitalize="characters"
            className="w-full h-12 px-4 rounded-lg border border-slate-300 font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="submit"
            disabled={!clean}
            className="w-full h-12 rounded-lg text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: '#0D304B' }}
          >
            Verificar <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
