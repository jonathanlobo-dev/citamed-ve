/**
 * LandingPage - CITAMED.VE
 * Página de presentación (citamedve.app). Solo cuenta qué es CitaMed y lleva al sistema
 * (app.citamedve.app) para iniciar sesión, crear cuenta o buscar médico.
 * Solo se muestra lo que ya existe en la plataforma.
 */

import { useState } from 'react';
import {
  CalendarDays, Armchair, Stethoscope, FileCheck2, Wallet, Globe, UserCog,
  MessageCircle, FileSpreadsheet, Search, HeartPulse, QrCode, ShieldCheck,
  Lock, BadgeCheck, Smartphone, ChevronDown, ArrowRight, Menu, X, Mic, Sparkles
} from 'lucide-react';
import { appHref } from '../config/appUrl';

const DOCTOR_FEATURES = [
  { icon: CalendarDays, title: 'Agenda en orden', text: 'Vista por día, semana y mes, con varios consultorios y horarios que tú defines.' },
  { icon: Armchair, title: 'Sala de espera en vivo', text: 'Ves quién llegó y en qué orden, y tus pacientes ven su turno desde el teléfono.' },
  { icon: Stethoscope, title: 'Espacio Clínico', text: 'Nota SOAP, signos vitales, examen físico por sistemas y alertas de alergia en una sola pantalla.' },
  { icon: Sparkles, title: 'Dicta y la IA redacta', text: 'Dicta por voz y la IA ordena la nota o el récipe. Tú revisas antes de guardar.' },
  { icon: FileCheck2, title: 'Documentos con QR', text: 'Récipes, órdenes de exámenes, reposos, constancias e informes en PDF que cualquiera puede verificar.' },
  { icon: Wallet, title: 'Cobros a tasa BCV', text: 'Registra pagos en dólares o bolívares con la tasa del día y entrega recibos verificables.' },
  { icon: Globe, title: 'Tu página propia', text: 'Un enlace con tu perfil y botón para agendar, listo para compartir por WhatsApp o redes.' },
  { icon: UserCog, title: 'Tu asistente incluida', text: 'Tu secretaria maneja agenda, sala de espera y cobros con su propia cuenta, sin ver la información clínica.' },
  { icon: MessageCircle, title: 'Confirmación por WhatsApp', text: 'Envías un enlace y el paciente confirma o cancela sin iniciar sesión.' },
  { icon: FileSpreadsheet, title: 'Trae tus pacientes', text: 'Importa tu lista desde Excel o CSV con vista previa antes de confirmar.' }
];

const PATIENT_FEATURES = [
  { icon: Search, title: 'Encuentra a tu médico', text: 'Busca por especialidad y ciudad, y mira su perfil antes de agendar.' },
  { icon: CalendarDays, title: 'Agenda en línea', text: 'Elige día y hora disponibles, sin llamadas ni esperas.' },
  { icon: Armchair, title: 'Tu turno en el teléfono', text: 'Sigue la sala de espera en vivo y llega cuando te toca.' },
  { icon: HeartPulse, title: 'Tu historia contigo', text: 'Consultas, récipes y documentos de tus médicos en un solo lugar.' },
  { icon: QrCode, title: 'Récipes verificables', text: 'Cada récipe trae un código QR que la farmacia puede comprobar.' }
];

const STEPS = [
  { n: '1', title: 'Crea tu cuenta', text: 'Nombre, correo y tu número MPPS. Toma menos de un minuto.' },
  { n: '2', title: 'Prepara tu consultorio', text: 'Dirección, horarios, precio y foto, paso a paso desde tu panel.' },
  { n: '3', title: 'Verificamos tu MPPS', text: 'Revisamos tus documentos para que tus pacientes sepan que eres médico.' },
  { n: '4', title: 'Empieza a atender', text: 'Comparte tu enlace, recibe citas y atiende desde la computadora o el teléfono.' }
];

const TRUST = [
  { icon: BadgeCheck, title: 'Médicos verificados', text: 'Cada médico pasa por la revisión de su número MPPS antes de atender.' },
  { icon: Lock, title: 'Tu información es tuya', text: 'Cada médico ve solo las consultas que hizo contigo. Sus notas privadas nunca se comparten.' },
  { icon: ShieldCheck, title: 'Documentos que no se alteran', text: 'Los documentos emitidos no se borran: solo se anulan, y el QR muestra su estado real.' }
];

