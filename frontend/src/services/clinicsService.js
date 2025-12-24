/**
 * Clinics Service - CITAMED.VE Frontend
 * M02 Sub-Partida 3.6 - Sistema de Clinicas y Organizaciones
 *
 * Servicio para consumir API de clinicas
 */

import api from './api';

const clinicsService = {
  // ═══════════════════════════════════════════════════════════════
  // CLINICAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Buscar clinicas con filtros
   */
  searchClinics: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.organizationType) params.append('organizationType', filters.organizationType);
    if (filters.isVerified !== undefined) params.append('isVerified', filters.isVerified);
    if (filters.search) params.append('search', filters.search);
    if (filters.city) params.append('city', filters.city);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const response = await api.get(`/clinics?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener clinica por ID
   */
  getClinicById: async (clinicId, options = {}) => {
    const params = new URLSearchParams();

    if (options.includeLocations !== undefined) params.append('includeLocations', options.includeLocations);
    if (options.includeServices) params.append('includeServices', 'true');
    if (options.includeImages) params.append('includeImages', 'true');
    if (options.includeAdmin) params.append('includeAdmin', 'true');

    const response = await api.get(`/clinics/${clinicId}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener clinica con todas sus relaciones
   */
  getClinicFull: async (clinicId) => {
    const response = await api.get(`/clinics/${clinicId}/full`);
    return response.data;
  },

  /**
   * Crear nueva clinica
   */
  createClinic: async (clinicData) => {
    const response = await api.post('/clinics', clinicData);
    return response.data;
  },

  /**
   * Actualizar clinica
   */
  updateClinic: async (clinicId, updateData) => {
    const response = await api.put(`/clinics/${clinicId}`, updateData);
    return response.data;
  },

  /**
   * Obtener mis clinicas
   */
  getMyClinics: async () => {
    const response = await api.get('/clinics/user/my-clinics');
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // SEDES (LOCATIONS)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtener sedes de una clinica
   */
  getClinicLocations: async (clinicId) => {
    const response = await api.get(`/clinics/${clinicId}/locations`);
    return response.data;
  },

  /**
   * Agregar sede a clinica
   */
  addLocation: async (clinicId, locationData) => {
    const response = await api.post(`/clinics/${clinicId}/locations`, locationData);
    return response.data;
  },

  /**
   * Actualizar sede
   */
  updateLocation: async (clinicId, locationId, updateData) => {
    const response = await api.put(`/clinics/${clinicId}/locations/${locationId}`, updateData);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // MEDICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtener medicos de una clinica
   */
  getClinicDoctors: async (clinicId, locationId = null) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    const response = await api.get(`/clinics/${clinicId}/doctors${params}`);
    return response.data;
  },

  /**
   * Asignar medico a clinica/sede
   */
  assignDoctor: async (clinicId, assignmentData) => {
    const response = await api.post(`/clinics/${clinicId}/doctors`, assignmentData);
    return response.data;
  },

  /**
   * Remover medico de clinica/sede
   */
  removeDoctor: async (clinicId, doctorId, locationId = null) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    const response = await api.delete(`/clinics/${clinicId}/doctors/${doctorId}${params}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // SERVICIOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtener servicios de una clinica
   */
  getClinicServices: async (clinicId, locationId = null) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    const response = await api.get(`/clinics/${clinicId}/services${params}`);
    return response.data;
  },

  /**
   * Agregar servicio a clinica
   */
  addService: async (clinicId, serviceData) => {
    const response = await api.post(`/clinics/${clinicId}/services`, serviceData);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // IMAGENES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtener imagenes de una clinica
   */
  getClinicImages: async (clinicId, locationId = null) => {
    const params = locationId ? `?locationId=${locationId}` : '';
    const response = await api.get(`/clinics/${clinicId}/images${params}`);
    return response.data;
  },

  /**
   * Agregar imagen a clinica
   */
  addImage: async (clinicId, imageData) => {
    const response = await api.post(`/clinics/${clinicId}/images`, imageData);
    return response.data;
  },

  /**
   * Eliminar imagen
   */
  deleteImage: async (clinicId, imageId) => {
    const response = await api.delete(`/clinics/${clinicId}/images/${imageId}`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // VERIFICACION (ADMIN)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verificar clinica (solo admin)
   */
  verifyClinic: async (clinicId) => {
    const response = await api.post(`/clinics/${clinicId}/verify`);
    return response.data;
  },

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtener tipos de organizacion disponibles
   */
  getOrganizationTypes: () => [
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinica_privada', label: 'Clinica Privada' },
    { value: 'centro_diagnostico', label: 'Centro de Diagnostico' },
    { value: 'laboratorio', label: 'Laboratorio' },
    { value: 'centro_odontologico', label: 'Centro Odontologico' },
    { value: 'centro_oftalmologico', label: 'Centro Oftalmologico' },
    { value: 'centro_rehabilitacion', label: 'Centro de Rehabilitacion' },
    { value: 'consultorio_medico', label: 'Consultorio Medico' },
    { value: 'otro', label: 'Otro' }
  ],

  /**
   * Obtener tipos de empleo de medicos
   */
  getEmploymentTypes: () => [
    { value: 'staff', label: 'Medico de Planta' },
    { value: 'visiting', label: 'Medico Visitante' },
    { value: 'partner', label: 'Socio' },
    { value: 'affiliated', label: 'Afiliado' }
  ],

  /**
   * Obtener tipos de imagenes
   */
  getImageTypes: () => [
    { value: 'exterior', label: 'Exterior' },
    { value: 'reception', label: 'Recepcion' },
    { value: 'consultation_room', label: 'Consultorio' },
    { value: 'waiting_room', label: 'Sala de Espera' },
    { value: 'equipment', label: 'Equipos' },
    { value: 'staff', label: 'Personal' },
    { value: 'other', label: 'Otro' }
  ]
};

export default clinicsService;
