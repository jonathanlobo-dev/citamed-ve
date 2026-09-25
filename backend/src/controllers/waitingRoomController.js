/**
 * WaitingRoomController - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA - Controlador de la sala de espera
 */

const waitingRoomService = require('../services/waitingRoomService');

const sendError = (res, error, defaultMessage = 'Error en sala de espera', defaultCode = 400) => {
  console.error(`[WaitingRoomController] ${defaultMessage}:`, error.message);
  const status = error.statusCode || (error.message && error.message.includes('No tienes permiso') ? 403 : defaultCode);
  return res.status(status).json({
    success: false,
    message: error.message || defaultMessage
  });
};

class WaitingRoomController {
  /**
   * POST /api/waiting-room/check-in
   * Check-in del paciente (entrar a la cola)
   */
  async checkIn(req, res) {
    try {
      const { appointmentId } = req.body;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere appointmentId'
        });
      }

      const result = await waitingRoomService.checkIn(appointmentId, req.user);

      res.json({
        success: true,
        message: '¡Check-in exitoso! Ya estás en la cola virtual.',
        data: result
      });
    } catch (error) {
      sendError(res, error, 'checkIn error', 400);
    }
  }

  /**
   * PUT /api/waiting-room/physical-check-in/:queueEntryId
   * Check-in físico (deprecated - usar confirm-arrival)
   */
  async physicalCheckIn(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.physicalCheckIn(queueEntryId, req.user);

      res.json({
        success: true,
        message: 'Check-in físico registrado',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'physicalCheckIn error', 400);
    }
  }

  /**
   * PUT /api/waiting-room/en-route/:queueEntryId
   * Marcar paciente como "en camino" (GPS detectó movimiento)
   */
  async markEnRoute(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.markEnRoute(queueEntryId, req.user);

      res.json({
        success: true,
        message: 'Marcado como en camino',
        data: {
          status: entry.status,
          queueEntryId: entry.id
        }
      });
    } catch (error) {
      sendError(res, error, 'markEnRoute error', 400);
    }
  }

  /**
   * PUT /api/waiting-room/confirm-arrival/:queueEntryId
   * Confirmar llegada física al consultorio (FASE 3)
   */
  async confirmArrival(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.confirmArrival(queueEntryId, req.user);

      res.json({
        success: true,
        message: '¡Llegada confirmada! El doctor te verá pronto.',
        data: {
          status: entry.status,
          queueEntryId: entry.id,
          position: entry.position,
          checkInTime: entry.checkInTime
        }
      });
    } catch (error) {
      sendError(res, error, 'confirmArrival error', 400);
    }
  }

  /**
   * GET /api/waiting-room/queue
   * Obtener cola del doctor actual
   */
  async getDoctorQueue(req, res) {
    try {
      const doctorId = req.user.id;
      const queueData = await waitingRoomService.getDoctorQueue(doctorId, req.user);

      res.json({
        success: true,
        data: queueData
      });
    } catch (error) {
      sendError(res, error, 'getDoctorQueue error', 500);
    }
  }

  /**
   * GET /api/waiting-room/queue/:doctorId
   * Obtener cola de un doctor específico (vista pública para pacientes)
   */
  async getQueueByDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const queueData = await waitingRoomService.getDoctorQueue(doctorId);

      // Para pacientes, ocultar información sensible (solo iniciales)
      const publicQueue = {
        queue: queueData.queue.map(entry => ({
          position: entry.position,
          status: entry.status,
          patient: {
            initials: entry.patient.initials
          },
          estimatedWaitMinutes: entry.estimatedWaitMinutes
        })),
        stats: {
          totalWaiting: queueData.stats.totalWaiting,
          avgWaitTime: queueData.stats.avgWaitTime
        }
      };

      res.json({
        success: true,
        data: publicQueue
      });
    } catch (error) {
      sendError(res, error, 'getQueueByDoctor error', 500);
    }
  }

  /**
   * GET /api/waiting-room/my-position
   * Obtener posición del paciente actual
   */
  async getMyPosition(req, res) {
    try {
      const { appointmentId } = req.query;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere appointmentId'
        });
      }

      const position = await waitingRoomService.getPatientPosition(appointmentId, req.user);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'No estás en ninguna cola'
        });
      }

      res.json({
        success: true,
        data: position
      });
    } catch (error) {
      sendError(res, error, 'getMyPosition error', 500);
    }
  }

  /**
   * GET /api/waiting-room/my-position/:appointmentId
   * Obtener mi posición para una cita específica (desde params)
   */
  async getMyPositionByAppointment(req, res) {
    try {
      const { appointmentId } = req.params;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere appointmentId'
        });
      }

      const position = await waitingRoomService.getPatientPosition(appointmentId, req.user);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'No tienes entrada en la cola para esta cita'
        });
      }

      res.json({
        success: true,
        data: {
          queueEntryId: position.entry?.id,
          position: position.position,
          status: position.entry?.status,
          estimatedWaitMinutes: position.estimatedWaitMinutes,
          appointmentsAhead: position.peopleAhead,
          originalPosition: position.entry?.originalPosition,
          joinedQueueAt: position.entry?.joinedQueueAt
        }
      });
    } catch (error) {
      sendError(res, error, 'getMyPositionByAppointment error', 500);
    }
  }

  /**
   * POST /api/waiting-room/call-next
   * Llamar al siguiente paciente
   */
  async callNext(req, res) {
    try {
      const doctorId = req.user.id;
      const entry = await waitingRoomService.callNextPatient(doctorId, req.user);

      if (!entry) {
        return res.json({
          success: true,
          message: 'No hay más pacientes en la cola',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Paciente llamado',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'callNext error', 400);
    }
  }

  /**
   * POST /api/waiting-room/call/:queueEntryId
   * Llamar a un paciente específico
   */
  async callPatient(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.callSpecificPatient(queueEntryId, req.user);

      res.json({
        success: true,
        message: 'Paciente llamado',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'callPatient error', 400);
    }
  }

  /**
   * POST /api/waiting-room/start-consultation/:queueEntryId
   * Iniciar consulta
   */
  async startConsultation(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.startConsultation(queueEntryId, req.user);

      res.json({
        success: true,
        message: 'Consulta iniciada',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'startConsultation error', 400);
    }
  }

  /**
   * POST /api/waiting-room/end-consultation/:queueEntryId
   * Finalizar consulta (acepta notas y diagnóstico)
   */
  async endConsultation(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { doctorNotes, diagnosis, actualDuration } = req.body || {};

      const entry = await waitingRoomService.endConsultation(queueEntryId, req.user, {
        doctorNotes,
        diagnosis,
        actualDuration
      });

      res.json({
        success: true,
        message: 'Consulta finalizada exitosamente',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'endConsultation error', 400);
    }
  }

  /**
   * PUT /api/waiting-room/no-show/:queueEntryId
   * Marcar paciente como no-show
   */
  async markNoShow(req, res) {
    try {
      const { queueEntryId } = req.params;
      const entry = await waitingRoomService.markNoShow(queueEntryId, req.user);

      res.json({
        success: true,
        message: 'Paciente marcado como no-show',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'markNoShow error', 400);
    }
  }

  /**
   * DELETE /api/waiting-room/cancel/:queueEntryId
   * Cancelar turno
   */
  async cancelTurn(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { reason } = req.body || {};

      const entry = await waitingRoomService.cancelTurn(queueEntryId, req.user, reason);

      res.json({
        success: true,
        message: 'Turno cancelado',
        data: entry
      });
    } catch (error) {
      sendError(res, error, 'cancelTurn error', 400);
    }
  }

  /**
   * GET /api/waiting-room/stats
   * Estadísticas del día
   */
  async getDayStats(req, res) {
    try {
      const doctorId = req.user.id;
      const { date } = req.query;

      const stats = await waitingRoomService.getDayStats(doctorId, date ? new Date(date) : null);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      sendError(res, error, 'getDayStats error', 500);
    }
  }

  /**
   * GET /api/waiting-room/chairs/:doctorId
   * Visualización de "las sillitas"
   */
  async getChairs(req, res) {
    try {
      const { doctorId } = req.params;
      const { maxChairs = 10 } = req.query;

      const chairs = await waitingRoomService.getChairsVisualization(
        doctorId,
        parseInt(maxChairs)
      );

      res.json({
        success: true,
        data: chairs
      });
    } catch (error) {
      sendError(res, error, 'getChairs error', 500);
    }
  }
}

module.exports = new WaitingRoomController();
