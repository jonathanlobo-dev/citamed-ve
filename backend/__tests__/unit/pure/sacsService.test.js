const { parseSacsResponse, compareWithDoctor, normalizeMatricula, checkDoctor, sacsDecision } = require('../../../src/services/sacsService');

const XML = `<?xml version="1.0" encoding="UTF-8" ?><xjx><cmd n="js"><![CDATA[xajax_createTable('[{"fecha_registro":"2023-01-18","cedula":"24914872","codprofesion":"8","profesion":"T.S.U. EN ENFERMER&Iacute;A","nombre1":"ROOSCELIS","apellido1":"VENTURA","tomo_registro":"561","folio_registro":"21","matricula":"MPPS-148020"},{"fecha_registro":"2022-02-10","cedula":"21053073","codprofesion":"1","profesion":"M&Eacute;DICO(A) CIRUJANO(A)","nombre1":"RAYNIX","apellido1":"PINEDA","tomo_registro":"423","folio_registro":"221","matricula":"MPPS-148020"}]')]]></cmd></xjx>`;
const NOT_FOUND = `<xjx><cmd n="js"><![CDATA[Swal.fire({title: 'Información', text: 'LA MATRÍCULA INGRESADA NO EXISTE, VERIFIQUE.', icon: 'info'});]]></cmd></xjx>`;

describe('SACS', () => {
  test('normaliza el número MPPS como lo pide el SACS', () => {
    expect(normalizeMatricula('148.020')).toBe('MPPS-148020');
    expect(normalizeMatricula('MPPS-148020')).toBe('MPPS-148020');
    expect(normalizeMatricula('abc')).toBeNull();
  });

  test('lee los registros y corrige los acentos', () => {
    const rows = parseSacsResponse(XML);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ cedula: '21053073', nombre: 'RAYNIX', profesion: 'MÉDICO(A) CIRUJANO(A)', fechaRegistro: '2022-02-10' });
    expect(parseSacsResponse(NOT_FOUND)).toEqual([]);
    expect(() => parseSacsResponse('<html>otra cosa</html>')).toThrow();
  });

  test('coincide con la médica aunque el número también sea de una enfermera', () => {
    const out = compareWithDoctor(parseSacsResponse(XML), { matricula: 'MPPS-148020', firstName: 'Raynix Eleana', lastName: 'Pineda Angulo' });
    expect(out.status).toBe('match');
    expect(out.record.cedula).toBe('21053073');
  });

  test('acepta nombres compuestos del SACS', () => {
    const rows = [{ matricula: 'MPPS-1', profesion: 'MÉDICO(A) CIRUJANO(A)', nombre: 'RAFAEL FERMIN', apellido: 'PATIÑO ROJAS' }];
    expect(compareWithDoctor(rows, { matricula: 'MPPS-1', firstName: 'Rafael', lastName: 'Patino' }).status).toBe('match');
  });

  test('otro nombre con ese número no coincide', () => {
    const out = compareWithDoctor(parseSacsResponse(XML), { matricula: 'MPPS-148020', firstName: 'Pedro', lastName: 'Pérez' });
    expect(out.status).toBe('name_mismatch');
  });

  test('si solo hay registros de otra profesión no es médico', () => {
    const rows = parseSacsResponse(XML).filter((r) => r.cedula === '24914872');
    expect(compareWithDoctor(rows, { matricula: 'MPPS-148020', firstName: 'Rooscelis', lastName: 'Ventura' }).status).toBe('not_doctor');
  });

  test('un número inválido no consulta y un SACS caído no rompe', async () => {
    expect((await checkDoctor({ mpps: 'MPQA', firstName: 'A', lastName: 'B' })).status).toBe('invalid');
    const orig = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('timeout'));
    const out = await checkDoctor({ mpps: '148020', firstName: 'A', lastName: 'B' });
    global.fetch = orig;
    expect(out.status).toBe('unavailable');
    expect(out.consultUrl).toContain('sacs.gob.ve');
  });

  test('solo pide documentos cuando el SACS no confirma el MPPS', () => {
    expect(sacsDecision('match')).toEqual({ documentsRequired: false, verificationStatus: 'pending' });
    // Si el SACS no responde no se castiga al médico: queda en revisión
    expect(sacsDecision('unavailable')).toEqual({ documentsRequired: false, verificationStatus: 'pending' });
    for (const s of ['not_found', 'name_mismatch', 'not_doctor', 'invalid']) {
      expect(sacsDecision(s)).toEqual({ documentsRequired: true, verificationStatus: 'documents_incomplete' });
    }
  });
});
