/**
 * LegalLayout - CITAMED.VE
 * Estructura común de las páginas legales: términos, privacidad y código de ética.
 */

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../common/Navbar/Navbar';
import { goToHome } from '../../config/appUrl';
import { useNavigate } from 'react-router-dom';

// Mientras un abogado no revise estos textos, la página lo dice. Al revisarlos se pone en false.
export const LEGAL_PENDING_REVIEW = true;

const OTHER_PAGES = [
  { to: '/terminos', label: 'Términos y Condiciones' },
  { to: '/privacidad', label: 'Política de Privacidad' },
  { to: '/codigo-etica', label: 'Código de Ética Médica' }
];

export default function LegalLayout({ title, updated, intro, sections }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          type="button"
          onClick={() => goToHome(navigate)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Volver al inicio
        </button>

        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Última actualización: {updated}</p>

          {LEGAL_PENDING_REVIEW && (
            <p role="note" className="mt-4 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-4 py-3">
              Versión preliminar: este texto está pendiente de revisión legal antes del lanzamiento público de CitaMed.
            </p>
          )}

          {intro && <p className="mt-6 text-gray-700 leading-relaxed">{intro}</p>}

          <div className="mt-8 space-y-8">
            {sections.map((s, i) => (
              <section key={s.title} aria-labelledby={`sec-${i}`}>
                <h2 id={`sec-${i}`} className="text-lg font-bold text-gray-900 mb-2">
                  {i + 1}. {s.title}
                </h2>
                {s.paragraphs?.map((p) => (
                  <p key={p} className="text-gray-700 leading-relaxed mb-3">{p}</p>
                ))}
                {s.items && (
                  <ul className="list-disc pl-6 space-y-1.5 text-gray-700 leading-relaxed">
                    {s.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <p className="mt-10 text-sm text-gray-600">
            ¿Dudas? Escríbenos a{' '}
            <a className="text-primary underline" href="mailto:soporte@citamedve.app">soporte@citamedve.app</a>.
          </p>
        </article>

        <nav aria-label="Otros documentos legales" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {OTHER_PAGES.map((p) => (
            <Link key={p.to} to={p.to} className="text-primary hover:underline">{p.label}</Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
