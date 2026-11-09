/**
 * spreadsheet.js - CITAMED.VE
 * Lectura y escritura de hojas de cálculo para la importación de pacientes.
 *
 * Reemplaza a la librería xlsx (SheetJS), que tiene dos avisos de seguridad sin versión corregida.
 * .xlsx se lee con exceljs (carga diferida: solo se descarga al importar) y .csv con un lector propio.
 * El formato antiguo .xls no se admite: se pide guardarlo como .xlsx o .csv.
 */

export const TEMPLATE_HEADERS = ['nombre', 'apellido', 'cedula', 'telefono', 'correo', 'fecha_nacimiento', 'sexo', 'alergias'];

export const TEMPLATE_SAMPLES = [
  ['Carlos', 'Mendoza', 'V-18234567', '04141234567', 'carlos.mendoza@ejemplo.com', '1985-04-12', 'Masculino', 'Penicilina'],
  ['Elena', 'Pérez', 'V-20111222', '04249876543', 'elena.perez@ejemplo.com', '1992-09-25', 'Femenino', ''],
  ['Andrés', 'González', 'E-82345678', '04125556677', 'andres.gonzalez@ejemplo.com', '1988-11-03', 'Masculino', 'Ibuprofeno']
];

export const MAX_ROWS = 500;

/** Qué tipo de archivo es, por su contenido (no por la extensión, que se puede cambiar a mano) */
export function detectFormat(bytes, fileName = '') {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length >= 4 && b[0] === 0x50 && b[1] === 0x4b) return 'xlsx'; // PK: un .xlsx es un zip
  if (b.length >= 4 && b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'xls';
  const name = String(fileName).toLowerCase();
  if (name.endsWith('.csv') || name.endsWith('.txt')) return 'csv';
  return 'csv';
}

/** Lector de CSV: comillas, saltos de línea dentro de comillas, BOM y separador coma, punto y coma o tabulador */
export function parseCsv(text) {
  let s = String(text ?? '');
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  const firstLine = s.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => (firstLine.match(new RegExp(`\\${ch}`, 'g')) || []).length;
  const delimiter = [',', ';', '\t'].sort((a, b) => count(b) - count(a))[0];

  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i += 1; } else { quoted = false; }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

/** Escribe una matriz como CSV (con comillas donde hacen falta) */
export function toCsv(matrix) {
  const q = (v) => {
    const t = v === null || v === undefined ? '' : String(v);
    return /[",\r\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return matrix.map((r) => r.map(q).join(',')).join('\r\n');
}

const pad = (n) => String(n).padStart(2, '0');

/** Lleva el valor de una celda de Excel a texto plano */
export function cellToText(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    // Excel guarda las fechas sin zona horaria: se leen en UTC para no correrlas un día
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((t) => t.text).join('');
    if ('result' in value) return cellToText(value.result);
    if ('text' in value) return cellToText(value.text);
    if ('error' in value) return '';
    return '';
  }
  return String(value);
}

/** Primera fila = encabezados; el resto, filas. Se saltan columnas sin encabezado y filas vacías. */
export function matrixToObjects(matrix) {
  if (!matrix.length) return [];
  const headers = matrix[0].map((h) => String(h ?? '').trim());
  const out = [];
  for (const cells of matrix.slice(1)) {
    const obj = {};
    let any = false;
    headers.forEach((h, i) => {
      if (!h) return;
      const v = String(cells[i] ?? '').trim();
      obj[h] = v;
      if (v !== '') any = true;
    });
    if (any) out.push(obj);
  }
  return out;
}

/** Lee un archivo y devuelve las filas como objetos { encabezado: valor } */
export async function readSpreadsheet(buffer, fileName = '') {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const format = detectFormat(bytes, fileName);

  if (format === 'xls') {
    throw new Error('El formato .xls (Excel antiguo) no se admite. Abre el archivo en Excel y guárdalo como .xlsx o .csv.');
  }

  if (format === 'csv') {
    const text = new TextDecoder('utf-8').decode(bytes);
    return matrixToObjects(parseCsv(text));
  }

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('El archivo no contiene ninguna hoja');

  const matrix = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells = [];
    const last = Math.max(row.cellCount, row.actualCellCount);
    for (let c = 1; c <= last; c += 1) cells.push(cellToText(row.getCell(c).value));
    matrix.push(cells);
  });
  return matrixToObjects(matrix);
}

/** Genera el .xlsx de la plantilla y devuelve sus bytes */
export async function buildXlsx(headers, samples, sheetName = 'Pacientes') {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow(headers);
  samples.forEach((r) => sheet.addRow(r));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((col) => { col.width = 22; });
  // Las cédulas y teléfonos son texto: así Excel no les quita el cero ni las convierte en número
  [3, 4].forEach((n) => { sheet.getColumn(n).numFmt = '@'; });
  return workbook.xlsx.writeBuffer();
}

function download(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTemplate(format = 'xlsx') {
  if (format === 'xlsx') {
    const bytes = await buildXlsx(TEMPLATE_HEADERS, TEMPLATE_SAMPLES);
    download(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'plantilla_pacientes_citamed.xlsx');
  } else {
    // El BOM hace que Excel abra los acentos bien
    const csv = `﻿${toCsv([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLES])}`;
    download(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'plantilla_pacientes_citamed.csv');
  }
}
