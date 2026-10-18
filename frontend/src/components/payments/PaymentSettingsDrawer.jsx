/**
 * PaymentSettingsDrawer.jsx - CitaMed
 * M05 / Semana 8 - Panel lateral para configurar métodos de cobro del médico (B3)
 */

import { useState, useEffect } from 'react';
import {
  Smartphone,
  Building,
  CreditCard,
  DollarSign,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Info
} from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import paymentService from '../../services/paymentService';

const ID_TYPES = ['V', 'E', 'J'];

export default function PaymentSettingsDrawer({ open, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [banks, setBanks] = useState([]);

  // Estados de formularios por método
  const [pagoMovil, setPagoMovil] = useState({
    enabled: false,
    bankCode: '0102',
    phone: '',
    idType: 'V',
    idNumber: ''
  });

  const [transferencia, setTransferencia] = useState({
    enabled: false,
    bankCode: '0102',
    accountNumber: '',
    holderName: '',
    idType: 'V',
    idNumber: ''
  });

  const [zelle, setZelle] = useState({
    enabled: false,
    email: '',
    holderName: ''
  });

  const [efectivoUsd, setEfectivoUsd] = useState({ enabled: true });
  const [efectivoVes, setEfectivoVes] = useState({ enabled: false });
  const [notes, setNotes] = useState('');

  // Errores de validación en línea
  const [validationErrors, setValidationErrors] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setValidationErrors({});

    Promise.all([
      paymentService.getBanks(),
      paymentService.getSettings()
    ])
      .then(([banksRes, settingsRes]) => {
        if (!isMounted) return;
        if (banksRes?.success && Array.isArray(banksRes.data)) {
          setBanks(banksRes.data);
        }
        if (settingsRes?.success && settingsRes.data) {
          const s = settingsRes.data;
          if (s.pagoMovil) {
            setPagoMovil({
              enabled: Boolean(s.pagoMovil.enabled),
              bankCode: s.pagoMovil.bankCode || '0102',
              phone: s.pagoMovil.phone || '',
              idType: s.pagoMovil.idType || 'V',
              idNumber: s.pagoMovil.idNumber || ''
            });
          }
          if (s.transferencia) {
            setTransferencia({
              enabled: Boolean(s.transferencia.enabled),
              bankCode: s.transferencia.bankCode || '0102',
              accountNumber: s.transferencia.accountNumber || '',
              holderName: s.transferencia.holderName || '',
              idType: s.transferencia.idType || 'V',
              idNumber: s.transferencia.idNumber || ''
            });
          }
          if (s.zelle) {
            setZelle({
              enabled: Boolean(s.zelle.enabled),
              email: s.zelle.email || '',
              holderName: s.zelle.holderName || ''
            });
          }
          if (s.efectivoUsd) {
            setEfectivoUsd({ enabled: Boolean(s.efectivoUsd.enabled) });
          }
          if (s.efectivoVes) {
            setEfectivoVes({ enabled: Boolean(s.efectivoVes.enabled) });
          }
          if (typeof s.notes === 'string') {
            setNotes(s.notes);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al cargar métodos de cobro:', err);
        setError('No pudimos cargar tus métodos de cobro. Intenta nuevamente.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Validación local
  const validate = () => {
    const errs = {};

    if (pagoMovil.enabled) {
      const cleanPhone = pagoMovil.phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 10 || cleanPhone.length > 12) {
        errs.pmPhone = 'Ingresa un número telefónico venezolano válido (ej. 04141234567)';
      }
      const cleanId = pagoMovil.idNumber.replace(/\D/g, '');
      if (!cleanId || cleanId.length < 6 || cleanId.length > 9) {
        errs.pmId = 'Ingresa una cédula o RIF válido (6 a 9 dígitos)';
      }
      if (!pagoMovil.bankCode) {
        errs.pmBank = 'Selecciona el banco de Pago Móvil';
      }
    }

    if (transferencia.enabled) {
      const cleanAcc = transferencia.accountNumber.replace(/\D/g, '');
      if (cleanAcc.length !== 20) {
        errs.trAccount = 'El número de cuenta bancaria debe tener exactamente 20 dígitos';
      } else if (transferencia.bankCode && !cleanAcc.startsWith(transferencia.bankCode)) {
        errs.trAccount = `El número de cuenta debe comenzar con los 4 dígitos del banco (${transferencia.bankCode})`;
      }
      if (!transferencia.holderName || transferencia.holderName.trim().length < 3) {
        errs.trHolder = 'Ingresa el nombre completo del titular de la cuenta';
      }
      const cleanId = transferencia.idNumber.replace(/\D/g, '');
      if (!cleanId || cleanId.length < 6 || cleanId.length > 9) {
        errs.trId = 'Ingresa una cédula o RIF válido (6 a 9 dígitos)';
      }
    }

    if (zelle.enabled) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!zelle.email || !emailRegex.test(zelle.email.trim())) {
        errs.zelleEmail = 'Ingresa un correo electrónico de Zelle válido';
      }
      if (!zelle.holderName || zelle.holderName.trim().length < 3) {
        errs.zelleHolder = 'Ingresa el nombre del titular de la cuenta Zelle';
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      pagoMovil,
      transferencia,
      zelle,
      efectivoUsd,
      efectivoVes,
      notes: notes.trim().slice(0, 200)
    };

    try {
      const res = await paymentService.updateSettings(payload);
      if (res.success) {
        setSuccessMsg('Métodos de cobro actualizados correctamente.');
        if (onSaved) onSaved(res.data);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Error al guardar métodos de cobro:', err);
      setError(
        err.response?.data?.message ||
        'Ocurrió un error al guardar los métodos de cobro. Verifica los datos.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Helper para buscar el nombre de un banco por su código
  const getBankName = (code) => {
    const b = banks.find((item) => item.code === code);
    return b ? b.name : `Banco (${code})`;
  };

  const anyEnabled =
    pagoMovil.enabled ||
    transferencia.enabled ||
    zelle.enabled ||
    efectivoUsd.enabled ||
    efectivoVes.enabled;

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <span>Mis Métodos de Cobro</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar métodos'}
          </button>
        </div>
      }
    >
      <div className="space-y-6 pb-6 text-sm text-gray-800">
        {/* Descripción superior */}
        <p className="text-gray-600 leading-relaxed">
          Configura las cuentas y métodos donde recibirás los pagos de tus consultas. Los datos
          bancarios solo se muestran a tus pacientes citados para que puedan reportar su pago.
        </p>

        {error && (
          <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo guardar</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {!anyEnabled && (
          <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Sin métodos activos</p>
              <p className="mt-0.5">
                Debes activar al menos un método de cobro para que tus pacientes puedan pagar y
                reportar sus pagos a través de CitaMed.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Cargando métodos de cobro...</p>
          </div>
        ) : (
          <>
            {/* 1. SECCIÓN PAGO MÓVIL */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Pago Móvil (Bs.)</h3>
                    <p className="text-xs text-gray-500">Pagos instantáneos interbancarios</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pagoMovil.enabled}
                    onChange={(e) =>
                      setPagoMovil({ ...pagoMovil, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {pagoMovil.enabled && (
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Banco receptor *
                    </label>
                    <select
                      value={pagoMovil.bankCode}
                      onChange={(e) =>
                        setPagoMovil({ ...pagoMovil, bankCode: e.target.value })
                      }
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Teléfono celular afiliado *
                    </label>
                    <input
                      type="text"
                      placeholder="04141234567 o +584141234567"
                      value={pagoMovil.phone}
                      onChange={(e) =>
                        setPagoMovil({ ...pagoMovil, phone: e.target.value })
                      }
                      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.pmPhone
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    {validationErrors.pmPhone && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.pmPhone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cédula o RIF del titular *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={pagoMovil.idType}
                        onChange={(e) =>
                          setPagoMovil({ ...pagoMovil, idType: e.target.value })
                        }
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {ID_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Ej. 12345678"
                        value={pagoMovil.idNumber}
                        onChange={(e) =>
                          setPagoMovil({
                            ...pagoMovil,
                            idNumber: e.target.value.replace(/\D/g, '')
                          })
                        }
                        className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.pmId
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                      />
                    </div>
                    {validationErrors.pmId && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.pmId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN TRANSFERENCIA BANCARIA */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Transferencia Bancaria (Bs.)</h3>
                    <p className="text-xs text-gray-500">Cuenta corriente o de ahorros nacional</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferencia.enabled}
                    onChange={(e) =>
                      setTransferencia({
                        ...transferencia,
                        enabled: e.target.checked
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {transferencia.enabled && (
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Banco *
                    </label>
                    <select
                      value={transferencia.bankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setTransferencia((prev) => ({
                          ...prev,
                          bankCode: code,
                          accountNumber:
                            prev.accountNumber.length > 4
                              ? code + prev.accountNumber.slice(4)
                              : code
                        }));
                      }}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Número de cuenta (20 dígitos) *
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="01020123450123456789"
                      value={transferencia.accountNumber}
                      onChange={(e) =>
                        setTransferencia({
                          ...transferencia,
                          accountNumber: e.target.value.replace(/\D/g, '')
                        })
                      }
                      className={`w-full text-sm font-mono border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.trAccount
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    <div className="flex justify-between items-center text-xs mt-1 text-gray-500">
                      <span>{transferencia.accountNumber.length}/20 dígitos</span>
                      {validationErrors.trAccount && (
                        <span className="text-red-600 font-normal">
                          {validationErrors.trAccount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre completo del titular *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Dr. Alejandro Rivas"
                      value={transferencia.holderName}
                      onChange={(e) =>
                        setTransferencia({
                          ...transferencia,
                          holderName: e.target.value
                        })
                      }
                      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.trHolder
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    {validationErrors.trHolder && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.trHolder}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cédula o RIF del titular *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={transferencia.idType}
                        onChange={(e) =>
                          setTransferencia({
                            ...transferencia,
                            idType: e.target.value
                          })
                        }
                        className="w-20 text-sm border border-gray-300 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        {ID_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Ej. 12345678"
                        value={transferencia.idNumber}
                        onChange={(e) =>
                          setTransferencia({
                            ...transferencia,
                            idNumber: e.target.value.replace(/\D/g, '')
                          })
                        }
                        className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                          validationErrors.trId
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                        }`}
                      />
                    </div>
                    {validationErrors.trId && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.trId}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. SECCIÓN ZELLE */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    Z
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Zelle (USD)</h3>
                    <p className="text-xs text-gray-500">Transferencias directas en dólares</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={zelle.enabled}
                    onChange={(e) =>
                      setZelle({ ...zelle, enabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {zelle.enabled && (
                <div className="pt-2 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Correo electrónico de Zelle *
                    </label>
                    <input
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={zelle.email}
                      onChange={(e) =>
                        setZelle({ ...zelle, email: e.target.value })
                      }
                      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.zelleEmail
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    {validationErrors.zelleEmail && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.zelleEmail}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nombre completo del titular *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Dr. Alejandro Rivas"
                      value={zelle.holderName}
                      onChange={(e) =>
                        setZelle({ ...zelle, holderName: e.target.value })
                      }
                      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        validationErrors.zelleHolder
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    {validationErrors.zelleHolder && (
                      <p className="text-xs text-red-600 mt-1">
                        {validationErrors.zelleHolder}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 4. SECCIÓN EFECTIVO */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>Cobro en Efectivo en Consulta</span>
              </h3>
              <p className="text-xs text-gray-500">
                Permite al paciente indicar que abonará en el consultorio.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-sm font-medium text-gray-800">
                    Efectivo en Dólares (USD)
                  </span>
                  <input
                    type="checkbox"
                    checked={efectivoUsd.enabled}
                    onChange={(e) =>
                      setEfectivoUsd({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </label>

                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
                  <span className="text-sm font-medium text-gray-800">
                    Efectivo en Bolívares (Bs.)
                  </span>
                  <input
                    type="checkbox"
                    checked={efectivoVes.enabled}
                    onChange={(e) =>
                      setEfectivoVes({ enabled: e.target.checked })
                    }
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </label>
              </div>
            </div>

            {/* 5. NOTAS ADICIONALES */}
            <div className="border border-gray-200 rounded-2xl p-4 bg-white shadow-sm space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Indicaciones adicionales para tus pacientes (opcional)
              </label>
              <textarea
                rows={2}
                maxLength={200}
                placeholder="Ej. Por favor enviar comprobante de Pago Móvil antes de ingresar al consultorio."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-right text-xs text-gray-400">
                {notes.length}/200 caracteres
              </p>
            </div>

            {/* VISTA PREVIA PARA EL PACIENTE */}
            <div className="mt-8 border-2 border-dashed border-gray-200 rounded-2xl p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                <Eye className="w-4 h-4 text-primary" />
                <span>Vista previa: lo que verá el paciente al pagar</span>
              </div>

              {!anyEnabled ? (
                <div className="p-4 bg-white border border-gray-200 rounded-xl text-center text-gray-500 text-xs">
                  Aún no has activado ningún método. Activa Pago Móvil, Transferencia, Zelle o
                  Efectivo para ver la ficha del paciente.
                </div>
              ) : (
                <div className="space-y-3">
                  {pagoMovil.enabled && (
                    <div className="p-3 bg-white border border-sky-100 rounded-xl shadow-xs text-xs space-y-1">
                      <div className="font-semibold text-sky-800 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Pago Móvil</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-gray-600">
                        <div>Banco: <strong className="text-gray-900">{getBankName(pagoMovil.bankCode)}</strong></div>
                        <div>Teléfono: <strong className="text-gray-900">{pagoMovil.phone || '04XX-XXXXXXX'}</strong></div>
                        <div className="col-span-2">Cédula / RIF: <strong className="text-gray-900">{pagoMovil.idType}-{pagoMovil.idNumber || 'XXXXXXX'}</strong></div>
                      </div>
                    </div>
                  )}

                  {transferencia.enabled && (
                    <div className="p-3 bg-white border border-indigo-100 rounded-xl shadow-xs text-xs space-y-1">
                      <div className="font-semibold text-indigo-800 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />
                        <span>Transferencia Bancaria</span>
                      </div>
                      <div className="text-gray-600 space-y-0.5">
                        <div>Banco: <strong className="text-gray-900">{getBankName(transferencia.bankCode)}</strong></div>
                        <div>Cuenta: <strong className="font-mono text-gray-900">{transferencia.accountNumber || '0102XXXXXXXXXXXXXXXX'}</strong></div>
                        <div>Titular: <strong className="text-gray-900">{transferencia.holderName || 'Nombre del Médico'}</strong></div>
                        <div>Documento: <strong className="text-gray-900">{transferencia.idType}-{transferencia.idNumber || 'XXXXXXX'}</strong></div>
                      </div>
                    </div>
                  )}

                  {zelle.enabled && (
                    <div className="p-3 bg-white border border-purple-100 rounded-xl shadow-xs text-xs space-y-1">
                      <div className="font-semibold text-purple-800 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Zelle (USD)</span>
                      </div>
                      <div className="text-gray-600 space-y-0.5">
                        <div>Correo: <strong className="text-gray-900">{zelle.email || 'correo@zelle.com'}</strong></div>
                        <div>Titular: <strong className="text-gray-900">{zelle.holderName || 'Nombre del Médico'}</strong></div>
                      </div>
                    </div>
                  )}

                  {(efectivoUsd.enabled || efectivoVes.enabled) && (
                    <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-xs text-gray-600">
                      <span>Efectivo disponible en consulta: </span>
                      <strong className="text-emerald-800">
                        {[
                          efectivoUsd.enabled ? 'Dólares (USD)' : null,
                          efectivoVes.enabled ? 'Bolívares (Bs.)' : null
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </strong>
                    </div>
                  )}

                  {notes && (
                    <p className="text-xs text-gray-500 italic px-1">
                      "{notes}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SideDrawer>
  );
}
