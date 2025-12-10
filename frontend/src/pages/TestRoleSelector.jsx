import React, { useState } from 'react';
import RoleSelector from '../components/auth/RoleSelector';

const TestRoleSelector = () => {
  const [selectedRole, setSelectedRole] = useState('');

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    console.log('Rol seleccionado:', roleId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Test RoleSelector
          </h1>
          <p className="text-gray-600">
            Prueba del componente de selección de rol
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* RoleSelector */}
          <RoleSelector 
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
          />

          {/* Debug Info */}
          {selectedRole && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Rol seleccionado:</span> {selectedRole}
              </p>
            </div>
          )}

          {/* Continue Button */}
          <button
            disabled={!selectedRole}
            className={`
              w-full mt-6 py-3 px-6 rounded-lg font-semibold
              transition-all duration-200
              ${selectedRole
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {selectedRole ? 'Continuar' : 'Selecciona un rol'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRoleSelector;