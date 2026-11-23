/**
 * guestBookingService.js - CitaMed
 * Primera cita sin registro (público, sin sesión)
 */

import api from './api';

const guestBookingService = {
  /** Horas libres de un médico para un día: { available, reason, slots: [{ start, duration }] } */
  getSlots: (doctorProfileId, date) =>
    api.get('/guest-booking/slots', { params: { doctorProfileId, date } }).then((res) => res.data),

  /** Crea la cuenta sin reclamar y la cita pendiente */
  create: (payload) =>
    api.post('/guest-booking/appointments', payload).then((res) => res.data)
};

export default guestBookingService;
