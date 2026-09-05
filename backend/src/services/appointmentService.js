/**
 * AppointmentService - CITAMED.VE
 * M03 - Gestion de Citas
 *
 * Servicio para crear, modificar y gestionar citas medicas
 */

const { Op } = require('sequelize');
const db = require('../models');

const { Appointment, User, DoctorProfile, DoctorAvailability, AvailabilityOverride, WaitingQueue, Specialty } = db;

class AppointmentService {
  /**
   * Obtener slots disponibles para un doctor en una fecha
   */
  async getAvailableSlots(doctorProfileId, date) {
    // Parsear YYYY-MM-DD en hora LOCAL (new Date('YYYY-MM-DD') lo interpreta como UTC
    // y getDay() se evalua en hora local => desfase de un dia para Venezuela UTC-4)
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();

    // 1. Verificar overrides
    const override = await AvailabilityOverride.getForDate(doctorProfileId, date);

    if (override) {
      if (override.overrideType === 'unavailable' ||
          override.overrideType === 'vacation' ||
          override.overrideType === 'holiday') {
        return {
          available: false,
          reason: override.reason || 'El doctor no esta disponible en esta fecha',
          slots: []
        };
      }

      // Horario personalizado
      if (override.overrideType === 'custom_hours') {
        return this._generateSlotsFromOverride(doctorProfileId, date, override);
      }
    }

    // 2. Obtener disponibilidad regular
    const availabilities = await DoctorAvailability.findAll({
      where: {
        doctorProfileId,
        dayOfWeek,
        isActive: true
      },
      order: [['startTime', 'ASC']]
    });

    if (availabilities.length === 0) {
      return {
        available: false,
        reason: 'El doctor no atiende este dia de la semana',
        slots: []
      };
    }

    // 3. Obtener citas existentes
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorProfileId,
        appointmentDate: date,
        status: {
          [Op.notIn]: ['cancelled_patient', 'cancelled_doctor', 'no_show']
        }
      },
      attributes: ['appointmentTime', 'duration', 'endTime']
    });

    const bookedSlots = existingAppointments.map(apt => ({
      start: apt.appointmentTime,
      end: apt.endTime || this._calculateEndTime(apt.appointmentTime, apt.duration)
    }));

    // 4. Generar slots disponibles
    const allSlots = [];
    for (const availability of availabilities) {
      const slots = availability.generateSlots(dateObj, bookedSlots);
      allSlots.push(...slots.filter(s => s.available));
    }

    return {
      available: allSlots.length > 0,
      slots: allSlots,
      date,
      doctorProfileId
    };
  }

  /**
   * Crear una nueva cita
   * Automáticamente crea entrada en la cola virtual con posición basada en hora de cita
   * Usa transacción para prevenir double-booking (race condition)
   */
  async createAppointment(data) {
    const {
      patientId,
      doctorId,
      doctorProfileId,
      specialtyId,
      appointmentDate,
      appointmentTime,
      appointmentType = 'first_consultation',
      reasonForVisit,
      symptoms = [],
      patientNotes,
      locationType = 'clinic',
      locationAddress,
      consultationFee = 0
    } = data;

    // 1. Verificar disponibilidad inicial (sin transacción para UX rápida)
    const availability = await this.getAvailableSlots(doctorProfileId, appointmentDate);

    if (!availability.available) {
      throw new Error(availability.reason);
    }

    const isSlotAvailable = availability.slots.some(
      slot => slot.start === appointmentTime && slot.available
    );

    if (!isSlotAvailable) {
      throw new Error('El horario seleccionado no esta disponible');
    }

    // 2. Obtener duracion del slot
    const slotInfo = availability.slots.find(s => s.start === appointmentTime);
    const duration = slotInfo ? slotInfo.duration : 30;

    // 3. Usar transacción para prevenir race condition (double booking)
    const transaction = await db.sequelize.transaction();

    try {
      // 3.1 Verificar nuevamente dentro de la transacción (con lock)
      const existingAppointment = await Appointment.findOne({
        where: {
          doctorProfileId,
          appointmentDate,
          appointmentTime,
          status: {
            [Op.notIn]: ['cancelled_patient', 'cancelled_doctor', 'no_show', 'rescheduled']
          }
        },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (existingAppointment) {
        await transaction.rollback();
        throw new Error('Este horario acaba de ser reservado por otro paciente. Por favor selecciona otro horario.');
      }

      // 3.2 Crear la cita
      const appointment = await Appointment.create({
        patientId,
        doctorId,
        doctorProfileId,
        specialtyId,
        appointmentDate,
        appointmentTime,
        duration,
        appointmentType,
        reasonForVisit,
        symptoms,
        patientNotes,
        locationType,
        locationAddress,
        consultationFee,
        status: 'pending'
      }, { transaction });

      // 4. Crear entrada en la cola virtual automáticamente
      // La posición se calcula por hora de cita, con orden de booking como desempate
      try {
        const queueResult = await WaitingQueue.addToQueueByAppointmentTime({
          id: appointment.id,
          doctorId,
          patientId,
          appointmentDate,
          appointmentTime,
          duration,
          createdAt: appointment.createdAt // Para desempate por orden de booking
        }, 30, transaction);

        // Agregar info de cola al appointment para retornar al frontend
        appointment.dataValues.queueInfo = {
          queueEntryId: queueResult.entry.id,
          position: queueResult.position,
          estimatedWaitMinutes: queueResult.estimatedWaitMinutes,
          appointmentsAhead: queueResult.appointmentsAhead,
          scheduledTime: queueResult.scheduledTime
        };
      } catch (queueError) {
        console.error('Error creando entrada en cola:', queueError);
        // No fallar la cita si la cola falla, pero loguear el error
      }

      await transaction.commit();
      return appointment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Confirmar una cita
   */
  async confirmAppointment(appointmentId, confirmedBy = 'system') {
    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    if (appointment.status !== 'pending') {
      throw new Error('Solo se pueden confirmar citas pendientes');
    }

    await appointment.addStatusHistory('confirmed', `Confirmada por ${confirmedBy}`);

    return appointment;
  }

  /**
   * Cancelar una cita
   */
  async cancelAppointment(appointmentId, cancelledBy, reason) {
    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    if (!appointment.canBeCancelled()) {
      throw new Error('Esta cita no puede ser cancelada');
    }

    const cancelStatus = cancelledBy === 'patient' ? 'cancelled_patient' : 'cancelled_doctor';

    appointment.status = cancelStatus;
    appointment.cancellationReason = reason;
    appointment.cancelledBy = cancelledBy;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Remover de la cola si existe
    await WaitingQueue.destroy({
      where: { appointmentId }
    });

    return appointment;
  }

  /**
   * Reprogramar una cita
   */
  async rescheduleAppointment(appointmentId, newDate, newTime, reason) {
    const originalAppointment = await Appointment.findByPk(appointmentId);

    if (!originalAppointment) {
      throw new Error('Cita no encontrada');
    }

    if (!originalAppointment.canBeRescheduled()) {
      throw new Error('Esta cita no puede ser reprogramada');
    }

    // Verificar disponibilidad del nuevo horario
    const availability = await this.getAvailableSlots(
      originalAppointment.doctorProfileId,
      newDate
    );

    if (!availability.available) {
      throw new Error(availability.reason);
    }

    const isSlotAvailable = availability.slots.some(
      slot => slot.start === newTime && slot.available
    );

    if (!isSlotAvailable) {
      throw new Error('El nuevo horario no esta disponible');
    }

    // Crear nueva cita
    const newAppointment = await Appointment.create({
      patientId: originalAppointment.patientId,
      doctorId: originalAppointment.doctorId,
      doctorProfileId: originalAppointment.doctorProfileId,
      specialtyId: originalAppointment.specialtyId,
      appointmentDate: newDate,
      appointmentTime: newTime,
      duration: originalAppointment.duration,
      appointmentType: originalAppointment.appointmentType,
      reasonForVisit: originalAppointment.reasonForVisit,
      symptoms: originalAppointment.symptoms,
      patientNotes: originalAppointment.patientNotes,
      locationType: originalAppointment.locationType,
      locationAddress: originalAppointment.locationAddress,
      consultationFee: originalAppointment.consultationFee,
      status: 'confirmed',
      rescheduledFrom: originalAppointment.id
    });

    // Marcar original como reprogramada
    originalAppointment.status = 'rescheduled';
    originalAppointment.rescheduledTo = newAppointment.id;
    originalAppointment.cancellationReason = reason || 'Reprogramada';
    await originalAppointment.save();

    return newAppointment;
  }

  /**
   * Obtener citas del dia para un doctor
   */
  async getDoctorDayAppointments(doctorId, date = new Date()) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

    const appointments = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: dateStr,
        status: {
          [Op.notIn]: ['cancelled_patient', 'cancelled_doctor']
        }
      },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ],
      order: [['appointmentTime', 'ASC']]
    });

    return appointments;
  }

  /**
   * Obtener proximas citas de un paciente
   */
  async getPatientUpcomingAppointments(patientId) {
    const today = new Date().toISOString().split('T')[0];

    const appointments = await Appointment.findAll({
      where: {
        patientId,
        appointmentDate: { [Op.gte]: today },
        status: { [Op.in]: ['pending', 'confirmed', 'scheduled'] }
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: DoctorProfile,
          as: 'doctorProfile',
          include: [{ model: Specialty, as: 'specialty' }]
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    // Obtener estado de cola para cada cita
    const appointmentsWithQueue = await Promise.all(
      appointments.map(async (apt) => {
        const queueEntry = await WaitingQueue.findOne({
          where: {
            appointmentId: apt.id,
            status: { [Op.notIn]: ['completed', 'cancelled', 'no_show'] }
          }
        });

        const aptJson = apt.toJSON();
        aptJson.queueStatus = queueEntry ? queueEntry.status : null;
        aptJson.queuePosition = queueEntry ? queueEntry.position : null;
        aptJson.queueEntryId = queueEntry ? queueEntry.id : null;
        return aptJson;
      })
    );

    return appointmentsWithQueue;
  }

  /**
   * Obtener historial de citas de un paciente
   */
  async getPatientAppointmentHistory(patientId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Appointment.findAndCountAll({
      where: { patientId },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: DoctorProfile,
          as: 'doctorProfile',
          include: [{ model: Specialty, as: 'specialty' }]
        }
      ],
      order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
      limit,
      offset
    });

    return {
      appointments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  }

  // Helpers privados
  _calculateEndTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  async _generateSlotsFromOverride(doctorProfileId, date, override) {
    const slots = [];
    const startParts = override.startTime.split(':').map(Number);
    const endParts = override.endTime.split(':').map(Number);
    const slotDuration = override.slotDuration || 30;

    let currentHour = startParts[0];
    let currentMinute = startParts[1];

    // Obtener citas existentes
    const existingAppointments = await Appointment.findAll({
      where: {
        doctorProfileId,
        appointmentDate: date,
        status: { [Op.notIn]: ['cancelled_patient', 'cancelled_doctor', 'no_show'] }
      }
    });

    const bookedTimes = existingAppointments.map(a => a.appointmentTime);

    while (true) {
      const slotStart = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }

      if (currentHour > endParts[0] || (currentHour === endParts[0] && currentMinute > endParts[1])) {
        break;
      }

      const slotEnd = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      const isBooked = bookedTimes.includes(slotStart);

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: !isBooked,
        duration: slotDuration,
        date
      });
    }

    return {
      available: slots.some(s => s.available),
      slots,
      customHours: true,
      reason: override.reason
    };
  }
}

module.exports = new AppointmentService();
