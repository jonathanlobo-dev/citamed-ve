import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

// App instalable: el service worker solo se registra en el sitio publicado, no en desarrollo local
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[CitaMed] No se pudo registrar el service worker:', err);
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        success: {
          duration: 4000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        },
        error: {
          duration: 5000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        },
      }}
    />
  </StrictMode>,
)
