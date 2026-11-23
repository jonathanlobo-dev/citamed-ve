/**
 * doctorFinanceService.js - CITAMED.VE
 * Reportes del médico: egresos del consultorio y reporte de ingresos, egresos y utilidad.
 * El cálculo vive en utils/financeReport.js (puro); aquí solo se leen y guardan datos.
 */

const { Op, fn, col, where: sqlWhere } = require('sequelize');
const db = require('../models');
const exchangeRateService = require('./exchangeRateService');
const { todayCaracas } = require('../utils/dateCaracas');
const finance = require('../utils/financeReport');

const { Payment, Appointment, DoctorExpense } = db;

async function currentRate() {
  try {
    const current = await exchangeRateService.getCurrent('USD/VES');
    return current && Number(current.rate) > 0 ? Number(current.rate) : null;
  } catch {
    return null;
  }
}

const serializeExpense = (e) => ({
  id: e.id,
  description: e.description,
  category: e.category,
  amount: e.amount,
  currency: e.currency,
  exchangeRate: e.exchangeRate,
  amountUsd: e.amountUsd,
  method: e.method,
  expenseDate: e.expenseDate,
  notes: e.notes
});

async function listExpenses(user, query = {}) {
  const period = finance.resolvePeriod(query);
  const rows = await DoctorExpense.findAll({
    where: { doctorId: user.id, expenseDate: { [Op.between]: [period.from, period.to] } },
    order: [['expenseDate', 'DESC'], ['id', 'DESC']]
  });
  return { period, items: rows.map(serializeExpense) };
}

async function createExpense(user, input) {
  const data = finance.validateExpenseInput(input, { today: todayCaracas() });
  const rate = data.currency === 'VES' ? await currentRate() : null;
  const amountUsd = finance.expenseAmountUsd(data.amount, data.currency, rate);
  const row = await DoctorExpense.create({
    doctorId: user.id,
    description: data.description,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    exchangeRate: rate,
    amountUsd,
    method: data.method,
    expenseDate: data.expenseDate,
    notes: data.notes,
    createdBy: user.id
  });
  return serializeExpense(row);
}

async function findOwnExpense(user, id) {
  const row = await DoctorExpense.findOne({ where: { id: Number(id), doctorId: user.id } });
  if (!row) throw Object.assign(new Error('Egreso no encontrado'), { statusCode: 404 });
  return row;
}

async function updateExpense(user, id, input) {
  const row = await findOwnExpense(user, id);
  const data = finance.validateExpenseInput(input, { today: todayCaracas() });
  // La tasa se conserva si el egreso ya estaba en bolívares con el mismo monto y moneda
  let rate = row.currency === 'VES' && data.currency === 'VES' ? row.exchangeRate : null;
  if (data.currency === 'VES' && !rate) rate = await currentRate();
  if (data.currency === 'USD') rate = null;
  const amountUsd = finance.expenseAmountUsd(data.amount, data.currency, rate);
  await row.update({
    description: data.description,
    category: data.category,
    amount: data.amount,
    currency: data.currency,
    exchangeRate: rate,
    amountUsd,
    method: data.method,
    expenseDate: data.expenseDate,
    notes: data.notes
  });
  return serializeExpense(row);
}

async function deleteExpense(user, id) {
  const row = await findOwnExpense(user, id);
  await row.destroy();
}

/**
 * Reporte del período: ingresos cobrados (cobros aprobados), por cobrar, egresos, utilidad
 * y consultas atendidas por tipo.
 */
async function getReport(user, query = {}) {
  const period = finance.resolvePeriod(query);
  const { start, end } = finance.caracasBounds(period);
  // Un cobro cuenta el día en que se aprobó (o se registró), no el día de la cita
  const paidAt = fn('COALESCE', col('reviewed_at'), col('created_at'));

  const [payments, pendingPayments, expenses, attended, unpaid, rate] = await Promise.all([
    Payment.findAll({
      where: { doctorId: user.id, status: 'approved', [Op.and]: [sqlWhere(paidAt, { [Op.between]: [start, end] })] },
      attributes: ['amountUsd', 'method']
    }),
    Payment.findAll({
      where: { doctorId: user.id, status: 'reported', createdAt: { [Op.between]: [start, end] } },
      attributes: ['amountUsd']
    }),
    DoctorExpense.findAll({
      where: { doctorId: user.id, expenseDate: { [Op.between]: [period.from, period.to] } },
      attributes: ['amountUsd', 'category']
    }),
    Appointment.findAll({
      where: {
        doctorId: user.id,
        status: { [Op.in]: ['in_progress', 'completed'] },
        appointmentDate: { [Op.between]: [period.from, period.to] }
      },
      attributes: ['appointmentType']
    }),
    Appointment.findAll({
      where: {
        doctorId: user.id,
        status: { [Op.in]: ['in_progress', 'completed'] },
        consultationFee: { [Op.gt]: 0 },
        paymentStatus: { [Op.ne]: 'paid' },
        appointmentDate: { [Op.between]: [period.from, period.to] }
      },
      attributes: ['id', 'consultationFee'],
      include: [{
        model: Payment,
        as: 'payments',
        attributes: ['id'],
        where: { status: { [Op.in]: ['reported', 'approved'] } },
        required: false
      }]
    }),
    currentRate()
  ]);

  // Por cobrar: consultas sin ningún cobro vigente
  const receivable = unpaid.filter((a) => !a.payments || a.payments.length === 0);

  return {
    period,
    ...finance.buildReport({ payments, pendingPayments, receivable, expenses, attended, rate })
  };
}

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense, getReport };