const FAQ = [
  { q: '¿Necesito instalar algo?', a: 'No. CitaMed funciona en el navegador de tu teléfono, tablet o computadora.' },
  { q: '¿Cómo verifican a los médicos?', a: 'Al registrarse, el médico envía su número MPPS y sus documentos. Nuestro equipo los revisa antes de habilitar las consultas, los documentos y los cobros.' },
  { q: '¿Quién puede ver mi historia médica?', a: 'Tú ves toda tu historia. Cada médico ve solo las consultas y documentos que hizo contigo, más los datos que tú compartas en tu perfil.' },
  { q: '¿Puedo cobrar en bolívares?', a: 'Sí. Registras el pago en dólares o en bolívares y CitaMed calcula el monto con la tasa BCV del día.' },
  { q: '¿Mi secretaria puede usarlo?', a: 'Sí. La invitas desde tu panel y tú decides qué puede hacer: agenda, sala de espera o cobros. Nunca ve la información clínica.' },
  { q: '¿Cómo se comprueba un récipe?', a: 'Escaneando su código QR. Se abre una página de CitaMed que muestra si el récipe es válido o fue anulado.' }
];

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-10">
      {eyebrow && <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-2">{eyebrow}</p>}
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">{title}</h2>
      {text && <p className="mt-3 text-slate-600 text-lg">{text}</p>}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-md transition">
      <span className="inline-flex p-2.5 rounded-xl bg-teal-50 text-teal-600 mb-3">
        <Icon className="w-5 h-5" />
      </span>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 leading-relaxed">{text}</p>
    </div>
  );
}

