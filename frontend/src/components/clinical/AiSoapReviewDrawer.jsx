/**
 * AiSoapReviewDrawer.jsx - CITAMED.VE
 * M03 / Semana 7 - Bloque D: Panel de Revisión de Propuestas de Inteligencia Artificial
 *
 * SideDrawer para que el médico inspeccione, edite y apruebe las propuestas clínicas de la IA
 * (SOAP, signos vitales, examen físico, récipe y órdenes de laboratorio).
 */

import { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Edit2,
  FileSpreadsheet,
  Pill,
  HeartPulse,
  Activity,
  Stethoscope,
  ClipboardList
} from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import { EXAM_SYSTEM_LABELS } from '../../utils/physicalExamLabels';

const VITAL_INFO = {
  systolic: { label: 'TA Sistólica', unit: 'mmHg' },
  diastolic: { label: 'TA Diastólica', unit: 'mmHg' },
  heartRate: { label: 'Frecuencia cardíaca', unit: 'lpm' },
  respiratoryRate: { label: 'Frecuencia respiratoria', unit: 'rpm' },
  temperature: { label: 'Temperatura', unit: '°C' },
  oxygenSaturation: { label: 'Saturación O₂', unit: '%' },
  weightKg: { label: 'Peso', unit: 'kg' },
  heightCm: { label: 'Talla', unit: 'cm' },
  glucose: { label: 'Glucemia', unit: 'mg/dL' }
};

const SOAP_FIELD_LABELS = {
  subjective: 'Subjetivo: Motivo y Enfermedad Actual',
  objective: 'Objetivo: Signos y Hallazgos Clínicos',
  assessment: 'Evaluación y Diagnóstico',
  plan: 'Plan de Tratamiento e Indicaciones'
};

