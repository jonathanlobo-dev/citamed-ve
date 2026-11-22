import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/** iPhone o iPad (los iPad nuevos se presentan como Mac con pantalla táctil) */
export function isIOSDevice(nav = typeof navigator !== 'undefined' ? navigator : {}) {
  const ua = nav.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1);
}

/** true si ya se abrió como app instalada */
function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

/**
 * Permite instalar CitaMed como app. En Android y computadora el navegador avisa con
 * "beforeinstallprompt" cuando la app es instalable. En iPhone ese aviso no existe: el botón
 * muestra cómo hacerlo con "Compartir > Agregar a pantalla de inicio".
 * Solo se ofrece si la página cargó el manifiesto (interruptor FEATURES.pwa y dominio del sistema).
 */
export default function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [iosCanInstall, setIosCanInstall] = useState(false);

  useEffect(() => {
    const hasManifest = !!document.querySelector('link[rel="manifest"]');
    setIosCanInstall(hasManifest && isIOSDevice() && !isStandalone());

    const onBefore = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBefore);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) {
      if (iosCanInstall) {
        toast('Para instalar CitaMed en tu iPhone: abre esta página en Safari, toca el botón Compartir y luego "Agregar a pantalla de inicio".', { duration: 9000, icon: '📲' });
      }
      return false;
    }
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    return choice?.outcome === 'accepted';
  }, [promptEvent, iosCanInstall]);

  return { canInstall: (!!promptEvent || iosCanInstall) && !installed, install };
}
