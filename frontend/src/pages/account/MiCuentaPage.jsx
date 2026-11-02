/**
 * MiCuentaPage - CITAMED.VE
 * Correo, clave y datos que identifican la cuenta. Los datos protegidos (nombre, cédula, MPPS)
 * no se editan solos: se pide el cambio con un motivo y lo decide un administrador.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, KeyRound, IdCard, CheckCircle2, AlertTriangle, Clock, XCircle, ChevronRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import PasswordStrengthIndicator from '../../components/auth/PasswordStrengthIndicator';
import { useAuth } from '../../context/AuthContext';
import accountService, { accountErrorMessage } from '../../services/accountService';

const PROFILE_LINK = {
  doctor: { to: '/medico/perfil/editar', label: 'Editar mi perfil profesional' },
  patient: { to: '/paciente/perfil/editar', label: 'Editar mi perfil' },
  provider: { to: '/proveedor/mi-empresa', label: 'Editar mi empresa' }
};

const STATUS_BADGE = {
  pending: { text: 'En revisión', cls: 'bg-amber-100 text-amber-800', Icon: Clock },
  approved: { text: 'Aprobada', cls: 'bg-emerald-100 text-emerald-800', Icon: CheckCircle2 },
  rejected: { text: 'Rechazada', cls: 'bg-red-100 text-red-800', Icon: XCircle }
};

const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none';
const primaryBtn = 'px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition';
const ghostBtn = 'px-5 py-2.5 text-gray-700 font-medium rounded-xl border border-gray-300 hover:bg-gray-50 transition';

function Card({ icon: Icon, title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
        <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-gray-500 mt-1">{hint}</span>}
    </label>
  );
}

/* ---------- Cambiar correo (dos pasos: clave + correo nuevo, luego código) ---------- */
function EmailDrawer({ open, onClose, currentEmail, onChanged }) {
  const [step, setStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setStep(1); setNewEmail(''); setPassword(''); setToken(''); setCode(''); setError(''); }
  }, [open]);

  const sendCode = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await accountService.requestEmailChange({ newEmail, currentPassword: password });
      setToken(r.token); setNewEmail(r.newEmail); setStep(2);
      toast.success('Te enviamos un código al correo nuevo');
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally { setBusy(false); }
  };

  const confirm = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const r = await accountService.confirmEmailChange({ token, code });
      toast.success('Tu correo fue actualizado');
      onChanged(r);
      onClose();
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Cambiar correo"
      subtitle={`Correo actual: ${currentEmail}`}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className={ghostBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" form="form-email" className={primaryBtn} disabled={busy}>
            {step === 1 ? 'Enviar código' : 'Confirmar cambio'}
          </button>
        </div>
      }
    >
      <form id="form-email" onSubmit={step === 1 ? sendCode : confirm}>
        {step === 1 ? (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Por seguridad te pedimos tu clave actual. Enviaremos un código al correo nuevo y el cambio solo se aplica cuando lo confirmes.
            </p>
            <Field label="Correo nuevo">
              <input type="email" required className={inputCls} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="email" />
            </Field>
            <Field label="Tu clave actual">
              <input type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              Escribe el código de 6 dígitos que enviamos a <strong>{newEmail}</strong>. Revisa también la carpeta de spam.
            </p>
            <Field label="Código">
              <input
                inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required
                className={`${inputCls} text-center text-xl tracking-[0.4em]`}
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} autoComplete="one-time-code"
              />
            </Field>
            <button type="button" className="text-sm text-primary underline" onClick={() => { setStep(1); setCode(''); setError(''); }}>
              Usar otro correo o reenviar el código
            </button>
          </>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </SideDrawer>
  );
}

/* ---------- Cambiar clave ---------- */
function PasswordDrawer({ open, onClose }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setCurrent(''); setNext(''); setAgain(''); setError(''); } }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== again) { setError('Las claves nuevas no coinciden'); return; }
    setBusy(true); setError('');
    try {
      await accountService.changePassword({ currentPassword: current, newPassword: next });
      toast.success('Tu clave fue cambiada');
      onClose();
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Cambiar clave"
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className={ghostBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" form="form-password" className={primaryBtn} disabled={busy}>Cambiar clave</button>
        </div>
      }
    >
      <form id="form-password" onSubmit={submit}>
        <Field label="Tu clave actual">
          <input type="password" required className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="Clave nueva">
          <input type="password" required className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <PasswordStrengthIndicator password={next} />
        <div className="mt-4">
          <Field label="Repite la clave nueva">
            <input type="password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </SideDrawer>
  );
}

