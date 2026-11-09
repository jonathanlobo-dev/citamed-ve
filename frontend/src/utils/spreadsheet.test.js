import { describe, test, expect } from 'vitest';
import ExcelJS from 'exceljs';
import {
  parseCsv, toCsv, cellToText, matrixToObjects, detectFormat, readSpreadsheet, buildXlsx, TEMPLATE_HEADERS, TEMPLATE_SAMPLES
} from './spreadsheet';

const enc = (s) => new TextEncoder().encode(s);

describe('parseCsv', () => {
  test('coma, filas y encabezados', () => {
    expect(parseCsv('a,b\n1,2\n3,4')).toEqual([['a', 'b'], ['1', '2'], ['3', '4']]);
  });
  test('Excel en español exporta con punto y coma', () => {
    expect(parseCsv('nombre;cedula\nAna;V-123')).toEqual([['nombre', 'cedula'], ['Ana', 'V-123']]);
  });
  test('tabulador', () => {
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  test('comillas, comas dentro y comillas escapadas', () => {
    expect(parseCsv('a,b\n"Pérez, Ana","dijo ""hola"""')).toEqual([['a', 'b'], ['Pérez, Ana', 'dijo "hola"']]);
  });
  test('salto de línea dentro de comillas', () => {
    expect(parseCsv('a,b\n"línea 1\nlínea 2",x')).toEqual([['a', 'b'], ['línea 1\nlínea 2', 'x']]);
  });
  test('fin de línea de Windows y BOM', () => {
    expect(parseCsv('﻿a,b\r\n1,2\r\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  test('sin salto final y vacío', () => {
    expect(parseCsv('a,b\n1,2')).toHaveLength(2);
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv(null)).toEqual([]);
  });
  test('celdas vacías se conservan', () => {
    expect(parseCsv('a,b,c\n1,,3')).toEqual([['a', 'b', 'c'], ['1', '', '3']]);
  });
});

describe('toCsv', () => {
  test('ida y vuelta con comas, comillas y saltos', () => {
    const m = [['a', 'b'], ['Pérez, Ana', 'dijo "hola"'], ['x\ny', '']];
    expect(parseCsv(toCsv(m))).toEqual(m);
  });
  test('nulos como vacío', () => {
    expect(toCsv([[null, undefined, 0]])).toBe(',,0');
  });
});

describe('cellToText', () => {
  test.each([
    [null, ''], [undefined, ''], ['hola', 'hola'], [42, '42'], [18234567, '18234567'], [true, 'true']
  ])('%p => %p', (v, e) => { expect(cellToText(v)).toBe(e); });
  test('fecha: se lee en UTC para no correr el día', () => {
    expect(cellToText(new Date(Date.UTC(1985, 3, 12)))).toBe('1985-04-12');
    expect(cellToText(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-01-01');
  });
  test('texto con formato, fórmulas, enlaces y errores', () => {
    expect(cellToText({ richText: [{ text: 'Ana ' }, { text: 'Pérez' }] })).toBe('Ana Pérez');
    expect(cellToText({ formula: 'A1+1', result: 5 })).toBe('5');
    expect(cellToText({ text: 'correo', hyperlink: 'mailto:a@b.com' })).toBe('correo');
    expect(cellToText({ error: '#N/A' })).toBe('');
  });
});

describe('matrixToObjects', () => {
  test('usa la primera fila como encabezados y salta filas vacías', () => {
    expect(matrixToObjects([['a', 'b'], ['1', '2'], ['', ''], ['3', '']])).toEqual([{ a: '1', b: '2' }, { a: '3', b: '' }]);
  });
  test('ignora columnas sin encabezado y recorta espacios', () => {
    expect(matrixToObjects([[' a ', '', 'c'], [' 1 ', 'x', '3']])).toEqual([{ a: '1', c: '3' }]);
  });
  test('solo encabezados o vacío => sin filas', () => {
    expect(matrixToObjects([['a', 'b']])).toEqual([]);
    expect(matrixToObjects([])).toEqual([]);
  });
});

describe('detectFormat', () => {
  test('un .xlsx es un zip (PK)', () => { expect(detectFormat(new Uint8Array([0x50, 0x4b, 3, 4]), 'datos.csv')).toBe('xlsx'); });
  test('el Excel antiguo se reconoce aunque se haya renombrado', () => {
    expect(detectFormat(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0]), 'datos.xlsx')).toBe('xls');
  });
  test('texto es csv', () => { expect(detectFormat(enc('a,b'), 'datos.csv')).toBe('csv'); });
});

describe('readSpreadsheet', () => {
  test('lee un CSV', async () => {
    const rows = await readSpreadsheet(enc('nombre,cedula\nAna,V-123\nLuis,V-456'), 'p.csv');
    expect(rows).toEqual([{ nombre: 'Ana', cedula: 'V-123' }, { nombre: 'Luis', cedula: 'V-456' }]);
  });
  test('rechaza el formato .xls con un mensaje claro', async () => {
    await expect(readSpreadsheet(new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0, 0]), 'viejo.xls')).rejects.toThrow(/\.xls/);
  });
  test('la plantilla oficial se lee de vuelta tal cual (ida y vuelta por .xlsx)', async () => {
    const bytes = await buildXlsx(TEMPLATE_HEADERS, TEMPLATE_SAMPLES);
    const rows = await readSpreadsheet(bytes, 'plantilla.xlsx');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ nombre: 'Carlos', apellido: 'Mendoza', cedula: 'V-18234567', telefono: '04141234567', fecha_nacimiento: '1985-04-12' });
    expect(rows[1].alergias).toBe('');
    expect(rows[2]).toMatchObject({ nombre: 'Andrés', cedula: 'E-82345678' });
  });
  test('números y fechas reales de Excel llegan como texto', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Hoja1');
    ws.addRow(['nombre', 'cedula', 'telefono', 'fecha_nacimiento']);
    ws.addRow(['Ana', 18234567, 4141234567, new Date(Date.UTC(1990, 5, 15))]);
    ws.addRow(['', '', '', '']);
    ws.addRow(['Luis', 20111222, '04249876543', '1988-11-03']);
    const rows = await readSpreadsheet(await wb.xlsx.writeBuffer(), 'x.xlsx');
    expect(rows).toEqual([
      { nombre: 'Ana', cedula: '18234567', telefono: '4141234567', fecha_nacimiento: '1990-06-15' },
      { nombre: 'Luis', cedula: '20111222', telefono: '04249876543', fecha_nacimiento: '1988-11-03' }
    ]);
  });
  test('un libro sin hojas se rechaza o queda vacío, nunca revienta', async () => {
    const wb = new ExcelJS.Workbook();
    const rows = await readSpreadsheet(await wb.xlsx.writeBuffer(), 'vacio.xlsx').catch((e) => e.message);
    expect(rows === 'El archivo no contiene ninguna hoja' || (Array.isArray(rows) && rows.length === 0)).toBe(true);
  });
  test('una hoja con solo encabezados no tiene filas', async () => {
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet('H').addRow(['nombre', 'cedula']);
    expect(await readSpreadsheet(await wb.xlsx.writeBuffer(), 'h.xlsx')).toEqual([]);
  });
});