function HeroMockup() {
  const rows = [
    { time: '08:30', name: 'María G.', state: 'Atendida', cls: 'bg-slate-100 text-slate-500' },
    { time: '09:00', name: 'Luis P.', state: 'En consulta', cls: 'bg-teal-100 text-teal-700' },
    { time: '09:30', name: 'Ana R.', state: 'En sala', cls: 'bg-amber-100 text-amber-700' },
    { time: '10:00', name: 'José M.', state: 'Confirmada', cls: 'bg-sky-100 text-sky-700' }
  ];
  return (
    <div className="relative w-full max-w-md mx-auto" aria-hidden="true">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500">Hoy</p>
            <p className="font-bold text-slate-900">Tu agenda</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700">4 citas</span>
        </div>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.time} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
              <span className="text-sm font-mono text-slate-500 w-12">{r.time}</span>
              <span className="flex-1 font-medium text-slate-800">{r.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.cls}`}>{r.state}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="absolute -bottom-6 -left-4 sm:-left-10 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center gap-3">
        <span className="p-2 rounded-xl bg-teal-600 text-white"><Mic className="w-4 h-4" /></span>
        <div>
          <p className="text-xs text-slate-500">Dictado</p>
          <p className="text-sm font-semibold text-slate-800">Nota SOAP lista</p>
        </div>
      </div>
      <div className="absolute -top-5 -right-3 sm:-right-8 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center gap-3">
        <span className="p-2 rounded-xl bg-orange-500 text-white"><QrCode className="w-4 h-4" /></span>
        <div>
          <p className="text-xs text-slate-500">Récipe</p>
          <p className="text-sm font-semibold text-slate-800">Verificable</p>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const loginHref = appHref('/login');
  const registerHref = appHref('/registro');
  const doctorRegisterHref = appHref('/registro?role=doctor');
  const patientRegisterHref = appHref('/registro?role=patient');
  const directoryHref = appHref('/directorio');

  const nav = [
    { href: '#medicos', label: 'Para médicos' },
    { href: '#pacientes', label: 'Para pacientes' },
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#preguntas', label: 'Preguntas' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Cabecera */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="#inicio" className="text-2xl font-extrabold text-primary">
            CITAMED<span className="text-accent">.VE</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {nav.map((n) => <a key={n.href} href={n.href} className="hover:text-teal-600">{n.label}</a>)}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <a href={loginHref} className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-300 hover:border-teal-500">Iniciar sesión</a>
            <a href={registerHref} className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90">Crear cuenta</a>
          </div>
          <button type="button" className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            {nav.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuOpen(false)} className="block font-medium text-slate-700">{n.label}</a>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a href={loginHref} className="text-center text-sm font-semibold px-4 py-2.5 rounded-xl border border-slate-300">Iniciar sesión</a>
              <a href={registerHref} className="text-center text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white">Crear cuenta</a>
            </div>
          </div>
        )}
      </header>

      <main id="contenido">
        {/* Hero */}
        <section id="inicio" className="overflow-hidden bg-gradient-to-br from-teal-50 via-white to-orange-50">
          <div className="max-w-6xl mx-auto px-4 py-14 md:py-24 grid md:grid-cols-2 gap-14 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-slate-900">
                Tu consultorio en orden. <span className="text-teal-600">Tus pacientes, más cerca.</span>
              </h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed">
                CitaMed reúne tu agenda, la sala de espera, la consulta con IA, los récipes con QR y los cobros
                a tasa BCV en un solo lugar. Y a tus pacientes les da una forma fácil de encontrarte y agendar.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a href={doctorRegisterHref} className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-xl bg-primary text-white hover:opacity-90">
                  Soy médico, crear cuenta <ArrowRight className="w-4 h-4" />
                </a>
                <a href={directoryHref} className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-teal-500">
                  <Search className="w-4 h-4" /> Buscar médico
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-500 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Sin instalar nada: funciona en el teléfono y en la computadora.
              </p>
            </div>
            <HeroMockup />
          </div>
        </section>

        {/* Médicos */}
        <section id="medicos" className="max-w-6xl mx-auto px-4 py-16 md:py-20 scroll-mt-16">
          <SectionTitle
            eyebrow="Para médicos"
            title="Todo tu consultorio en una sola herramienta"
            text="Menos papel y menos mensajes sueltos. Más tiempo para tus pacientes."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCTOR_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
          <div className="text-center mt-10">
            <a href={doctorRegisterHref} className="inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl bg-primary text-white hover:opacity-90">
              Crear mi cuenta de médico <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Pacientes */}
        <section id="pacientes" className="bg-white border-y border-slate-200 scroll-mt-16">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <SectionTitle
              eyebrow="Para pacientes"
              title="Tu salud, sin vueltas"
              text="Encuentra a tu médico, agenda en minutos y ten tu información siempre a mano."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {PATIENT_FEATURES.map((f) => <FeatureCard key={f.title} {...f} />)}
            </div>
            <div className="text-center mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a href={directoryHref} className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700">
                <Search className="w-4 h-4" /> Buscar médico
              </a>
              <a href={patientRegisterHref} className="inline-flex items-center justify-center gap-2 font-semibold px-6 py-3 rounded-xl border border-slate-300 hover:border-teal-500">
                Crear cuenta de paciente
              </a>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="max-w-6xl mx-auto px-4 py-16 md:py-20 scroll-mt-16">
          <SectionTitle eyebrow="Cómo funciona" title="Empieza en cuatro pasos" />
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-white rounded-2xl border border-slate-200 p-5">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-primary text-white font-bold mb-3">{s.n}</span>
                <h3 className="font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Confianza */}
        <section className="bg-primary text-white">
          <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <Icon className="w-8 h-8 text-teal-300 mb-3" />
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-white/80 mt-1 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="max-w-3xl mx-auto px-4 py-16 md:py-20 scroll-mt-16">
          <SectionTitle eyebrow="Preguntas frecuentes" title="Lo que más nos preguntan" />
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={f.q} className="bg-white rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 text-left p-5 font-semibold text-slate-900"
                  aria-expanded={openFaq === i}
                >
                  {f.q}
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="px-5 pb-5 -mt-2 text-slate-600 leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Llamado final */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="rounded-3xl bg-gradient-to-br from-teal-600 to-primary text-white p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold">Lleva tu consultorio a CitaMed</h2>
            <p className="mt-3 text-white/85 text-lg">Crea tu cuenta hoy y prepara tu consultorio a tu ritmo.</p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <a href={doctorRegisterHref} className="font-bold px-6 py-3.5 rounded-xl bg-white text-primary hover:bg-slate-100">Soy médico, crear cuenta</a>
              <a href={loginHref} className="font-semibold px-6 py-3.5 rounded-xl border border-white/40 hover:bg-white/10">Ya tengo cuenta</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold text-white">CITAMED<span className="text-accent">.VE</span></p>
            <p className="text-sm mt-1">Plataforma de salud que conecta médicos y pacientes en Venezuela.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="/terminos" className="hover:text-white">Términos y Condiciones</a>
            <a href="/privacidad" className="hover:text-white">Política de Privacidad</a>
            <a href="/codigo-etica" className="hover:text-white">Código de Ética Médica</a>
            <a href={loginHref} className="hover:text-white">Iniciar sesión</a>
          </nav>
        </div>
        <p className="text-center text-xs pb-6">© {new Date().getFullYear()} CitaMed. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
