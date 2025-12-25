/**
 * WaitingRoomController - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA - Controlador de la sala de espera
 */

const waitingRoomService = require('../services/waitingRoomService');

class WaitingRoomController {
  /**
   * POST /api/waiting-room/check-in
   * Check-in del paciente (entrar a la cola)
   */
  async checkIn(req, res) {
    try {
      const { appointmentId } = req.body;
      const patientId = req.user.id;

      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere appointmentId'
        });
      }

      const result = await waitingRoomService.checkIn(appointmentId);

      res.json({
        success: true,
        message: 'Check-in exitoso! Ya estas en la cola virtual.',
        data: result
      });
    } catch (error) {
      console.error('[WaitingRoomController] checkIn error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/waiting-room/physical-check-in/:queueEntryId
   * Check-in fisico (cuando el paciente llega al consultorio)
   */
  async physicalCheckIn(req, res) {
    try {
      const { queueEntryId } = req.params;

      const entry = await waitingRoomService.physicalCheckIn(queueEntryId);

      res.json({
        success: true,
        message: 'Check-in fisico registrado',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] physicalCheckIn error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/waiting-room/queue
   * Obtener cola del doctor actual
   */
  async getDoctorQueue(req, res) {
    try {
      const doctorId = req.user.id;

      const queueData = await waitingRoomService.getDoctorQueue(doctorId);

      res.json({
        success: true,
        data: queueData
      });
    } catch (error) {
      console.error('[WaitingRoomController] getDoctorQueue error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cola',
        error: error.message
      });
    }
  }

  /**
   * GET /api/waiting-room/queue/:doctorId
   * Obtener cola de un doctor especifico (para pacientes)
   */
  async getQueueByDoctor(req, res) {
    try {
      const { doctorId } = req.params;

      const queueData = await waitingRoomService.getDoctorQueue(doctorId);

      // Para pacientes, ocultar informacion sensible
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
      console.error('[WaitingRoomController] getQueueByDoctor error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo cola',
        error: error.message
      });
    }
  }

  /**
   * GET /api/waiting-room/my-position
   * Obtener posicion del paciente actual
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

      const position = await waitingRoomService.getPatientPosition(appointmentId);

      if (!position) {
        return res.status(404).json({
          success: false,
          message: 'No estas en ninguna cola'
        });
      }

      res.json({
        success: true,
        data: position
      });
    } catch (error) {
      console.error('[WaitingRoomController] getMyPosition error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo posicion',
        error: error.message
      });
    }
  }

  /**
   * POST /api/waiting-room/call-next
   * Llamar al siguiente paciente
   */
  async callNext(req, res) {
    try {
      const doctorId = req.user.id;

      const entry = await waitingRoomService.callNextPatient(doctorId);

      if (!entry) {
        return res.json({
          success: true,
          message: 'No hay mas pacientes en la cola',
          data: null
        });
      }

      res.json({
        success: true,
        message: 'Paciente llamado',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] callNext error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/waiting-room/call/:queueEntryId
   * Llamar a un paciente especifico
   */
  async callPatient(req, res) {
    try {
      const { queueEntryId } = req.params;

      const entry = await waitingRoomService.callSpecificPatient(queueEntryId);

      res.json({
        success: true,
        message: 'Paciente llamado',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] callPatient error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/waiting-room/start-consultation/:queueEntryId
   * Iniciar consulta
   */
  async startConsultation(req, res) {
    try {
      const { queueEntryId } = req.params;

      const entry = await waitingRoomService.startConsultation(queueEntryId);

      res.json({
        success: true,
        message: 'Consulta iniciada',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] startConsultation error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/waiting-room/end-consultation/:queueEntryId
   * Finalizar consulta
   */
  async endConsultation(req, res) {
    try {
      const { queueEntryId } = req.params;

      const entry = await waitingRoomService.endConsultation(queueEntryId);

      res.json({
        success: true,
        message: 'Consulta finalizada',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] endConsultation error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/waiting-room/no-show/:queueEntryId
   * Marcar paciente como no-show
   */
  async markNoShow(req, res) {
    try {
      const { queueEntryId } = req.params;

      const entry = await waitingRoomService.markNoShow(queueEntryId);

      res.json({
        success: true,
        message: 'Paciente marcado como no-show',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] markNoShow error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/waiting-room/cancel/:queueEntryId
   * Cancelar turno
   */
  async cancelTurn(req, res) {
    try {
      const { queueEntryId } = req.params;
      const { reason } = req.body;

      const entry = await waitingRoomService.cancelTurn(queueEntryId, reason);

      res.json({
        success: true,
        message: 'Turno cancelado',
        data: entry
      });
    } catch (error) {
      console.error('[WaitingRoomController] cancelTurn error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/waiting-room/stats
   * Estadisticas del dia
   */
  async getDayStats(req, res) {
    try {
      const doctorId = req.user.id;
      const { date } = req.query;

      const stats = await waitingRoomService.getDayStats(doctorId, date ? new Date(date) : new Date());

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[WaitingRoomController] getDayStats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadisticas',
        error: error.message
      });
    }
  }

  /**
   * GET /api/waiting-room/chairs
   * Visualizacion de "las sillitas"
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
      console.error('[WaitingRoomController] getChairs error:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo visualizacion',
        error: error.message
      });
    }
  }
}

module.exports = new WaitingRoomController();
