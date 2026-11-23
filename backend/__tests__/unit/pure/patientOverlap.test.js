const { findPatientOverlap } = require('../../../src/utils/patientOverlap');

describe('citas del paciente que se cruzan', () => {
  const day = [
    { id: 1, appointmentTime: '16:30:00', duration: 30, status: 'pending' },
    { id: 2, appointmentTime: '17:30:00', duration: 30, status: 'confirmed' },
    { id: 3, appointmentTime: '09:00:00', duration: 30, status: 'cancelled_patient' }
  ];

  test('misma hora con otro médico se bloquea', () => {
    expect(findPatientOverlap(day, '17:30', 30)?.id).toBe(2);
  });

  test('una cita que empieza en medio de otra se bloquea', () => {
    expect(findPatientOverlap(day, '16:45', 30)?.id).toBe(1);
  });

  test('una cita justo al terminar la otra se permite', () => {
    expect(findPatientOverlap(day, '17:00', 30)).toBeNull();
    expect(findPatientOverlap(day, '18:00', 30)).toBeNull();
  });

  test('las canceladas no cuentan y al reprogramar se ignora la propia cita', () => {
    expect(findPatientOverlap(day, '09:00', 30)).toBeNull();
    expect(findPatientOverlap(day, '17:30', 30, 2)).toBeNull();
  });
});
