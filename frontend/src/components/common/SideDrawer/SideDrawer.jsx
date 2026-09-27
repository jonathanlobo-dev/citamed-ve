import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './SideDrawer.css';

/**
 * SideDrawer - Panel lateral deslizable (CitaMed)
 * Reemplaza ventanas emergentes y modales en los flujos clínicos.
 *
 * @param {boolean} open - Si el panel está abierto
 * @param {Function} onClose - Callback al cerrar
 * @param {React.ReactNode} title - Título del encabezado
 * @param {React.ReactNode} children - Contenido del panel
 * @param {React.ReactNode} [footer] - Acciones del pie de página
 */
export default function SideDrawer({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  // Bloquear scroll de fondo y manejar foco / tecla Escape
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial en el panel para accesibilidad
    const timer = setTimeout(() => {
      if (panelRef.current) {
        panelRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedRef.current && previouslyFocusedRef.current.focus) {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open && typeof document !== 'undefined') {
    return null;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`sidedrawer-overlay ${open ? 'open' : ''}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : 'Panel lateral'}
    >
      <div
        ref={panelRef}
        className="sidedrawer-panel"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sidedrawer-header">
          <h2 className="sidedrawer-title">{title}</h2>
          <button
            type="button"
            className="sidedrawer-close-btn"
            onClick={onClose}
            aria-label="Cerrar panel"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="sidedrawer-body">{children}</div>

        {footer && <footer className="sidedrawer-footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
