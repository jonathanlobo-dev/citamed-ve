/**
 * doctorPatientsController.js - CITAMED.VE
 * M03 / Semana 6 - Controlador de pacientes y ficha clínica para el médico
 */

const clinicalRecordService = require('../services/clinicalRecordService');

class DoctorPatientsController {
  /**
   * GET /api/doctor/patients
   */
  async getDoctorPatients(req, res) {
    try {
      const data = await clinicalRecordService.getDoctorPatients(req.user.id, req.query);
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[DoctorPatientsController] getDoctorPatients error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/doctor/patients/:patientId/record
   */
  async getPatientRecordForDoctor(req, res) {
    try {
      const data = await clinicalRecordService.getPatientRecordForDoctor(
        req.params.patientId,
        req.user.id,
        req.user.role
      );
      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[DoctorPatientsController] getPatientRecordForDoctor error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/doctor/patients/:patientId/allergies
   */
  async addPatientAllergy(req, res) {
    try {
      const allergy = await clinicalRecordService.addPatientAllergy(
        req.params.patientId,
        req.user.id,
        req.user.role,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Alergia registrada exitosamente',
        data: allergy
      });
    } catch (error) {
      console.error('[DoctorPatientsController] addPatientAllergy error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/doctor/patients/:patientId/conditions
   */
  async addPatientCondition(req, res) {
    try {
      const condition = await clinicalRecordService.addPatientCondition(
        req.params.patientId,
        req.user,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Condición / antecedente registrado exitosamente',
        data: condition
      });
    } catch (error) {
      console.error('[DoctorPatientsController] addPatientCondition error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new DoctorPatientsController();
