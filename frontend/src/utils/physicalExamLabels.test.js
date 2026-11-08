import { describe, test, expect } from 'vitest';
import {
  EXAM_SYSTEM_LABELS, SEVERITY_LABELS, ALLERGY_TYPE_LABELS, CONDITION_STATUS_LABELS, examSystemLabel, labelOf
} from './physicalExamLabels';

describe('etiquetas del examen físico', () => {
  test.each(Object.entries(EXAM_SYSTEM_LABELS))('%s se muestra como "%s"', (key, label) => {
    expect(examSystemLabel(key)).toBe(label);
    expect(label.length).toBeGreaterThan(2);
  });
  test('un sistema desconocido se muestra tal cual', () => {
    expect(examSystemLabel('sistemaNuevo')).toBe('sistemaNuevo');
  });
  test('el examen físico cubre los sistemas que valida el servidor', () => {
    ['general', 'headNeck', 'cardiovascular', 'abdomen', 'skin'].forEach((k) => {
      expect(Object.keys(EXAM_SYSTEM_LABELS)).toContain(k);
    });
  });
});

describe('labelOf', () => {
  test.each([['SEVERITY_LABELS', SEVERITY_LABELS], ['ALLERGY_TYPE_LABELS', ALLERGY_TYPE_LABELS], ['CONDITION_STATUS_LABELS', CONDITION_STATUS_LABELS]])('%s', (_n, map) => {
    Object.entries(map).forEach(([k, v]) => expect(labelOf(map, k)).toBe(v));
    expect(labelOf(map, 'otro')).toBe('otro');
    expect(labelOf(map, '')).toBe('');
    expect(labelOf(map, null)).toBe('');
  });
});
