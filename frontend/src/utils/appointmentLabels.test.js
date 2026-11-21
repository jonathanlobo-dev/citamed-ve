import { describe, test, expect } from 'vitest';
import { appointmentStatusLabel, shortTime, ymdToDmy } from './appointmentLabels';

describe('textos de citas', () => {
  test('traduce estados y deja pasar desconocidos', () => {
    expect(appointmentStatusLabel('completed')).toBe('Atendida');
    expect(appointmentStatusLabel('otro')).toBe('otro');
  });
  test('hora sin segundos y fecha sin correrse', () => {
    expect(shortTime('14:00:00')).toBe('14:00');
    expect(ymdToDmy('2026-11-21')).toBe('21/11/2026');
  });
});
