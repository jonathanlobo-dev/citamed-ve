/**
 * CobrosPage.jsx - CitaMed
 * M05 / Semana 8 - Página principal de cobros del médico (/medico/cobros) (B2)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Calendar,
  User,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Banknote,
  Smartphone,
  Building,
  Ban
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import AssistantDoctorBanner from '../../components/assistant/AssistantDoctorBanner';
import { useAuth } from '../../context/AuthContext';
import paymentService from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';
import PaymentSettingsDrawer from '../../components/payments/PaymentSettingsDrawer';
import RecordPaymentDrawer from '../../components/payments/RecordPaymentDrawer';

const METHOD_LABELS = {
  pago_movil: { label: 'Pago Móvil', icon: Smartphone, color: 'text-sky-600 bg-sky-50' },
  transferencia: { label: 'Transferencia', icon: Building, color: 'text-indigo-600 bg-indigo-50' },
  zelle: { label: 'Zelle', icon: DollarSign, color: 'text-purple-600 bg-purple-50' },
  efectivo_usd: { label: 'Efectivo USD', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50' },
  efectivo_ves: { label: 'Efectivo Bs.', icon: Banknote, color: 'text-teal-600 bg-teal-50' }
};

export default function CobrosPage() {
  const { user } = useAuth();
  // Pestaña activa: 'pending' (Por validar), 'receivable' (Por cobrar), 'history' (Historial)
  const [activeTab, setActiveTab] = useState('pending');

  const [canVoidReceipts] = useState(() => {
    if (user?.role !== 'assistant') return true;
    try {
      const perms = JSON.parse(localStorage.getItem('citamed_acting_doctor_permissions') || '{}');
      return perms.canVoidReceipts === true;
    } catch {
      return false;
    }
  });

  // Estados de datos
  const [pendingList, setPendingList] = useState([]);
  const [receivableData, setReceivableData] = useState({ totalCount: 0, totalAmountUsd: 0, data: [] });
  const [historyData, setHistoryData] = useState({ total: 0, totals: {}, data: [], page: 1, totalPages: 1 });

  // Tasa BCV
  const [rateInfo, setRateInfo] = useState(null);

  // Estados de carga y error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filtros de historial
  const [historyFilters, setHistoryFilters] = useState({
    from: '',
    to: '',
    status: '',
    page: 1
  });

  // Paneles laterales
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [recordDrawerOpen, setRecordDrawerOpen] = useState(false);
  const [selectedAppointmentForRecord, setSelectedAppointmentForRecord] = useState(null);

  // Estados de acciones en línea (rechazo y anulación)
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [voidingId, setVoidingId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  // Descarga de PDF
  const [downloadingId, setDownloadingId] = useState(null);

  // Formato seguro de fechas sin hora (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDateSafe = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = String(dateStr).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Formato de fecha con hora en zona horaria Caracas
  const formatDateTimeCaracas = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Cargar Tasa BCV
  const loadRates = useCallback(async () => {
    try {
      const res = await exchangeRateService.getCurrentRates();
      if (res?.success && res.data?.usd) {
        setRateInfo(res.data.usd);
      }
    } catch (err) {
      console.warn('No se pudo cargar la tasa BCV:', err.message);
    }
  }, []);

  // Cargar datos según pestaña
  const loadTabData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'pending') {
        const res = await paymentService.listPending();
        if (res.success) {
          setPendingList(res.data || []);
        }
      } else if (activeTab === 'receivable') {
        const res = await paymentService.listReceivable();
        if (res.success) {
          // El servidor responde { items, totalUsd, count }; la pantalla usa { data, totalAmountUsd, totalCount }
          const r = res.data || {};
          setReceivableData({
            totalCount: r.count || 0,
            totalAmountUsd: r.totalUsd || 0,
            data: (r.items || []).map((item) => ({ ...item, daysAgo: item.daysElapsed }))
          });
        }
      } else if (activeTab === 'history') {
        const res = await paymentService.listHistory({
          from: historyFilters.from || undefined,
          to: historyFilters.to || undefined,
          status: historyFilters.status || undefined,
          page: historyFilters.page
        });
        if (res.success) {
          // El servidor responde { items, total, page, totalPages, totals: { approvedUsd, approvedVes } }
          const h = res.data || {};
          setHistoryData({
            total: h.total || 0,
            page: h.page || 1,
            totalPages: h.totalPages || 1,
            data: h.items || [],
            totals: { totalUsd: h.totals?.approvedUsd || 0, totalVes: h.totals?.approvedVes || 0 }
          });
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de cobros:', err);
      setError('No pudimos cargar la información de cobros. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, historyFilters]);

  // Carga inicial
  // Nombres de los bancos para mostrar "0134 - Banesco" en vez del código solo
  const [bankNames, setBankNames] = useState({});
  useEffect(() => {
    paymentService.getBanks()
      .then((res) => setBankNames(Object.fromEntries((res.data || []).map((b) => [b.code, b.name]))))
      .catch(() => {});
  }, []);
  const bankLabel = (code) => (bankNames[code] ? `${code} - ${bankNames[code]}` : code);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Aprobar pago reportado
  const handleApprove = async (id) => {
    if (!window.confirm('¿Confirmas que recibiste este pago en tu cuenta?')) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await paymentService.approve(id);
      if (res.success) {
        setActionSuccess(`Pago aprobado exitosamente. Se emitió el recibo ${res.data?.receiptNumber || ''}.`);
        loadTabData();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error al aprobar pago:', err);
      setError(err.response?.data?.message || 'No se pudo aprobar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  // Rechazar pago reportado
  const handleConfirmReject = async (id) => {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) {
      alert('Debes indicar un motivo de rechazo (mínimo 5 caracteres).');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await paymentService.reject(id, rejectReason.trim());
      if (res.success) {
        setActionSuccess('Pago rechazado. El paciente ha sido notificado.');
        setRejectingId(null);
        setRejectReason('');
        loadTabData();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error al rechazar pago:', err);
      setError(err.response?.data?.message || 'No se pudo rechazar el pago.');
    } finally {
      setActionLoading(false);
    }
  };

  // Anular pago aprobado
  const handleConfirmVoid = async (id) => {
    if (!voidReason.trim() || voidReason.trim().length < 5) {
      alert('Debes indicar el motivo de anulación del recibo (mínimo 5 caracteres).');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      const res = await paymentService.voidPayment(id, voidReason.trim());
      if (res.success) {
        setActionSuccess('Recibo anulado exitosamente. La consulta volvió a estado por cobrar.');
        setVoidingId(null);
        setVoidReason('');
        loadTabData();
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      console.error('Error al anular recibo:', err);
      setError(err.response?.data?.message || 'No se pudo anular el cobro.');
    } finally {
      setActionLoading(false);
    }
  };

  // Descarga de recibo en PDF
  const handleDownloadReceipt = async (payment) => {
    setDownloadingId(payment.id);
    try {
      const blob = await paymentService.downloadReceipt(payment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${payment.receiptNumber || payment.verificationCode || payment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar recibo:', err);
      alert('No se pudo descargar el recibo en PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Abrir panel lateral de registrar cobro para una cita
  const handleOpenRecordForAppointment = (appointment) => {
    setSelectedAppointmentForRecord(appointment);
    setRecordDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <Navbar />
      <AssistantDoctorBanner />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ENCABEZADO */}
        <header className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                  Cobros y Recibos
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Gestiona los pagos de tus consultas, valida transferencias y emite recibos oficiales en CitaMed.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            {/* Tasa BCV oficial */}
            {rateInfo && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-slate-500 font-medium">Tasa oficial BCV:</span>{' '}
                  <strong className="text-slate-900 font-bold">
                    Bs. {Number(rateInfo.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                  <span className="text-slate-400 text-[11px] ml-1">/ USD</span>
                </div>
              </div>
            )}

            {/* Botón Mis Métodos de Cobro (solo médico) */}
            {user?.role !== 'assistant' && (
              <button
                type="button"
                onClick={() => setSettingsDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span>Mis métodos de cobro</span>
              </button>
            )}
          </div>
        </header>

        {/* MENSAJES DE ESTADO */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Aviso</p>
              <p className="mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-700 font-semibold underline ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {actionSuccess && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium flex-1">{actionSuccess}</p>
          </div>
        )}

        {/* PESTAÑAS */}
        <div className="flex items-center border-b border-slate-200 mb-6 gap-2 sm:gap-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-2 font-semibold text-sm transition relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Por validar</span>
            {pendingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receivable')}
            className={`pb-3 px-2 font-semibold text-sm transition relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'receivable'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Por cobrar</span>
            {receivableData.totalCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800">
                {receivableData.totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 font-semibold text-sm transition relative whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Historial de cobros</span>
          </button>
        </div>

        {/* CONTENIDO DE PESTAÑAS */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">Cargando información de cobros...</p>
          </div>
        ) : (
          <>
            {/* PESTAÑA 1: POR VALIDAR */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingList.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-800">
                      No tienes pagos por validar
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Cuando un paciente reporte su pago por Pago Móvil, Transferencia o Zelle,
                      aparecerá aquí para tu confirmación y emisión del recibo.
                    </p>
                  </div>
                ) : (
                  pendingList.map((payment) => {
                    const methodCfg = METHOD_LABELS[payment.method] || {
                      label: payment.method,
                      icon: DollarSign,
                      color: 'text-slate-600 bg-slate-50'
                    };
                    const MethodIcon = methodCfg.icon;
                    const patient = payment.patient || {};
                    const patName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Paciente';

                    return (
                      <div
                        key={payment.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${methodCfg.color}`}>
                              <MethodIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base">
                                  {patName}
                                </h3>
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold">
                                  Por validar
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Consulta: {formatDateSafe(payment.appointment?.appointmentDate)}
                                {payment.reportedAt && ` • Reportado: ${formatDateTimeCaracas(payment.reportedAt)}`}
                              </p>
                            </div>
                          </div>

                          {/* Montos */}
                          <div className="text-left sm:text-right">
                            <div className="text-xl font-black text-slate-900">
                              ${Number(payment.amountUsd).toFixed(2)}{' '}
                              <span className="text-xs font-medium text-slate-500">USD</span>
                            </div>
                            {payment.amountVes && (
                              <div className="text-xs font-bold text-primary">
                                Bs. {Number(payment.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-slate-400 font-normal ml-1">
                                  (Tasa: {Number(payment.exchangeRate).toFixed(2)})
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Detalles del pago */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                          <div>
                            <span className="text-slate-500 block">Método:</span>
                            <strong className="text-slate-900">{methodCfg.label}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Referencia:</span>
                            <strong className="font-mono text-slate-900">{payment.reference || 'N/A'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Banco pagador:</span>
                            <span className="text-slate-900">{payment.payerBank ? bankLabel(payment.payerBank) : 'No especificado'}</span>
                          </div>
                          {payment.payerNote && (
                            <div className="col-span-1 sm:col-span-3 pt-1 border-t border-slate-200 text-slate-600 italic">
                              Nota del paciente: "{payment.payerNote}"
                            </div>
                          )}
                        </div>

                        {/* Panel de rechazo en línea si está activo */}
                        {rejectingId === payment.id ? (
                          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                            <label className="block text-xs font-bold text-red-900">
                              Motivo del rechazo (se mostrará al paciente para que corrija su reporte):
                            </label>
                            <textarea
                              rows={2}
                              maxLength={300}
                              placeholder="Ej. No encontramos la referencia en la cuenta bancaria. Verifica el monto y el banco."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="w-full text-xs p-2.5 bg-white border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                disabled={actionLoading}
                                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleConfirmReject(payment.id)}
                                disabled={actionLoading || rejectReason.trim().length < 5}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                              >
                                {actionLoading ? 'Rechazando...' : 'Confirmar rechazo'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Botones de acción */
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingId(payment.id);
                                setRejectReason('');
                              }}
                              disabled={actionLoading}
                              className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApprove(payment.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprobar y emitir recibo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* PESTAÑA 2: POR COBRAR */}
            {activeTab === 'receivable' && (
              <div className="space-y-4">
                {/* Resumen de cuentas por cobrar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Consultas pendientes por cobrar
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {receivableData.totalCount} {receivableData.totalCount === 1 ? 'consulta' : 'consultas'}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total adeudado
                    </span>
                    <div className="text-2xl font-black text-primary">
                      ${Number(receivableData.totalAmountUsd || 0).toFixed(2)}{' '}
                      <span className="text-xs font-semibold text-slate-500">USD</span>
                    </div>
                  </div>
                </div>

                {receivableData.data?.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-800">
                      No tienes consultas pendientes por cobrar
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Todas tus consultas atendidas tienen su cobro validado o registrado.
                    </p>
                  </div>
                ) : (
                  receivableData.data.map((apt) => {
                    const patName = apt.patient
                      ? `${apt.patient.firstName || ''} ${apt.patient.lastName || ''}`.trim()
                      : 'Paciente';
                    const fee = Number(apt.consultationFee || 0);
                    const feeVes = rateInfo?.rate ? (fee * Number(rateInfo.rate)).toFixed(2) : null;

                    return (
                      <div
                        key={apt.id}
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-base">
                              {patName}
                            </h4>
                            {apt.daysAgo !== undefined && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                                {apt.daysAgo === 0 ? 'Hoy' : `Hace ${apt.daysAgo} días`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Fecha de consulta: {formatDateSafe(apt.appointmentDate)}
                            {apt.appointmentNumber && ` • Cita #${apt.appointmentNumber}`}
                            {apt.type && ` • Modalidad: ${apt.type}`}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <div className="text-lg font-black text-slate-900">
                              ${fee.toFixed(2)}{' '}
                              <span className="text-xs font-medium text-slate-500">USD</span>
                            </div>
                            {feeVes && (
                              <div className="text-xs text-slate-500">
                                ~ Bs. {Number(feeVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenRecordForAppointment(apt)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-xs shrink-0"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Registrar cobro</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* PESTAÑA 3: HISTORIAL DE COBROS */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Barra de filtros */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Desde:</span>
                      <input
                        type="date"
                        value={historyFilters.from}
                        onChange={(e) =>
                          setHistoryFilters((prev) => ({ ...prev, from: e.target.value, page: 1 }))
                        }
                        className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Hasta:</span>
                      <input
                        type="date"
                        value={historyFilters.to}
                        onChange={(e) =>
                          setHistoryFilters((prev) => ({ ...prev, to: e.target.value, page: 1 }))
                        }
                        className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 font-medium">Estado:</span>
                      <select
                        value={historyFilters.status}
                        onChange={(e) =>
                          setHistoryFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                        }
                        className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs"
                      >
                        <option value="">Todos los estados</option>
                        <option value="approved">Aprobados</option>
                        <option value="rejected">Rechazados</option>
                        <option value="voided">Anulados</option>
                      </select>
                    </div>
                  </div>

                  {(historyFilters.from || historyFilters.to || historyFilters.status) && (
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryFilters({ from: '', to: '', status: '', page: 1 })
                      }
                      className="text-xs text-primary font-semibold hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>

                {/* Resumen de totales cobrados en el rango */}
                {historyData.totals && (
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Total cobrado en el rango
                      </span>
                      <div className="text-2xl font-black mt-0.5">
                        ${Number(historyData.totals.totalUsd || 0).toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-300">USD</span>
                      </div>
                    </div>

                    {historyData.totals.totalVes > 0 && (
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Equivalente total en Bolívares
                        </span>
                        <div className="text-xl font-bold text-emerald-400 mt-0.5">
                          Bs. {Number(historyData.totals.totalVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Lista de cobros históricos */}
                {historyData.data?.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-800">
                      No se encontraron cobros en el historial
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      No hay registros que coincidan con los filtros de fecha y estado seleccionados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyData.data.map((payment) => {
                      const methodCfg = METHOD_LABELS[payment.method] || {
                        label: payment.method,
                        icon: DollarSign,
                        color: 'text-slate-600 bg-slate-50'
                      };
                      const patName = payment.patient
                        ? `${payment.patient.firstName || ''} ${payment.patient.lastName || ''}`.trim()
                        : 'Paciente';

                      const isApproved = payment.status === 'approved';
                      const isRejected = payment.status === 'rejected';
                      const isVoided = payment.status === 'voided';

                      return (
                        <div
                          key={payment.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                                  {patName}
                                </h4>
                                {payment.status === 'reported' && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                    Por validar
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Aprobado
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                    Rechazado
                                  </span>
                                )}
                                {isVoided && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                    Anulado
                                  </span>
                                )}
                                {payment.receiptNumber && (
                                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    {payment.receiptNumber}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Consulta: {formatDateSafe(payment.appointment?.appointmentDate)}
                                {payment.reviewedAt && ` • Procesado: ${formatDateTimeCaracas(payment.reviewedAt)}`}
                              </p>
                            </div>

                            {/* Monto */}
                            <div className="text-left sm:text-right">
                              <div className="text-base sm:text-lg font-black text-slate-900">
                                ${Number(payment.amountUsd).toFixed(2)}{' '}
                                <span className="text-xs font-medium text-slate-500">USD</span>
                              </div>
                              {payment.amountVes && (
                                <div className="text-xs font-semibold text-slate-600">
                                  Bs. {Number(payment.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                            <div>
                              Método: <strong className="text-slate-800">{methodCfg.label}</strong>
                            </div>
                            {payment.reference && (
                              <div>
                                Ref: <strong className="font-mono text-slate-800">{payment.reference}</strong>
                              </div>
                            )}
                            {payment.payerBank && (
                              <div>
                                Banco: <span className="text-slate-800">{bankLabel(payment.payerBank)}</span>
                              </div>
                            )}
                          </div>

                          {payment.reviewNote && (
                            <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 italic">
                              Motivo: "{payment.reviewNote}"
                            </div>
                          )}

                          {/* Panel en línea de anulación */}
                          {voidingId === payment.id ? (
                            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mt-2">
                              <label className="block text-xs font-bold text-amber-900">
                                Motivo de anulación del recibo (mínimo 5 caracteres):
                              </label>
                              <textarea
                                rows={2}
                                maxLength={300}
                                placeholder="Ej. Error en la conciliación del monto o duplicado."
                                value={voidReason}
                                onChange={(e) => setVoidReason(e.target.value)}
                                className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVoidingId(null);
                                    setVoidReason('');
                                  }}
                                  disabled={actionLoading}
                                  className="px-3 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmVoid(payment.id)}
                                  disabled={actionLoading || voidReason.trim().length < 5}
                                  className="px-3 py-1 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                                >
                                  {actionLoading ? 'Anulando...' : 'Confirmar anulación'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Acciones de la fila */
                            (isApproved || isVoided) && (
                              <div className="flex items-center justify-end gap-3 pt-2">
                                {isApproved && canVoidReceipts && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setVoidingId(payment.id);
                                      setVoidReason('');
                                    }}
                                    disabled={actionLoading}
                                    className="text-xs text-slate-500 hover:text-red-600 font-semibold transition"
                                  >
                                    Anular cobro
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadReceipt(payment)}
                                  disabled={downloadingId === payment.id}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>
                                    {downloadingId === payment.id ? 'Descargando...' : 'Descargar recibo'}
                                  </span>
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}

                    {/* Paginación */}
                    {historyData.totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setHistoryFilters((prev) => ({
                              ...prev,
                              page: Math.max(1, prev.page - 1)
                            }))
                          }
                          disabled={historyFilters.page <= 1}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white disabled:opacity-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </button>
                        <span className="text-xs text-slate-500 font-medium">
                          Página {historyFilters.page} de {historyData.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setHistoryFilters((prev) => ({
                              ...prev,
                              page: Math.min(historyData.totalPages, prev.page + 1)
                            }))
                          }
                          disabled={historyFilters.page >= historyData.totalPages}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white disabled:opacity-50"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* PANEL LATERAL: MIS MÉTODOS DE COBRO */}
      <PaymentSettingsDrawer
        open={settingsDrawerOpen}
        onClose={() => setSettingsDrawerOpen(false)}
        onSaved={() => {
          loadTabData();
        }}
      />

      {/* PANEL LATERAL: REGISTRAR COBRO */}
      <RecordPaymentDrawer
        open={recordDrawerOpen}
        onClose={() => {
          setRecordDrawerOpen(false);
          setSelectedAppointmentForRecord(null);
        }}
        appointment={selectedAppointmentForRecord}
        onRecorded={() => {
          loadTabData();
        }}
      />
    </div>
  );
}
