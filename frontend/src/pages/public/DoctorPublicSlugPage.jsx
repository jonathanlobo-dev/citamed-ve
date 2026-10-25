/**
 * DoctorPublicSlugPage.jsx - CITAMED.VE
 * Semana 9 / Bloque B - Página pública del médico accesible por /dr/:slug
 * 
 * Reglas:
 * - Página pública, limpia y optimizada para móviles (390 px).
 * - NUNCA muestra correo, cédula ni teléfono personal.
 * - Botón "Agendar cita" (lleva a /agendar/:doctorId).
 * - Botón "Compartir perfil" (Web Share o portapapeles).
 * - Marca CitaMed, español neutro venezolano (tú), sin guiones largos.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  Share2,
  Phone,
  Video,
  DollarSign,
  Languages,
  Award,
  ArrowRight,
  ShieldCheck,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react';
import publicService from '../../services/publicService';
import toast from 'react-hot-toast';

export default function DoctorPublicSlugPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDoctor() {
      try {
        setLoading(true);
        setError(null);
        const res = await publicService.getDoctorBySlug(slug);
        if (isMounted) {
          if (res.success && res.data) {
            setDoctor(res.data);
            // Actualizar título de la pestaña para compartir y SEO
            document.title = `${res.data.name} | CitaMed`;
          } else {
            setError(res.message || 'No se encontró el perfil del médico.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Médico no encontrado o perfil no disponible.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (slug) {
      loadDoctor();
    }

    return () => {
      isMounted = false;
      document.title = 'CitaMed';
    };
  }, [slug]);

  const handleShare = async () => {
    const pageUrl = window.location.href;
    const shareData = {
      title: `${doctor?.name || 'Médico'} en CitaMed`,
      text: `Agenda tu cita médica con ${doctor?.name || 'tu médico'} en CitaMed.`,
      url: pageUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      toast.success('¡Enlace copiado al portapapeles!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  };

  const handleBookAppointment = () => {
    if (doctor?.doctorId) {
      navigate(`/agendar/${doctor.doctorId}`);
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Cargando perfil médico...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Perfil no disponible</h1>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          {error || 'El médico solicitado no existe o su enlace público no se encuentra activo.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
        >
          Volver a CitaMed
        </button>
      </div>
    );
  }

  const cleanWhatsapp = doctor.whatsappNumber ? String(doctor.whatsappNumber).replace(/\D/g, '') : '';
  const waUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp.startsWith('58') ? cleanWhatsapp : '58' + cleanWhatsapp.replace(/^0/, '')}?text=${encodeURIComponent(`Hola ${doctor.name}, te contacto desde tu página en CitaMed.`)}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      {/* Barra superior de marca minimalista */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
              C
            </div>
            <span className="font-bold text-lg text-primary tracking-tight">CitaMed</span>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            title="Compartir perfil"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{copied ? '¡Copiado!' : 'Compartir'}</span>
          </button>
        </div>
      </header>

      {/* Contenido principal optimizado para 390px */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">
        {/* Tarjeta de presentación / Hero */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm text-center sm:text-left sm:flex sm:items-center sm:gap-5">
          <div className="relative mx-auto sm:mx-0 w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-primary/20 flex-shrink-0 shadow-inner flex items-center justify-center">
            {doctor.profilePhoto ? (
              <img
                src={doctor.profilePhoto}
                alt={doctor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                {doctor.firstName?.[0]}
                {doctor.lastName?.[0]}
              </div>
            )}
            <div
              className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow"
              title="Médico verificado por CitaMed"
            >
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          <div className="mt-3 sm:mt-0 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                <CheckCircle className="w-3 h-3 text-teal-600" />
                Verificado
              </span>
              {doctor.acceptingNewPatients && (
                <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200/60">
                  Nuevos pacientes
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {doctor.name}
            </h1>

            <p className="text-sm font-semibold text-primary mt-0.5">
              {doctor.specialty?.name || 'Especialista Médico'}
              {doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ''}
            </p>

            {/* Reputación y experiencia */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs text-slate-600">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="font-bold text-slate-800">
                  {doctor.averageRating > 0 ? doctor.averageRating.toFixed(1) : 'Nuevo'}
                </span>
                {doctor.totalReviews > 0 && (
                  <span className="text-slate-400">({doctor.totalReviews} reseñas)</span>
                )}
              </div>
              {doctor.experienceYears > 0 && (
                <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
                  <Award className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{doctor.experienceYears} años de experiencia</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Resumen rápido de consulta y tarifas */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Consulta Presencial
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900">
                ${doctor.consultationFee.toFixed(2)}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">USD</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Por consulta
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-sm">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              Modalidades
            </span>
            <div className="space-y-1 mt-1 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5 text-teal-700">
                <Building className="w-3.5 h-3.5 text-teal-600" />
                <span>Consultorio</span>
              </div>
              {doctor.telemedicineEnabled && (
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Telemedicina</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Ubicación del Consultorio */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Lugar de atención
          </h2>
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-xs space-y-1">
            <p className="font-bold text-slate-800 text-sm">
              {doctor.clinicName || 'Consultorio Profesional'}
            </p>
            {doctor.clinicAddress && (
              <p className="text-slate-600">{doctor.clinicAddress}</p>
            )}
            {(doctor.city || doctor.state) && (
              <p className="text-slate-500 font-medium">
                {[doctor.city, doctor.state].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </section>

        {/* Biografía / Acerca de */}
        {doctor.bio && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Acerca del especialista
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {doctor.bio}
            </p>
          </section>
        )}

        {/* Condiciones que trata o Enfoques */}
        {((doctor.specialConditions && doctor.specialConditions.length > 0) ||
          (doctor.treatmentApproaches && doctor.treatmentApproaches.length > 0)) && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900">Áreas de atención y enfoque</h2>
            {doctor.specialConditions && doctor.specialConditions.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
                  Condiciones frecuentes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {doctor.specialConditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Idiomas */}
        {doctor.languages && doctor.languages.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
              <Languages className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-slate-500 block">Idiomas de atención</span>
              <span className="font-bold text-slate-800">{doctor.languages.join(', ')}</span>
            </div>
          </section>
        )}

        {/* Mensaje de confianza / Garantía */}
        <div className="p-4 bg-teal-50/70 border border-teal-200/60 rounded-xl text-xs text-teal-800 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <p>
            Tu información y cita están respaldadas por la plataforma médica <strong>CitaMed</strong>.
            Podrás gestionar confirmaciones y recordatorios sin costo adicional.
          </p>
        </div>
      </main>

      {/* Barra de acción fija en la parte inferior para móviles */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition shadow-sm"
              title="Contactar por WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>
          )}
          <button
            type="button"
            onClick={handleBookAppointment}
            className="flex-1 py-3 px-5 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Agendar cita con {doctor.name.split(' ')[1] || 'el médico'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
