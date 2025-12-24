/**
 * PasswordStrengthIndicator - CITAMED.VE
 * M01 Sub-Partida 2.4.2
 *
 * Indicador visual de fortaleza de contraseña
 * - Barra de progreso
 * - Checklist de requisitos
 * - Colores según fortaleza
 */

import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

/**
 * Indicador de fortaleza de contraseña
 * @param {Object} props
 * @param {string} props.password - Contraseña a evaluar
 * @param {boolean} props.showRequirements - Mostrar checklist de requisitos
 */
function PasswordStrengthIndicator({ password = '', showRequirements = true }) {
  // Evaluar requisitos
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password)
  };

  // Contar requisitos cumplidos
  const metRequirements = Object.values(requirements).filter(Boolean).length;

  // Determinar fortaleza
  let strength = 'none';
  let strengthLabel = '';
  let strengthColor = 'bg-gray-200';
  let strengthWidth = '0%';

  if (password.length > 0) {
    if (metRequirements <= 2) {
      strength = 'weak';
      strengthLabel = 'Débil';
      strengthColor = 'bg-red-500';
      strengthWidth = '33%';
    } else if (metRequirements <= 3) {
      strength = 'medium';
      strengthLabel = 'Media';
      strengthColor = 'bg-yellow-500';
      strengthWidth = '66%';
    } else {
      strength = 'strong';
      strengthLabel = 'Fuerte';
      strengthColor = 'bg-green-500';
      strengthWidth = '100%';
    }
  }

  // Requisitos a mostrar
  const requirementsList = [
    { key: 'minLength', label: 'Mínimo 8 caracteres', met: requirements.minLength },
    { key: 'hasUppercase', label: 'Una letra mayúscula', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'Una letra minúscula', met: requirements.hasLowercase },
    { key: 'hasNumber', label: 'Un número', met: requirements.hasNumber },
    { key: 'hasSpecial', label: 'Un carácter especial (@$!%*?&)', met: requirements.hasSpecial, optional: true }
  ];

  return (
    <div className="space-y-3">
      {/* Barra de fortaleza */}
      <div className="space-y-1">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${strengthColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: strengthWidth }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {password.length > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className={`font-medium ${
              strength === 'weak' ? 'text-red-600' :
              strength === 'medium' ? 'text-yellow-600' :
              strength === 'strong' ? 'text-green-600' :
              'text-gray-400'
            }`}>
              {strengthLabel}
            </span>
            <span className="text-gray-500">
              {metRequirements}/4 requisitos
            </span>
          </div>
        )}
      </div>

      {/* Lista de requisitos */}
      {showRequirements && (
        <ul className="space-y-1.5">
          {requirementsList.map(({ key, label, met, optional }) => (
            <motion.li
              key={key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 text-sm ${
                met ? 'text-green-600' : optional ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className={`w-4 h-4 ${optional ? 'text-gray-300' : 'text-gray-400'}`} />
              )}
              <span>
                {label}
                {optional && <span className="text-xs ml-1">(opcional)</span>}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthIndicator;
