/**
 * PatientNavBar.jsx - CitaMed
 * Barra de navegación del paciente, visible en todas sus páginas:
 *  - Arriba y fija: Inicio, Mis citas, Mi historia, Directorio y Mi cuenta (en el teléfono muestra
 *    en qué sección estás).
 *  - Abajo, solo en el teléfono: las mismas cinco opciones como pestañas.
 * La sección activa siempre queda marcada. "Inicio" pasa por goToHome: con sesión abierta lleva al panel.
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FileHeart, Stethoscope, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { goToHome } from '../../config/appUrl';
import { PATIENT_SECTIONS, patientSectionFor, showPatientNav } from '../../config/patientNav';

const ICONS = {
  inicio: Home,
  citas: CalendarDays,
  historia: FileHeart,
  directorio: Stethoscope,
  cuenta: UserCog
};

export default function PatientNavBar() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const visible = showPatientNav(user, location.pathname);
  const active = visible ? patientSectionFor(location.pathname) : null;

  // El resto de la app (Navbar, banners fijos) lee estas medidas desde el CSS global
  useEffect(() => {
    if (!visible) return undefined;
    document.body.classList.add('has-patient-nav');
    return () => document.body.classList.remove('has-patient-nav');
  }, [visible]);

  if (!visible) return null;

  const go = (section) => {
    if (section.key === 'inicio') goToHome(navigate);
    else navigate(section.path);
  };

  const ActiveIcon = ICONS[active.key];

  return (
    <>
      <header className="sticky top-0 z-[60] h-12 bg-slate-900 text-white shadow-sm" data-testid="patient-nav-top">
        <nav aria-label="Navegación del paciente" className="container mx-auto h-full px-4 lg:px-8 flex items-center">
          {/* Teléfono: dónde estás */}
          <div className="md:hidden flex items-center gap-2 font-semibold text-sm" aria-live="polite">
            <ActiveIcon className="w-4 h-4 text-sky-300" aria-hidden="true" />
            <span>{active.label}</span>
          </div>

          {/* Escritorio: las cinco secciones */}
          <ul className="hidden md:flex items-center gap-1 h-full">
            {PATIENT_SECTIONS.map((section) => {
              const Icon = ICONS[section.key];
              const isActive = section.key === active.key;
              return (
                <li key={section.key} className="h-full">
                  <button
                    type="button"
                    onClick={() => go(section)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`h-full px-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-sky-300 text-white font-bold'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <nav
        aria-label="Navegación del paciente (teléfono)"
        data-testid="patient-nav-bottom"
        className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(15,23,42,0.08)] flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PATIENT_SECTIONS.map((section) => {
          const Icon = ICONS[section.key];
          const isActive = section.key === active.key;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => go(section)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 h-16 text-[11px] leading-tight transition-colors ${
                isActive ? 'text-primary font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`px-3 py-1 rounded-full ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
              {section.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
