/**
 * usePatientProfile Hook - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Hook para gestión del perfil de paciente
 */

import { useState, useCallback, useEffect } from 'react';
import patientService from '../services/patientService';
import toast from 'react-hot-toast';

/**
 * Hook para gestión del perfil de paciente
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoFetch - Cargar perfil automáticamente
 * @param {number} options.patientId - ID del paciente (para doctores viendo pacientes)
 */
const usePatientProfile = (options = {}) => {
  const { autoFetch = false, patientId = null } = options;

  // ═══════════════════════════════════════════════════════════════
  // ESTADO
  // ═══════════════════════════════════════════════════════════════

  // Perfil
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Completitud
  const [completeness, setCompleteness] = useState(null);
  const [loadingCompleteness, setLoadingCompleteness] = useState(false);

  // Historial médico
  const [medicalHistory, setMedicalHistory] = useState([]);

  // Alergias
  const [allergies, setAllergies] = useState([]);

  // Medicamentos
  const [medications, setMedications] = useState([]);

  // Operaciones
  const [saving, setSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene perfil de un paciente (para doctores)
   */
  const fetchPatientProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientService.getPatientProfile(id);
      if (response.success) {
        setProfile(response.data);
        if (response.data.medicalHistory) {
          setMedicalHistory(response.data.medicalHistory);
        }
        if (response.data.allergies) {
          setAllergies(response.data.allergies);
        }
        if (response.data.medications) {
          setMedications(response.data.medications);
        }
        if (response.data.completeness) {
          setCompleteness(response.data.completeness);
        }
      } else {
        setError(response.message || 'Error al cargar perfil');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene perfil del paciente autenticado
   */
  const fetchMyProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await patientService.getMyProfile();
      if (response.success) {
        setProfile(response.data);
        if (response.data.medicalHistory) {
          setMedicalHistory(response.data.medicalHistory);
        }
        if (response.data.allergies) {
          setAllergies(response.data.allergies);
        }
        if (response.data.medications) {
          setMedications(response.data.medications);
        }
        if (response.data.completeness) {
          setCompleteness(response.data.completeness);
        }
      } else {
        setError(response.message || 'Error al cargar perfil');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de conexión';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene completitud del perfil
   */
  const fetchCompleteness = useCallback(async () => {
    setLoadingCompleteness(true);

    try {
      const response = await patientService.getCompleteness();
      if (response.success) {
        setCompleteness(response.data);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingCompleteness(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE ACTUALIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Actualiza información básica del perfil
   */
  const updateBasicInfo = useCallback(async (data) => {
    setSaving(true);

    try {
      const response = await patientService.updateProfile(data);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...response.data }));
        toast.success('Perfil actualizado exitosamente');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al actualizar perfil');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar perfil';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  /**
   * Actualiza contacto de emergencia
   */
  const updateEmergencyContactInfo = useCallback(async (contactData) => {
    setSaving(true);

    try {
      const response = await patientService.updateEmergencyContact(contactData);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...response.data }));
        toast.success('Contacto de emergencia actualizado');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al actualizar contacto');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar contacto';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  /**
   * Actualiza información del seguro
   */
  const updateInsuranceInfo = useCallback(async (insuranceData) => {
    setSaving(true);

    try {
      const response = await patientService.updateInsurance(insuranceData);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...response.data }));
        toast.success('Información de seguro actualizada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al actualizar seguro');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar seguro';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE HISTORIAL MÉDICO
  // ═══════════════════════════════════════════════════════════════

  const handleAddMedicalHistory = useCallback(async (historyData) => {
    setSaving(true);

    try {
      const response = await patientService.addMedicalHistory(historyData);
      if (response.success) {
        setMedicalHistory(prev => [...prev, response.data]);
        setProfile(prev => ({
          ...prev,
          medicalHistory: [...(prev.medicalHistory || []), response.data]
        }));
        toast.success('Condición médica agregada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar condición');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agregar condición';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUpdateMedicalHistory = useCallback(async (historyId, historyData) => {
    setSaving(true);

    try {
      const response = await patientService.updateMedicalHistory(historyId, historyData);
      if (response.success) {
        setMedicalHistory(prev =>
          prev.map(h => h.id === historyId ? { ...h, ...response.data } : h)
        );
        setProfile(prev => ({
          ...prev,
          medicalHistory: prev.medicalHistory?.map(h =>
            h.id === historyId ? { ...h, ...response.data } : h
          )
        }));
        toast.success('Condición médica actualizada');
      } else {
        toast.error(response.message || 'Error al actualizar condición');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar condición';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteMedicalHistory = useCallback(async (historyId) => {
    setSaving(true);

    try {
      const response = await patientService.deleteMedicalHistory(historyId);
      if (response.success) {
        setMedicalHistory(prev => prev.filter(h => h.id !== historyId));
        setProfile(prev => ({
          ...prev,
          medicalHistory: prev.medicalHistory?.filter(h => h.id !== historyId)
        }));
        toast.success('Condición médica eliminada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar condición');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar condición';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE ALERGIAS
  // ═══════════════════════════════════════════════════════════════

  const handleAddAllergy = useCallback(async (allergyData) => {
    setSaving(true);

    try {
      const response = await patientService.addAllergy(allergyData);
      if (response.success) {
        setAllergies(prev => [...prev, response.data]);
        setProfile(prev => ({
          ...prev,
          allergies: [...(prev.allergies || []), response.data]
        }));
        toast.success('Alergia agregada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar alergia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agregar alergia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUpdateAllergy = useCallback(async (allergyId, allergyData) => {
    setSaving(true);

    try {
      const response = await patientService.updateAllergy(allergyId, allergyData);
      if (response.success) {
        setAllergies(prev =>
          prev.map(a => a.id === allergyId ? { ...a, ...response.data } : a)
        );
        setProfile(prev => ({
          ...prev,
          allergies: prev.allergies?.map(a =>
            a.id === allergyId ? { ...a, ...response.data } : a
          )
        }));
        toast.success('Alergia actualizada');
      } else {
        toast.error(response.message || 'Error al actualizar alergia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar alergia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteAllergy = useCallback(async (allergyId) => {
    setSaving(true);

    try {
      const response = await patientService.deleteAllergy(allergyId);
      if (response.success) {
        setAllergies(prev => prev.filter(a => a.id !== allergyId));
        setProfile(prev => ({
          ...prev,
          allergies: prev.allergies?.filter(a => a.id !== allergyId)
        }));
        toast.success('Alergia eliminada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar alergia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar alergia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE MEDICAMENTOS
  // ═══════════════════════════════════════════════════════════════

  const handleAddMedication = useCallback(async (medicationData) => {
    setSaving(true);

    try {
      const response = await patientService.addMedication(medicationData);
      if (response.success) {
        setMedications(prev => [...prev, response.data]);
        setProfile(prev => ({
          ...prev,
          medications: [...(prev.medications || []), response.data]
        }));
        toast.success('Medicamento agregado');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar medicamento');
      }
      return response;
    } catch (err) {
      // Detectar alerta de alergia
      if (err.response?.data?.isAllergyWarning) {
        toast.error(err.response.data.message, {
          duration: 6000,
          icon: '⚠️'
        });
        return { success: false, isAllergyWarning: true, message: err.response.data.message };
      }

      const errorMessage = err.response?.data?.message || 'Error al agregar medicamento';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUpdateMedication = useCallback(async (medicationId, medicationData) => {
    setSaving(true);

    try {
      const response = await patientService.updateMedication(medicationId, medicationData);
      if (response.success) {
        setMedications(prev =>
          prev.map(m => m.id === medicationId ? { ...m, ...response.data } : m)
        );
        setProfile(prev => ({
          ...prev,
          medications: prev.medications?.map(m =>
            m.id === medicationId ? { ...m, ...response.data } : m
          )
        }));
        toast.success('Medicamento actualizado');
      } else {
        toast.error(response.message || 'Error al actualizar medicamento');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar medicamento';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteMedication = useCallback(async (medicationId) => {
    setSaving(true);

    try {
      const response = await patientService.deleteMedication(medicationId);
      if (response.success) {
        setMedications(prev => prev.filter(m => m.id !== medicationId));
        setProfile(prev => ({
          ...prev,
          medications: prev.medications?.filter(m => m.id !== medicationId)
        }));
        toast.success('Medicamento eliminado');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar medicamento');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar medicamento';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleStopMedication = useCallback(async (medicationId) => {
    setSaving(true);

    try {
      const response = await patientService.stopMedication(medicationId);
      if (response.success) {
        setMedications(prev =>
          prev.map(m => m.id === medicationId ? { ...m, ...response.data, isActive: false } : m)
        );
        setProfile(prev => ({
          ...prev,
          medications: prev.medications?.map(m =>
            m.id === medicationId ? { ...m, ...response.data, isActive: false } : m
          )
        }));
        toast.success('Medicamento suspendido');
      } else {
        toast.error(response.message || 'Error al suspender medicamento');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al suspender medicamento';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene alergias críticas (severas o riesgo vital)
   */
  const getCriticalAllergies = useCallback(() => {
    return allergies.filter(a =>
      a.severity === 'severe' || a.severity === 'life_threatening'
    );
  }, [allergies]);

  /**
   * Obtiene condiciones crónicas activas
   */
  const getChronicConditions = useCallback(() => {
    return medicalHistory.filter(h => h.status === 'chronic');
  }, [medicalHistory]);

  /**
   * Obtiene medicamentos activos
   */
  const getActiveMedications = useCallback(() => {
    return medications.filter(m => m.isActive);
  }, [medications]);

  /**
   * Refresca todos los datos
   */
  const refreshAll = useCallback(async () => {
    if (patientId) {
      await fetchPatientProfile(patientId);
    } else {
      await Promise.all([
        fetchMyProfile(),
        fetchCompleteness()
      ]);
    }
  }, [patientId, fetchPatientProfile, fetchMyProfile, fetchCompleteness]);

  /**
   * Limpia el estado
   */
  const reset = useCallback(() => {
    setProfile(null);
    setCompleteness(null);
    setMedicalHistory([]);
    setAllergies([]);
    setMedications([]);
    setError(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoFetch) {
      if (patientId) {
        fetchPatientProfile(patientId);
      } else {
        fetchMyProfile();
      }
    }
  }, [autoFetch, patientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════
  // RETURN
  // ═══════════════════════════════════════════════════════════════

  return {
    // Estado
    profile,
    loading,
    error,
    saving,

    // Completitud
    completeness,
    loadingCompleteness,

    // Datos
    medicalHistory,
    allergies,
    medications,

    // Carga
    fetchPatientProfile,
    fetchMyProfile,
    fetchCompleteness,

    // Actualización básica
    updateBasicInfo,
    updateEmergencyContact: updateEmergencyContactInfo,
    updateInsurance: updateInsuranceInfo,

    // Historial médico
    addMedicalHistory: handleAddMedicalHistory,
    updateMedicalHistory: handleUpdateMedicalHistory,
    deleteMedicalHistory: handleDeleteMedicalHistory,

    // Alergias
    addAllergy: handleAddAllergy,
    updateAllergy: handleUpdateAllergy,
    deleteAllergy: handleDeleteAllergy,

    // Medicamentos
    addMedication: handleAddMedication,
    updateMedication: handleUpdateMedication,
    deleteMedication: handleDeleteMedication,
    stopMedication: handleStopMedication,

    // Utilidades
    getCriticalAllergies,
    getChronicConditions,
    getActiveMedications,
    refreshAll,
    reset
  };
};

export default usePatientProfile;
