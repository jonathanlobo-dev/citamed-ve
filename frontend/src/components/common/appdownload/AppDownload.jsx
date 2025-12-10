/**
 * 📱 APP DOWNLOAD - CITAMED.VE
 * Sección para instalar la PWA (Progressive Web App)
 */

import { useState, useEffect } from 'react';
import './AppDownload.css';
import Button from '../button/button';

function AppDownload() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar si es iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Escuchar evento de instalación (Chrome, Edge)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA instalada');
    }
    
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <section className="app-download-section">
      <div className="container">
        <div className="app-download-content">
          <div className="app-download-text">
            <h2 className="app-download-title">
              📱 Lleva CITAMED.VE en tu Bolsillo
            </h2>
            <p className="app-download-description">
              Instala nuestra app y accede más rápido a tu salud desde cualquier lugar. 
              Sin necesidad de descargar desde tiendas, instala directamente desde tu navegador.
            </p>
            
            <div className="app-features">
              <div className="app-feature">
                <span className="feature-icon">⚡</span>
                <span>Acceso instantáneo</span>
              </div>
              <div className="app-feature">
                <span className="feature-icon">📲</span>
                <span>Notificaciones en tiempo real</span>
              </div>
              <div className="app-feature">
                <span className="feature-icon">💾</span>
                <span>Funciona sin conexión</span>
              </div>
              <div className="app-feature">
                <span className="feature-icon">🔒</span>
                <span>100% seguro</span>
              </div>
            </div>
          </div>

          <div className="app-download-actions">
            {/* Android / Chrome */}
            {isInstallable && !isIOS && (
              <div className="install-card">
                <div className="install-icon">📱</div>
                <h3>Instalar en Android</h3>
                <p>Un click y listo. No ocupa espacio innecesario.</p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={handleInstallClick}
                  fullWidth
                >
                  Instalar Ahora
                </Button>
              </div>
            )}

            {/* iOS */}
            {isIOS && (
              <div className="install-card">
                <div className="install-icon">🍎</div>
                <h3>Instalar en iPhone/iPad</h3>
                <ol className="ios-instructions">
                  <li>Presiona el botón <strong>Compartir</strong> <span className="ios-share-icon">⎋</span></li>
                  <li>Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                  <li>Confirma y ¡listo!</li>
                </ol>
              </div>
            )}

            {/* Fallback para navegadores no compatibles */}
            {!isInstallable && !isIOS && (
              <div className="install-card">
                <div className="install-icon">🌐</div>
                <h3>Accede desde el Navegador</h3>
                <p>
                  También puedes usar CITAMED.VE directamente desde tu navegador favorito.
                  Guarda esta página en tus favoritos para acceso rápido.
                </p>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={() => window.location.href = '#registro'}
                  fullWidth
                >
                  Comenzar Ahora
                </Button>
              </div>
            )}

            {/* Mockup del teléfono */}
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="phone-notch"></div>
                <div className="phone-content">
                  <div className="mockup-app-header">
                    <span className="mockup-logo">CITAMED<span className="mockup-accent">.VE</span></span>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-header">📅 Próxima Cita</div>
                    <div className="mockup-card-content">
                      <strong>Dr. Carlos Pérez</strong>
                      <div>Hoy, 10:30 AM</div>
                      <div className="mockup-badge">Eres el turno #3</div>
                    </div>
                  </div>
                  <div className="mockup-card">
                    <div className="mockup-card-header">💊 Recetas</div>
                    <div className="mockup-card-content">
                      <small>2 recetas activas</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AppDownload;