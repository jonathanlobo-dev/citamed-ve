/**
 * sacsService.js - CITAMED.VE
 * Consulta el registro de profesionales de la salud del SACS (Servicio Autónomo de Contraloría
 * Sanitaria) por número de matrícula MPPS y lo compara con los datos del médico.
 *
 * El SACS no tiene API oficial: su página pública (sistemas.sacs.gob.ve/consultas/prfsnal_salud)
 * responde con una sola petición POST (xajax) que trae los registros en JSON. Si el SACS cambia
 * su página o no responde, se devuelve "unavailable" y el admin consulta a mano con el enlace.
 *
 * Ojo: un mismo número MPPS puede tener registros de varias profesiones (médico y enfermera, por
 * ejemplo), por eso se exige profesión médica y que coincida el nombre.
 */
const SACS_URL = 'https://sistemas.sacs.gob.ve/consultas/prfsnal_salud';
const TIMEOUT_MS = 12000;

const ENTITIES = { aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü', amp: '&', quot: '"', apos: "'" };
function decodeEntities(s) {
  return String(s || '').replace(/&([a-zA-Z]+);/g, (m, name) => {
    const lower = ENTITIES[name.toLowerCase()];
    if (!lower) return m;
    return name[0] === name[0].toUpperCase() ? lower.toUpperCase() : lower;
  });
}

/** "MPPS-148.020", "148020" o "mpps 148020" -> "MPPS-148020"; null si no hay número */
function normalizeMatricula(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `MPPS-${Number(digits)}` : null;
}

/** Extrae los registros del XML que devuelve el SACS */
function parseSacsResponse(xml) {
  const text = String(xml || '');
  if (/NO EXISTE/i.test(text)) return [];
  const m = text.match(/xajax_createTable\('([\s\S]*?)'\)/);
  if (!m) throw new Error('Respuesta del SACS con un formato desconocido');
  const rows = JSON.parse(m[1]);
  return rows.map((r) => ({
    cedula: r.cedula || null,
    nombre: decodeEntities(r.nombre1 || ''),
    apellido: decodeEntities(r.apellido1 || ''),
    profesion: decodeEntities(r.profesion || ''),
    matricula: r.matricula || null,
    fechaRegistro: r.fecha_registro || null,
    tomo: r.tomo_registro || null,
    folio: r.folio_registro || null
  }));
}

const plain = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const tokens = (s) => plain(s).split(/\s+/).filter(Boolean);
const isDoctorProfession = (p) => /MEDIC/.test(plain(p)) && !/VETERIN/.test(plain(p));

/**
 * Compara los registros del SACS con el médico.
 * status: match | name_mismatch | not_doctor | not_found
 */
function compareWithDoctor(records, { matricula, firstName, lastName }) {
  const exact = records.filter((r) => r.matricula === matricula);
  if (!exact.length) return { status: 'not_found', record: null, records: [] };
  const doctors = exact.filter((r) => isDoctorProfession(r.profesion));
  if (!doctors.length) return { status: 'not_doctor', record: exact[0], records: exact };
  const first = tokens(firstName);
  const last = tokens(lastName);
  // El SACS puede traer uno o dos nombres/apellidos: basta con que coincida el primero de cada uno
  const hit = doctors.find((r) => first.includes(tokens(r.nombre)[0]) && last.includes(tokens(r.apellido)[0]));
  if (hit) return { status: 'match', record: hit, records: exact };
  return { status: 'name_mismatch', record: doctors[0], records: exact };
}

async function fetchByMatricula(matricula) {
  const body = new URLSearchParams();
  body.append('xajax', 'getPrfsnalMatricula');
  body.append('xajaxargs[]', matricula);
  const res = await fetch(SACS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`SACS respondió ${res.status}`);
  return parseSacsResponse(await res.text());
}

/** Consulta y compara. Nunca lanza: si el SACS falla devuelve status "unavailable". */
async function checkDoctor({ mpps, firstName, lastName }) {
  const matricula = normalizeMatricula(mpps);
  const base = { matricula, consultUrl: SACS_URL };
  if (!matricula) return { ...base, status: 'invalid', record: null, records: [] };
  try {
    const records = await fetchByMatricula(matricula);
    return { ...base, ...compareWithDoctor(records, { matricula, firstName, lastName }) };
  } catch (error) {
    return { ...base, status: 'unavailable', error: error.message, record: null, records: [] };
  }
}

module.exports = { checkDoctor, parseSacsResponse, compareWithDoctor, normalizeMatricula, SACS_URL };