/* ---------- Pedir cambio de un dato protegido ---------- */
function ChangeRequestDrawer({ item, onClose, onSent }) {
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (item) { setValue(''); setReason(''); setError(''); } }, [item]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await accountService.createChangeRequest({ field: item.field, value, reason });
      toast.success('Solicitud enviada. Te avisaremos cuando se revise.');
      onSent();
      onClose();
    } catch (err) {
      setError(accountErrorMessage(err));
    } finally { setBusy(false); }
  };

  return (
    <SideDrawer
      open={!!item}
      onClose={onClose}
      title={item ? `Cambiar ${item.label.toLowerCase()}` : ''}
      subtitle={item ? `Dato actual: ${item.value || 'sin dato'}` : ''}
      footer={
        <div className="flex justify-end gap-3">
          <button type="button" className={ghostBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" form="form-request" className={primaryBtn} disabled={busy}>Enviar solicitud</button>
        </div>
      }
    >
      <form id="form-request" onSubmit={submit}>
        <p className="text-sm text-gray-600 mb-4">
          Este dato identifica tu cuenta{item?.field === 'firstName' || item?.field === 'lastName' ? ' y aparece en tus documentos' : ''}, por eso un administrador revisa el cambio antes de aplicarlo.
        </p>
        <Field label={`${item?.label || ''} correcto`}>
          <input required className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <Field label="Motivo del cambio" hint="Por ejemplo: me equivoqué al escribirlo. Mínimo 10 caracteres.">
          <textarea required rows={4} maxLength={500} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      </form>
    </SideDrawer>
  );
}

export default function MiCuentaPage() {
  const { user, updateUser, refreshUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [requestItem, setRequestItem] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([accountService.getSummary(), accountService.listChangeRequests()]);
      setSummary(s); setRequests(r); setLoadError('');
    } catch (err) {
      setLoadError(accountErrorMessage(err, 'No pudimos cargar tu cuenta.'));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onEmailChanged = async ({ email }) => {
    updateUser({ email, emailVerified: true });
    await Promise.all([load(), refreshUser()]);
  };

  const profileLink = PROFILE_LINK[user?.role];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
          <p className="text-gray-600 text-sm">Tu correo, tu clave y los datos que identifican tu cuenta.</p>
        </header>

        {loadError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{loadError}</p>}

        {summary && (
          <>
            <Card icon={Mail} title="Correo">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 break-all">{summary.email}</p>
                  {summary.emailVerified ? (
                    <p className="flex items-center gap-1 text-sm text-emerald-700 mt-1"><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Verificado</p>
                  ) : (
                    <p className="flex items-center gap-1 text-sm text-amber-700 mt-1"><AlertTriangle className="w-4 h-4" aria-hidden="true" /> Sin verificar</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {!summary.emailVerified && (
                    <Link
                      to={`/verificar/email?userId=${user.id}&email=${encodeURIComponent(summary.email)}&returnTo=${encodeURIComponent('/cuenta')}`}
                      className={primaryBtn}
                    >
                      Verificar
                    </Link>
                  )}
                  <button type="button" className={ghostBtn} onClick={() => setEmailOpen(true)}>Cambiar correo</button>
                </div>
              </div>
            </Card>

            <Card icon={KeyRound} title="Clave">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">Cámbiala cada cierto tiempo y no la repitas en otros sitios.</p>
                <button type="button" className={ghostBtn} onClick={() => setPasswordOpen(true)}>Cambiar clave</button>
              </div>
            </Card>

            {summary.protectedData.length > 0 && (
              <Card icon={IdCard} title="Datos de tu cuenta">
                <p className="text-sm text-gray-600 mb-4">
                  Estos datos te identifican, por eso no se editan directamente. Si algo está mal, pide el cambio y un administrador lo revisa.
                </p>
                <ul className="divide-y divide-gray-100">
                  {summary.protectedData.map((d) => {
                    const pending = summary.pendingFields.includes(d.field);
                    return (
                      <li key={d.field} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-500">{d.label}</p>
                          <p className="font-medium text-gray-900">{d.value || 'Sin dato'}</p>
                        </div>
                        {pending ? (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4" aria-hidden="true" /> Solicitud en revisión
                          </span>
                        ) : (
                          <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setRequestItem(d)}>
                            Pedir cambio
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {profileLink && (
              <Link to={profileLink.to} className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:border-primary/40 transition">
                <span className="font-medium text-gray-900">{profileLink.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </Link>
            )}

            {requests.length > 0 && (
              <Card icon={Clock} title="Mis solicitudes">
                <ul className="space-y-3">
                  {requests.map((r) => {
                    const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                    const label = summary.protectedData.find((d) => d.field === r.field)?.label || r.field;
                    return (
                      <li key={r.id} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">{label}: {r.currentValue || 'sin dato'} → {r.requestedValue}</p>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                            <badge.Icon className="w-3.5 h-3.5" aria-hidden="true" /> {badge.text}
                          </span>
                        </div>
                        {r.reviewNote && <p className="text-sm text-gray-600 mt-2">Respuesta: {r.reviewNote}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </>
        )}
      </main>

      <EmailDrawer open={emailOpen} onClose={() => setEmailOpen(false)} currentEmail={summary?.email || user?.email || ''} onChanged={onEmailChanged} />
      <PasswordDrawer open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <ChangeRequestDrawer item={requestItem} onClose={() => setRequestItem(null)} onSent={load} />
    </div>
  );
}
