/**
 * DoctorProfilePage - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Página pública del perfil de un doctor - Diseño Enterprise Premium
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  Award,
  GraduationCap,
  Briefcase,
  Calendar,
  Video,
  Home,
  Shield,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Heart,
  MessageCircle,
  Share2,
  Languages,
  Stethoscope,
  Building2,
  BadgeCheck,
  TrendingUp,
  Users,
  ThumbsUp
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import useDoctorProfile from '../../hooks/useDoctorProfile';

// Componente de estadísticas destacadas
const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-white/70">{label}</div>
  </div>
);

// Badge de verificación
const VerificationBadge = ({ isVerified, verificationStatus }) => {
  if (isVerified || verificationStatus === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 px-3 py-1.5 rounded-full text-sm font-medium">
        <ShieldCheck className="w-4 h-4" />
        Médico Verificado
      </div>
    );
  }
  return null;
};

// Componente de Badge para especialidades
const SpecialtyBadge = ({ specialty, isPrimary }) => (
  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
    isPrimary
      ? 'bg-white text-teal-700 shadow-lg'
      : 'bg-white/20 text-white backdrop-blur-sm'
  }`}>
    {isPrimary && <Star className="w-3.5 h-3.5 mr-1.5 text-amber-500 fill-current" />}
    {specialty?.name || specialty}
  </span>
);

// Componente de sección con icono
const SectionHeader = ({ icon: Icon, title, color = 'teal' }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
      <Icon className={`w-6 h-6 text-${color}-600`} />
    </div>
    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
  </div>
);

// Componente de Educación mejorado
const EducationItem = ({ education }) => (
  <div className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
    <div className="p-3 bg-blue-100 rounded-xl h-fit">
      <GraduationCap className="w-6 h-6 text-blue-600" />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-gray-900 text-lg">{education.degree}</h4>
      <p className="text-blue-600 font-medium">{education.institution}</p>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        <Calendar className="w-4 h-4" />
        <span>{education.startYear} - {education.endYear || 'Presente'}</span>
        {education.country && (
          <>
            <span className="text-gray-300">•</span>
            <MapPin className="w-4 h-4" />
            <span>{education.country}</span>
          </>
        )}
      </div>
    </div>
  </div>
);

// Componente de Experiencia mejorado
const ExperienceItem = ({ experience }) => (
  <div className="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-100">
    <div className="p-3 bg-purple-100 rounded-xl h-fit">
      <Briefcase className="w-6 h-6 text-purple-600" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-3">
        <h4 className="font-bold text-gray-900 text-lg">{experience.position}</h4>
        {experience.isCurrent && (
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
            Actualmente
          </span>
        )}
      </div>
      <p className="text-purple-600 font-medium">{experience.institution}</p>
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>
          {new Date(experience.startDate).toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })}
          {' → '}
          {experience.endDate
            ? new Date(experience.endDate).toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })
            : 'Presente'}
        </span>
        {experience.city && (
          <>
            <span className="text-gray-300">•</span>
            <MapPin className="w-4 h-4" />
            <span>{experience.city}</span>
          </>
        )}
      </div>
    </div>
  </div>
);

// Tarjeta de servicio/precio
const ServicePriceCard = ({ icon: Icon, title, price, description, color, available = true }) => (
  <div className={`relative overflow-hidden rounded-2xl border-2 ${available ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'} p-5 transition-all hover:border-teal-200 hover:shadow-lg`}>
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-4`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h4 className="font-bold text-gray-900 text-lg mb-1">{title}</h4>
    <p className="text-sm text-gray-500 mb-3">{description}</p>
    {available && price > 0 ? (
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-teal-600">${parseFloat(price).toFixed(2)}</span>
        <span className="text-gray-400 text-sm">USD</span>
      </div>
    ) : (
      <span className="text-gray-400 text-sm">No disponible</span>
    )}
  </div>
);

// Componente de Disponibilidad mejorado
const AvailabilityCard = ({ availability }) => {
  if (!availability) return null;

  const dayNames = {
    0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
  };

  const days = Object.entries(availability).filter(([_, data]) => data.available);

  if (days.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {days.map(([dayNum, data]) => (
        <div key={dayNum} className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-teal-600" />
            <p className="font-bold text-teal-800">{dayNames[dayNum] || data.dayNameShort}</p>
          </div>
          <div className="space-y-2">
            {data.schedules?.map((schedule, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 font-medium">{schedule.start} - {schedule.end}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente principal
const DoctorProfilePage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    availability,
    fetchProfile,
    fetchAvailability
  } = useDoctorProfile();

  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (doctorId) {
      fetchProfile(parseInt(doctorId));
      fetchAvailability(parseInt(doctorId));
    }
  }, [doctorId, fetchProfile, fetchAvailability]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-white animate-bounce" />
            </div>
            <p className="text-gray-500 font-medium">Cargando perfil del doctor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perfil no encontrado</h2>
            <p className="text-gray-500 mb-6">{error || 'El médico que buscas no existe o no está disponible.'}</p>
            <button
              onClick={() => navigate('/directorio')}
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al directorio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información', icon: User },
    { id: 'services', label: 'Servicios y Tarifas', icon: Briefcase },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'location', label: 'Ubicación', icon: MapPin }
  ];

  // Calcular estadísticas
  const stats = {
    experience: profile.experienceYears || 0,
    rating: profile.averageRating ? parseFloat(profile.averageRating).toFixed(1) : null,
    reviews: profile.totalReviews || 0,
    patients: profile.totalPatients || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* Hero Header Premium */}
      <div className="relative overflow-hidden">
        {/* Fondo con patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500">
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heroPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroPattern)" />
          </svg>
          {/* Círculos decorativos */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-white/70 text-sm mb-8"
          >
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/directorio" className="hover:text-white transition-colors">Directorio Médico</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Dr. {profile.firstName} {profile.lastName}</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Columna izquierda - Foto y acciones */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full lg:w-auto flex flex-col items-center"
            >
              {/* Foto con anillo de estado */}
              <div className="relative">
                <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-white p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt={`Dr. ${profile.firstName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-20 h-20 text-gray-400" />
                    )}
                  </div>
                </div>
                {/* Badge de verificación flotante */}
                {(profile.isVerified || profile.verificationStatus === 'approved') && (
                  <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <BadgeCheck className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              {/* Acciones rápidas mobile */}
              <div className="flex gap-3 mt-6 lg:hidden">
                <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                  <Heart className="w-5 h-5 text-white" />
                </button>
                <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>

            {/* Columna central - Info principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 text-center lg:text-left"
            >
              {/* Verificación */}
              <div className="mb-3">
                <VerificationBadge isVerified={profile.isVerified} verificationStatus={profile.verificationStatus} />
              </div>

              {/* Nombre */}
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
                Dr. {profile.firstName} {profile.lastName}
              </h1>

              {/* Especialidades */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
                {profile.specialtiesList?.map((spec, idx) => (
                  <SpecialtyBadge key={idx} specialty={spec} isPrimary={spec.isPrimary || idx === 0} />
                ))}
                {profile.specialty && !profile.specialtiesList?.length && (
                  <SpecialtyBadge specialty={{ name: profile.specialty }} isPrimary />
                )}
              </div>

              {/* Bio corta */}
              {profile.bio && (
                <p className="text-white/80 text-lg max-w-xl mb-6 leading-relaxed">
                  {profile.bio.length > 150 ? `${profile.bio.substring(0, 150)}...` : profile.bio}
                </p>
              )}

              {/* Ubicación y contacto rápido */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-white/80">
                {profile.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{profile.city}{profile.state && `, ${profile.state}`}</span>
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    <span>{profile.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Columna derecha - CTA y acciones */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-auto"
            >
              {/* Card de reserva */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[280px]">
                <div className="text-center mb-4">
                  <p className="text-gray-500 text-sm mb-1">Consulta desde</p>
                  {profile.consultationFee > 0 || profile.priceTeleconsultation > 0 ? (
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-teal-600">
                        ${Math.min(
                          profile.consultationFee || 999,
                          profile.priceTeleconsultation || 999
                        ).toFixed(2)}
                      </span>
                      <span className="text-gray-400">USD</span>
                    </div>
                  ) : (
                    <span className="text-xl text-gray-400">Consultar</span>
                  )}
                </div>

                <button
                  onClick={() => window.alert('Sistema de citas próximamente disponible')}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-4 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-3"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Cita
                </button>

                {profile.whatsappNumber && (
                  <a
                    href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Contactar por WhatsApp
                  </a>
                )}

                {/* Acciones adicionales desktop */}
                <div className="hidden lg:flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button className="flex-1 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-600">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Guardar</span>
                  </button>
                  <button className="flex-1 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-gray-600">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Compartir</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Estadísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            {stats.experience > 0 && (
              <StatCard
                icon={Award}
                value={`${stats.experience}+`}
                label="Años de experiencia"
                color="bg-amber-500"
              />
            )}
            {stats.rating && (
              <StatCard
                icon={Star}
                value={stats.rating}
                label={`${stats.reviews} reseñas`}
                color="bg-yellow-500"
              />
            )}
            {profile.acceptingNewPatients && (
              <StatCard
                icon={Users}
                value="Sí"
                label="Acepta nuevos pacientes"
                color="bg-green-500"
              />
            )}
            {profile.telemedicineEnabled && (
              <StatCard
                icon={Video}
                value="Disponible"
                label="Telemedicina"
                color="bg-blue-500"
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna principal */}
              <div className="lg:col-span-2 space-y-8">
                {/* Sobre mí */}
                {profile.bio && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <SectionHeader icon={User} title="Sobre mí" />
                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  </div>
                )}

                {/* Formación Académica */}
                {profile.education?.length > 0 && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <SectionHeader icon={GraduationCap} title="Formación Académica" color="blue" />
                    <div className="space-y-4">
                      {profile.education.map((edu, idx) => (
                        <EducationItem key={idx} education={edu} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Experiencia Profesional */}
                {profile.experience?.length > 0 && (
                  <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <SectionHeader icon={Briefcase} title="Experiencia Profesional" color="purple" />
                    <div className="space-y-4">
                      {profile.experience.map((exp, idx) => (
                        <ExperienceItem key={idx} experience={exp} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensaje si no hay info adicional */}
                {!profile.bio && !profile.education?.length && !profile.experience?.length && (
                  <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Información en proceso</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Este médico aún está completando su perfil. Puedes contactarlo directamente para más información.
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Especialidades */}
                {(profile.specialtiesList?.length > 0 || profile.specialty) && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                      Especialidades
                    </h3>
                    <div className="space-y-2">
                      {profile.specialtiesList?.map((spec, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-teal-600" />
                          <span className="font-medium text-teal-800">{spec.name}</span>
                          {spec.isPrimary && (
                            <span className="text-xs bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full">Principal</span>
                          )}
                        </div>
                      ))}
                      {profile.specialty && !profile.specialtiesList?.length && (
                        <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-teal-600" />
                          <span className="font-medium text-teal-800">{profile.specialty}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Idiomas */}
                {profile.languages?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-indigo-600" />
                      Idiomas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trust Signals */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
                  <h3 className="text-lg font-bold text-teal-900 mb-4">¿Por qué elegir a este médico?</h3>
                  <div className="space-y-3">
                    {(profile.isVerified || profile.verificationStatus === 'approved') && (
                      <div className="flex items-center gap-3 text-teal-700">
                        <ShieldCheck className="w-5 h-5" />
                        <span className="text-sm font-medium">Credenciales verificadas</span>
                      </div>
                    )}
                    {profile.acceptingNewPatients && (
                      <div className="flex items-center gap-3 text-teal-700">
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-medium">Acepta nuevos pacientes</span>
                      </div>
                    )}
                    {profile.telemedicineEnabled && (
                      <div className="flex items-center gap-3 text-teal-700">
                        <Video className="w-5 h-5" />
                        <span className="text-sm font-medium">Consultas por video</span>
                      </div>
                    )}
                    {profile.acceptsInsurance && (
                      <div className="flex items-center gap-3 text-teal-700">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">Acepta seguros médicos</span>
                      </div>
                    )}
                    {stats.experience > 0 && (
                      <div className="flex items-center gap-3 text-teal-700">
                        <Award className="w-5 h-5" />
                        <span className="text-sm font-medium">{stats.experience}+ años de experiencia</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Servicios y Tarifas */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              {/* Tarifas */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <SectionHeader icon={Briefcase} title="Servicios y Tarifas" color="teal" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ServicePriceCard
                    icon={User}
                    title="Consulta Presencial"
                    price={profile.consultationFee}
                    description="Atención en consultorio"
                    color="bg-gradient-to-br from-teal-500 to-cyan-500"
                    available={profile.consultationFee > 0}
                  />
                  <ServicePriceCard
                    icon={Video}
                    title="Teleconsulta"
                    price={profile.priceTeleconsultation}
                    description="Consulta por videollamada"
                    color="bg-gradient-to-br from-blue-500 to-indigo-500"
                    available={profile.telemedicineEnabled && profile.priceTeleconsultation > 0}
                  />
                  <ServicePriceCard
                    icon={Home}
                    title="Visita a Domicilio"
                    price={profile.priceHomeVisit}
                    description="Atención en tu hogar"
                    color="bg-gradient-to-br from-purple-500 to-pink-500"
                    available={profile.homeVisitsEnabled && profile.priceHomeVisit > 0}
                  />
                </div>
              </div>

              {/* Información adicional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.acceptsInsurance && (
                  <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-green-500 flex items-center justify-center">
                        <Shield className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-800 text-lg">Acepta Seguros Médicos</h4>
                        <p className="text-green-600 text-sm">Consulta disponibilidad de tu aseguradora</p>
                      </div>
                    </div>
                  </div>
                )}
                {profile.availableForEmergencies && (
                  <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-red-500 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-red-800 text-lg">Disponible para Emergencias</h4>
                        <p className="text-red-600 text-sm">Atención prioritaria en casos urgentes</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Horarios */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={Calendar} title="Horarios de Atención" color="green" />
              {availability ? (
                <AvailabilityCard availability={availability} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Horarios no disponibles</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Este médico aún no ha configurado sus horarios de atención. Contacta directamente para agendar una cita.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Ubicación */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <SectionHeader icon={Building2} title="Consultorio" color="red" />

                {profile.clinicName || profile.clinicAddress || profile.city ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Info del consultorio */}
                    <div className="space-y-4">
                      {profile.clinicName && (
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <Building2 className="w-6 h-6 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{profile.clinicName}</p>
                            <p className="text-gray-500 text-sm">Nombre del consultorio</p>
                          </div>
                        </div>
                      )}

                      {profile.clinicAddress && (
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <MapPin className="w-6 h-6 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{profile.clinicAddress}</p>
                            <p className="text-gray-600">{profile.city}{profile.state && `, ${profile.state}`}</p>
                          </div>
                        </div>
                      )}

                      {profile.phoneNumber && (
                        <a
                          href={`tel:${profile.phoneNumber}`}
                          className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                        >
                          <Phone className="w-6 h-6 text-teal-600" />
                          <div>
                            <p className="font-medium text-teal-800">{profile.phoneNumber}</p>
                            <p className="text-teal-600 text-sm">Toca para llamar</p>
                          </div>
                        </a>
                      )}
                    </div>

                    {/* Mapa placeholder */}
                    <div className="h-64 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      {(profile.officeLatitude || profile.coordinates?.lat) ? (
                        <div className="text-center text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="font-medium">Mapa interactivo próximamente</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {profile.officeLatitude || profile.coordinates?.lat}, {profile.officeLongitude || profile.coordinates?.lng}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <MapPin className="w-12 h-12 mx-auto mb-3" />
                          <p>Ubicación no especificada</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ubicación no disponible</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Este médico aún no ha agregado la ubicación de su consultorio.
                    </p>
                  </div>
                )}
              </div>

              {/* Fotos del consultorio */}
              {profile.officePhotos?.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Fotos del Consultorio</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {profile.officePhotos.map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={photo}
                          alt={`Consultorio ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* CTA Flotante móvil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-30">
        <div className="flex gap-3">
          <button
            onClick={() => window.alert('Sistema de citas próximamente disponible')}
            className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            Agendar Cita
          </button>
          {profile.whatsappNumber && (
            <a
              href={`https://wa.me/${profile.whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white p-3 rounded-xl"
            >
              <MessageCircle className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorProfilePage;
