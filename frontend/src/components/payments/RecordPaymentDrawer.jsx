/**
 * RecordPaymentDrawer.jsx - CitaMed
 * M05 / Semana 8 - Panel lateral para registrar cobro en consultorio y emitir recibo (B4)
 */

import { useState, useEffect } from 'react';
import {
  DollarSign,
  Banknote,
  Smartphone,
  Building,
  CheckCircle2,
  AlertCircle,
  Download,
  Calendar,
  User,
  FileCheck
} from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import paymentService from '../../services/paymentService';
import exchangeRateService from '../../services/exchangeRateService';

const PAYMENT_METHODS = [
  { id: 'efectivo_usd', label: 'Efectivo en Dólares (USD)', icon: DollarSign, currency: 'USD' },
  { id: 'efectivo_ves', label: 'Efectivo en Bolívares (Bs.)', icon: Banknote, currency: 'VES' },
  { id: 'pago_movil', label: 'Pago Móvil (Bs.)', icon: Smartphone, currency: 'VES' },
  { id: 'transferencia', label: 'Transferencia Bancaria (Bs.)', icon: Building, currency: 'VES' },
  { id: 'zelle', label: 'Zelle (USD)', icon: DollarSign, currency: 'USD' }
];

export default function RecordPaymentDrawer({
  open,
  onClose,
  appointment,
  onRecorded
}) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successPayment, setSuccessPayment] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Datos financieros
  const [rate, setRate] = useState(null);
  const [banks, setBanks] = useState([]);

  // Formulario
  const [method, setMethod] = useState('efectivo_usd');
  const [reference, setReference] = useState('');
  const [payerBank, setPayerBank] = useState('');
  const [payerNote, setPayerNote] = useState('');
  const [validationError, setValidationError] = useState('');

  const appointmentId = appointment?.id;
  const rawFee =
    appointment?.consultationFee ??
    appointment?.price ??
    appointment?.priceConsultation ??
    0;
  const amountUsd = Number(rawFee) || 0;

  useEffect(() => {
    if (!open || !appointmentId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSuccessPayment(null);
    setValidationError('');
    setReference('');
    setPayerBank('');
    setPayerNote('');
    setMethod('efectivo_usd');

    Promise.all([
      exchangeRateService.getCurrentRates(),
      paymentService.getBanks()
    ])
      .then(([ratesRes, banksRes]) => {
        if (!isMounted) return;
        if (ratesRes?.success && ratesRes.data?.usd?.rate) {
          setRate(Number(ratesRes.data.usd.rate));
        }
        if (banksRes?.success && Array.isArray(banksRes.data)) {
          setBanks(banksRes.data);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al inicializar registro de cobro:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, appointmentId]);

  const amountVes = rate && amountUsd > 0 ? (amountUsd * rate).toFixed(2) : null;

  const handleRecord = async () => {
    setValidationError('');
    setError(null);

    const isCash = method === 'efectivo_usd' || method === 'efectivo_ves';
    if (!isCash && !reference.trim()) {
      setValidationError('La referencia es obligatoria para este método de pago');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        appointmentId,
        method,
        reference: reference.trim() || undefined,
        payerBank: payerBank ? payerBank.trim() : undefined,
        payerNote: payerNote.trim() || undefined
      };

      const res = await paymentService.recordPayment(payload);
      if (res.success && res.data) {
        setSuccessPayment(res.data);
        if (onRecorded) {
          onRecorded(res.data);
        }
      }
    } catch (err) {
      console.error('Error al registrar cobro:', err);
      setError(
        err.response?.data?.message ||
        'No se pudo registrar el cobro. Verifica los datos e intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!successPayment?.id) return;
    setDownloadingPdf(true);
    try {
      const blob = await paymentService.downloadReceipt(successPayment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-${successPayment.receiptNumber || successPayment.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar recibo:', err);
      alert('No se pudo descargar el recibo en PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const patientName =
    appointment?.patient?.name ||
    `${appointment?.patient?.firstName || ''} ${appointment?.patient?.lastName || ''}`.trim() ||
    appointment?.patientProfile?.firstName
      ? `${appointment?.patientProfile?.firstName || ''} ${appointment?.patientProfile?.lastName || ''}`.trim()
      : 'Paciente';

  const appointmentDate = appointment?.appointmentDate || '';
  const formattedDate = appointmentDate
    ? appointmentDate.split('-').reverse().join('/')
    : '';

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          <span>Registrar Cobro</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          {successPayment ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition shadow-sm"
            >
              Listo
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRecord}
                disabled={submitting || loading || amountUsd <= 0}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Registrando...' : 'Emitir recibo'}
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-6 text-sm text-gray-800">
        {/* Paciente y Cita */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <User className="w-4 h-4 text-primary" />
            <span>{patientName}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Consulta: {formattedDate}
              </span>
            )}
            {appointment?.appointmentNumber && (
              <span>Cita #{appointment.appointmentNumber}</span>
            )}
          </div>
        </div>

        {/* Tarjeta de montos */}
        <div className="bg-gradient-to-br from-primary/10 via-white to-primary/5 border border-primary/20 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Tarifa de la consulta
            </span>
            <span className="text-2xl font-black text-gray-900">
              ${amountUsd.toFixed(2)}{' '}
              <span className="text-xs font-semibold text-gray-500">USD</span>
            </span>
          </div>

          {rate && amountVes && (
            <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-xs text-gray-600">
              <span>Equivalente en Bolívares (Tasa BCV {rate.toFixed(2)} Bs./USD):</span>
              <strong className="text-primary text-sm font-bold">
                Bs. {Number(amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error al registrar</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successPayment ? (
          /* Estado de éxito */
          <div className="border border-emerald-200 bg-emerald-50 rounded-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-gray-900 text-base">
                Cobro registrado exitosamente
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Se ha generado el recibo oficial con código QR de verificación.
              </p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-xl p-3.5 text-xs text-gray-700 space-y-1">
              <div>
                Recibo Nº: <strong className="text-gray-900">{successPayment.receiptNumber}</strong>
              </div>
              <div>
                Código de verificación:{' '}
                <strong className="font-mono text-gray-900">
                  {successPayment.verificationCode}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadingPdf}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Descargando...' : 'Descargar Recibo en PDF'}
            </button>
          </div>
        ) : (
          /* Formulario de registro */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Método de pago recibido *
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const selected = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm">{m.label}</span>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {m.currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Referencia */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Número de referencia{' '}
                {method.startsWith('efectivo') ? (
                  <span className="text-gray-400 font-normal">(Opcional)</span>
                ) : (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="text"
                placeholder={
                  method.startsWith('efectivo')
                    ? 'Opcional para pagos en efectivo'
                    : 'Ej. 0123456789'
                }
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  validationError
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                }`}
              />
              {validationError && (
                <p className="text-xs text-red-600 mt-1">{validationError}</p>
              )}
            </div>

            {/* Banco pagador */}
            {(method === 'pago_movil' || method === 'transferencia') && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Banco emisor / pagador (opcional)
                </label>
                <select
                  value={payerBank}
                  onChange={(e) => setPayerBank(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">-- Seleccionar banco emisor --</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notas opcionales */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nota o concepto del cobro (opcional)
              </label>
              <input
                type="text"
                maxLength={200}
                placeholder="Ej. Cobrado en consultorio en efectivo"
                value={payerNote}
                onChange={(e) => setPayerNote(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>
    </SideDrawer>
  );
}
