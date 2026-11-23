/**
 * doctorFinanceService.js - CitaMed
 * Reportes del médico: reporte de ingresos, egresos y utilidad, y registro de egresos
 */

import api from './api';

const doctorFinanceService = {
  /** params: { month: 'AAAA-MM' } o { from, to } */
  getReport: (params) =>
    api.get('/doctor-finance/report', { params }).then((res) => res.data),

  listExpenses: (params) =>
    api.get('/doctor-finance/expenses', { params }).then((res) => res.data),

  createExpense: (expense) =>
    api.post('/doctor-finance/expenses', expense).then((res) => res.data),

  updateExpense: (id, expense) =>
    api.put(`/doctor-finance/expenses/${id}`, expense).then((res) => res.data),

  deleteExpense: (id) =>
    api.delete(`/doctor-finance/expenses/${id}`).then((res) => res.data)
};

export default doctorFinanceService;
