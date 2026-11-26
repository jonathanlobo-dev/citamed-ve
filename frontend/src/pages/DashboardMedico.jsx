/**
 * DashboardMedico - CITAMED.VE
 * Panel principal del médico ("Espacio médico"), según la propuesta del piloto (QA 23/11):
 * menú lateral azul, una sola tarjeta de verificación profesional y las tareas del consultorio
 * ordenadas, con agenda, cobros y perfil a la derecha.
 * Colores de la marca: azul #0D304B, turquesa #00B9A5, naranja #FF8A00, gris #F2F6F8.
 */
import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutGrid, CalendarDays, Wallet, User, Search, Home, LogOut, ShieldCheck, ArrowRight,
  MapPin, Clock, CreditCard, Camera, Link2, ExternalLink, ChevronRight, Check, Star,
  Plus, Users, Armchair, UserCheck, BarChart3, Stethoscope, Menu, X
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import useDoctorProfile from '../hooks/useDoctorProfile';
import { FEATURES } from '../config/features';
import { goToHome } from '../config/appUrl';
import { buildSetupTasks } from '../components/doctor/setupTasks';

const NAVY = '#0D304B';
const TEAL = '#00B9A5';

const MY_SPACE = [
  { to: '/medico/dashboard', label: 'Mi consultorio', icon: LayoutGrid },
  { to: '/medico/consulta/nueva', label: 'Nueva consulta', icon: Plus },
  { to: '/medico/agenda', label: 'Mi agenda', icon: CalendarDays },
  { to: '/medico/sala-espera', label: 'Sala de espera', icon: Armchair },
  { to: '/medico/pacientes', label: 'Mis pacientes', icon: Users },
  { to: '/medico/cobros', label: 'Cobros', icon: Wallet },
  ...(FEATURES.doctorReports ? [{ to: '/medico/reportes', label: 'Reportes', icon: BarChart3 }] : [])
];

const MY_ACCOUNT = [
  { to: '/medico/perfil/editar', label: 'Perfil médico', icon: User },
  ...(FEATURES.assistant ? [{ to: '/medico/asistentes', label: 'Mi asistente', icon: UserCheck }] : []),
  { to: '/directorio', label: 'Directorio médico', icon: Search }
];

