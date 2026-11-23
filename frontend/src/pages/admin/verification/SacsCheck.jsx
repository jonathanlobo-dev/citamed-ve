/**
 * SacsCheck - CITAMED.VE
 * En la solicitud de verificación, compara lo que declaró el médico (nombre y MPPS) con el
 * registro oficial del SACS. Es una ayuda: quien aprueba sigue siendo el admin.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { checkSacs } from '../../../services/kycVerificationService';

const STATUS = {
  match: { tone: 'green', Icon: CheckCircle2, title: 'Coincide con el SACS', text: 'El número MPPS es de un médico con este nombre.' },
  name_mismatch: { tone: 'red', Icon: XCircle, title: 'El nombre no coincide', text: 'Ese número MPPS es de otro médico. No apruebes sin aclararlo.' },
  not_doctor: { tone: 'red', Icon: XCircle, title: 'No está registrado como médico', text: 'Ese número MPPS es de otra profesión de la salud.' },
  not_found: { tone: 'red', Icon: XCircle, title: 'No aparece en el SACS', text: 'Ese número MPPS no existe en el registro.' },
  invalid: { tone: 'amber', Icon: AlertTriangle, title: 'Número MPPS no válido', text: 'El médico no escribió un número MPPS que se pueda consultar.' },
  unavailable: { tone: 'amber', Icon: AlertTriangle, title: 'El SACS no respondió', text: 'Consulta a mano con el enlace de abajo o vuelve a intentarlo.' }
};
const TONES = {
  green: 'border-green-200 bg-green-50 text-green-800',
  red: 'border-red-200 bg-red-50 text-red-800',
  amber: 'border-amber-200 bg-amber-50 text-amber-800'
};

export default function SacsCheck({ requestId }) {
  const [state, setState] = useState({ loading: true, data: null });

  const load = async () => {
    setState({ loading: true, data: null });
    try {
      const res = await checkSacs(requestId);
      setState({ loading: false, data: res.data });
    } catch {
      setState({ loading: false, data: { status: 'unavailable', consultUrl: 'https://sistemas.sacs.gob.ve/consultas/prfsnal_salud' } });
    }
  };

  useEffect(() => { load(); }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-3">Revisión en el SACS</h4>
      {state.loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 p-3 border rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" /> Consultando el registro del SACS...
        </div>
      ) : (
        <SacsResult data={state.data} onRetry={load} />
      )}
    </div>
  );
}

function SacsResult({ data, onRetry }) {
  const info = STATUS[data.status] || STATUS.unavailable;
  const { Icon } = info;
  const r = data.record;
  return (
    <div className="space-y-3">
      <div className={`flex items-start gap-2 p-3 border rounded-lg ${TONES[info.tone]}`}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">{info.title}</p>
          <p className="text-xs mt-0.5">{info.text}</p>
        </div>
      </div>

      {(data.declared || r) && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-gray-50 border">
            <p className="font-semibold text-gray-500 mb-1">Lo que puso el médico</p>
            <p className="text-gray-900">{[data.declared?.firstName, data.declared?.lastName].filter(Boolean).join(' ') || '-'}</p>
            <p className="text-gray-700">MPPS: {data.declared?.mpps || '-'}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 border">
            <p className="font-semibold text-gray-500 mb-1">Lo que dice el SACS</p>
            {r ? (
              <>
                <p className="text-gray-900">{r.nombre} {r.apellido}</p>
                <p className="text-gray-700">{r.matricula}</p>
                <p className="text-gray-700">{r.profesion}</p>
                <p className="text-gray-700">Cédula: {r.cedula}</p>
                {r.fechaRegistro && <p className="text-gray-500">Registro: {r.fechaRegistro.split('-').reverse().join('/')}</p>}
              </>
            ) : (
              <p className="text-gray-500">Sin datos</p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-xs">
        <a href={data.consultUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-teal-700 font-semibold hover:underline">
          Abrir el SACS <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900">
          <RefreshCw className="h-3.5 w-3.5" /> Consultar de nuevo
        </button>
      </div>
    </div>
  );
}
