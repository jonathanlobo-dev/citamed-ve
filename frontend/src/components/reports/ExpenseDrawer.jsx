/**
 * ExpenseDrawer.jsx - CitaMed
 * Panel lateral para registrar o editar un egreso del consultorio (reportes del médico)
 */

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import doctorFinanceService from '../../services/doctorFinanceService';
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_METHOD_LABELS,
  todayCaracas
} from '../../utils/financeLabels';

const emptyForm = () => ({
  description: '',
  category: 'insumos',
  amount: '',
  currency: 'USD',
  method: 'efectivo',
  expenseDate: todayCaracas(),
  notes: ''
});

export default function ExpenseDrawer({ open, onClose, expense, rate, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      expense
        ? {
            description: expense.description || '',
            category: expense.category,
            amount: String(expense.amount),
            currency: expense.currency,
            method: expense.method,
            expenseDate: String(expense.expenseDate).split('T')[0],
            notes: expense.notes || ''
          }
        : emptyForm()
    );
  }, [open, expense]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const amountNumber = Number(String(form.amount).replace(',', '.'));
  const usdPreview =
    form.currency === 'VES' && rate > 0 && amountNumber > 0
      ? `Equivale a $${(amountNumber / rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} a la tasa BCV de hoy`
      : null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.description.trim().length < 3) return setError('Describe el egreso (mínimo 3 caracteres).');
    if (!(amountNumber > 0)) return setError('El monto debe ser mayor que cero.');
    setSaving(true);
    try {
      const payload = { ...form, amount: amountNumber };
      if (expense) await doctorFinanceService.updateExpense(expense.id, payload);
      else await doctorFinanceService.createExpense(payload);
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos guardar el egreso. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const labelClass = 'block text-xs font-semibold text-slate-600 mb-1';

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={expense ? 'Editar egreso' : 'Registrar egreso'}
      subtitle="Lo que gastas para mantener tu consultorio"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="expense-form"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar egreso'}
          </button>
        </div>
      }
    >
      <form id="expense-form" onSubmit={submit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className={labelClass} htmlFor="exp-desc">Descripción</label>
          <input id="exp-desc" className={inputClass} value={form.description} onChange={set('description')} maxLength={150} placeholder="Ej: Alquiler de noviembre" />
        </div>

        <div>
          <label className={labelClass} htmlFor="exp-cat">Categoría</label>
          <select id="exp-cat" className={inputClass} value={form.category} onChange={set('category')}>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className={labelClass} htmlFor="exp-amount">Monto</label>
            <input id="exp-amount" className={inputClass} inputMode="decimal" value={form.amount} onChange={set('amount')} placeholder="0,00" />
          </div>
          <div>
            <label className={labelClass} htmlFor="exp-cur">Moneda</label>
            <select id="exp-cur" className={inputClass} value={form.currency} onChange={set('currency')}>
              <option value="USD">USD</option>
              <option value="VES">Bs.</option>
            </select>
          </div>
        </div>
        {usdPreview && <p className="text-xs text-slate-500 -mt-2">{usdPreview}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="exp-date">Fecha</label>
            <input id="exp-date" type="date" className={inputClass} value={form.expenseDate} max={todayCaracas()} onChange={set('expenseDate')} />
          </div>
          <div>
            <label className={labelClass} htmlFor="exp-method">Pagado con</label>
            <select id="exp-method" className={inputClass} value={form.method} onChange={set('method')}>
              {Object.entries(EXPENSE_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="exp-notes">Nota (opcional)</label>
          <textarea id="exp-notes" className={inputClass} rows={3} maxLength={300} value={form.notes} onChange={set('notes')} />
        </div>
      </form>
    </SideDrawer>
  );
}
