/**
 * ExcelImportDrawer.jsx - CITAMED.VE
 * M03 / Semana 9 - Bloque E: Importar pacientes desde Excel / CSV
 *
 * Lee el archivo en el navegador con xlsx (SheetJS), valida cada fila
 * (cédula, teléfono venezolano, nombres y correo), muestra vista previa
 * con filas válidas e inválidas, y envía por lotes (máx 500) al servidor.
 */

import { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  RefreshCw,
  FileText,
  Users,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import clinicalRecordService from '../../services/clinicalRecordService';
import toast from 'react-hot-toast';

export default function ExcelImportDrawer({
  open,
  onClose,
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverSummary, setServerSummary] = useState(null);
  const [importError, setImportError] = useState(null);

  const fileInputRef = useRef(null);

  const resetState = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setParsing(false);
    setSubmitting(false);
    setServerSummary(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Descargar plantilla oficial
  const handleDownloadTemplate = (format = 'xlsx') => {
    const headers = [
      'nombre',
      'apellido',
      'cedula',
      'telefono',
      'correo',
      'fecha_nacimiento',
      'sexo',
      'alergias'
    ];

    const samples = [
      [
        'Carlos',
        'Mendoza',
        'V-18234567',
        '04141234567',
        'carlos.mendoza@ejemplo.com',
        '1985-04-12',
        'Masculino',
        'Penicilina'
      ],
      [
        'Elena',
        'Pérez',
        'V-20111222',
        '04249876543',
        'elena.perez@ejemplo.com',
        '1992-09-25',
        'Femenino',
        ''
      ],
      [
        'Andrés',
        'González',
        'E-82345678',
        '04125556677',
        'andres.gonzalez@ejemplo.com',
        '1988-11-03',
        'Masculino',
        'Ibuprofeno'
      ]
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...samples]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pacientes');

    if (format === 'xlsx') {
      XLSX.writeFile(wb, 'plantilla_pacientes_citamed.xlsx');
    } else {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'plantilla_pacientes_citamed.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  // Validación rápida del lado del cliente
  const validateRowClient = (row, index) => {
    const errors = [];

    // Claves flexibles
    const getVal = (...keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const lowerK = k.toLowerCase().replace(/[\s_-]/g, '');
        for (const rk of rowKeys) {
          if (rk.toLowerCase().replace(/[\s_-]/g, '') === lowerK && row[rk] !== undefined && row[rk] !== null && String(row[rk]).trim() !== '') {
            return String(row[rk]).trim();
          }
        }
      }
      return '';
    };

    const nombre = getVal('nombre', 'firstName', 'nombres');
    const apellido = getVal('apellido', 'lastName', 'apellidos');
    const cedula = getVal('cedula', 'ci', 'identificationNumber', 'identificacion');
    const telefono = getVal('telefono', 'phone', 'celular', 'tlf');
    const correo = getVal('correo', 'email');
    const fechaNacimiento = getVal('fecha_nacimiento', 'dateOfBirth', 'nacimiento');
    const sexo = getVal('sexo', 'gender');
    const alergias = getVal('alergias', 'allergies');

    if (!nombre) errors.push('Nombre requerido');
    if (!apellido) errors.push('Apellido requerido');

    // Cédula
    if (!cedula) {
      errors.push('Cédula requerida');
    } else {
      const digits = cedula.replace(/\D/g, '');
      if (digits.length < 6 || digits.length > 9) {
        errors.push('Cédula debe tener 6-9 dígitos');
      }
    }

    // Teléfono venezolano
    if (!telefono) {
      errors.push('Teléfono requerido');
    } else {
      const cleanPhone = telefono.replace(/[\s().-]/g, '');
      let normalized = cleanPhone;
      if (normalized.startsWith('0')) normalized = '+58' + normalized.slice(1);
      else if (normalized.startsWith('58')) normalized = '+' + normalized;
      else if (!normalized.startsWith('+58') && !normalized.startsWith('+')) normalized = '+58' + normalized;

      if (!/^\+58\d{10}$/.test(normalized)) {
        errors.push('Teléfono venezolano inválido');
      }
    }

    // Correo opcional
    if (correo) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(correo.toLowerCase())) {
        errors.push('Correo inválido');
      }
    }

    return {
      _rowNum: index + 1,
      _isValid: errors.length === 0,
      _errors: errors,
      nombre,
      apellido,
      cedula,
      telefono,
      correo,
      fecha_nacimiento: fechaNacimiento,
      sexo,
      alergias,
      _raw: row
    };
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setFileName(selected.name);
    setParsing(true);
    setServerSummary(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('El archivo no contiene ninguna hoja');
        }
        const sheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('La hoja está vacía o no tiene datos');
        }
        if (rawJson.length > 500) {
          throw new Error(`El archivo tiene ${rawJson.length} filas. El máximo permitido por envío es de 500 filas.`);
        }

        const validated = rawJson.map((r, idx) => validateRowClient(r, idx));
        setParsedRows(validated);
      } catch (err) {
        console.error('Error parseando archivo Excel:', err);
        setImportError(err.message || 'Error al procesar el archivo');
        setParsedRows([]);
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      setImportError('Error al leer el archivo en el navegador');
      setParsing(false);
    };

    reader.readAsArrayBuffer(selected);
  };

  const validRows = parsedRows.filter((r) => r._isValid);
  const invalidRows = parsedRows.filter((r) => !r._isValid);

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setSubmitting(true);
    setImportError(null);

    try {
      // Enviamos el lote completo (el servidor re-valida fila por fila estrictamente)
      const payloadRows = parsedRows.map((r) => ({
        nombre: r.nombre,
        apellido: r.apellido,
        cedula: r.cedula,
        telefono: r.telefono,
        correo: r.correo,
        fecha_nacimiento: r.fecha_nacimiento,
        sexo: r.sexo,
        alergias: r.alergias
      }));

      const res = await clinicalRecordService.importPatients(payloadRows);
      if (res && res.summary) {
        setServerSummary(res.summary);
        toast.success(
          `Importación lista: ${res.summary.created} creados, ${res.summary.linked} vinculados.`
        );
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error('Respuesta del servidor sin resumen');
      }
    } catch (err) {
      console.error('Error en importación al servidor:', err);
      setImportError(
        err.response?.data?.message ||
        err.message ||
        'Error al procesar la importación en el servidor'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SideDrawer
      isOpen={open}
      onClose={handleClose}
      title="Importar Pacientes desde Excel"
      subtitle="Carga masiva de pacientes al directorio médico de CitaMed"
      size="lg"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Banner descriptivo */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Carga rápida y vinculación automática</span>
          </div>
          <p className="text-emerald-800 text-[11px] leading-relaxed">
            Sube un archivo Excel (.xlsx, .xls) o CSV con el listado de tus pacientes.
            Si el paciente ya está registrado en CitaMed (por cédula), se vinculará a tu directorio médico;
            si es nuevo, se creará su ficha médica para que puedas atenderlo de inmediato.
          </p>
        </div>

        {/* Sección de descarga de plantillas */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 block">¿No tienes el formato oficial?</span>
            <span className="text-[11px] text-slate-500">
              Descarga la plantilla con las columnas recomendadas y datos de ejemplo:
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDownloadTemplate('xlsx')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 rounded-md font-semibold text-[11px] transition shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              Plantilla .xlsx
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-slate-500 rounded-md font-semibold text-[11px] transition shadow-xs text-slate-600"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Plantilla .csv
            </button>
          </div>
        </div>

        {/* Resumen del servidor (si ya se ejecutó la importación) */}
        {serverSummary ? (
          <div className="space-y-4 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Resultados de la importación</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="block text-[10px] uppercase font-bold text-slate-500">Procesadas</span>
                <span className="text-lg font-extrabold text-slate-800">{serverSummary.total}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="block text-[10px] uppercase font-bold text-emerald-700">Creados</span>
                <span className="text-lg font-extrabold text-emerald-700">{serverSummary.created}</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <span className="block text-[10px] uppercase font-bold text-blue-700">Vinculados</span>
                <span className="text-lg font-extrabold text-blue-700">
                  {serverSummary.linked} <span className="text-xs font-normal">({serverSummary.alreadyLinked} previos)</span>
                </span>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                <span className="block text-[10px] uppercase font-bold text-rose-700">Errores</span>
                <span className="text-lg font-extrabold text-rose-700">{serverSummary.errors}</span>
              </div>
            </div>

            {serverSummary.errorRows && serverSummary.errorRows.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <span className="font-semibold text-rose-800 block text-xs">
                  Detalle de filas no importadas ({serverSummary.errorRows.length}):
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] p-2 bg-rose-50/50 rounded-lg border border-rose-200">
                  {serverSummary.errorRows.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-rose-700">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Fila #{err.row} {err.cedula && `(${err.cedula})`}: {err.error}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-xs"
              >
                Cerrar y actualizar lista
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Selector de archivo / Dropzone */}
            <div className="space-y-2">
              <label className="font-semibold text-slate-800 block">
                Selecciona o arrastra tu archivo:
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition text-center"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700 block text-xs">
                    {fileName ? fileName : 'Haz clic para seleccionar tu archivo Excel o CSV'}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Formatos admitidos: .xlsx, .xls, .csv (máximo 500 filas)
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Error de lectura o importación */}
            {importError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold block">Error al procesar:</span>
                  <p className="text-[11px] mt-0.5">{importError}</p>
                </div>
              </div>
            )}

            {/* Spinner de lectura */}
            {parsing && (
              <div className="p-6 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Leyendo y validando archivo en el navegador...</span>
              </div>
            )}

            {/* Vista previa y validación por fila */}
            {!parsing && parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200">
                  <span className="font-semibold text-slate-800 text-xs">
                    Vista previa de validación:
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-medium">
                      Total: {parsedRows.length}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 rounded text-emerald-800 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Válidas: {validRows.length}
                    </span>
                    {invalidRows.length > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 rounded text-rose-800 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Con errores: {invalidRows.length}
                      </span>
                    )}
                  </div>
                </div>

                {/* Tabla scrollable de filas */}
                <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 border-b border-slate-200 z-10">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Nombre</th>
                        <th className="p-2">Cédula</th>
                        <th className="p-2">Teléfono</th>
                        <th className="p-2">Correo</th>
                        <th className="p-2">Alergias</th>
                        <th className="p-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((r, idx) => (
                        <tr
                          key={idx}
                          className={r._isValid ? 'hover:bg-slate-50' : 'bg-red-50/50 hover:bg-red-50'}
                        >
                          <td className="p-2 font-mono text-slate-400">{r._rowNum}</td>
                          <td className="p-2 font-medium text-slate-800 truncate max-w-[120px]">
                            {r.nombre} {r.apellido}
                          </td>
                          <td className="p-2 font-mono text-slate-700">{r.cedula || '-'}</td>
                          <td className="p-2 text-slate-600">{r.telefono || '-'}</td>
                          <td className="p-2 text-slate-500 truncate max-w-[120px]">
                            {r.correo || '-'}
                          </td>
                          <td className="p-2 text-slate-500 truncate max-w-[100px]">
                            {r.alergias || '-'}
                          </td>
                          <td className="p-2">
                            {r._isValid ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                                <Check className="w-2.5 h-2.5" /> Válida
                              </span>
                            ) : (
                              <span
                                title={r._errors.join(', ')}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-800 font-semibold cursor-help"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" /> {r._errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {invalidRows.length > 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                    Atención: las filas con errores no podrán ser guardadas por el servidor.
                    Puedes corregir tu archivo o continuar para importar las filas que sí son válidas.
                  </p>
                )}

                {/* Acciones de envío */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={submitting || parsedRows.length === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importando al servidor...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importar {parsedRows.length} pacientes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SideDrawer>
  );
}
