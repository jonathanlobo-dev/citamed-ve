/**
 * ReportesPage.jsx - CitaMed
 * Reportes del médico (/medico/reportes): ingresos cobrados, por cobrar, egresos por categoría,
 * utilidad y consultas por tipo. Montos en USD con su equivalente en Bs a la tasa guardada.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Stethoscope
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import ExpenseDrawer from '../../components/reports/ExpenseDrawer';
import doctorFinanceService from '../../services/doctorFinanceService';
import {
  currentMonthCaracas,
  shiftMonth,
  monthLabel,
  formatUsd,
  formatVes,
  periodParams,
  isRangeReady,
  expenseCategoryLabel,
  expenseMethodLabel,
  incomeMethodLabel,
  consultationTypeLabel
} from '../../utils/financeLabels';

const dmy = (ymd) => {
  const [y, m, d] = String(ymd).split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

function KpiCard({ icon: Icon, title, usd, ves, tone, hint }) {
  const tones = {
    green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    red: 'text-rose-700 bg-rose-50 border-rose-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    primary: 'text-primary bg-primary/10 border-primary/20'
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-8 h-8 rounded-lg border flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold text-slate-500">{title}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 leading-tight">{formatUsd(usd)}</p>
      {ves !== null && ves !== undefined && <p className="text-xs text-slate-500 mt-0.5">{formatVes(ves)}</p>}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

function BarList({ rows, emptyText }) {
  if (!rows.length) return <p className="text-sm text-slate-500 py-2">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex justify-between gap-3 text-sm mb-1">
            <span className="text-slate-700 font-medium">{r.label}</span>
            <span className="text-slate-900 font-bold shrink-0">{r.text}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className={`h-full rounded-full ${r.color || 'bg-primary'}`} style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ReportesPage() {
  const thisMonth = currentMonthCaracas();
  const [mode, setMode] = useState('month');
  const [month, setMonth] = useState(thisMonth);
  const [range, setRange] = useState({ from: '', to: '' });

  const [report, setReport] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const ready = mode === 'month' || isRangeReady(range.from, range.to);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError('');
    try {
      const params = periodParams({ mode, month, from: range.from, to: range.to });
      const [rep, exp] = await Promise.all([
        doctorFinanceService.getReport(params),
        doctorFinanceService.listExpenses(params)
      ]);
      setReport(rep.data);
      setExpenses(exp.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'No pudimos cargar el reporte. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [ready, mode, month, range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => { setEditing(null); setDrawerOpen(true); };
  const openEdit = (exp) => { setEditing(exp); setDrawerOpen(true); };
  const handleSaved = () => { setDrawerOpen(false); setEditing(null); load(); };

  const handleDelete = async (id) => {
    try {
      await doctorFinanceService.deleteExpense(id);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setConfirmDeleteId(null);
      setError(err.response?.data?.message || 'No pudimos eliminar el egreso.');
    }
  };

  const profitNegative = report && report.profit.totalUsd < 0;
  const periodText = mode === 'month' ? monthLabel(month) : ready ? `${dmy(range.from)} al ${dmy(range.to)}` : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">Reportes</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Cuánto cobras, cuánto gastas y cuánto te queda. Montos en dólares con su equivalente en Bs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:opacity-90 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Registrar egreso
          </button>
        </header>

        {/* PERÍODO */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 self-start" role="tablist" aria-label="Tipo de período">
            {[['month', 'Por mes'], ['range', 'Rango de fechas']].map(([key, text]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => setMode(key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition ${mode === key ? 'bg-white shadow-xs text-primary' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {text}
              </button>
            ))}
          </div>

          {mode === 'month' ? (
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Mes anterior" onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-[10rem] text-center font-bold capitalize">{monthLabel(month)}</span>
              <button type="button" aria-label="Mes siguiente" disabled={month >= thisMonth} onClick={() => setMonth(shiftMonth(month, 1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
              {month !== thisMonth && (
                <button type="button" onClick={() => setMonth(thisMonth)} className="text-xs font-semibold text-primary underline ml-1">Este mes</button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs font-semibold text-slate-500" htmlFor="rep-from">Desde</label>
              <input id="rep-from" type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-300 text-sm" />
              <label className="text-xs font-semibold text-slate-500" htmlFor="rep-to">Hasta</label>
              <input id="rep-to" type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="px-3 py-2 rounded-xl border border-slate-300 text-sm" />
              {!ready && (range.from || range.to) && <span className="text-xs text-amber-700">Revisa que la fecha final no sea anterior a la inicial.</span>}
            </div>
          )}
        </section>

        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm" role="alert">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="flex-1">{error}</p>
          </div>
        )}

        {!ready && <p className="text-sm text-slate-500">Elige las dos fechas para ver el reporte.</p>}
        {ready && loading && !report && (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        )}

        {ready && report && (
          <div className={loading ? 'opacity-60 transition' : 'transition'}>
            {!report.rate && (
              <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                No hay tasa BCV guardada en este momento, por eso no se muestran los equivalentes en Bs.
              </p>
            )}

            <p className="text-sm text-slate-500 mb-3">
              Período: <strong className="text-slate-800">{periodText}</strong>
              {report.rate && <> · Tasa BCV guardada: <strong className="text-slate-800">{formatVes(report.rate)}</strong></>}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <KpiCard icon={TrendingUp} tone="green" title="Ingresos cobrados" usd={report.income.totalUsd} ves={report.income.totalVes} hint={`${report.income.count} cobro(s) aprobado(s)`} />
              <KpiCard icon={TrendingDown} tone="red" title="Egresos" usd={report.expenses.totalUsd} ves={report.expenses.totalVes} hint={`${report.expenses.count} egreso(s)`} />
              <KpiCard
                icon={Wallet}
                tone={profitNegative ? 'red' : 'primary'}
                title="Utilidad"
                usd={report.profit.totalUsd}
                ves={report.profit.totalVes}
                hint={report.profit.marginPercent === null ? 'Sin ingresos en el período' : `Margen de ${String(report.profit.marginPercent).replace('.', ',')}%`}
              />
              <KpiCard
                icon={Clock}
                tone="amber"
                title="Por cobrar"
                usd={report.receivable.totalUsd}
                ves={report.receivable.totalVes}
                hint={`${report.receivable.count} consulta(s)${report.pendingValidation.count ? ` · ${report.pendingValidation.count} pago(s) por validar` : ''}`}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h2 className="font-black text-slate-900 mb-4">Egresos por categoría</h2>
                <BarList
                  emptyText="No registraste egresos en este período."
                  rows={report.expenses.byCategory.map((c) => ({
                    key: c.category,
                    label: expenseCategoryLabel(c.category),
                    value: c.totalUsd,
                    color: 'bg-rose-400',
                    text: `${formatUsd(c.totalUsd)} · ${String(c.percent).replace('.', ',')}%`
                  }))}
                />
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h2 className="font-black text-slate-900 mb-4">Ingresos por método de cobro</h2>
                <BarList
                  emptyText="No hay cobros aprobados en este período."
                  rows={report.income.byMethod.map((m) => ({
                    key: m.method,
                    label: incomeMethodLabel(m.method),
                    value: m.totalUsd,
                    color: 'bg-emerald-400',
                    text: formatUsd(m.totalUsd)
                  }))}
                />
              </section>

              <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h2 className="font-black text-slate-900">Consultas atendidas por tipo</h2>
                  <span className="ml-auto text-sm font-bold text-slate-700">{report.consultations.total} en total</span>
                </div>
                <BarList
                  emptyText="No atendiste consultas en este período."
                  rows={report.consultations.byType.map((t) => ({
                    key: t.type,
                    label: consultationTypeLabel(t.type),
                    value: t.count,
                    text: String(t.count)
                  }))}
                />
              </section>
            </div>

            <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h2 className="font-black text-slate-900">Egresos del período</h2>
                <button type="button" onClick={openNew} className="text-sm font-bold text-primary hover:underline">Registrar egreso</button>
              </div>
              {expenses.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">Todavía no registras egresos en este período. Anótalos para ver tu utilidad real.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <li key={exp.id} className="p-4 sm:px-5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{exp.description}</p>
                        <p className="text-xs text-slate-500">
                          {dmy(exp.expenseDate)} · {expenseCategoryLabel(exp.category)} · {expenseMethodLabel(exp.method)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-slate-900">{formatUsd(exp.amountUsd)}</p>
                        {exp.currency === 'VES' && <p className="text-xs text-slate-500">{formatVes(exp.amount)}</p>}
                      </div>
                      {confirmDeleteId === exp.id ? (
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          <button type="button" onClick={() => handleDelete(exp.id)} className="font-bold text-rose-700 underline">Eliminar</button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="text-slate-500 underline">No</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" aria-label="Editar egreso" onClick={() => openEdit(exp)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><Pencil className="w-4 h-4" /></button>
                          <button type="button" aria-label="Eliminar egreso" onClick={() => setConfirmDeleteId(exp.id)} className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>

      <ExpenseDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditing(null); }}
        expense={editing}
        rate={report?.rate}
        onSaved={handleSaved}
      />
    </div>
  );
}
