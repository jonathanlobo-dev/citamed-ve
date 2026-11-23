import { describe, it, expect } from 'vitest';
import { formatTime12 } from '../appointmentLabels';

describe('formatTime12', () => {
  it('muestra la hora de reloj normal', () => {
    expect(formatTime12('17:30:00')).toBe('5:30 p. m.');
    expect(formatTime12('09:05')).toBe('9:05 a. m.');
    expect(formatTime12('12:00')).toBe('12:00 p. m.');
    expect(formatTime12('00:15')).toBe('12:15 a. m.');
    expect(formatTime12('')).toBe('');
  });
});