// Estado de la verificación, con el perfil recién consultado (no con la sesión guardada)
const VERIFICATION = {
  pending: { pill: 'En revisión', pillCls: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Consultamos tu MPPS en el SACS y estamos revisando tu solicitud. Mientras tanto puedes preparar tu consultorio; para atender, emitir documentos o cobrar hace falta la aprobación.', action: 'Ver estado' },
  rejected: { pill: 'Rechazada', pillCls: 'bg-red-50 text-red-700 border-red-200', text: 'Tu verificación fue rechazada. Revisa el motivo y vuelve a enviar tus documentos.', action: 'Revisar verificación' },
  documents_incomplete: { pill: 'Faltan documentos', pillCls: 'bg-orange-50 text-orange-700 border-orange-200', text: 'No pudimos confirmar tu MPPS en el SACS. Sube tu título, tu certificado MPPS y tu cédula para revisarlo a mano.', action: 'Subir documentos' },
  unverified: { pill: 'Pendiente', pillCls: 'bg-orange-50 text-orange-700 border-orange-200', text: 'Puedes preparar tu consultorio. Para atender, emitir documentos o cobrar, primero debes completar la verificación.', action: 'Revisar verificación' }
};

// Texto del botón de cada tarea, como en la propuesta
const TASK_UI = {
  location: { title: 'Dirección del consultorio', hint: 'Indica dónde recibirás a tus pacientes.', doneHint: 'Tu dirección ya está cargada.', action: 'Agregar', icon: MapPin },
  schedule: { title: 'Horarios de atención', hint: 'Los pacientes solo agendan en los horarios que publiques.', doneHint: 'Tu disponibilidad ya está configurada.', action: 'Configurar', icon: Clock },
  price: { title: 'Tarifa de la consulta', hint: 'Define el precio que verá el paciente.', doneHint: 'Tu tarifa ya está definida.', action: 'Definir', icon: CreditCard },
  photo: { title: 'Fotografía de perfil', hint: 'Dale una imagen profesional a tu perfil.', doneHint: 'Tu foto ya está en tu perfil.', action: 'Subir', icon: Camera },
  share: { title: 'Tu página pública', hint: 'Comparte tu enlace por WhatsApp.', action: null, icon: Link2 }
};

function SideLink({ item, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end
      onClick={onClick}
      className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive ? 'bg-white/10 text-white font-semibold' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
    >
      {({ isActive }) => (
        <>
          <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: isActive ? TEAL : undefined }} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ onNavigate, onLogout }) {
  return (
    <div className="flex flex-col h-full px-3 py-6" style={{ backgroundColor: NAVY }}>
      <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">MI ESPACIO</p>
      <nav className="space-y-1">{MY_SPACE.map((i) => <SideLink key={i.to} item={i} onClick={onNavigate} />)}</nav>
      <div className="my-5 mx-3 border-t border-white/10" />
      <p className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-slate-400">MI CUENTA</p>
      <nav className="space-y-1">{MY_ACCOUNT.map((i) => <SideLink key={i.to} item={i} onClick={onNavigate} />)}</nav>
      <div className="mt-auto pt-6 space-y-1">
        <button type="button" onClick={goToHome} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white">
          <Home className="w-[18px] h-[18px]" /> Inicio público
        </button>
        <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white">
          <LogOut className="w-[18px] h-[18px]" /> Salir
        </button>
      </div>
    </div>
  );
}

function DashboardMedico() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const { profile, completeness, fetchMyProfile, fetchCompleteness } = useDoctorProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchMyProfile();
    fetchCompleteness();
  }, [fetchMyProfile, fetchCompleteness]);

  // Si el estado de verificación cambió, la sesión guardada se pone al día (para los avisos de otras pantallas)
  useEffect(() => {
    const saved = user?.profile?.verificationStatus;
    if (profile?.verificationStatus && saved && profile.verificationStatus !== saved) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.verificationStatus]);

  const slug = profile?.publicSlug || null;
  const publicPageUrl = slug ? `${window.location.origin}/dr/${slug}` : null;

  const handleShareWhatsApp = () => {
    if (!publicPageUrl) return;
    const text = `Hola, te comparto mi perfil y enlace para agendar citas médicas en CitaMed: ${publicPageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    if (!publicPageUrl) return;
    navigator.clipboard.writeText(publicPageUrl);
    toast.success('Enlace a tu página pública copiado');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/directorio?q=${encodeURIComponent(q)}` : '/directorio');
  };

  const firstName = profile?.firstName || user?.profile?.firstName || user?.firstName || '';
  const lastName = profile?.lastName || user?.profile?.lastName || user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Doctor';
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'DR';
  // La especialidad puede venir como texto (sesión) o como objeto { name } (perfil)
  const specialtyOf = (s) => (s && typeof s === 'object' ? s.name : s);
  const specialty = specialtyOf(profile?.specialty) || specialtyOf(user?.profile?.specialty) || 'Medicina general';

  const verified = profile?.isVerified === true;
  const verification = profile && !verified ? (VERIFICATION[profile.verificationStatus] || VERIFICATION.unverified) : null;

  const tasks = buildSetupTasks(profile, { onSharePublicPage: handleShareWhatsApp }).filter((t) => t.id !== 'documents');
  const pendingTasks = tasks.filter((t) => !t.optional && !t.done).length;

  const percent = completeness?.percentage || 0;
  const reviews = profile?.totalReviews || 0;
  const rating = reviews > 0 && profile?.averageRating ? parseFloat(profile.averageRating).toFixed(1) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F2F6F8' }}>
      {/* Barra superior */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center gap-4 px-4 lg:px-6 h-16">
          <button type="button" className="lg:hidden p-2 -ml-2 text-slate-600" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/medico/dashboard" className="flex items-center gap-2 shrink-0">
            <img src="/icons/icon-192.png" alt="" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              CITAMED<span style={{ color: '#FF8A00' }}>.VE</span>
            </span>
          </Link>
          <span className="hidden md:block h-7 w-px bg-slate-200" />
          <span className="hidden md:block text-sm font-medium text-slate-600">Espacio médico</span>

          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 ml-auto w-64 px-3 h-10 rounded-lg bg-slate-50 border border-slate-200">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar médicos" className="flex-1 bg-transparent text-sm outline-none" />
          </form>

          <Link to="/cuenta" className="flex items-center gap-3 ml-auto md:ml-4">
            {profile?.profilePhoto
              ? <img src={profile.profilePhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#E0F5F2', color: NAVY }}>{initials}</span>}
            <span className="hidden sm:block leading-tight">
              <span className="block text-sm font-semibold" style={{ color: NAVY }}>Dr. {fullName}</span>
              <span className="block text-xs text-slate-500">{specialty}</span>
            </span>
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Menú lateral fijo en computadora */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <Sidebar onLogout={handleLogout} />
        </aside>

        {/* Menú lateral en el teléfono (panel que se desliza) */}
        {menuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
              <button type="button" className="absolute top-3 right-3 p-2 text-white/80 z-10" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
                <X className="w-5 h-5" />
              </button>
              <Sidebar onNavigate={() => setMenuOpen(false)} onLogout={handleLogout} />
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 px-4 lg:px-6 py-5 space-y-4">
          <p className="text-xs text-slate-500">Mi consultorio <span className="mx-1.5">/</span> Inicio</p>

          {/* Bienvenida */}
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-7">
              <p className="text-[11px] font-semibold tracking-wider" style={{ color: TEAL }}>BIENVENIDO A TU ESPACIO MÉDICO</p>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold" style={{ color: NAVY }}>Hola, Dr. {fullName}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {pendingTasks > 0 ? 'Prepara tu consultorio para empezar.' : 'Tu consultorio está listo para recibir pacientes.'}
                <br />Organiza tu consultorio desde un solo lugar.
              </p>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"><User className="w-3.5 h-3.5" /> {specialty}</p>
            </div>
            <div className="hidden md:flex w-[38%] items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #145374 55%, ${TEAL} 130%)` }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 0, transparent 40%), radial-gradient(circle at 80% 80%, #00B9A5 0, transparent 45%)' }} />
              <div className="relative flex items-center gap-4 text-white">
                <span className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center"><Stethoscope className="w-8 h-8" /></span>
                <span className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center"><CalendarDays className="w-6 h-6" /></span>
                <span className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></span>
              </div>
            </div>
          </section>

          {/* Verificación profesional: una sola tarjeta con el estado real */}
          {verification && (
            <section className="bg-white rounded-2xl border border-slate-200 border-l-4 p-5 flex flex-col md:flex-row md:items-center gap-4" style={{ borderLeftColor: TEAL }}>
              <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#E0F5F2', color: NAVY }}>
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold" style={{ color: NAVY }}>Verificación profesional</h2>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${verification.pillCls}`}>{verification.pill}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600 max-w-xl">{verification.text}</p>
              </div>
              <Link to="/medico/verificacion" className="inline-flex items-center justify-center gap-3 px-5 h-11 rounded-lg text-sm font-semibold text-white shrink-0" style={{ backgroundColor: NAVY }}>
                {verification.action} <ArrowRight className="w-4 h-4" />
              </Link>
            </section>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
            {/* Prepara tu consultorio */}
            <section className="bg-white rounded-2xl border border-slate-200">
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: NAVY }}>Prepara tu consultorio</h2>
                  <p className="text-sm text-slate-500">{pendingTasks > 0 ? 'Tu próximo paso está aquí.' : 'Todo listo. Puedes cambiar cualquier dato cuando quieras.'}</p>
                </div>
                <Link to="/medico/perfil/editar" className="text-[11px] font-semibold tracking-wider text-slate-500 hover:text-slate-700 pt-1">CONFIGURACIÓN</Link>
              </div>
              <ul className="px-3 py-2">
                {tasks.map((task) => {
                  const ui = TASK_UI[task.id];
                  if (!ui) return null;
                  const Icon = ui.icon;
                  const isShare = task.id === 'share';
                  const body = (
                    <>
                      <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${task.done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}>
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold" style={{ color: NAVY }}>
                          {ui.title}{task.optional && <span className="ml-1.5 text-[11px] font-normal text-slate-400">Opcional</span>}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {isShare && !publicPageUrl ? task.hint : (task.done ? ui.doneHint : ui.hint)}
                        </span>
                      </span>
                      {isShare
                        ? <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                        : task.done
                          ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"><Check className="w-3.5 h-3.5" /> Listo</span>
                          : <span className="text-sm font-semibold" style={{ color: NAVY }}>{ui.action}</span>}
                      {!isShare && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
                    </>
                  );
                  const cls = 'flex items-center gap-3 px-2 py-3.5 rounded-lg hover:bg-slate-50 w-full text-left';
                  return (
                    <li key={task.id} className="border-b border-slate-100 last:border-0">
                      {task.to
                        ? <Link to={task.to} className={cls}>{body}</Link>
                        : <button type="button" onClick={task.onClick} className={cls}>{body}</button>}
                      {isShare && publicPageUrl && (
                        <div className="flex flex-wrap gap-2 pl-14 pb-3 -mt-1">
                          <button type="button" onClick={handleCopyLink} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Copiar enlace</button>
                          <a href={publicPageUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50">Ver página</a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Columna derecha */}
            <div className="space-y-4">
              <section className="rounded-2xl p-5 text-white" style={{ backgroundColor: NAVY }}>
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-semibold tracking-wider text-slate-300">AGENDA MÉDICA</p>
                  <CalendarDays className="w-5 h-5" style={{ color: TEAL }} />
                </div>
                <h3 className="mt-2 text-xl font-semibold">Tus citas, a la mano</h3>
                <p className="mt-1 text-xs text-slate-300">Consulta la agenda de tu consultorio.</p>
                <Link to="/medico/agenda" className="mt-4 flex items-center justify-between px-4 h-10 rounded-lg bg-white text-sm font-semibold" style={{ color: NAVY }}>
                  Ver agenda <ArrowRight className="w-4 h-4" />
                </Link>
              </section>

              <Link to="/medico/cobros" className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-3 hover:border-slate-300">
                <span className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500"><Wallet className="w-5 h-5" /></span>
                <span className="flex-1">
                  <span className="block font-semibold" style={{ color: NAVY }}>Cobros</span>
                  <span className="block text-xs text-slate-500">Consulta tus movimientos.</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: NAVY }}>Ver cobros <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>

              <section className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold" style={{ color: NAVY }}>Tu perfil profesional</h3>
                  <span className="text-xl font-bold" style={{ color: NAVY }}>{percent} %</span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: TEAL }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Completado</span>
                  <Link to="/medico/perfil/editar" className="flex items-center gap-1 font-semibold" style={{ color: NAVY }}>Editar perfil <ArrowRight className="w-3.5 h-3.5" /></Link>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5" style={rating ? { color: '#FF8A00', fill: '#FF8A00' } : undefined} />
                    {rating ? `${rating} de calificación` : 'Sin reseñas todavía'}
                  </span>
                  <span>{reviews} {reviews === 1 ? 'reseña' : 'reseñas'}</span>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardMedico;
