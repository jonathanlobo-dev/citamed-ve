import { useState, useEffect, useCallback } from 'react';

/**
 * Permite instalar CitaMed como app. El navegador avisa con "beforeinstallprompt" solo cuando
 * la app es instalable y todavía no está instalada (en iPhone nunca se dispara: allí se usa
 * "Compartir > Agregar a pantalla de inicio").
 */
export default function usePwaInstall() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
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
    if (!promptEvent) return false;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    return choice?.outcome === 'accepted';
  }, [promptEvent]);

  return { canInstall: !!promptEvent && !installed, install };
}
