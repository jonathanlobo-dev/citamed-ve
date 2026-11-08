import { describe, test, expect } from 'vitest';
import { SCHEDULE_PARTS, partOfTime } from './scheduleBlocks';

describe('bloques de atención', () => {
  test('son mañana, tarde y noche, en ese orden', () => {
    expect(SCHEDULE_PARTS.map((p) => p.label)).toEqual(['Mañana', 'Tarde', 'Noche']);
    expect(SCHEDULE_PARTS.map((p) => p.key)).toEqual(['morning', 'afternoon', 'evening']);
  });
  test('cada bloque empieza antes de terminar y no se solapan', () => {
    SCHEDULE_PARTS.forEach((p) => expect(p.startTime < p.endTime).toBe(true));
    for (let i = 1; i < SCHEDULE_PARTS.length; i += 1) {
      expect(SCHEDULE_PARTS[i - 1].endTime <= SCHEDULE_PARTS[i].startTime).toBe(true);
    }
  });
  test('las horas sugeridas caen en su propio bloque', () => {
    SCHEDULE_PARTS.forEach((p) => expect(partOfTime(p.startTime).key).toBe(p.key));
  });
});

describe('partOfTime', () => {
  test.each([
    ['00:00', 'morning'], ['06:30', 'morning'], ['08:00', 'morning'], ['11:59', 'morning'],
    ['12:00', 'afternoon'], ['13:00', 'afternoon'], ['17:59', 'afternoon'],
    ['18:00', 'evening'], ['21:00', 'evening'], ['23:30', 'evening'],
    ['08:00:00', 'morning'], ['14:30:00', 'afternoon'], ['19:00:00', 'evening']
  ])('%s => %s', (time, key) => {
    expect(partOfTime(time).key).toBe(key);
  });
  test.each([[''], [null], [undefined], ['abc']])('sin hora válida (%p) se toma como mañana', (v) => {
    expect(partOfTime(v).key).toBe('morning');
  });
});
