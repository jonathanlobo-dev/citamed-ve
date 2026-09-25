/**
 * Helper de fecha y hora para Venezuela (America/Caracas, UTC-4) - CITAMED.VE
 * Centraliza el cálculo de "hoy" y "ahora" evitando desfases por UTC o zona del servidor.
 */

const getCaracasParts = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Caracas',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(d);

  const getPart = (type) => parts.find(p => p.type === type)?.value;
  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: parseInt(getPart('hour') || '0', 10),
    minute: parseInt(getPart('minute') || '0', 10),
    second: parseInt(getPart('second') || '0', 10)
  };
};

/**
 * Devuelve la fecha actual en hora de Caracas en formato 'YYYY-MM-DD'
 * @param {Date|string} [date=new Date()]
 * @returns {string} 'YYYY-MM-DD'
 */
const todayCaracas = (date = new Date()) => {
  const parts = getCaracasParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

/**
 * Devuelve los minutos transcurridos desde la medianoche en hora de Caracas
 * @param {Date|string} [date=new Date()]
 * @returns {number} Minutos (0 a 1439)
 */
const nowMinutesCaracas = (date = new Date()) => {
  const parts = getCaracasParts(date);
  return parts.hour * 60 + parts.minute;
};

/**
 * Devuelve la hora actual en hora de Caracas en formato 'HH:mm'
 * @param {Date|string} [date=new Date()]
 * @returns {string} 'HH:mm'
 */
const nowTimeCaracas = (date = new Date()) => {
  const parts = getCaracasParts(date);
  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
};

module.exports = {
  todayCaracas,
  nowMinutesCaracas,
  nowTimeCaracas,
  getCaracasParts
};
