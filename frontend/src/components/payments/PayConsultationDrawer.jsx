/**
 * PayConsultationDrawer.jsx - CitaMed
 * M05 / Semana 8 - Panel lateral para pagar y reportar el pago de la consulta (C2 y C3)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Banknote,
  Smartphone,
  Building,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Info,
  Calendar,
  User,
  ArrowRight
} from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import paymentService from '../../services/paymentService';

// Formato de fecha con hora en zona horaria Caracas (para marcas de tiempo)
function formatDateTimeCaracas(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
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
    return String(isoString);
  }
}

// Formato de fecha sin hora (YYYY-MM-DD) sin pasar por new Date()
function formatDateOnly(dateStr) {
  if (!dateStr) return '';
  try {
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return String(dateStr);
  }
}

export default function PayConsultationDrawer({
  open,
  onClose,
  appointment,
  onPaymentReported
}) {
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Llave de idempotencia única por apertura del panel (no por cada clic)
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Estados de interacción
  const [copiedKey, setCopiedKey] = useState(null);
  const [isReReporting, setIsReReporting] = useState(false);

  // Formulario "Ya pagué"
  const [selectedMethod, setSelectedMethod] = useState('');
  const [reference, setReference] = useState('');
  const [payerBank, setPayerBank] = useState('');
  const [payerNote, setPayerNote] = useState('');
  const [formError, setFormError] = useState('');

  const appointmentId = appointment?.id;

  // Cargar resumen de cobro y bancos al abrir el panel
  const loadSummary = useCallback(async (aptId) => {
    if (!aptId) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, banksRes] = await Promise.all([
        paymentService.getAppointmentSummary(aptId),
        paymentService.getBanks().catch(() => ({ data: [] }))
      ]);

      const summary = summaryRes.data || summaryRes;
      setSummaryData(summary);
      setBanks(banksRes.data || []);

      // Seleccionar el primer método habilitado por defecto
      const settings = summary?.paymentSettings || {};
      if (settings.pagoMovil?.enabled) {
        setSelectedMethod('pago_movil');
      } else if (settings.transferencia?.enabled) {
        setSelectedMethod('transferencia');
      } else if (settings.zelle?.enabled) {
        setSelectedMethod('zelle');
      } else if (settings.efectivoUsd?.enabled) {
        setSelectedMethod('efectivo_usd');
      } else if (settings.efectivoVes?.enabled) {
        setSelectedMethod('efectivo_ves');
      } else {
        setSelectedMethod('');
      }
    } catch (err) {
      console.error('Error al cargar datos de cobro de la consulta:', err);
      setError(
        err.response?.data?.message ||
        'No pudimos cargar la información de pago. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Al abrir el panel: generar UUID de idempotencia y cargar datos
  useEffect(() => {
    if (open && appointmentId) {
      setIdempotencyKey(crypto.randomUUID());
      setIsReReporting(false);
      setReference('');
      setPayerBank('');
      setPayerNote('');
      setFormError('');
      loadSummary(appointmentId);
    } else if (!open) {
      setSummaryData(null);
      setError(null);
      setFormError('');
    }
  }, [open, appointmentId, loadSummary]);

  // Copiar al portapapeles con confirmación visual
  const handleCopy = (text, key) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    }
  };

  // Obtener nombre del banco según su código SUDEBAN
  const getBankName = (code) => {
    if (!code) return '';
    const b = banks.find((item) => item.code === code);
    return b ? `${b.code} - ${b.name}` : `Banco (${code})`;
  };

  // Datos financieros calculados por el servidor
  const pricing = summaryData?.pricing || {};
  const settings = summaryData?.paymentSettings || {};
  const payments = summaryData?.payments || [];

  // Determinar cobro activo: primero aprobado, luego reportado, luego rechazado
  const activePayment =
    payments.find((p) => p.status === 'approved') ||
    payments.find((p) => p.status === 'reported') ||
    payments.find((p) => p.status === 'rejected') ||
    payments[0] ||
    null;

  const amountUsd = Number(pricing.amountUsd ?? appointment?.consultationFee ?? 0);
  const exchangeRate = pricing.exchangeRate ? Number(pricing.exchangeRate) : null;
  const amountVes = pricing.amountVes ? Number(pricing.amountVes) : null;
  const isStale = Boolean(pricing.exchangeRateStale);

  // ¿El médico tiene al menos un método configurado? (C3)
  const hasDoctorMethods = Boolean(
    settings.pagoMovil?.enabled ||
    settings.transferencia?.enabled ||
    settings.zelle?.enabled ||
    settings.efectivoUsd?.enabled ||
    settings.efectivoVes?.enabled
  );

  // Descarga oficial del recibo en PDF
  const handleDownloadReceipt = async () => {
    if (!activePayment?.id) return;
    setDownloadingPdf(true);
    try {
      const blob = await paymentService.downloadReceipt(activePayment.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `recibo-CitaMed-${activePayment.receiptNumber || activePayment.verificationCode || activePayment.id}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar el recibo:', err);
      alert('No se pudo descargar el recibo. Por favor intenta de nuevo.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Envío del formulario "Ya pagué"
  const handleSubmitReport = async (e) => {
    e?.preventDefault();
    if (submitting) return; // Prevención de doble clic

    setFormError('');

    if (!selectedMethod) {
      setFormError('Por favor selecciona el método con el que pagaste.');
      return;
    }

    const isCash = selectedMethod === 'efectivo_usd' || selectedMethod === 'efectivo_ves';
    if (!isCash && !reference.trim()) {
      setFormError('El número de referencia es obligatorio para este método de pago.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appointmentId,
        method: selectedMethod,
        reference: isCash ? (reference.trim() || undefined) : reference.trim(),
        payerBank: payerBank ? payerBank.trim() : undefined,
        payerNote: payerNote.trim() ? payerNote.trim() : undefined,
        idempotencyKey
      };

      const res = await paymentService.reportPayment(payload);
      setIsReReporting(false);

      // Recargar el resumen del cobro para mostrar el estado "En revisión"
      await loadSummary(appointmentId);

      if (onPaymentReported) {
        onPaymentReported(res.data || res);
      }
    } catch (err) {
      console.error('Error al reportar pago:', err);
      setFormError(
        err.response?.data?.message ||
        'No pudimos registrar tu reporte de pago. Verifica la referencia e intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reiniciar para reportar de nuevo en caso de rechazo
  const handleStartReReport = () => {
    setIdempotencyKey(crypto.randomUUID());
    setIsReReporting(true);
    setReference('');
    setFormError('');
  };

  // Título dinámico del panel lateral
  let drawerTitle = 'Pagar consulta';
  if (activePayment?.status === 'approved' || appointment?.paymentStatus === 'paid') {
    drawerTitle = 'Recibo de consulta';
  } else if (activePayment?.status === 'reported') {
    drawerTitle = 'Estado de tu pago';
  } else if (activePayment?.status === 'rejected' && !isReReporting) {
    drawerTitle = 'Pago no confirmado';
  }

  // Determinar si se muestra el formulario "Ya pagué"
  const showReportForm =
    hasDoctorMethods &&
    (!activePayment ||
      activePayment.status === 'voided' ||
      (activePayment.status === 'rejected' && isReReporting));

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition"
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-6 text-gray-800 pb-4">
        {/* Aviso fijo obligatorio: CitaMed no procesa pagos */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-900 leading-relaxed font-medium">
            CitaMed no procesa pagos. Pagas directamente al médico y él confirma la recepción.
          </p>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Cargando datos de la consulta...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">Ocurrió un error</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => loadSummary(appointmentId)}
                className="mt-2 text-xs font-semibold underline hover:text-red-900"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Tarjeta de Resumen de Tarifa y Tasa Oficial */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-indigo-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100/70">
                <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                  Tarifa de consulta
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ${amountUsd.toFixed(2)} <span className="text-xs font-normal text-gray-500">USD</span>
                </span>
              </div>

              {/* Tasa del día BCV y monto en Bs. */}
              {exchangeRate && (
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Tasa oficial BCV:</span>
                    <span className="font-semibold text-gray-800 text-xs">
                      Bs. {exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} / USD
                    </span>
                  </div>

                  {pricing.exchangeRateDate && (
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Actualizada:</span>
                      <span>{formatDateTimeCaracas(pricing.exchangeRateDate)}</span>
                    </div>
                  )}

                  {amountVes !== null && (
                    <div className="pt-2 border-t border-indigo-100/70 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Equivalente en bolívares:</span>
                      <span className="text-base font-bold text-primary">
                        Bs. {amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Advertencia de tasa stale */}
              {isStale && (
                <div className="mt-3 bg-amber-50 border border-amber-300 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 font-medium leading-tight">
                    La tasa puede estar desactualizada; confirma el monto con el consultorio.
                  </p>
                </div>
              )}
            </div>

            {/* ESTADO 1: PAGADO / APROBADO */}
            {(activePayment?.status === 'approved' || appointment?.paymentStatus === 'paid') && (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Pago confirmado y recibido</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Tu médico confirmó la recepción de este pago. El recibo oficial cuenta con código de verificación verificable públicamente.
                </p>

                {activePayment?.receiptNumber && (
                  <div className="bg-white/80 rounded-lg p-3 border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Número de recibo:</span>
                      <span className="font-mono font-semibold text-gray-800">{activePayment.receiptNumber}</span>
                    </div>
                    {activePayment.verificationCode && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Código de verificación:</span>
                        <span className="font-mono font-semibold text-primary">{activePayment.verificationCode}</span>
                      </div>
                    )}
                    {activePayment.reviewedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fecha de confirmación:</span>
                        <span className="text-gray-700">{formatDateTimeCaracas(activePayment.reviewedAt)}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  disabled={downloadingPdf}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition text-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {downloadingPdf ? 'Generando recibo...' : 'Descargar recibo oficial'}
                </button>
              </div>
            )}

            {/* ESTADO 2: EN REVISIÓN */}
            {activePayment?.status === 'reported' && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-base">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Pago en revisión</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Reportaste tu pago exitosamente. Tu médico está validando la recepción en su cuenta y confirmará la consulta a la brevedad.
                </p>

                <div className="bg-white/90 rounded-xl p-3 border border-amber-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reportado:</span>
                    <span className="font-medium text-gray-800">
                      {formatDateTimeCaracas(activePayment.reportedAt || activePayment.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Método reportado:</span>
                    <span className="font-semibold text-gray-800 capitalize">
                      {activePayment.method?.replace('_', ' ')}
                    </span>
                  </div>
                  {activePayment.reference && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Referencia:</span>
                      <span className="font-mono font-medium text-gray-800">{activePayment.reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-amber-100">
                    <span className="text-gray-500">Monto:</span>
                    <span className="font-bold text-gray-900">
                      ${Number(activePayment.amountUsd || amountUsd).toFixed(2)} USD
                      {activePayment.amountVes && ` (Bs. ${Number(activePayment.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2 })})`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ESTADO 3: RECHAZADO (con opción a reportar de nuevo) */}
            {activePayment?.status === 'rejected' && !isReReporting && (
              <div className="bg-red-50 border border-red-300 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-semibold text-base">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>Pago no confirmado</span>
                </div>
                <p className="text-xs text-red-800 leading-relaxed">
                  El médico revisó el reporte pero no pudo verificar la recepción de los fondos con los datos provistos.
                </p>

                {activePayment.reviewNote && (
                  <div className="bg-white/90 border border-red-200 rounded-xl p-3">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-red-600 block mb-1">
                      Motivo indicado por el médico:
                    </span>
                    <p className="text-xs text-gray-800 font-medium italic">
                      "{activePayment.reviewNote}"
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleStartReReport}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-2.5 px-4 rounded-xl shadow-sm transition text-sm"
                >
                  <ArrowRight className="w-4 h-4" />
                  Reportar pago de nuevo
                </button>
              </div>
            )}

            {/* CASO C3: El médico no tiene métodos configurados */}
            {!hasDoctorMethods && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 text-center space-y-2">
                <AlertCircle className="w-7 h-7 text-amber-600 mx-auto" />
                <h4 className="text-sm font-semibold text-amber-900">
                  Métodos de pago no configurados
                </h4>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Este médico aún no configuró sus datos de pago. Coordina el pago con el consultorio.
                </p>
              </div>
            )}

            {/* LISTA DE MÉTODOS HABILITADOS DEL MÉDICO (C2) */}
            {hasDoctorMethods && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Datos de pago del médico
                </h3>

                {/* Pago Móvil */}
                {settings.pagoMovil?.enabled && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                      <Smartphone className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Pago Móvil</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {settings.pagoMovil.bankCode && (
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Banco:</span>
                          <span className="font-medium text-gray-800">{getBankName(settings.pagoMovil.bankCode)}</span>
                        </div>
                      )}

                      {settings.pagoMovil.phone && (
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Teléfono:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-gray-900">{settings.pagoMovil.phone}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(settings.pagoMovil.phone, 'pm-phone')}
                              className="text-primary hover:text-primary-dark p-1 rounded"
                              title="Copiar teléfono"
                            >
                              {copiedKey === 'pm-phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {settings.pagoMovil.idNumber && (
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Cédula / RIF:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-gray-900">
                              {settings.pagoMovil.idType || 'V'}-{settings.pagoMovil.idNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`${settings.pagoMovil.idType || 'V'}${settings.pagoMovil.idNumber}`, 'pm-id')}
                              className="text-primary hover:text-primary-dark p-1 rounded"
                              title="Copiar cédula"
                            >
                              {copiedKey === 'pm-id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transferencia Bancaria */}
                {settings.transferencia?.enabled && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                      <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Transferencia Bancaria</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {settings.transferencia.bankCode && (
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Banco:</span>
                          <span className="font-medium text-gray-800">{getBankName(settings.transferencia.bankCode)}</span>
                        </div>
                      )}

                      {settings.transferencia.accountNumber && (
                        <div className="flex flex-col gap-1 bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Número de cuenta:</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-medium text-gray-900 break-all select-all">
                              {settings.transferencia.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(settings.transferencia.accountNumber, 'trans-acc')}
                              className="text-primary hover:text-primary-dark p-1 rounded shrink-0"
                              title="Copiar número de cuenta"
                            >
                              {copiedKey === 'trans-acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {settings.transferencia.holderName && (
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Titular:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{settings.transferencia.holderName}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(settings.transferencia.holderName, 'trans-holder')}
                              className="text-primary hover:text-primary-dark p-1 rounded"
                              title="Copiar titular"
                            >
                              {copiedKey === 'trans-holder' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {settings.transferencia.idNumber && (
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Cédula / RIF:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-gray-800">
                              {settings.transferencia.idType || 'V'}-{settings.transferencia.idNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`${settings.transferencia.idType || 'V'}${settings.transferencia.idNumber}`, 'trans-id')}
                              className="text-primary hover:text-primary-dark p-1 rounded"
                              title="Copiar documento"
                            >
                              {copiedKey === 'trans-id' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Zelle */}
                {settings.zelle?.enabled && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                      <DollarSign className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Zelle (USD)</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {settings.zelle.email && (
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Correo:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-gray-900 break-all">{settings.zelle.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(settings.zelle.email, 'zelle-email')}
                              className="text-primary hover:text-primary-dark p-1 rounded shrink-0"
                              title="Copiar correo de Zelle"
                            >
                              {copiedKey === 'zelle-email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {settings.zelle.holderName && (
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Titular:</span>
                          <span className="font-medium text-gray-800">{settings.zelle.holderName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Efectivo */}
                {(settings.efectivoUsd?.enabled || settings.efectivoVes?.enabled) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Efectivo en consultorio</span>
                    </div>
                    {settings.efectivoUsd?.enabled && (
                      <p className="text-gray-600">• Se acepta efectivo en dólares (USD) directamente en consultorio.</p>
                    )}
                    {settings.efectivoVes?.enabled && (
                      <p className="text-gray-600">• Se acepta efectivo en bolívares (Bs.) a la tasa oficial del día.</p>
                    )}
                  </div>
                )}

                {/* Nota del consultorio */}
                {settings.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700">
                    <span className="font-semibold block mb-0.5 text-gray-800">Nota del consultorio:</span>
                    <p className="italic">{settings.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* FORMULARIO "YA PAGUÉ" (C2) */}
            {showReportForm && (
              <form onSubmit={handleSubmitReport} className="bg-white border border-primary/20 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Reportar pago realizado
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Completa los datos de tu comprobante para que el médico confirme la recepción.
                  </p>
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-800 font-medium leading-tight">{formError}</p>
                  </div>
                )}

                {/* Selector de método utilizado */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Método utilizado <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedMethod}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  >
                    <option value="" disabled>Selecciona el método con el que pagaste</option>
                    {settings.pagoMovil?.enabled && (
                      <option value="pago_movil">Pago Móvil (Bs.)</option>
                    )}
                    {settings.transferencia?.enabled && (
                      <option value="transferencia">Transferencia Bancaria (Bs.)</option>
                    )}
                    {settings.zelle?.enabled && (
                      <option value="zelle">Zelle (USD)</option>
                    )}
                    {settings.efectivoUsd?.enabled && (
                      <option value="efectivo_usd">Efectivo en Dólares (USD)</option>
                    )}
                    {settings.efectivoVes?.enabled && (
                      <option value="efectivo_ves">Efectivo en Bolívares (Bs.)</option>
                    )}
                  </select>

                  {/* Indicación del monto esperado según la moneda del método */}
                  {selectedMethod && (
                    <div className="text-[11px] text-gray-500 pt-0.5">
                      {['pago_movil', 'transferencia', 'efectivo_ves'].includes(selectedMethod) ? (
                        <span>Monto esperado en bolívares: <strong>Bs. {amountVes ? amountVes.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '---'}</strong></span>
                      ) : (
                        <span>Monto esperado en dólares: <strong>${amountUsd.toFixed(2)} USD</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Referencia bancaria */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Número de referencia
                    {selectedMethod !== 'efectivo_usd' && selectedMethod !== 'efectivo_ves' ? (
                      <span className="text-red-500"> *</span>
                    ) : (
                      <span className="text-gray-400 font-normal"> (opcional en efectivo)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. 12345678 (últimos dígitos del comprobante)"
                    maxLength={60}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    required={selectedMethod !== 'efectivo_usd' && selectedMethod !== 'efectivo_ves'}
                  />
                </div>

                {/* Banco de origen (opcional) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Banco de origen <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <select
                    value={payerBank}
                    onChange={(e) => setPayerBank(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Selecciona tu banco (si aplica)</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.code} - {b.name}
                      </option>
                    ))}
                    <option value="Otro">Otro banco o internacional</option>
                  </select>
                </div>

                {/* Nota adicional (opcional) */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Nota o comentario <span className="text-gray-400 font-normal">(opcional, máx. 200 caracteres)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={payerNote}
                    onChange={(e) => setPayerNote(e.target.value)}
                    placeholder="Ej. Pago realizado desde la cuenta de mi familiar..."
                    maxLength={200}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <div className="text-right text-[10px] text-gray-400">
                    {payerNote.length}/200
                  </div>
                </div>

                {/* Botón de envío con protección de doble clic e idempotencia */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enviando reporte...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Reportar pago</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </SideDrawer>
  );
}
