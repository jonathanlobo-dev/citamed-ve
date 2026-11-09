/**
 * TurnstileWidget - CITAMED.VE
 * Casilla anti robots de Cloudflare. No se muestra nada si el build no trae VITE_TURNSTILE_SITE_KEY.
 */

import { useEffect, useRef } from 'react';
import { SITE_KEY, turnstileEnabled, setTurnstileToken, RESET_EVENT } from '../../utils/turnstile';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let scriptPromise = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => { scriptPromise = null; reject(new Error('No se pudo cargar la verificación anti robots')); };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function TurnstileWidget({ className = 'flex justify-center my-4' }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!turnstileEnabled()) return undefined;
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          language: 'es',
          callback: (token) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          'error-callback': () => setTurnstileToken('')
        });
      })
      .catch(() => setTurnstileToken(''));

    const onReset = () => {
      if (window.turnstile && widgetId.current !== null) window.turnstile.reset(widgetId.current);
    };
    window.addEventListener(RESET_EVENT, onReset);

    return () => {
      cancelled = true;
      window.removeEventListener(RESET_EVENT, onReset);
      if (window.turnstile && widgetId.current !== null) {
        try { window.turnstile.remove(widgetId.current); } catch { /* ya no existe */ }
      }
      widgetId.current = null;
      setTurnstileToken('');
    };
  }, []);

  if (!turnstileEnabled()) return null;
  return <div ref={ref} className={className} data-testid="turnstile" />;
}
