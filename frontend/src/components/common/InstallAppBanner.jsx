import { useEffect, useState } from 'react';
import { Download, X, Smartphone, Share2, PlusSquare, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Aviso flotante para instalar CitaMed como app (misma idea que usa NeosVet).
 * - Android y computadora: usa el aviso del navegador ("beforeinstallprompt") si existe;
 *   si no, muestra los pasos del menú de Chrome.
 * - iPhone: no hay aviso automático; muestra los pasos de Safari (Compartir > Agregar a inicio).
 * Se oculta si ya está instalada y, si la persona lo cierra, no vuelve a salir en 7 días.
 * Solo aparece si la página cargó el manifiesto (interruptor FEATURES.pwa y dominio del sistema)
 * y con sesión iniciada, para no tapar los botones de inicio de sesión y registro en el teléfono.
 */

const DISMISS_KEY = 'citamed_pwa_dismissed';
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

// Se captura fuera de React: Chrome lo dispara una sola vez, a veces antes de que monte el componente
let deferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('citamed:pwa-ready'));
  });
}

export function detectPlatform(ua = navigator.userAgent, touchPoints = navigator.maxTouchPoints || 0) {
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && touchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

export default function InstallAppBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    if (!hasManifest || isStandalone() || recentlyDismissed()) return undefined;

    // En teléfonos se ofrece siempre; en computadora solo si el navegador permite instalar
    if (platform !== 'desktop' || deferredPrompt) setVisible(true);

    const onReady = () => setVisible(true);
    const onInstalled = () => setVisible(false);
    window.addEventListener('citamed:pwa-ready', onReady);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('citamed:pwa-ready', onReady);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [platform]);

  const install = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (outcome === 'accepted') setVisible(false);
        return;
      } catch {
        deferredPrompt = null;
      }
    }
    setShowSteps(true);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // sin almacenamiento: solo se oculta por ahora
    }
  };

  if (!visible || !user) return null;

  const steps =
    platform === 'ios'
      ? [
          { icon: <Share2 className="w-4 h-4" />, text: 'Abre esta página en Safari y toca "Compartir" (abajo).' },
          { icon: <PlusSquare className="w-4 h-4" />, text: 'Elige "Agregar a pantalla de inicio".' },
          { icon: <Download className="w-4 h-4" />, text: 'Toca "Agregar". CitaMed queda como una app.' },
        ]
      : [
          { icon: <MoreVertical className="w-4 h-4" />, text: 'Toca el menú ⋮ de Chrome (arriba a la derecha).' },
          { icon: <Smartphone className="w-4 h-4" />, text: 'Elige "Instalar aplicación" o "Agregar a la pantalla principal".' },
          { icon: <Download className="w-4 h-4" />, text: 'Confirma con "Instalar".' },
        ];

  return (
    <div
      className="fixed left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
      style={{ bottom: 'calc(1rem + var(--patient-bottom-h, 0px))' }}
      role="region"
      aria-label="Instalar CitaMed"
    >
      <div className="rounded-2xl bg-white border border-teal-200 shadow-xl p-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Instala CitaMed</p>
            <p className="text-xs text-gray-500">
              {platform === 'ios' ? 'Agrégala a tu pantalla de inicio en 3 pasos' : 'Ábrela directo desde tu teléfono'}
            </p>
          </div>
          {!showSteps && (
            <button
              onClick={install}
              className="min-h-[40px] px-3 rounded-lg bg-teal-600 text-white text-sm font-semibold flex items-center gap-1.5 hover:bg-teal-700"
            >
              <Download className="w-4 h-4" />
              Instalar
            </button>
          )}
          <button
            onClick={dismiss}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showSteps && (
          <ol className="mt-3 space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-teal-50/60 text-xs text-gray-700">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {i + 1}
                </span>
                <span className="text-teal-700 shrink-0">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
