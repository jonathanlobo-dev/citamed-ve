/**
 * GuestBookingDrawer.jsx - CitaMed
 * Panel lateral para pedir la primera cita sin tener cuenta: nombre, cédula, teléfono y correo.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import TurnstileWidget from '../common/TurnstileWidget';
import guestBookingService from '../../services/guestBookingService';
import { EMPTY_GUEST_FORM, validateGuestForm, buildGuestPayload } from '../../utils/guestBookingForm';
import { turnstileEnabled, getTurnstileToken } from '../../utils/turnstile';

export default function GuestBookingDrawer({ open, onClose, summary, booking, onBooked }) {
  const [form, setForm] = useState(EMPTY_GUEST_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const found = validateGuestForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (turnstileEnabled() && !getTurnstileToken()) {
      setServerError({ message: 'Completa la verificación anti robots e intenta de nuevo.' });
      return;
    }
    setSaving(true);
    try {
      const res = await guestBookingService.create(buildGuestPayload(form, booking));
      onBooked({ ...res.data, email: form.email.trim().toLowerCase() });
    } catch (err) {
      const data = err.response?.data;
      setServerError({
        code: data?.code,
        message: data?.message || 'No pudimos pedir tu cita. Intenta de nuevo.'
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors[field] ? 'border-red-400' : 'border-slate-300'}`;
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1';
  const fieldError = (field) => errors[field] && <p className="text-xs text-red-600 mt-1">{errors[field]}</p>;

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Tus datos para la cita"
      subtitle={summary}
      footer={
        <button
          type="submit"
          form="guest-booking-form"
          disabled={saving}
          className="w-full px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
        >
          {saving ? 'Enviando solicitud...' : 'Enviar solicitud de cita'}
        </button>
      }
    >
      <form id="guest-booking-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-blue-600" />
          <p>
            Con estos datos creamos tu cuenta. Te enviaremos un correo para que elijas tu clave: así podrás agendar de nuevo, ver tus récipes digitales y no olvidar nada.
          </p>
        </div>

        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError.message}</span>
            </div>
            {serverError.code === 'ACCOUNT_EXISTS' && (
              <div className="flex flex-wrap gap-3 mt-2 pl-6 text-sm font-semibold">
                <Link to="/login" state={{ from: { pathname: window.location.pathname + window.location.search } }} className="text-primary underline">Iniciar sesión</Link>
                <Link to="/forgot-password" className="text-primary underline">Olvidé mi clave</Link>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="g-first">Nombre</label>
            <input id="g-first" className={inputClass('firstName')} value={form.firstName} onChange={set('firstName')} maxLength={60} autoComplete="given-name" />
            {fieldError('firstName')}
          </div>
          <div>
            <label className={labelClass} htmlFor="g-last">Apellido</label>
            <input id="g-last" className={inputClass('lastName')} value={form.lastName} onChange={set('lastName')} maxLength={60} autoComplete="family-name" />
            {fieldError('lastName')}
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="g-id">Cédula</label>
          <div className="flex gap-2">
            <select aria-label="Tipo de cédula" className={`${inputClass('identificationType')} w-20`} value={form.identificationType} onChange={set('identificationType')}>
              <option value="V">V</option>
              <option value="E">E</option>
            </select>
            <input id="g-id" className={inputClass('identificationNumber')} inputMode="numeric" value={form.identificationNumber} onChange={set('identificationNumber')} maxLength={12} placeholder="12345678" />
          </div>
          {fieldError('identificationNumber')}
        </div>

        <div>
          <label className={labelClass} htmlFor="g-phone">Teléfono</label>
          <input id="g-phone" className={inputClass('phone')} type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} maxLength={20} placeholder="0414-1234567" autoComplete="tel" />
          {fieldError('phone')}
        </div>

        <div>
          <label className={labelClass} htmlFor="g-email">Correo electrónico</label>
          <input id="g-email" className={inputClass('email')} type="email" value={form.email} onChange={set('email')} maxLength={120} autoComplete="email" />
          {fieldError('email')}
        </div>

        <TurnstileWidget />

        <p className="text-xs text-slate-500">
          ¿Ya tienes cuenta? <Link to="/login" state={{ from: { pathname: window.location.pathname + window.location.search } }} className="text-primary font-semibold underline">Inicia sesión</Link> para agendar más rápido.
        </p>
      </form>
    </SideDrawer>
  );
}
