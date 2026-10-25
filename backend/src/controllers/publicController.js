/**
 * publicController.js - CITAMED.VE
 * Semana 9 / Bloques B y C - Controladores públicos para perfil de médico y confirmación de citas
 * 
 * Reglas de seguridad:
 * - Endpoints públicos sin sesión.
 * - NUNCA devuelven correo, cédula, teléfono personal ni datos clínicos.
 * - Citas solo para fechas futuras en estado pending o confirmed.
 * - Cancelación reutiliza la función existente en appointmentService.
 */

const { DoctorProfile, User, Specialty, DoctorSpecialty, Appointment } = require('../models');
const appointmentService = require('../services/appointmentService');
const auditService = require('../services/auditService');

/**
 * GET /api/public/doctors/:slug
 * Obtiene el perfil público de un médico por su slug amigable
 */
async function getDoctorBySlug(req, res) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Identificador del médico no proporcionado.'
      });
    }

    const cleanSlug = String(slug).toLowerCase().trim();

    const profile = await DoctorProfile.findOne({
      where: { publicSlug: cleanSlug },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'isActive', 'role']
        },
        {
          model: Specialty,
          as: 'specialty',
          attributes: ['id', 'name']
        },
        {
          model: DoctorSpecialty,
          as: 'doctorSpecialties',
          include: [{
            model: Specialty,
            as: 'specialty',
            attributes: ['id', 'name']
          }]
        }
      ]
    });

    if (!profile || !profile.user || !profile.user.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado o perfil inactivo.'
      });
    }

    // Sanitización estricta: CERO datos privados (sin correo, cédula ni teléfono personal)
    const publicData = {
      doctorId: profile.userId,
      publicSlug: profile.publicSlug,
      name: `Dr(a). ${profile.firstName} ${profile.lastName}`,
      firstName: profile.firstName,
      lastName: profile.lastName,
      profilePhoto: profile.profilePhoto || null,
      specialty: profile.specialty ? { id: profile.specialty.id, name: profile.specialty.name } : null,
      subSpecialty: profile.subSpecialty || null,
      experienceYears: profile.experienceYears || 0,
      bio: profile.bio || '',
      consultationFee: profile.consultationFee ? parseFloat(profile.consultationFee) : 0,
      currency: 'USD',
      averageRating: parseFloat(profile.averageRating || profile.average_rating || 0),
      totalReviews: parseInt(profile.totalReviews || profile.total_reviews || 0, 10),
      clinicName: profile.clinicName || '',
      clinicAddress: profile.clinicAddress || '',
      city: profile.city || '',
      state: profile.state || '',
      // Solo el número de WhatsApp profesional si está configurado
      whatsappNumber: profile.whatsappNumber || null,
      languages: profile.languages && profile.languages.length > 0 ? profile.languages : ['Español'],
      treatmentApproaches: profile.treatmentApproaches || [],
      specialConditions: profile.specialConditions || [],
      telemedicineEnabled: !!profile.telemedicineEnabled,
      acceptingNewPatients: profile.acceptingNewPatients !== false
    };

    return res.json({
      success: true,
      data: publicData
    });
  } catch (error) {
    console.error('Error en getDoctorBySlug:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la información pública del médico.'
    });
  }
}

/**
 * GET /api/public/appointments/:token
 * Obtiene el resumen de una cita mediante su token de confirmación (sin datos clínicos)
 */
