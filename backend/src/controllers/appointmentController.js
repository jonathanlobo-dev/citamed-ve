/**
 * AppointmentController - CITAMED.VE
 * M03 - Gestion de Citas
 */

const appointmentService = require('../services/appointmentService');
const reminderService = require('../services/reminderService');
const db = require('../models');

const { Appointment, DoctorProfile } = db;

class AppointmentController {
  /**
   * GET /api/appointments/available-slots
   * Obtener slots disponibles para un doctor
   */
  async getAvailableSlots(req, res) {
    try {
      const { doctorProfileId, date } = req.query;

      if (!doctorProfileId || !date) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere doctorProfileId y date'
        });
      }

      const result = await appointmentService.getAvailableSlots(doctorProfileId, date);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[AppointmentController] getAvailableSlots error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo slots disponibles',
        error: error.message
      });
    }
  }

  /**
   * POST /api/appointments
   * Crear una nueva cita
   */
  async create(req, res) {
    try {
      const patientId = req.user.id;
      const {
        doctorId,
        doctorProfileId,
        specialtyId,
        appointmentDate,
        appointmentTime,
        appointmentType,
        reasonForVisit,
        symptoms,
        patientNotes,
        locationType,
        locationAddress
      } = req.body;

      // Obtener fee del doctor
      const doctorProfile = await DoctorProfile.findByPk(doctorProfileId);
      const consultationFee = doctorProfile?.consultationFee || 0;

      const appointment = await appointmentService.createAppointment({
        patientId,
        doctorId,
        doctorProfileId,
        specialtyId,
        appointmentDate,
        appointmentTime,
        appointmentType,
        reasonForVisit,
        symptoms,
        patientNotes,
        locationType,
        locationAddress,
        consultationFee
      });

      // Enviar confirmacion
      await reminderService.sendAppointmentConfirmation(appointment);

      res.status(201).json({
        success: true,
        message: 'Cita creada exitosamente',
        data: appointment
      });
    } catch (error) {
      console.error('[AppointmentController] create error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/appointments/:id/confirm
   * Confirmar una cita
   */
  async confirm(req, res) {
    try {
      const { id } = req.params;
      const confirmedBy = req.user.role;

      const appointment = await appointmentService.confirmAppointment(id, confirmedBy);

      res.json({
        success: true,
        message: 'Cita confirmada',
        data: appointment
      });
    } catch (error) {
      console.error('[AppointmentController] confirm error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/appointments/:id/cancel
   * Cancelar una cita
   */
  async cancel(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledBy = req.user.role === 'doctor' ? 'doctor' : 'patient';

      const appointment = await appointmentService.cancelAppointment(id, cancelledBy, reason);

      // Notificar
      await reminderService.sendCancellationNotification(appointment, cancelledBy);

      res.json({
        success: true,
        message: 'Cita cancelada',
        data: appointment
      });
    } catch (error) {
      console.error('[AppointmentController] cancel error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/appointments/:id/reschedule
   * Reprogramar una cita
   */
  async reschedule(req, res) {
    try {
      const { id } = req.params;
      const { newDate, newTime, reason } = req.body;

      if (!newDate || !newTime) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere newDate y newTime'
        });
      }

      const newAppointment = await appointmentService.rescheduleAppointment(
        id,
        newDate,
        newTime,
        reason
      );

      // Enviar confirmacion de la nueva cita
      await reminderService.sendAppointmentConfirmation(newAppointment);

      res.json({
        success: true,
        message: 'Cita reprogramada exitosamente',
        data: newAppointment
      });
    } catch (error) {
      console.error('[AppointmentController] reschedule error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/appointments/my
   * Obtener citas del usuario actual
   */
  async getMyAppointments(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10, upcoming = 'true' } = req.query;

      let appointments;

      if (upcoming === 'true') {
        if (userRole === 'patient') {
          appointments = await appointmentService.getPatientUpcomingAppointments(userId);
        } else if (userRole === 'doctor') {
          appointments = await appointmentService.getDoctorDayAppointments(userId);
        }

        return res.json({
          success: true,
          data: appointments
        });
      }

      // Historial paginado
      const history = await appointmentService.getPatientAppointmentHistory(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('[AppointmentController] getMyAppointments error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo citas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/appointments/:id
   * Obtener detalle de una cita
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const appointment = await Appointment.findByPk(id, {
        include: [
          { model: db.User, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
          { model: db.User, as: 'doctor', attributes: ['id', 'firstName', 'lastName', 'email'] },
          {
            model: db.DoctorProfile,
            as: 'doctorProfile',
            include: [{ model: db.Specialty, as: 'specialty' }]
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Cita no encontrada'
        });
      }

      // Verificar acceso
      if (appointment.patientId !== userId && appointment.doctorId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes acceso a esta cita'
        });
      }

      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      console.error('[AppointmentController] getById error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cita',
        error: error.message
      });
    }
  }

  /**
   * GET /api/appointments/doctor/today
   * Obtener citas del dia para el doctor actual
   */
  async getDoctorToday(req, res) {
    try {
      const doctorId = req.user.id;
      const { date } = req.query;

      const appointments = await appointmentService.getDoctorDayAppointments(
        doctorId,
        date || new Date()
      );

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('[AppointmentController] getDoctorToday error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo citas del dia',
        error: error.message
      });
    }
  }
}

module.exports = new AppointmentController();
