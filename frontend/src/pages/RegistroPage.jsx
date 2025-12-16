/**
 * RegistroPage - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Página de selección de tipo de cuenta y wizards de registro:
 * - Paciente: 4 pasos
 * - Médico: 6 pasos
 * - Proveedor: 5 pasos
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Stethoscope, Building2, ArrowLeft } from 'lucide-react';
import { PatientWizard } from '../components/auth/PatientWizard';
import { DoctorWizard } from '../components/auth/DoctorWizard';
import { ProviderWizard } from '../components/auth/ProviderWizard';

const ROLES = [
  {
    id: 'patient',
    name: 'Paciente',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    description: 'Agenda citas y consulta médicos',
    features: [
      'Busca médicos por especialidad',
      'Agenda citas online',
      'Historial de consultas',
      'Recordatorios automáticos'
    ]
  },
  {
    id: 'doctor',
    name: 'Médico',
    icon: Stethoscope,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    hoverBorder: 'hover:border-teal-400',
    description: 'Gestiona tus pacientes y consultas',
    features: [
      'Perfil profesional verificado',
      'Gestión de agenda',
      'Historial de pacientes',
      'Teleconsultas'
    ]
  },
  {
    id: 'provider',
    name: 'Proveedor',
    icon: Building2,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverBorder: 'hover:border-orange-400',
    description: 'Ofrece servicios y productos médicos',
    features: [
      'Catálogo de servicios',
      'Múltiples sucursales',
      'Gestión de pedidos',
      'Reportes y estadísticas'
    ]
  }
];

/**
 * Componente de selección de rol
 */
function RoleSelector({ onSelect }) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          Crea tu cuenta en <span className="text-primary">CITAMED</span>
          <span className="text-accent">.VE</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Selecciona el tipo de cuenta que deseas crear
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ROLES.map((role, index) => {
          const IconComponent = role.icon;
          return (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(role.id)}
              className={`
                relative p-6 bg-white border-2 ${role.borderColor} rounded-xl
                ${role.hoverBorder} hover:shadow-xl transition-all cursor-pointer
                group
              `}
            >
              {/* Icon */}
              <div className={`
                w-16 h-16 ${role.bgColor} rounded-full flex items-center justify-center
                mb-4 mx-auto group-hover:scale-110 transition-transform
              `}>
                <IconComponent className={`w-8 h-8 ${role.color}`} />
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                {role.name}
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {role.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-gray-500">
                {role.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${role.color.replace('text-', 'bg-')}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Select indicator */}
              <div className={`
                absolute inset-0 rounded-xl border-2 border-transparent
                group-hover:border-primary/50 transition-colors pointer-events-none
              `} />
            </motion.div>
          );
        })}
      </div>

      {/* Login link */}
      <div className="text-center mt-8">
        <p className="text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Página principal de registro
 */
function RegistroPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState(null);

  // Verificar si viene con rol predefinido en URL
  useEffect(() => {
    const roleFromURL = searchParams.get('role');
    if (roleFromURL && ['patient', 'doctor', 'provider'].includes(roleFromURL)) {
      setSelectedRole(roleFromURL);
    }
  }, [searchParams]);

  // Manejar selección de rol
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    // Actualizar URL sin recargar
    window.history.pushState({}, '', `/registro?role=${roleId}`);
  };

  // Volver a selección de rol
  const handleBack = () => {
    setSelectedRole(null);
    window.history.pushState({}, '', '/registro');
  };

  // Renderizar wizard según rol
  const renderWizard = () => {
    switch (selectedRole) {
      case 'patient':
        return <PatientWizard />;
      case 'doctor':
        return <DoctorWizard />;
      case 'provider':
        return <ProviderWizard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 py-8 px-4">
      {/* Back button */}
      <div className="max-w-4xl mx-auto mb-6">
        <button
          onClick={() => selectedRole ? handleBack() : navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {selectedRole ? 'Cambiar tipo de cuenta' : 'Volver al inicio'}
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={selectedRole || 'selector'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {selectedRole ? renderWizard() : <RoleSelector onSelect={handleRoleSelect} />}
      </motion.div>
    </div>
  );
}

export default RegistroPage;
