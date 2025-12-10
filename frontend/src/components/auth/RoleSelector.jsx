import React, { useState } from 'react';
import './RoleSelector.css';  // ← ESTA LÍNEA ES NUEVA
import { ChevronDown, User, Stethoscope, Building2, Pill, FlaskConical, Shield, Package } from 'lucide-react';

/**
 * RoleSelector Component
 * Selector elegante de rol para registro multi-paso en CITAMED.VE
 * 
 * @param {Function} onRoleSelect - Callback cuando se selecciona un rol
 * @param {String} selectedRole - Rol actualmente seleccionado
 */

const RoleSelector = ({ onRoleSelect, selectedRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  // ⭐ ROLES COMPLETOS DE CITAMED.VE
  const roles = [
    {
      id: 'patient',
      name: 'Paciente',
      description: 'Buscar médicos y agendar citas',
      icon: User,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-700'
    },
    {
      id: 'doctor',
      name: 'Médico',
      description: 'Atender pacientes y gestionar consultas',
      icon: Stethoscope,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-700'
    },
    {
      id: 'clinic',
      name: 'Clínica/Centro Médico',
      description: 'Gestionar múltiples médicos y servicios',
      icon: Building2,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-700'
    },
    {
      id: 'pharmacy',
      name: 'Farmacia',
      description: 'Vender medicamentos y productos farmacéuticos',
      icon: Pill,
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-700'
    },
    {
      id: 'laboratory',
      name: 'Laboratorio',
      description: 'Procesar exámenes y análisis clínicos',
      icon: FlaskConical,
      color: 'bg-cyan-500',
      hoverColor: 'hover:bg-cyan-50',
      borderColor: 'border-cyan-500',
      textColor: 'text-cyan-700'
    },
    {
      id: 'insurer',
      name: 'Aseguradora',
      description: 'Gestionar seguros médicos y reembolsos',
      icon: Shield,
      color: 'bg-yellow-500',
      hoverColor: 'hover:bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-700'
    },
    {
      id: 'supplier',
      name: 'Proveedor/Importador',
      description: 'Vender suplementos, equipos y productos médicos importados',
      icon: Package,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-50',
      borderColor: 'border-orange-500',
      textColor: 'text-orange-700'
    }
  ];

  // Encontrar el rol seleccionado
  const selected = roles.find(role => role.id === selectedRole);

  // Handler para seleccionar rol
  const handleSelectRole = (roleId) => {
    onRoleSelect(roleId);
    setIsOpen(false);
  };

  // Cerrar dropdown al hacer click fuera
  const handleBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto" onBlur={handleBlur}>
      {/* Label */}
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        ¿Cómo deseas registrarte en CITAMED.VE?
      </label>

      {/* Dropdown Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between
            px-4 py-3.5 bg-white border-2 rounded-xl
            transition-all duration-200 ease-in-out
            shadow-sm hover:shadow-md
            ${selected 
              ? `${selected.borderColor} ring-2 ring-opacity-30 ${selected.color.replace('bg-', 'ring-')}` 
              : 'border-gray-300 hover:border-gray-400'
            }
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          `}
        >
          <div className="flex items-center space-x-3">
            {selected ? (
              <>
                {/* Icon */}
                <div className={`p-2 rounded-lg ${selected.color} text-white shadow-sm`}>
                  <selected.icon className="w-5 h-5" />
                </div>
                {/* Text */}
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.description}</p>
                </div>
              </>
            ) : (
              <span className="text-gray-400 font-medium">Selecciona tu rol...</span>
            )}
          </div>
          
          {/* Chevron */}
          <ChevronDown 
            className={`
              w-5 h-5 text-gray-400 transition-transform duration-200 
              ${isOpen ? 'transform rotate-180' : ''}
            `} 
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="
              absolute z-20 w-full mt-2 
              bg-white border border-gray-200 rounded-xl shadow-2xl
              max-h-[32rem] overflow-y-auto
              animate-slideDown
            ">
              {roles.map((role, index) => {
                const Icon = role.icon;
                const isSelected = selectedRole === role.id;
                
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleSelectRole(role.id)}
                    className={`
                      w-full flex items-center space-x-3
                      px-4 py-3.5 text-left
                      transition-all duration-150
                      ${isSelected 
                        ? `${role.color.replace('bg-', 'bg-opacity-10 bg-')} ${role.borderColor.replace('border-', 'border-l-4 border-')}`
                        : `${role.hoverColor} hover:border-l-4 ${role.borderColor}`
                      }
                      ${index !== roles.length - 1 ? 'border-b border-gray-100' : ''}
                      ${index === 0 ? 'rounded-t-xl' : ''}
                      ${index === roles.length - 1 ? 'rounded-b-xl' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`
                      p-2.5 rounded-lg ${role.color} text-white shadow-sm
                      transition-transform duration-150
                      ${isSelected ? 'scale-110' : 'group-hover:scale-105'}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1">
                      <p className={`font-semibold ${isSelected ? role.textColor : 'text-gray-900'}`}>
                        {role.name}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {role.description}
                      </p>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium ${role.textColor}`}>
                          Seleccionado
                        </span>
                        <div className={`w-2 h-2 rounded-full ${role.color} animate-pulse`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Helper Text */}
      {!selected && (
        <p className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
          <span>💡</span>
          <span>Selecciona el tipo de cuenta que mejor se ajuste a tus necesidades</span>
        </p>
      )}

      {/* Selected Role Info Card */}
      {selected && (
        <div className={`
          mt-3 p-3 rounded-lg 
          ${selected.color.replace('bg-', 'bg-opacity-10 bg-')} 
          border-l-4 ${selected.borderColor}
          animate-fadeIn
        `}>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Continuarás como:</span> 
            <span className={`ml-1 font-bold ${selected.textColor}`}>{selected.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;