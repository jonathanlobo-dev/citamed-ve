/**
 * ProviderWizard - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Wizard de registro de proveedores en 5 pasos:
 * 1. Credenciales de acceso
 * 2. Datos de la empresa
 * 3. Categoría y servicios
 * 4. Ubicación y cobertura
 * 5. Confirmación
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useWizard } from '../../../hooks/useWizard';
import StepIndicator from '../StepIndicator';
import ProviderStep1Credentials from './ProviderStep1Credentials';
import ProviderStep2Company from './ProviderStep2Company';
import ProviderStep3Services from './ProviderStep3Services';
import ProviderStep4Location from './ProviderStep4Location';
import ProviderStep5Confirmation from './ProviderStep5Confirmation';
import authService from '../../../services/authService';

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  'Credenciales',
  'Empresa',
  'Servicios',
  'Ubicación',
  'Confirmación'
];

const INITIAL_DATA = {
  // Step 1
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  // Step 2
  companyName: '',
  rif: '',
  legalName: '',
  legalRepresentative: '',
  commercialPhone: '',
  contactEmail: '',
  // Step 3
  providerType: '',
  description: '',
  mainProducts: '',
  // Step 4
  mainAddress: '',
  city: '',
  state: '',
  coverageZones: '',
  hasMultipleLocations: false,
  locationCount: ''
};

function ProviderWizard() {
  const navigate = useNavigate();
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
    clearWizard
  } = useWizard({
    wizardId: 'provider',
    totalSteps: TOTAL_STEPS,
    initialData: INITIAL_DATA,
    persistData: true
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      const registrationData = {
        // Paso 1
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
        // Paso 2
        companyName: formData.companyName,
        rif: formData.rif,
        legalName: formData.legalName,
        legalRepresentative: formData.legalRepresentative,
        commercialPhone: formData.commercialPhone,
        contactEmail: formData.contactEmail,
        // Paso 3
        providerType: formData.providerType,
        description: formData.description || null,
        mainProducts: formData.mainProducts || null,
        // Paso 4
        mainAddress: formData.mainAddress,
        city: formData.city,
        state: formData.state,
        coverageZones: formData.coverageZones || null,
        hasMultipleLocations: formData.hasMultipleLocations || false,
        locationCount: formData.locationCount ? parseInt(formData.locationCount) : null
      };

      const response = await authService.registerProvider(registrationData);

      if (response.success) {
        clearWizard();
        setRegistrationSuccess(true);

        // Redirigir después de 4 segundos
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Registro exitoso. Su cuenta está en revisión. Le notificaremos cuando sea aprobada.',
              email: formData.email
            }
          });
        }, 4000);
      }
    } catch (error) {
      console.error('Error en registro:', error);

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
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Registro enviado!
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Su solicitud de registro ha sido recibida. Nuestro equipo verificará
          la documentación de su empresa.
        </p>
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Estado: En revisión</span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Serás redirigido automáticamente...
        </p>
      </motion.div>
    );
  }

  const renderStep = () => {
    const commonProps = {
      formData,
      updateField,
      errors,
      setFieldErrors
    };

    switch (currentStep) {
      case 1:
        return <ProviderStep1Credentials {...commonProps} onNext={nextStep} />;
      case 2:
        return <ProviderStep2Company {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <ProviderStep3Services {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <ProviderStep4Location {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return (
          <ProviderStep5Confirmation
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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
          <Building2 className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Registro de Proveedor</h1>
        <p className="text-gray-600 mt-2">
          Registra tu empresa para ofrecer productos y servicios
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

export default ProviderWizard;
