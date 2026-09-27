/**
 * myClinicalRecordController.js - CITAMED.VE
 * M03 / Semana 6 - Controlador de historia clínica del propio paciente
 */

const clinicalRecordService = require('../services/clinicalRecordService');

class MyClinicalRecordController {
  /**
   * GET /api/patients/me/record
   */
  async getMyClinicalRecord(req, res) {
    try {
      const data = await clinicalRecordService.getMyClinicalRecord(req.user.id);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[MyClinicalRecordController] getMyClinicalRecord error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MyClinicalRecordController();
