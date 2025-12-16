/**
 * PatientWizard - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Wizard de registro de pacientes en 4 pasos:
 * 1. Credenciales de acceso
 * 2. Datos personales
 * 3. Información médica
 * 4. Confirmación
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useWizard } from '../../../hooks/useWizard';
import StepIndicator from '../StepIndicator';
import PatientStep1Credentials from './PatientStep1Credentials';
import PatientStep2Personal from './PatientStep2Personal';
import PatientStep3Medical from './PatientStep3Medical';
import PatientStep4Confirmation from './PatientStep4Confirmation';
import authService from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

const TOTAL_STEPS = 4;
const STEP_LABELS = [
  'Credenciales',
  'Datos personales',
  'Info. médica',
  'Confirmación'
];

const INITIAL_DATA = {
  // Step 1
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  // Step 2
  firstName: '',
  lastName: '',
  identificationNumber: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  // Step 3
  allergies: '',
  chronicConditions: '',
  bloodType: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: ''
};

/**
 * Componente principal del wizard de registro de pacientes
 */
function PatientWizard() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);

  const {
    currentStep,
    totalSteps,
    formData,
    errors,
    isSubmitting,
    nextStep,
    prevStep,
    goToStep,
    updateField,
    setFieldErrors,
    setIsSubmitting,
    clearWizard,
    hasSavedData
  } = useWizard({
    wizardId: 'patient',
    totalSteps: TOTAL_STEPS,
    initialData: INITIAL_DATA,
    persistData: true
  });

  // Verificar si hay datos guardados al cargar
  useEffect(() => {
    if (hasSavedData() && currentStep > 1) {
      // Podríamos mostrar un modal preguntando si quiere continuar
      console.log('Datos guardados encontrados, continuando desde paso', currentStep);
    }
  }, []);

  // Manejar envío del formulario
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      // Preparar datos para enviar
      const registrationData = {
        // Paso 1
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
        // Paso 2
        firstName: formData.firstName,
        lastName: formData.lastName,
        identificationNumber: formData.identificationNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        // Paso 3
        allergies: formData.allergies || null,
        chronicConditions: formData.chronicConditions || null,
        bloodType: formData.bloodType,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        emergencyContactRelation: formData.emergencyContactRelation || null
      };

      // Llamar al API
      const response = await authService.registerPatient(registrationData);

      if (response.success) {
        // Limpiar datos del wizard
        clearWizard();

        // Mostrar éxito
        setRegistrationSuccess(true);

        // Si el API devuelve token, hacer login automático
        if (response.data?.token) {
          login(response.data.token, response.data.user);
          // Redirigir después de 2 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Redirigir a login después de 3 segundos
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Registro exitoso. Por favor inicia sesión.',
                email: formData.email
              }
            });
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);

      // Manejar errores de validación del servidor
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setFieldErrors(serverErrors);
      }

      setRegistrationError(
        error.response?.data?.message ||
        'Error al registrar. Por favor intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de éxito
  if (registrationSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[400px] flex flex-col items-center justify-center text-center p-8"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Registro exitoso!
        </h2>
        <p className="text-gray-600 mb-4">
          Tu cuenta ha sido creada correctamente.
        </p>
        <p className="text-sm text-gray-500">
          Serás redirigido automáticamente...
        </p>
      </motion.div>
    );
  }

  // Renderizar paso actual
  const renderStep = () => {
    const commonProps = {
      formData,
      updateField,
      errors,
      setFieldErrors
    };

    switch (currentStep) {
      case 1:
        return (
          <PatientStep1Credentials
            {...commonProps}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <PatientStep2Personal
            {...commonProps}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 3:
        return (
          <PatientStep3Medical
            {...commonProps}
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 4:
        return (
          <PatientStep4Confirmation
            {...commonProps}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Registro de Paciente</h1>
        <p className="text-gray-600 mt-2">
          Crea tu cuenta para agendar citas médicas
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={STEP_LABELS}
      />

      {/* Error general */}
      {registrationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {registrationError}
          </p>
        </motion.div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
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

export default PatientWizard;