async function getAppointmentByToken(req, res) {
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string' || token.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Token de confirmación inválido.'
      });
    }

    const appointment = await Appointment.findOne({
      where: { confirmationToken: token.trim() },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: DoctorProfile,
          as: 'doctorProfile',
          attributes: ['clinicName', 'clinicAddress', 'city', 'profilePhoto', 'publicSlug']
        },
        {
          model: Specialty,
          as: 'specialty',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName'] // Solo primer nombre para el saludo amigable
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o el enlace no es válido.'
      });
    }

    const isUpcoming = appointment.isUpcoming();
    const canConfirmOrCancel = isUpcoming && ['pending', 'confirmed'].includes(appointment.status);

    // Sanitización estricta: CERO datos clínicos, diagnósticos, récipes o identificadores sensibles
    const publicData = {
      id: appointment.id,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime ? appointment.appointmentTime.slice(0, 5) : '',
      status: appointment.status,
      confirmedVia: appointment.confirmedVia || null,
      patientFirstName: appointment.patient?.firstName || 'Paciente',
      doctorName: `Dr(a). ${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim(),
      doctorPhoto: appointment.doctorProfile?.profilePhoto || null,
      doctorSlug: appointment.doctorProfile?.publicSlug || null,
      specialty: appointment.specialty?.name || 'Consulta Médica',
      clinicName: appointment.doctorProfile?.clinicName || appointment.locationDetails || 'Consultorio Médico',
      clinicAddress: appointment.doctorProfile?.clinicAddress || appointment.locationAddress || '',
      city: appointment.doctorProfile?.city || '',
      isUpcoming,
      canConfirmOrCancel
    };

    return res.json({
      success: true,
      data: publicData
    });
  } catch (error) {
    console.error('Error en getAppointmentByToken:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar los datos de la cita.'
    });
  }
}

/**
 * POST /api/public/appointments/:token/confirm
 * Confirma la asistencia del paciente a una cita futura
 */
async function confirmAppointment(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de confirmación no proporcionado.'
      });
    }

    const appointment = await Appointment.findOne({
      where: { confirmationToken: token.trim() }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o el enlace no es válido.'
      });
    }

    if (!appointment.isUpcoming()) {
      return res.status(400).json({
        success: false,
        message: 'Esta cita ya pasó y no puede ser confirmada.'
      });
    }

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `La cita no puede ser confirmada porque su estado actual es ${appointment.status}.`
      });
    }

    const via = req.body.via ? String(req.body.via).slice(0, 20) : 'whatsapp';

    appointment.status = 'confirmed';
    appointment.confirmedVia = via;
    appointment.confirmationSent = true;
    await appointment.save();

    // Auditoría
    try {
      await auditService.log({
        userId: appointment.patientId,
        action: 'appointment_confirmed_via_link',
        resource: 'appointment',
        resourceId: appointment.id,
        metadata: {
          confirmedVia: via,
          token,
          ipAddress: req.ip
        }
      });
    } catch (auditErr) {
      console.warn('Error registrando auditoría de confirmación:', auditErr.message);
    }

    return res.json({
      success: true,
      message: '¡Asistencia confirmada con éxito! Te esperamos en tu consulta.',
      data: {
        status: 'confirmed',
        confirmedVia: via
      }
    });
  } catch (error) {
    console.error('Error en confirmAppointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al confirmar la asistencia a la cita.'
    });
  }
}

/**
 * POST /api/public/appointments/:token/cancel
 * Cancela la cita futura a solicitud del paciente
 */
async function cancelAppointment(req, res) {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de confirmación no proporcionado.'
      });
    }

    const appointment = await Appointment.findOne({
      where: { confirmationToken: token.trim() }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o el enlace no es válido.'
      });
    }

    if (!appointment.isUpcoming()) {
      return res.status(400).json({
        success: false,
        message: 'Esta cita ya pasó y no puede ser cancelada.'
      });
    }

    if (!appointment.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Esta cita no puede ser cancelada en su estado actual.'
      });
    }

    const rawReason = req.body.reason ? String(req.body.reason).trim().slice(0, 300) : '';
    const reason = rawReason || 'Cancelada por el paciente desde enlace de WhatsApp';

    // REUTILIZAR la función existente en appointmentService (Regla del plan)
    await appointmentService.cancelAppointment(appointment.id, 'patient', reason);

    // Marcar canal de cancelación
    appointment.confirmedVia = 'whatsapp';
    await appointment.save();

    // Auditoría
    try {
      await auditService.log({
        userId: appointment.patientId,
        action: 'appointment_cancelled_via_link',
        resource: 'appointment',
        resourceId: appointment.id,
        metadata: {
          cancelledVia: 'whatsapp',
          reason,
          token,
          ipAddress: req.ip
        }
      });
    } catch (auditErr) {
      console.warn('Error registrando auditoría de cancelación:', auditErr.message);
    }

    return res.json({
      success: true,
      message: 'Tu cita ha sido cancelada exitosamente.',
      data: {
        status: 'cancelled_patient'
      }
    });
  } catch (error) {
    console.error('Error en cancelAppointment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al cancelar la cita.'
    });
  }
}

module.exports = {
  getDoctorBySlug,
  getAppointmentByToken,
  confirmAppointment,
  cancelAppointment
};