export default function AiSoapReviewDrawer({
  open,
  onClose,
  soapProposal = {},
  rxProposal = {},
  soapError = null,
  rxError = null,
  currentSoap = {},
  currentVitals = {},
  onApply,
  onCreateLabOrders
}) {
  // Estado de selección de campos SOAP
  const [selectedSoap, setSelectedSoap] = useState({});
  const [soapModes, setSoapModes] = useState({}); // 'append' | 'replace'

  // Estado de signos vitales seleccionados
  const [selectedVitals, setSelectedVitals] = useState({});

  // Estado de examen físico seleccionado
  const [selectedExam, setSelectedExam] = useState({});

  // Estado de récipe médico (editable antes de aplicar)
  const [rxItems, setRxItems] = useState([]);
  const [selectedRxItems, setSelectedRxItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [indications, setIndications] = useState('');
  const [applyIndications, setApplyIndications] = useState(true);

  // Casilla de responsabilidad obligatoria
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  // Inicializar estado cuando se abre con nuevas propuestas
  useEffect(() => {
    if (!open) return;

    // 1. SOAP
    const initialSelectedSoap = {};
    const initialSoapModes = {};
    ['subjective', 'objective', 'assessment', 'plan'].forEach((field) => {
      const propText = (soapProposal[field] || '').trim();
      const currText = (currentSoap[field] || '').trim();
      if (propText) {
        initialSelectedSoap[field] = true;
        initialSoapModes[field] = currText ? 'append' : 'replace';
      } else {
        initialSelectedSoap[field] = false;
        initialSoapModes[field] = 'append';
      }
    });
    setSelectedSoap(initialSelectedSoap);
    setSoapModes(initialSoapModes);

    // 2. Signos vitales
    const initialSelectedVitals = {};
    const propVitals = soapProposal.vitalSigns || {};
    Object.keys(VITAL_INFO).forEach((k) => {
      if (propVitals[k] !== undefined && propVitals[k] !== null && propVitals[k] !== '') {
        initialSelectedVitals[k] = true;
      } else {
        initialSelectedVitals[k] = false;
      }
    });
    setSelectedVitals(initialSelectedVitals);

    // 3. Examen físico
    const initialSelectedExam = {};
    const propExam = soapProposal.physicalExam || {};
    Object.keys(EXAM_SYSTEM_LABELS).forEach((systemKey) => {
      if (propExam[systemKey] && propExam[systemKey].findings) {
        initialSelectedExam[systemKey] = true;
      } else {
        initialSelectedExam[systemKey] = false;
      }
    });
    setSelectedExam(initialSelectedExam);

    // 4. Récipe
    const items = (rxProposal.items || []).map((it) => ({ ...it }));
    setRxItems(items);
    setSelectedRxItems(items.map(() => true));
    setIndications(rxProposal.indications || '');
    setApplyIndications(Boolean(rxProposal.indications));

    // Reiniciar confirmación
    setResponsibilityAccepted(false);
    setEditingItemIndex(null);
  }, [open, soapProposal, rxProposal, currentSoap]);

  // Manejar edición de item del récipe
  const handleItemFieldChange = (index, field, value) => {
    setRxItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Consolidar y enviar selecciones
  const handleConfirmApply = () => {
    if (!responsibilityAccepted) return;

    // Calcular valores de SOAP a aplicar
    const soapUpdates = {};
    ['subjective', 'objective', 'assessment', 'plan'].forEach((field) => {
      if (selectedSoap[field] && soapProposal[field]) {
        const current = (currentSoap[field] || '').trim();
        const proposed = soapProposal[field].trim();
        if (soapModes[field] === 'append' && current) {
          soapUpdates[field] = `${current}\n\n${proposed}`;
        } else {
          soapUpdates[field] = proposed;
        }
      }
    });

    // Calcular signos vitales a aplicar
    const vitalsUpdates = {};
    const propVitals = soapProposal.vitalSigns || {};
    Object.keys(selectedVitals).forEach((k) => {
      if (selectedVitals[k] && propVitals[k] !== undefined && propVitals[k] !== null) {
        vitalsUpdates[k] = propVitals[k];
      }
    });

    // Calcular examen físico a aplicar
    const examUpdates = {};
    const propExam = soapProposal.physicalExam || {};
    Object.keys(selectedExam).forEach((k) => {
      if (selectedExam[k] && propExam[k]) {
        examUpdates[k] = propExam[k];
      }
    });

    // Calcular items del récipe seleccionados
    const itemsToApply = rxItems.filter((_, idx) => selectedRxItems[idx]);
    const indicationsToApply = applyIndications ? indications.trim() : '';

    onApply({
      soapUpdates,
      vitalsUpdates,
      examUpdates,
      recipeItemsUpdates: itemsToApply,
      recipeIndicationsUpdate: indicationsToApply,
      hasRecipeApplied: itemsToApply.length > 0,
      hasExamApplied: Object.keys(examUpdates).length > 0
    });

    onClose();
  };

  // Warnings consolidados
  const allWarnings = [
    ...(soapProposal.warnings || []),
    ...(rxProposal.warnings || [])
  ];

  const labOrders = soapProposal.labOrders || [];

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Revisar Propuesta de la IA"
      width="max-w-2xl"
    >
      <div className="space-y-6 pb-20">
        {/* AVISO FIJO: EXPERIMENTAL Y RESPONSABILIDAD MÉDICA */}
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-xs text-amber-900 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Aviso médico y legal obligatorio</p>
            <p className="leading-relaxed">
              Función experimental de asistencia. La IA puede equivocarse u omitir datos.
              Revisa todo antes de aplicarlo: el diagnóstico, los medicamentos y las dosis
              son responsabilidad exclusiva del médico tratante.
            </p>
          </div>
        </div>

        {/* ALERTA DE FALLOS PARCIALES */}
        {(soapError || rxError) && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <X className="w-4 h-4 text-rose-600" /> Atención a fallos parciales
            </p>
            {soapError && <p>• SOAP: {soapError}</p>}
            {rxError && <p>• Récipe: {rxError}</p>}
          </div>
        )}

        {/* WARNINGS EMITIDOS POR LA IA */}
        {allWarnings.length > 0 && (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
            <p className="font-bold">Observaciones del procesador clínico:</p>
            <ul className="list-disc list-inside space-y-0.5">
              {allWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 1. SECCIÓN: SOAP */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Estructura SOAP Propuesta
          </h3>

          {['subjective', 'objective', 'assessment', 'plan'].map((field) => {
            const propText = (soapProposal[field] || '').trim();
            const currText = (currentSoap[field] || '').trim();
            if (!propText) return null;

            return (
              <div
                key={field}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedSoap[field])}
                      onChange={(e) =>
                        setSelectedSoap((prev) => ({ ...prev, [field]: e.target.checked }))
                      }
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span>{SOAP_FIELD_LABELS[field]}</span>
                  </label>

                  {currText && selectedSoap[field] && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`mode-${field}`}
                          value="append"
                          checked={soapModes[field] === 'append'}
                          onChange={() =>
                            setSoapModes((prev) => ({ ...prev, [field]: 'append' }))
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span>Agregar al final</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`mode-${field}`}
                          value="replace"
                          checked={soapModes[field] === 'replace'}
                          onChange={() =>
                            setSoapModes((prev) => ({ ...prev, [field]: 'replace' }))
                          }
                          className="text-primary focus:ring-primary"
                        />
                        <span>Reemplazar</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Vista comparativa */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {currText && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded">
                      <span className="font-semibold text-slate-500 block mb-1">
                        Contenido actual en formulario:
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap line-clamp-3">
                        {currText}
                      </p>
                    </div>
                  )}
                  <div
                    className={`p-2.5 bg-sky-50/60 border border-sky-200 rounded ${
                      !currText ? 'md:col-span-2' : ''
                    }`}
                  >
                    <span className="font-semibold text-sky-800 block mb-1">
                      Propuesta de la IA:
                    </span>
                    <p className="text-slate-800 whitespace-pre-wrap">{propText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. SECCIÓN: SIGNOS VITALES */}
        {soapProposal.vitalSigns &&
          Object.keys(VITAL_INFO).some(
            (k) =>
              soapProposal.vitalSigns[k] !== undefined &&
              soapProposal.vitalSigns[k] !== null &&
              soapProposal.vitalSigns[k] !== ''
          ) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <HeartPulse className="w-4 h-4 text-emerald-600" /> Signos Vitales Detectados
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(VITAL_INFO).map(([key, info]) => {
                  const val = soapProposal.vitalSigns?.[key];
                  if (val === undefined || val === null || val === '') return null;
                  const currentVal = currentVitals[key];

                  return (
                    <label
                      key={key}
                      className={`p-2.5 border rounded-lg flex items-start gap-2 cursor-pointer transition ${
                        selectedVitals[key]
                          ? 'bg-emerald-50/60 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(selectedVitals[key])}
                        onChange={(e) =>
                          setSelectedVitals((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                      />
                      <div className="text-xs">
                        <span className="font-semibold text-slate-700 block">
                          {info.label}
                        </span>
                        <span className="text-emerald-800 font-bold text-sm">
                          {val} {info.unit}
                        </span>
                        {currentVal && (
                          <span className="text-[10px] text-slate-500 block">
                            (Actual: {currentVal} {info.unit})
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

        {/* 3. SECCIÓN: EXAMEN FÍSICO */}
        {soapProposal.physicalExam &&
          Object.keys(EXAM_SYSTEM_LABELS).some(
            (k) => soapProposal.physicalExam[k]?.findings
          ) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                <Stethoscope className="w-4 h-4 text-indigo-600" /> Examen Físico por Sistemas
              </h3>

              <div className="space-y-2">
                {Object.entries(EXAM_SYSTEM_LABELS).map(([systemKey, label]) => {
                  const item = soapProposal.physicalExam?.[systemKey];
                  if (!item || !item.findings) return null;

                  return (
                    <div
                      key={systemKey}
                      className={`p-3 border rounded-lg flex items-start gap-2.5 transition ${
                        selectedExam[systemKey]
                          ? 'bg-indigo-50/40 border-indigo-200'
                          : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(selectedExam[systemKey])}
                        onChange={(e) =>
                          setSelectedExam((prev) => ({
                            ...prev,
                            [systemKey]: e.target.checked
                          }))
                        }
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5"
                      />
                      <div className="text-xs flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800">{label}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'abnormal'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {item.status === 'abnormal' ? 'Anormal' : 'Normal'}
                          </span>
                        </div>
                        <p className="text-slate-700">{item.findings}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* 4. SECCIÓN: RÉCIPE MÉDICO */}
        {rxItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
              <Pill className="w-4 h-4 text-purple-600" /> Tratamiento Farmacológico Propuesto
            </h3>

            <div className="space-y-3">
              {rxItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 border rounded-lg space-y-2.5 transition ${
                    selectedRxItems[idx]
                      ? 'bg-purple-50/30 border-purple-200'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedRxItems[idx])}
                        onChange={(e) =>
                          setSelectedRxItems((prev) => {
                            const u = [...prev];
                            u[idx] = e.target.checked;
                            return u;
                          })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      <span>Medicamento #{idx + 1}: {item.medication || 'Sin nombre'}</span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingItemIndex(editingItemIndex === idx ? null : idx)
                      }
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      {editingItemIndex === idx ? 'Cerrar edición' : 'Editar'}
                    </button>
                  </div>

                  {/* Detalle o Formulario de edición */}
                  {editingItemIndex === idx ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-white rounded border border-slate-200 text-xs">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Medicamento</label>
                        <input
                          type="text"
                          value={item.medication}
                          onChange={(e) => handleItemFieldChange(idx, 'medication', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Presentación</label>
                        <input
                          type="text"
                          value={item.presentation}
                          onChange={(e) => handleItemFieldChange(idx, 'presentation', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Dosis</label>
                        <input
                          type="text"
                          value={item.dose}
                          onChange={(e) => handleItemFieldChange(idx, 'dose', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Frecuencia</label>
                        <input
                          type="text"
                          value={item.frequency}
                          onChange={(e) => handleItemFieldChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Duración</label>
                        <input
                          type="text"
                          value={item.duration}
                          onChange={(e) => handleItemFieldChange(idx, 'duration', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-0.5">Instrucciones</label>
                        <input
                          type="text"
                          value={item.instructions}
                          onChange={(e) => handleItemFieldChange(idx, 'instructions', e.target.value)}
                          className="w-full px-2 py-1 border rounded text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-700 bg-white/70 p-2 rounded">
                      <div><span className="text-slate-400 block text-[10px]">Presentación:</span> {item.presentation || '—'}</div>
                      <div><span className="text-slate-400 block text-[10px]">Dosis:</span> {item.dose || '—'}</div>
                      <div><span className="text-slate-400 block text-[10px]">Frecuencia:</span> {item.frequency || '—'}</div>
                      <div><span className="text-slate-400 block text-[10px]">Duración:</span> {item.duration || '—'}</div>
                      <div className="col-span-2"><span className="text-slate-400 block text-[10px]">Instrucciones:</span> {item.instructions || '—'}</div>
                    </div>
                  )}
                </div>
              ))}

              {indications && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyIndications}
                      onChange={(e) => setApplyIndications(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span>Indicaciones generales del récipe</span>
                  </label>
                  <p className="text-xs text-slate-700 pl-6 whitespace-pre-wrap">{indications}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SECCIÓN: ÓRDENES DE LABORATORIO */}
        {labOrders.length > 0 && (
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-indigo-600" /> Exámenes sugeridos en consulta:
              </span>
              {onCreateLabOrders && (
                <button
                  type="button"
                  onClick={() => {
                    onCreateLabOrders(labOrders);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Crear orden con esto
                </button>
              )}
            </div>
            <ul className="list-disc list-inside text-indigo-800 space-y-0.5 pl-1">
              {labOrders.map((exam, idx) => (
                <li key={idx}>{exam}</li>
              ))}
            </ul>
          </div>
        )}

        {/* PIE DE PÁGINA: CASILLA OBLIGATORIA Y ACCIONES */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <label className="flex items-start gap-2.5 p-3 bg-slate-100 rounded-lg border border-slate-300 cursor-pointer text-xs font-semibold text-slate-800">
            <input
              type="checkbox"
              checked={responsibilityAccepted}
              onChange={(e) => setResponsibilityAccepted(e.target.checked)}
              className="rounded text-primary focus:ring-primary h-4 w-4 mt-0.5"
            />
            <span>
              Revisé la propuesta y asumo la responsabilidad de los datos que aplico.
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!responsibilityAccepted}
              onClick={handleConfirmApply}
              className="flex-1 py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Aplicar seleccionados
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </SideDrawer>
  );
}
