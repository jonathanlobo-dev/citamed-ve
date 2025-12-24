/**
 * useDoctorProfile Hook - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Hook para gestión del perfil médico
 */

import { useState, useCallback, useEffect } from 'react';
import doctorService from '../services/doctorService';
import toast from 'react-hot-toast';

/**
 * Hook para gestión del perfil médico
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoFetch - Cargar perfil automáticamente
 * @param {number} options.doctorId - ID del doctor (para perfil público)
 */
const useDoctorProfile = (options = {}) => {
  const { autoFetch = false, doctorId = null } = options;

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

  // Especialidades
  const [specialties, setSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  // Disponibilidad
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Slots disponibles
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Operaciones
  const [saving, setSaving] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // FUNCIONES DE CARGA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene perfil público de un doctor
   */
  const fetchProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await doctorService.getProfile(id);
      if (response.success) {
        setProfile(response.data);
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
   * Obtiene perfil del doctor autenticado
   */
  const fetchMyProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await doctorService.getMyProfile();
      if (response.success) {
        setProfile(response.data);
        if (response.data.completeness) {
          setCompleteness(response.data.completeness);
        }
        if (response.data.doctorSpecialties) {
          setSpecialties(response.data.doctorSpecialties);
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
      const response = await doctorService.getCompleteness();
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

  /**
   * Obtiene disponibilidad semanal
   */
  const fetchAvailability = useCallback(async (id) => {
    setLoadingAvailability(true);

    try {
      const response = await doctorService.getAvailability(id);
      if (response.success) {
        setAvailability(response.data);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingAvailability(false);
    }
  }, []);

  /**
   * Obtiene slots disponibles para una fecha
   */
  const fetchAvailableSlots = useCallback(async (id, date) => {
    setLoadingSlots(true);

    try {
      const response = await doctorService.getAvailableSlots(id, date);
      if (response.success) {
        setAvailableSlots(response.data);
      }
      return response;
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoadingSlots(false);
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
      const response = await doctorService.updateProfile(data);
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
   * Actualiza ubicación del consultorio
   */
  const updateLocationInfo = useCallback(async (locationData) => {
    setSaving(true);

    try {
      const response = await doctorService.updateLocation(locationData);
      if (response.success) {
        setProfile(prev => ({ ...prev, ...response.data }));
        toast.success('Ubicación actualizada exitosamente');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al actualizar ubicación');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar ubicación';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE ESPECIALIDADES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Agrega una especialidad
   */
  const handleAddSpecialty = useCallback(async (specialtyData) => {
    setSaving(true);

    try {
      const response = await doctorService.addSpecialty(specialtyData);
      if (response.success) {
        setSpecialties(prev => [...prev, response.data]);
        toast.success('Especialidad agregada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar especialidad');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agregar especialidad';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  /**
   * Elimina una especialidad
   */
  const handleRemoveSpecialty = useCallback(async (specialtyId) => {
    setSaving(true);

    try {
      const response = await doctorService.removeSpecialty(specialtyId);
      if (response.success) {
        setSpecialties(prev => prev.filter(s => s.specialtyId !== specialtyId));
        toast.success('Especialidad eliminada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar especialidad');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar especialidad';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE EDUCACIÓN
  // ═══════════════════════════════════════════════════════════════

  const handleAddEducation = useCallback(async (educationData) => {
    setSaving(true);

    try {
      const response = await doctorService.addEducation(educationData);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          education: [...(prev.education || []), response.data]
        }));
        toast.success('Educación agregada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar educación');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agregar educación';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUpdateEducation = useCallback(async (educationId, educationData) => {
    setSaving(true);

    try {
      const response = await doctorService.updateEducation(educationId, educationData);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          education: prev.education?.map(e =>
            e.id === educationId ? { ...e, ...response.data } : e
          )
        }));
        toast.success('Educación actualizada');
      } else {
        toast.error(response.message || 'Error al actualizar educación');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar educación';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteEducation = useCallback(async (educationId) => {
    setSaving(true);

    try {
      const response = await doctorService.deleteEducation(educationId);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          education: prev.education?.filter(e => e.id !== educationId)
        }));
        toast.success('Educación eliminada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar educación');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar educación';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE EXPERIENCIA
  // ═══════════════════════════════════════════════════════════════

  const handleAddExperience = useCallback(async (experienceData) => {
    setSaving(true);

    try {
      const response = await doctorService.addExperience(experienceData);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          experience: [...(prev.experience || []), response.data]
        }));
        toast.success('Experiencia agregada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al agregar experiencia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al agregar experiencia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUpdateExperience = useCallback(async (experienceId, experienceData) => {
    setSaving(true);

    try {
      const response = await doctorService.updateExperience(experienceId, experienceData);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          experience: prev.experience?.map(e =>
            e.id === experienceId ? { ...e, ...response.data } : e
          )
        }));
        toast.success('Experiencia actualizada');
      } else {
        toast.error(response.message || 'Error al actualizar experiencia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar experiencia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeleteExperience = useCallback(async (experienceId) => {
    setSaving(true);

    try {
      const response = await doctorService.deleteExperience(experienceId);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          experience: prev.experience?.filter(e => e.id !== experienceId)
        }));
        toast.success('Experiencia eliminada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al eliminar experiencia');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar experiencia';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE DISPONIBILIDAD
  // ═══════════════════════════════════════════════════════════════

  const handleSetAvailability = useCallback(async (schedules) => {
    setSaving(true);

    try {
      const response = await doctorService.setAvailability(schedules);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          availability: response.data
        }));
        toast.success('Horarios actualizados');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al actualizar horarios');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar horarios';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE FOTOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sube foto de perfil (acepta File object)
   */
  const handleUploadProfilePhoto = useCallback(async (file) => {
    setSaving(true);

    try {
      const response = await doctorService.uploadProfilePhoto(file);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          profilePhoto: response.data.profilePhoto
        }));
        toast.success('Foto de perfil actualizada');
        await fetchCompleteness();
      } else {
        toast.error(response.message || 'Error al subir foto');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al subir foto de perfil';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [fetchCompleteness]);

  const handleUploadPhoto = useCallback(async (photoUrl) => {
    setSaving(true);

    try {
      const response = await doctorService.uploadPhoto(photoUrl);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          officePhotos: response.data.photos
        }));
        toast.success('Foto agregada');
      } else {
        toast.error(response.message || 'Error al subir foto');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al subir foto';
      toast.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDeletePhoto = useCallback(async (photoUrl) => {
    setSaving(true);

    try {
      const response = await doctorService.deletePhoto(photoUrl);
      if (response.success) {
        setProfile(prev => ({
          ...prev,
          officePhotos: response.data.photos
        }));
        toast.success('Foto eliminada');
      } else {
        toast.error(response.message || 'Error al eliminar foto');
      }
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al eliminar foto';
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
   * Refresca todos los datos
   */
  const refreshAll = useCallback(async () => {
    if (doctorId) {
      await Promise.all([
        fetchProfile(doctorId),
        fetchAvailability(doctorId)
      ]);
    } else {
      await Promise.all([
        fetchMyProfile(),
        fetchCompleteness()
      ]);
    }
  }, [doctorId, fetchProfile, fetchMyProfile, fetchAvailability, fetchCompleteness]);

  /**
   * Limpia el estado
   */
  const reset = useCallback(() => {
    setProfile(null);
    setCompleteness(null);
    setSpecialties([]);
    setAvailability(null);
    setAvailableSlots([]);
    setError(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (autoFetch) {
      if (doctorId) {
        fetchProfile(doctorId);
        fetchAvailability(doctorId);
      } else {
        fetchMyProfile();
      }
    }
  }, [autoFetch, doctorId]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Especialidades
    specialties,
    loadingSpecialties,

    // Disponibilidad
    availability,
    loadingAvailability,
    availableSlots,
    loadingSlots,

    // Carga
    fetchProfile,
    fetchMyProfile,
    fetchCompleteness,
    fetchAvailability,
    fetchAvailableSlots,

    // Actualización
    updateBasicInfo,
    updateLocationInfo,

    // Especialidades
    addSpecialty: handleAddSpecialty,
    removeSpecialty: handleRemoveSpecialty,

    // Educación
    addEducation: handleAddEducation,
    updateEducation: handleUpdateEducation,
    deleteEducation: handleDeleteEducation,

    // Experiencia
    addExperience: handleAddExperience,
    updateExperience: handleUpdateExperience,
    deleteExperience: handleDeleteExperience,

    // Disponibilidad
    setAvailability: handleSetAvailability,

    // Fotos
    uploadProfilePhoto: handleUploadProfilePhoto,
    uploadPhoto: handleUploadPhoto,
    deletePhoto: handleDeletePhoto,

    // Utilidades
    refreshAll,
    reset
  };
};

export default useDoctorProfile;
