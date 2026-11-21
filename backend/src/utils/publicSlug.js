/**
 * publicSlug.js - CITAMED.VE
 * Genera el enlace propio del médico (/dr/:slug) a partir de su nombre, sin repetir uno existente.
 */
const { Op } = require('sequelize');

function baseSlugFor(firstName, lastName) {
  return `${firstName || ''} ${lastName || ''}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'medico';
}

async function uniquePublicSlug(DoctorProfile, firstName, lastName, { excludeId = null, transaction } = {}) {
  const baseSlug = baseSlugFor(firstName, lastName);
  let candidate = baseSlug;
  let counter = 1;
  for (;;) {
    const where = { publicSlug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await DoctorProfile.findOne({ where, transaction });
    if (!existing) return candidate;
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}

module.exports = { baseSlugFor, uniquePublicSlug };
