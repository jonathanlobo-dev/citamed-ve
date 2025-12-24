/**
 * Search Service - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Servicio de búsqueda avanzada con filtros combinables
 */

const { Op, QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Calcula la distancia usando fórmula de Haversine (en km)
 */
const HAVERSINE_FORMULA = `
  (6371 * acos(
    cos(radians(:userLat)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians(:userLng)) +
    sin(radians(:userLat)) * sin(radians(latitude))
  ))
`;

/**
 * Busca médicos con filtros combinables
 * @param {Object} filters - Filtros de búsqueda
 * @param {string} filters.query - Búsqueda por nombre
 * @param {number[]} filters.specialtyIds - IDs de especialidades
 * @param {string} filters.city - Ciudad
 * @param {string} filters.state - Estado
 * @param {number} filters.minPrice - Precio mínimo
 * @param {number} filters.maxPrice - Precio máximo
 * @param {number} filters.minRating - Rating mínimo
 * @param {number} filters.minExperience - Años de experiencia mínimos
 * @param {string[]} filters.languages - Idiomas
 * @param {boolean} filters.acceptsInsurance - Acepta seguros
 * @param {string[]} filters.insuranceNames - Nombres de seguros específicos
 * @param {boolean} filters.isVerified - Solo verificados
 * @param {string} filters.gender - Género del médico
 * @param {string[]} filters.reputationLevels - Niveles de reputación
 * @param {boolean} filters.hasAvailability - Solo con disponibilidad
 * @param {boolean} filters.acceptsNewPatients - Acepta nuevos pacientes
 * @param {number} filters.userLat - Latitud del usuario
 * @param {number} filters.userLng - Longitud del usuario
 * @param {number} filters.maxDistance - Distancia máxima en km
 * @param {string} filters.consultationType - Tipo: 'online', 'in_person', 'both'
 * @param {string} filters.sortBy - Campo de ordenamiento
 * @param {string} filters.sortOrder - 'ASC' o 'DESC'
 * @param {number} filters.page - Página actual
 * @param {number} filters.limit - Resultados por página
 * @returns {Promise<Object>} Resultados paginados
 */
const searchDoctors = async (filters = {}) => {
  const {
    query,
    specialtyIds,
    city,
    state,
    minPrice,
    maxPrice,
    minRating,
    minExperience,
    languages,
    acceptsInsurance,
    insuranceNames,
    isVerified,
    gender,
    reputationLevels,
    hasAvailability,
    acceptsNewPatients,
    userLat,
    userLng,
    maxDistance,
    consultationType,
    sortBy = 'average_rating',
    sortOrder = 'DESC',
    page = 1,
    limit = 20
  } = filters;

  const conditions = [];
  const replacements = {};

  // Búsqueda por nombre (full text search)
  if (query && query.trim()) {
    conditions.push(`
      to_tsvector('spanish', COALESCE(full_name, '')) @@ plainto_tsquery('spanish', :query)
      OR LOWER(full_name) LIKE LOWER(:queryLike)
    `);
    replacements.query = query.trim();
    replacements.queryLike = `%${query.trim()}%`;
  }

  // Filtro por especialidades
  if (specialtyIds && specialtyIds.length > 0) {
    conditions.push(`specialty_ids && ARRAY[:specialtyIds]::INTEGER[]`);
    replacements.specialtyIds = specialtyIds;
  }

  // Filtro por ciudad
  if (city && city.trim()) {
    conditions.push(`LOWER(city) = LOWER(:city)`);
    replacements.city = city.trim();
  }

  // Filtro por estado
  if (state && state.trim()) {
    conditions.push(`LOWER(state) = LOWER(:state)`);
    replacements.state = state.trim();
  }

  // Filtro por precio (según tipo de consulta)
  if (consultationType === 'online') {
    if (minPrice !== undefined) {
      conditions.push(`consultation_price_online >= :minPrice`);
      replacements.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      conditions.push(`consultation_price_online <= :maxPrice`);
      replacements.maxPrice = maxPrice;
    }
  } else if (consultationType === 'in_person') {
    if (minPrice !== undefined) {
      conditions.push(`consultation_price_in_person >= :minPrice`);
      replacements.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      conditions.push(`consultation_price_in_person <= :maxPrice`);
      replacements.maxPrice = maxPrice;
    }
  } else {
    // Both or not specified - check either price
    if (minPrice !== undefined) {
      conditions.push(`(consultation_price_online >= :minPrice OR consultation_price_in_person >= :minPrice)`);
      replacements.minPrice = minPrice;
    }
    if (maxPrice !== undefined) {
      conditions.push(`(consultation_price_online <= :maxPrice OR consultation_price_in_person <= :maxPrice)`);
      replacements.maxPrice = maxPrice;
    }
  }

  // Filtro por rating mínimo
  if (minRating !== undefined) {
    conditions.push(`average_rating >= :minRating`);
    replacements.minRating = minRating;
  }

  // Filtro por experiencia mínima
  if (minExperience !== undefined) {
    conditions.push(`years_of_experience >= :minExperience`);
    replacements.minExperience = minExperience;
  }

  // Filtro por idiomas
  if (languages && languages.length > 0) {
    conditions.push(`languages && ARRAY[:languages]::TEXT[]`);
    replacements.languages = languages;
  }

  // Filtro por aceptación de seguros
  if (acceptsInsurance !== undefined) {
    conditions.push(`accepts_insurance = :acceptsInsurance`);
    replacements.acceptsInsurance = acceptsInsurance;
  }

  // Filtro por seguros específicos
  if (insuranceNames && insuranceNames.length > 0) {
    conditions.push(`insurance_names && ARRAY[:insuranceNames]::TEXT[]`);
    replacements.insuranceNames = insuranceNames;
  }

  // Filtro por verificación
  if (isVerified !== undefined) {
    conditions.push(`is_verified = :isVerified`);
    replacements.isVerified = isVerified;
  }

  // Filtro por género
  if (gender && gender.trim()) {
    conditions.push(`LOWER(gender) = LOWER(:gender)`);
    replacements.gender = gender.trim();
  }

  // Filtro por niveles de reputación
  if (reputationLevels && reputationLevels.length > 0) {
    conditions.push(`reputation_level = ANY(ARRAY[:reputationLevels]::TEXT[])`);
    replacements.reputationLevels = reputationLevels;
  }

  // Filtro por disponibilidad
  if (hasAvailability !== undefined) {
    conditions.push(`has_availability = :hasAvailability`);
    replacements.hasAvailability = hasAvailability;
  }

  // Filtro por acepta nuevos pacientes
  if (acceptsNewPatients !== undefined) {
    conditions.push(`accepts_new_patients = :acceptsNewPatients`);
    replacements.acceptsNewPatients = acceptsNewPatients;
  }

  // Filtro por tipo de consulta disponible
  if (consultationType === 'online') {
    conditions.push(`consultation_price_online IS NOT NULL`);
  } else if (consultationType === 'in_person') {
    conditions.push(`consultation_price_in_person IS NOT NULL`);
  }

  // Búsqueda geográfica
  let distanceSelect = '';
  let distanceOrder = '';
  if (userLat !== undefined && userLng !== undefined) {
    replacements.userLat = userLat;
    replacements.userLng = userLng;

    distanceSelect = `, ${HAVERSINE_FORMULA} AS distance`;

    if (maxDistance !== undefined) {
      conditions.push(`
        latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND ${HAVERSINE_FORMULA} <= :maxDistance
      `);
      replacements.maxDistance = maxDistance;
    }

    // Si ordena por distancia
    if (sortBy === 'distance') {
      distanceOrder = 'distance';
    }
  }

  // Construir WHERE clause
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Determinar ORDER BY
  const validSortFields = [
    'average_rating',
    'years_of_experience',
    'total_reviews',
    'consultation_price_online',
    'consultation_price_in_person',
    'full_name',
    'created_at'
  ];

  let orderBy;
  if (sortBy === 'distance' && distanceOrder) {
    orderBy = `distance ${sortOrder === 'ASC' ? 'ASC' : 'ASC'}, average_rating DESC`;
  } else if (validSortFields.includes(sortBy)) {
    orderBy = `${sortBy} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;
  } else {
    orderBy = 'average_rating DESC, total_reviews DESC';
  }

  // Calcular offset
  const offset = (page - 1) * limit;

  // Query principal
  const mainQuery = `
    SELECT
      doctor_id,
      doctor_profile_id,
      full_name,
      specialties_text,
      specialty_ids,
      city,
      state,
      country,
      consultation_price_online,
      consultation_price_in_person,
      latitude,
      longitude,
      years_of_experience,
      accepts_insurance,
      insurance_names,
      languages,
      gender,
      reputation_level,
      average_rating,
      total_reviews,
      total_appointments,
      has_availability,
      next_available_date,
      accepts_new_patients,
      is_verified,
      verification_status,
      profile_photo
      ${distanceSelect}
    FROM doctor_search_cache
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT :limit
    OFFSET :offset
  `;

  // Query de conteo
  const countQuery = `
    SELECT COUNT(*) as total
    FROM doctor_search_cache
    ${whereClause}
  `;

  replacements.limit = limit;
  replacements.offset = offset;

  try {
    // Ejecutar queries en paralelo
    const [results, countResult] = await Promise.all([
      sequelize.query(mainQuery, {
        replacements,
        type: QueryTypes.SELECT
      }),
      sequelize.query(countQuery, {
        replacements,
        type: QueryTypes.SELECT
      })
    ]);

    const total = parseInt(countResult[0].total, 10);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        doctors: results,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          applied: Object.keys(filters).filter(k => filters[k] !== undefined && filters[k] !== null)
        }
      }
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Obtiene lista de especialidades para autocomplete
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Lista de especialidades
 */
const getSpecialties = async (query = '') => {
  try {
    let whereClause = '';
    const replacements = {};

    if (query && query.trim()) {
      whereClause = `WHERE LOWER(name) LIKE LOWER(:query)`;
      replacements.query = `%${query.trim()}%`;
    }

    const results = await sequelize.query(`
      SELECT id, name, description
      FROM specialties
      ${whereClause}
      ORDER BY name ASC
      LIMIT 50
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Get specialties error:', error);
    throw error;
  }
};

/**
 * Obtiene lista de ciudades para autocomplete
 * @param {string} query - Texto de búsqueda
 * @param {string} state - Filtrar por estado
 * @returns {Promise<Array>} Lista de ciudades únicas
 */
const getCities = async (query = '', state = '') => {
  try {
    const conditions = ['city IS NOT NULL'];
    const replacements = {};

    if (query && query.trim()) {
      conditions.push(`LOWER(city) LIKE LOWER(:query)`);
      replacements.query = `%${query.trim()}%`;
    }

    if (state && state.trim()) {
      conditions.push(`LOWER(state) = LOWER(:state)`);
      replacements.state = state.trim();
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const results = await sequelize.query(`
      SELECT DISTINCT city, state, COUNT(*) as doctor_count
      FROM doctor_search_cache
      ${whereClause}
      GROUP BY city, state
      ORDER BY doctor_count DESC, city ASC
      LIMIT 50
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Get cities error:', error);
    throw error;
  }
};

/**
 * Obtiene lista de estados para autocomplete
 * @param {string} query - Texto de búsqueda
 * @returns {Promise<Array>} Lista de estados únicos
 */
const getStates = async (query = '') => {
  try {
    let whereClause = 'WHERE state IS NOT NULL';
    const replacements = {};

    if (query && query.trim()) {
      whereClause += ` AND LOWER(state) LIKE LOWER(:query)`;
      replacements.query = `%${query.trim()}%`;
    }

    const results = await sequelize.query(`
      SELECT DISTINCT state, COUNT(*) as doctor_count
      FROM doctor_search_cache
      ${whereClause}
      GROUP BY state
      ORDER BY doctor_count DESC, state ASC
      LIMIT 30
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Get states error:', error);
    throw error;
  }
};

/**
 * Obtiene lista de seguros aceptados
 * @returns {Promise<Array>} Lista de seguros únicos
 */
const getInsuranceProviders = async () => {
  try {
    const results = await sequelize.query(`
      SELECT DISTINCT unnest(insurance_names) as insurance_name
      FROM doctor_search_cache
      WHERE insurance_names IS NOT NULL
        AND array_length(insurance_names, 1) > 0
      ORDER BY insurance_name ASC
    `, {
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: results.map(r => r.insurance_name)
    };
  } catch (error) {
    console.error('Get insurance providers error:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de búsqueda para filtros
 * @returns {Promise<Object>} Estadísticas
 */
const getSearchStats = async () => {
  try {
    const stats = await sequelize.query(`
      SELECT
        COUNT(*) as total_doctors,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_doctors,
        COUNT(*) FILTER (WHERE has_availability = true) as available_doctors,
        COUNT(*) FILTER (WHERE accepts_insurance = true) as accepts_insurance,
        MIN(consultation_price_online) FILTER (WHERE consultation_price_online IS NOT NULL) as min_price_online,
        MAX(consultation_price_online) FILTER (WHERE consultation_price_online IS NOT NULL) as max_price_online,
        MIN(consultation_price_in_person) FILTER (WHERE consultation_price_in_person IS NOT NULL) as min_price_in_person,
        MAX(consultation_price_in_person) FILTER (WHERE consultation_price_in_person IS NOT NULL) as max_price_in_person,
        AVG(average_rating) FILTER (WHERE average_rating > 0) as avg_rating,
        MAX(years_of_experience) as max_experience,
        COUNT(DISTINCT city) as total_cities,
        COUNT(DISTINCT state) as total_states
      FROM doctor_search_cache
    `, {
      type: QueryTypes.SELECT
    });

    // Contar por nivel de reputación
    const reputationCounts = await sequelize.query(`
      SELECT reputation_level, COUNT(*) as count
      FROM doctor_search_cache
      GROUP BY reputation_level
    `, {
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: {
        ...stats[0],
        reputationLevels: reputationCounts.reduce((acc, r) => {
          acc[r.reputation_level] = parseInt(r.count, 10);
          return acc;
        }, {})
      }
    };
  } catch (error) {
    console.error('Get search stats error:', error);
    throw error;
  }
};

/**
 * Actualiza el cache de búsqueda para un médico específico
 * @param {number} doctorId - ID del usuario médico
 * @returns {Promise<Object>} Resultado
 */
const updateDoctorSearchCache = async (doctorId) => {
  try {
    await sequelize.query(`SELECT update_doctor_search_cache(:doctorId)`, {
      replacements: { doctorId },
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      message: 'Cache actualizado correctamente'
    };
  } catch (error) {
    console.error('Update cache error:', error);
    throw error;
  }
};

/**
 * Reconstruye todo el cache de búsqueda
 * @returns {Promise<Object>} Resultado
 */
const rebuildSearchCache = async () => {
  try {
    // Obtener todos los médicos
    const doctors = await sequelize.query(`
      SELECT id FROM users WHERE role = 'doctor'
    `, {
      type: QueryTypes.SELECT
    });

    // Actualizar cada uno
    for (const doctor of doctors) {
      await updateDoctorSearchCache(doctor.id);
    }

    return {
      success: true,
      message: `Cache reconstruido para ${doctors.length} médicos`
    };
  } catch (error) {
    console.error('Rebuild cache error:', error);
    throw error;
  }
};

/**
 * Búsqueda rápida para sugerencias (autocomplete)
 * @param {string} query - Texto de búsqueda
 * @param {number} limit - Límite de resultados
 * @returns {Promise<Object>} Sugerencias agrupadas
 */
const quickSearch = async (query, limit = 5) => {
  if (!query || query.trim().length < 2) {
    return {
      success: true,
      data: { doctors: [], specialties: [], cities: [] }
    };
  }

  const searchQuery = query.trim();
  const replacements = {
    query: `%${searchQuery}%`,
    limit
  };

  try {
    // Buscar médicos
    const doctors = await sequelize.query(`
      SELECT doctor_id, doctor_profile_id, full_name, specialties_text, city, profile_photo
      FROM doctor_search_cache
      WHERE LOWER(full_name) LIKE LOWER(:query)
      ORDER BY average_rating DESC
      LIMIT :limit
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Buscar especialidades
    const specialties = await sequelize.query(`
      SELECT id, name
      FROM specialties
      WHERE LOWER(name) LIKE LOWER(:query)
      LIMIT :limit
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Buscar ciudades
    const cities = await sequelize.query(`
      SELECT DISTINCT city, state, COUNT(*) as doctor_count
      FROM doctor_search_cache
      WHERE LOWER(city) LIKE LOWER(:query)
      GROUP BY city, state
      ORDER BY doctor_count DESC
      LIMIT :limit
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    return {
      success: true,
      data: {
        doctors,
        specialties,
        cities
      }
    };
  } catch (error) {
    console.error('Quick search error:', error);
    throw error;
  }
};

module.exports = {
  searchDoctors,
  getSpecialties,
  getCities,
  getStates,
  getInsuranceProviders,
  getSearchStats,
  updateDoctorSearchCache,
  rebuildSearchCache,
  quickSearch
};
