/**
 * ProviderProfilePage - CITAMED.VE
 * Mi Empresa - Perfil completo del proveedor médico
 *
 * Página espectacular para gestionar el perfil de empresa
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Edit,
  ArrowLeft,
  Star,
  Award,
  Shield,
  CheckCircle,
  Camera,
  FileText,
  Truck,
  CreditCard,
  BadgeCheck,
  Share2,
  Download,
  Copy,
  Printer,
  QrCode,
  Check,
  ChevronRight,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  MessageCircle,
  Calendar,
  Target,
  Sparkles,
  Boxes,
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar/Navbar';
import { ImageUpload, ImageGallery } from '../../components/common/media';

// Componente de tarjeta de estadística
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    teal: 'from-teal-500 to-teal-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-5 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-green-400/30' : trend < 0 ? 'bg-red-400/30' : 'bg-white/20'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/80">{title}</div>
      {subtitle && <div className="text-xs text-white/60 mt-1">{subtitle}</div>}
    </motion.div>
  );
};

// Componente de barra de progreso
const ProgressBar = ({ percentage, color = 'teal' }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={`h-2 rounded-full ${
        percentage >= 80 ? 'bg-green-500' :
        percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
      }`}
    />
  </div>
);

// Componente de horario de atención
const BusinessHours = ({ schedule }) => {
  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const defaultSchedule = {
    monday: { open: '08:00', close: '18:00', isOpen: true },
    tuesday: { open: '08:00', close: '18:00', isOpen: true },
    wednesday: { open: '08:00', close: '18:00', isOpen: true },
    thursday: { open: '08:00', close: '18:00', isOpen: true },
    friday: { open: '08:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '13:00', isOpen: true },
    sunday: { open: '', close: '', isOpen: false }
  };

  const businessSchedule = schedule || defaultSchedule;

  return (
    <div className="space-y-2">
      {days.map(day => {
        const daySchedule = businessSchedule[day.key] || { isOpen: false };
        return (
          <div key={day.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-gray-700 font-medium">{day.label}</span>
            {daySchedule.isOpen ? (
              <span className="text-green-600 font-medium">
                {daySchedule.open} - {daySchedule.close}
              </span>
            ) : (
              <span className="text-gray-400 italic">Cerrado</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Componente de categoría de producto
const ProductCategoryCard = ({ category }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
        <Package className="w-6 h-6 text-white" />
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{category.name}</h4>
        <p className="text-sm text-gray-500">{category.productCount} productos</p>
      </div>
    </div>
  </motion.div>
);

// Componente de acciones
const ProfileActions = ({ onExport, onShare, onPrint }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 min-w-[200px]"
          >
            <button
              onClick={() => { onPrint(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Imprimir perfil
            </button>
            <button
              onClick={() => { handleCopyLink(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProviderProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRModal, setShowQRModal] = useState(false);
  const printRef = useRef(null);

  // Datos del proveedor (vendrían del backend en producción)
  const providerProfile = {
    companyName: user?.profile?.companyName || user?.companyName || 'Mi Empresa Médica',
    legalName: user?.profile?.legalName || 'Nombre Legal de la Empresa C.A.',
    rif: user?.profile?.rif || 'J-12345678-9',
    providerType: user?.profile?.providerType || 'Distribuidor de Equipos Médicos',
    description: user?.profile?.description || 'Somos una empresa dedicada a la distribución de equipos y suministros médicos de alta calidad.',
    logo: user?.profile?.logo || null,
    coverImage: user?.profile?.coverImage || null,
    address: user?.profile?.address || 'Av. Principal, Torre Empresarial, Piso 5',
    city: user?.profile?.city || 'Caracas',
    state: user?.profile?.state || 'Distrito Capital',
    phone: user?.profile?.phone || user?.phone || '+58 212-555-0000',
    email: user?.profile?.email || user?.email || 'contacto@miempresa.com',
    website: user?.profile?.website || 'www.miempresa.com',
    whatsapp: user?.profile?.whatsapp || '+58 412-555-0000',
    socialMedia: user?.profile?.socialMedia || {
      instagram: '@miempresa',
      facebook: '/miempresa',
      linkedin: '/company/miempresa',
      twitter: '@miempresa'
    },
    isVerified: user?.profile?.isVerified || false,
    yearsInBusiness: user?.profile?.yearsInBusiness || 5,
    employeeCount: user?.profile?.employeeCount || '10-50',
    certifications: user?.profile?.certifications || ['ISO 9001', 'Certificación ANVISA'],
    paymentMethods: user?.profile?.paymentMethods || ['Transferencia', 'Punto de venta', 'Efectivo'],
    deliveryOptions: user?.profile?.deliveryOptions || ['Entrega local', 'Envío nacional'],
    categories: user?.profile?.categories || [
      { id: 1, name: 'Equipos de Diagnóstico', productCount: 45 },
      { id: 2, name: 'Instrumental Quirúrgico', productCount: 78 },
      { id: 3, name: 'Material Desechable', productCount: 120 }
    ],
    stats: {
      products: 243,
      orders: 156,
      customers: 89,
      rating: 4.8,
      salesThisMonth: 125000
    },
    completeness: 75
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Sparkles },
    { id: 'info', label: 'Información', icon: Building2 },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'gallery', label: 'Galería', icon: Camera }
  ];

  const handleExport = () => window.print();
  const handleShare = () => setShowQRModal(true);
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50" ref={printRef}>
      {/* Header Espectacular */}
      <div className="relative overflow-hidden">
        {/* Imagen de portada o fondo degradado */}
        <div className="absolute inset-0">
          {providerProfile.coverImage ? (
            <img
              src={providerProfile.coverImage}
              alt="Portada"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                                   radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Navegación superior */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al panel</span>
            </Link>

            <ProfileActions
              onExport={handleExport}
              onShare={handleShare}
              onPrint={handlePrint}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-end pb-6">
            {/* Logo de empresa */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white">
                {providerProfile.logo ? (
                  <img
                    src={providerProfile.logo}
                    alt="Logo"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="w-16 h-16 md:w-20 md:h-20 text-blue-500" />
                )}
              </div>
              {/* Badge de verificado */}
              {providerProfile.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                  <BadgeCheck className="w-6 h-6 text-blue-500" />
                </div>
              )}
              {/* Indicador de completitud */}
              <div className="absolute -top-2 -left-2 bg-white rounded-full p-2 shadow-lg">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                    <circle
                      cx="20" cy="20" r="16"
                      stroke={providerProfile.completeness >= 80 ? '#10b981' : providerProfile.completeness >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="4" fill="none"
                      strokeDasharray={`${providerProfile.completeness * 1.005} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {providerProfile.completeness}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Info principal */}
            <div className="flex-1 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {providerProfile.companyName}
                  </h1>
                  {providerProfile.isVerified && (
                    <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4" />
                      Verificado
                    </span>
                  )}
                </div>
                <p className="text-blue-100 text-lg mb-4">
                  {providerProfile.providerType}
                </p>

                {/* Info rápida */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {providerProfile.city}, {providerProfile.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {providerProfile.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {providerProfile.yearsInBusiness} años en el mercado
                  </span>
                </div>

                {/* Rating y métricas rápidas */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-yellow-500/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-yellow-400/30">
                    <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold">{providerProfile.stats.rating}</span>
                    <span className="text-yellow-100">({providerProfile.stats.customers} clientes)</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                    <Package className="w-5 h-5" />
                    <span className="font-bold">{providerProfile.stats.products}</span>
                    <span className="text-blue-100">productos</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Botón editar */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/proveedor/configuracion"
                className="flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:shadow-xl shadow-lg group"
              >
                <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Editar Empresa
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-500' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Tab: Resumen */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Estadísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  title="Productos"
                  value={providerProfile.stats.products}
                  subtitle="En catálogo"
                  icon={Package}
                  color="blue"
                />
                <StatCard
                  title="Pedidos"
                  value={providerProfile.stats.orders}
                  subtitle="Este mes"
                  icon={ShoppingCart}
                  color="green"
                  trend={12}
                />
                <StatCard
                  title="Clientes"
                  value={providerProfile.stats.customers}
                  subtitle="Activos"
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  title="Ventas"
                  value={`$${(providerProfile.stats.salesThisMonth / 1000).toFixed(0)}K`}
                  subtitle="Este mes"
                  icon={TrendingUp}
                  color="orange"
                  trend={8}
                />
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Descripción y certificaciones */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Sobre Nosotros
                  </h3>
                  <p className="text-gray-600 mb-4">{providerProfile.description}</p>

                  {/* Certificaciones */}
                  {providerProfile.certifications.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Certificaciones</h4>
                      <div className="flex flex-wrap gap-2">
                        {providerProfile.certifications.map((cert, idx) => (
                          <span key={idx} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Horario de atención */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Horario de Atención
                  </h3>
                  <BusinessHours schedule={providerProfile.schedule} />
                </div>

                {/* Métodos de pago y entrega */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    Métodos de Pago
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {providerProfile.paymentMethods.map((method, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm">
                        {method}
                      </span>
                    ))}
                  </div>

                  <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2 flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    Opciones de Entrega
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {providerProfile.deliveryOptions.map((option, idx) => (
                      <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                        {option}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Categorías de productos */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-blue-500" />
                    Categorías de Productos
                  </h3>
                  <div className="space-y-3">
                    {providerProfile.categories.map(category => (
                      <ProductCategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Completar perfil */}
              {providerProfile.completeness < 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Target className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Completa tu perfil de empresa</h3>
                      <p className="text-blue-100 mb-4">
                        Un perfil completo genera más confianza y atrae más clientes.
                        Te falta {100 - providerProfile.completeness}% por completar.
                      </p>
                      <div className="mb-4">
                        <ProgressBar percentage={providerProfile.completeness} />
                      </div>
                      <Link
                        to="/proveedor/configuracion"
                        className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                      >
                        Completar ahora
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Datos legales */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Datos Legales
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Razón Social</label>
                    <p className="font-medium text-gray-900">{providerProfile.legalName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">RIF</label>
                    <p className="font-medium text-gray-900">{providerProfile.rif}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Tipo de Proveedor</label>
                    <p className="font-medium text-gray-900">{providerProfile.providerType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Empleados</label>
                    <p className="font-medium text-gray-900">{providerProfile.employeeCount} empleados</p>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-500" />
                  Contacto
                </h3>
                <div className="space-y-4">
                  <a href={`tel:${providerProfile.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-500" />
                    </div>
                    <span>{providerProfile.phone}</span>
                  </a>
                  <a href={`mailto:${providerProfile.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <span>{providerProfile.email}</span>
                  </a>
                  <a href={`https://wa.me/${providerProfile.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-green-600">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <span>WhatsApp</span>
                  </a>
                  <a href={`https://${providerProfile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                    <span>{providerProfile.website}</span>
                  </a>
                </div>
              </div>

              {/* Dirección */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Ubicación
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-700">{providerProfile.address}</p>
                  <p className="text-gray-600">{providerProfile.city}, {providerProfile.state}</p>
                </div>
                {/* Placeholder para mapa */}
                <div className="mt-4 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">Mapa próximamente</span>
                  </div>
                </div>
              </div>

              {/* Redes sociales */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-500" />
                  Redes Sociales
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {providerProfile.socialMedia.instagram && (
                    <a href={`https://instagram.com/${providerProfile.socialMedia.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow">
                      <Instagram className="w-5 h-5 text-pink-500" />
                      <span className="text-sm text-gray-700">{providerProfile.socialMedia.instagram}</span>
                    </a>
                  )}
                  {providerProfile.socialMedia.facebook && (
                    <a href={`https://facebook.com${providerProfile.socialMedia.facebook}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:shadow-md transition-shadow">
                      <Facebook className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Facebook</span>
                    </a>
                  )}
                  {providerProfile.socialMedia.linkedin && (
                    <a href={`https://linkedin.com${providerProfile.socialMedia.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:shadow-md transition-shadow">
                      <Linkedin className="w-5 h-5 text-blue-700" />
                      <span className="text-sm text-gray-700">LinkedIn</span>
                    </a>
                  )}
                  {providerProfile.socialMedia.twitter && (
                    <a href={`https://twitter.com/${providerProfile.socialMedia.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl hover:shadow-md transition-shadow">
                      <Twitter className="w-5 h-5 text-sky-500" />
                      <span className="text-sm text-gray-700">{providerProfile.socialMedia.twitter}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Productos */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Categorías de Productos</h3>
                <Link
                  to="/proveedor/catalogo"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Ver catálogo completo
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providerProfile.categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Package className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{category.name}</h4>
                        <p className="text-sm text-gray-500">{category.productCount} productos</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-600">Ver productos</span>
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Call to action para agregar productos */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Gestiona tu catálogo</h4>
                    <p className="text-gray-600 text-sm">Agrega, edita o elimina productos de tu catálogo</p>
                  </div>
                  <Link
                    to="/proveedor/catalogo"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    Ir al Catálogo
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Galería */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Galería de Imágenes</h3>
                <Link
                  to="/proveedor/configuracion?tab=gallery"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Camera className="w-4 h-4" />
                  Editar galería
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-center py-12">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  Aún no has agregado imágenes a tu galería.
                  <br />
                  <Link to="/proveedor/configuracion?tab=gallery" className="text-blue-600 hover:underline">
                    Agregar imágenes
                  </Link>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de QR */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6">
                <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Compartir Empresa
                </h3>
                <p className="text-gray-500 text-sm">
                  Escanea este código para ver el perfil de {providerProfile.companyName}
                </p>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-400">
                    <QrCode className="w-20 h-20 mx-auto mb-2" />
                    <span className="text-xs">Código QR</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowQRModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar enlace
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default ProviderProfilePage;
