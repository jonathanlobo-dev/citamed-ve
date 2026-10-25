/**
 * ActivarAsistentePage.jsx - CITAMED.VE
 * M01 / Semana 9 - La asistente invitada define su contraseña desde el enlace del correo
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { assistantService } from '../../services/assistantService';

export default function ActivarAsistentePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    assistantService.getInvitation(token)
      .then((res) => setInfo(res.data))
      .catch((err) => setLoadError(err.response?.data?.message || 'No pudimos abrir la invitación'));
  }, [token]);

  const rules = [
    { ok: password.length >= 8, label: 'Al menos 8 caracteres' },
    { ok: /[a-z]/.test(password), label: 'Una letra minúscula' },
    { ok: /[A-Z]/.test(password), label: 'Una letra mayúscula' },
    { ok: /\d/.test(password), label: 'Un número' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!rules.every((r) => r.ok)) {
      setFormError('La contraseña no cumple los requisitos');
      return;
    }
    if (password !== confirm) {
      setFormError('Las contraseñas no coinciden');
      return;
    }
    setSubmitting(true);
    try {
      await assistantService.activateInvitation(token, password);
      setDone(true);
    } catch (err) {
      setFormError(err.response?.data?.message || 'No pudimos activar tu cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-primary">
            CITAMED<span className="text-accent">.VE</span>
          </h1>
        </div>

        {!info && !loadError && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {loadError && (
          <div className="text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="text-sm text-slate-700">{loadError}</p>
            <button type="button" onClick={() => navigate('/login')} className="text-sm font-semibold text-primary hover:underline">
              Ir a iniciar sesión
            </button>
          </div>
        )}

        {info && done && (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h2 className="text-lg font-bold text-slate-900">¡Tu cuenta está activa!</h2>
            <p className="text-sm text-slate-600">
              Ya trabajas con {info.doctorName}. Inicia sesión con {info.email} y la contraseña que acabas de crear.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90"
            >
              Iniciar sesión
            </button>
          </div>
        )}

        {info && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Hola {info.assistantFirstName}</h2>
              <p className="text-sm text-slate-600 mt-1">
                {info.doctorName} te invitó a ser su asistente en CitaMed. Crea tu contraseña para activar tu cuenta.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Correo</label>
              <input type="email" value={info.email} disabled className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 text-sm" />
            </div>

            <div>
              <label htmlFor="pw" className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="pw"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-10 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-1">
                {rules.map((r) => (
                  <li key={r.label} className={`text-xs flex items-center gap-1 ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <CheckCircle2 className="w-3 h-3" /> {r.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label htmlFor="pw2" className="block text-xs font-semibold text-slate-700 mb-1">Repite la contraseña</label>
              <input
                id="pw2"
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Activando...' : 'Activar mi cuenta'}
            </button>

            <p className="text-xs text-slate-500 text-center">
              Como asistente no tendrás acceso a la historia clínica de los pacientes.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
