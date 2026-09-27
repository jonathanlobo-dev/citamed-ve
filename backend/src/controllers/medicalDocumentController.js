/**
 * medicalDocumentController.js - CITAMED.VE
 * M03 / Semana 6 - Controlador para emisión, consulta, descarga y verificación de documentos médicos
 */

const medicalDocumentService = require('../services/medicalDocumentService');
const { generateMedicalDocumentPdf } = require('../services/medicalDocumentPdfService');

class MedicalDocumentController {
  /**
   * POST /api/medical-documents
   * Emitir documento médico (doctor/admin)
   */
  async create(req, res) {
    try {
      const doc = await medicalDocumentService.createDocument(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Documento emitido exitosamente',
        data: doc
      });
    } catch (error) {
      console.error('[MedicalDocumentController] create error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/patient/:patientId
   * Obtener documentos de un paciente con reglas de privacidad
   */
  async getByPatient(req, res) {
    try {
      const docs = await medicalDocumentService.getDocumentsByPatient(req.params.patientId, req.user);
      res.json({
        success: true,
        data: docs
      });
    } catch (error) {
      console.error('[MedicalDocumentController] getByPatient error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/:id/pdf
   * Descargar documento médico en PDF
   */
  async downloadPdf(req, res) {
    try {
      const doc = await medicalDocumentService.getDocumentForUser(req.params.id, req.user);

      if (doc.type === 'attachment') {
        return res.status(400).json({
          success: false,
          message: 'Los archivos adjuntos deben descargarse desde el endpoint de archivos'
        });
      }

      const pdfBuffer = await generateMedicalDocumentPdf(doc);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.type}-${doc.verificationCode}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[MedicalDocumentController] downloadPdf error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/medical-documents/:id/void
   * Anular un documento médico emitido (doctor/admin)
   */
  async void(req, res) {
    try {
      const doc = await medicalDocumentService.voidDocument(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Documento anulado exitosamente',
        data: doc
      });
    } catch (error) {
      console.error('[MedicalDocumentController] void error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/verify/:code
   * Verificación pública unificada
   */
  async verify(req, res) {
    try {
      const result = await medicalDocumentService.verifyDocument(req.params.code);
      if (!result.valid && result.message === 'Documento no encontrado') {
        return res.status(404).json({
          success: false,
          data: result
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[MedicalDocumentController] verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar el documento',
        error: error.message
      });
    }
  }
}

module.exports = new MedicalDocumentController();
