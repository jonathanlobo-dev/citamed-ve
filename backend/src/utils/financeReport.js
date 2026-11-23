/**
 * financeReport.js - CITAMED.VE
 * Reportes del médico: cálculo puro de ingresos, egresos y utilidad (sin base de datos, para poder probarlo).
 * Los montos viven en USD; el equivalente en Bs se calcula con la tasa guardada (exchange_rates).
 */

const EXPENSE_CATEGORIES = [
  'alquiler',
  'servicios_publicos',
  'insumos',
  'nomina',
  'equipos',
  'mantenimiento',
  'impuestos',
  'marketing',
  'otro'
];

const EXPENSE_METHODS = ['efectivo', 'pago_movil', 'transferencia', 'zelle', 'tarjeta', 'otro'];
const EXPENSE_CURRENCIES = ['USD', 'VES'];
const MAX_RANGE_DAYS = 366;

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

// Número de día de una fecha YYYY-MM-DD sin pasar por la zona horaria local
function dayNumber(str) {
  const [y, m, d] = str.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

/**
 * Período del reporte: un mes ("2026-11") o un rango ("from" y "to").
 * Devuelve { from, to } en YYYY-MM-DD o lanza un error 400.
 */
function resolvePeriod({ month, from, to } = {}) {
  if (month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw fail('El mes debe tener el formato AAAA-MM');
    const [y, m] = month.split('-').map(Number);
    return { from: `${month}-01`, to: `${month}-${String(daysInMonth(y, m)).padStart(2, '0')}` };
  }
  if (!isValidDate(from) || !isValidDate(to)) throw fail('Indica un período válido (mes o rango de fechas)');
  if (dayNumber(to) < dayNumber(from)) throw fail('La fecha final no puede ser anterior a la inicial');
  if (dayNumber(to) - dayNumber(from) + 1 > MAX_RANGE_DAYS) throw fail('El período no puede pasar de un año');
  return { from, to };
}

/** Límites en instantes UTC de un rango de días de Caracas (UTC-4 todo el año). */
function caracasBounds({ from, to }) {
  return {
    start: new Date(`${from}T00:00:00.000-04:00`),
    end: new Date(`${to}T23:59:59.999-04:00`)
  };
}

/** Monto de un egreso en USD según su moneda y la tasa. */
function expenseAmountUsd(amount, currency, rate) {
  const value = Number(amount);
  if (currency === 'USD') return round2(value);
  const r = Number(rate);
  if (!(r > 0)) throw fail('No hay tasa BCV disponible para convertir el egreso', 503);
  return round2(value / r);
}

/** Valida y limpia los datos de un egreso. Devuelve los campos listos para guardar. */
function validateExpenseInput(input = {}, { today } = {}) {
  const description = String(input.description || '').trim().replace(/\s+/g, ' ');
  if (description.length < 3) throw fail('Describe el egreso (mínimo 3 caracteres)');
  if (description.length > 150) throw fail('La descripción no puede pasar de 150 caracteres');

  if (!EXPENSE_CATEGORIES.includes(input.category)) throw fail('Elige una categoría válida');
  const currency = String(input.currency || 'USD').toUpperCase();
  if (!EXPENSE_CURRENCIES.includes(currency)) throw fail('La moneda debe ser USD o VES');

  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw fail('El monto debe ser mayor que cero');
  if (Math.abs(Math.round(amount * 100) / 100 - amount) > 1e-9) throw fail('El monto admite máximo 2 decimales');
  if (amount > 999999999) throw fail('El monto es demasiado grande');

  const method = input.method || 'efectivo';
  if (!EXPENSE_METHODS.includes(method)) throw fail('Elige un método de pago válido');

  const expenseDate = input.expenseDate;
  if (!isValidDate(expenseDate)) throw fail('Indica la fecha del egreso');
  if (today && dayNumber(expenseDate) > dayNumber(today)) throw fail('La fecha del egreso no puede ser futura');

  const notes = String(input.notes || '').trim().slice(0, 300);

  return { description, category: input.category, currency, amount: round2(amount), method, expenseDate, notes: notes || null };
}

function sumBy(items, pick) {
  return round2(items.reduce((acc, item) => acc + (Number(pick(item)) || 0), 0));
}

/** Agrupa egresos por categoría con su porcentaje sobre el total. Orden: mayor a menor. */
function groupExpensesByCategory(expenses) {
  const total = sumBy(expenses, (e) => e.amountUsd);
  const map = new Map();
  for (const e of expenses) {
    const key = e.category || 'otro';
    const cur = map.get(key) || { category: key, totalUsd: 0, count: 0 };
    cur.totalUsd += Number(e.amountUsd) || 0;
    cur.count += 1;
    map.set(key, cur);
  }
  return [...map.values()]
    .map((g) => ({ ...g, totalUsd: round2(g.totalUsd), percent: total > 0 ? Math.round((g.totalUsd / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.totalUsd - a.totalUsd);
}

/** Cuenta consultas atendidas por tipo (appointmentType), de mayor a menor. */
function groupConsultationsByType(appointments) {
  const map = new Map();
  for (const a of appointments) {
    const key = a.appointmentType || 'first_consultation';
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}

/** Cobros aprobados por método. */
function groupIncomeByMethod(payments) {
  const map = new Map();
  for (const p of payments) {
    const cur = map.get(p.method) || { method: p.method, totalUsd: 0, count: 0 };
    cur.totalUsd += Number(p.amountUsd) || 0;
    cur.count += 1;
    map.set(p.method, cur);
  }
  return [...map.values()].map((g) => ({ ...g, totalUsd: round2(g.totalUsd) })).sort((a, b) => b.totalUsd - a.totalUsd);
}

/**
 * Arma el reporte completo.
 * @param {Object} data
 * @param {Array} data.payments Cobros aprobados del período ({ amountUsd, method })
 * @param {Array} data.pendingPayments Cobros reportados aún sin validar ({ amountUsd })
 * @param {Array} data.receivable Consultas atendidas sin cobro ({ consultationFee })
 * @param {Array} data.expenses Egresos del período ({ amountUsd, category })
 * @param {Array} data.attended Consultas atendidas del período ({ appointmentType })
 * @param {number|null} data.rate Tasa USD/VES guardada
 */
function buildReport({ payments = [], pendingPayments = [], receivable = [], expenses = [], attended = [], rate = null } = {}) {
  const incomeUsd = sumBy(payments, (p) => p.amountUsd);
  const expensesUsd = sumBy(expenses, (e) => e.amountUsd);
  const profitUsd = round2(incomeUsd - expensesUsd);
  const receivableUsd = sumBy(receivable, (a) => a.consultationFee);
  const pendingUsd = sumBy(pendingPayments, (p) => p.amountUsd);
  const validRate = Number(rate) > 0 ? Number(rate) : null;
  const toVes = (usd) => (validRate ? round2(usd * validRate) : null);

  return {
    rate: validRate,
    income: { totalUsd: incomeUsd, totalVes: toVes(incomeUsd), count: payments.length, byMethod: groupIncomeByMethod(payments) },
    receivable: { totalUsd: receivableUsd, totalVes: toVes(receivableUsd), count: receivable.length },
    pendingValidation: { totalUsd: pendingUsd, totalVes: toVes(pendingUsd), count: pendingPayments.length },
    expenses: {
      totalUsd: expensesUsd,
      totalVes: toVes(expensesUsd),
      count: expenses.length,
      byCategory: groupExpensesByCategory(expenses)
    },
    profit: {
      totalUsd: profitUsd,
      totalVes: toVes(profitUsd),
      marginPercent: incomeUsd > 0 ? Math.round((profitUsd / incomeUsd) * 1000) / 10 : null
    },
    consultations: { total: attended.length, byType: groupConsultationsByType(attended) }
  };
}

module.exports = {
  EXPENSE_CATEGORIES,
  EXPENSE_METHODS,
  EXPENSE_CURRENCIES,
  round2,
  isValidDate,
  resolvePeriod,
  caracasBounds,
  expenseAmountUsd,
  validateExpenseInput,
  groupExpensesByCategory,
  groupConsultationsByType,
  groupIncomeByMethod,
  buildReport
};
