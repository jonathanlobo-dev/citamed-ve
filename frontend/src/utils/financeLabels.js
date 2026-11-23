/**
 * financeLabels.js - CitaMed
 * Etiquetas y ayudas de formato para los reportes del médico (sin tocar la red).
 * Las fechas YYYY-MM-DD nunca pasan por new Date(): en Caracas se correrían al día anterior.
 */

export const EXPENSE_CATEGORY_LABELS = {
  alquiler: 'Alquiler del consultorio',
  servicios_publicos: 'Servicios (luz, agua, internet)',
  insumos: 'Insumos y materiales',
  nomina: 'Personal y honorarios',
  equipos: 'Equipos e instrumental',
  mantenimiento: 'Mantenimiento y reparaciones',
  impuestos: 'Impuestos y tasas',
  marketing: 'Publicidad y mercadeo',
  otro: 'Otros gastos'
};

export const EXPENSE_METHOD_LABELS = {
  efectivo: 'Efectivo',
  pago_movil: 'Pago Móvil',
  transferencia: 'Transferencia',
  zelle: 'Zelle',
  tarjeta: 'Punto / Tarjeta',
  otro: 'Otro medio'
};

export const INCOME_METHOD_LABELS = {
  pago_movil: 'Pago Móvil',
  transferencia: 'Transferencia',
  zelle: 'Zelle',
  efectivo_usd: 'Efectivo USD',
  efectivo_ves: 'Efectivo Bs.'
};

export const CONSULTATION_TYPE_LABELS = {
  first_consultation: 'Primera consulta',
  follow_up: 'Seguimiento',
  emergency: 'Emergencia',
  routine_checkup: 'Chequeo de rutina',
  telemedicine: 'Telemedicina',
  home_visit: 'Visita a domicilio'
};

const label = (map, key) => map[key] || key || '';
export const expenseCategoryLabel = (k) => label(EXPENSE_CATEGORY_LABELS, k);
export const expenseMethodLabel = (k) => label(EXPENSE_METHOD_LABELS, k);
export const incomeMethodLabel = (k) => label(INCOME_METHOD_LABELS, k);
export const consultationTypeLabel = (k) => label(CONSULTATION_TYPE_LABELS, k);

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function caracasParts(now, withDay) {
  const opts = { timeZone: 'America/Caracas', year: 'numeric', month: '2-digit' };
  if (withDay) opts.day = '2-digit';
  const parts = new Intl.DateTimeFormat('en-CA', opts).formatToParts(now);
  return (t) => parts.find((p) => p.type === t)?.value;
}

/** Mes actual en Caracas como AAAA-MM. */
export function currentMonthCaracas(now = new Date()) {
  const get = caracasParts(now, false);
  return `${get('year')}-${get('month')}`;
}

/** Hoy en Caracas como AAAA-MM-DD. */
export function todayCaracas(now = new Date()) {
  const get = caracasParts(now, true);
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** Suma o resta meses a un AAAA-MM. */
export function shiftMonth(month, delta) {
  const [y, m] = month.split('-').map(Number);
  const index = y * 12 + (m - 1) + delta;
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

/** "noviembre de 2026" */
export function monthLabel(month) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} de ${y}`;
}

const nf = (n) =>
  Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatUsd = (n) => `$${nf(n)}`;
export const formatVes = (n) => (n === null || n === undefined ? '' : `Bs. ${nf(n)}`);

/** Parámetros que se envían al servidor según el modo elegido. */
export function periodParams({ mode, month, from, to }) {
  return mode === 'range' ? { from, to } : { month };
}

/** Un rango de fechas es enviable si ambas existen y la final no es anterior a la inicial. */
export function isRangeReady(from, to) {
  return /^\d{4}-\d{2}-\d{2}$/.test(from || '') && /^\d{4}-\d{2}-\d{2}$/.test(to || '') && from <= to;
}
