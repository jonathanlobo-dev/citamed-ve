/**
 * Prescription Controller - CITAMED.VE
 * M03 / Semana 5 - Controlador de récipes médicos
 */

const prescriptionService = require('../services/prescriptionService');
const prescriptionPdfService = require('../services/prescriptionPdfService');

/**
 * Emite un nuevo récipe médico
 */
async function create(req, res) {
  try {
    const { appointmentId, items, indications } = req.body;
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        error: 'El ID de la cita (appointmentId) es obligatorio'
      });
    }

    const prescription = await prescriptionService.createPrescription({
      appointmentId: parseInt(appointmentId, 10),
      user: req.user,
      items,
      indications
    });

    return res.status(201).json({
      success: true,
      message: 'Récipe médico emitido exitosamente',
      data: prescription
    });
  } catch (err) {
    console.error('Error in prescriptionController.create:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error al emitir el récipe médico'
    });
  }
}

/**
 * Obtiene los récipes emitidos para una cita
 */
async function getByAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const prescriptions = await prescriptionService.getPrescriptionsByAppointment(
      parseInt(appointmentId, 10),
      req.user
    );

    return res.json({
      success: true,
      data: prescriptions
    });
  } catch (err) {
    console.error('Error in prescriptionController.getByAppointment:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error al obtener récipes de la cita'
    });
  }
}

/**
 * Genera y descarga el PDF del récipe médico
 */
async function downloadPdf(req, res) {
  try {
    const { id } = req.params;
    const prescription = await prescriptionService.getPrescriptionForUser(
      parseInt(id, 10),
      req.user
    );

    const pdfBuffer = await prescriptionPdfService.generatePrescriptionPdf(prescription);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recipe-CitaMed-${prescription.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (err) {
    console.error('Error in prescriptionController.downloadPdf:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error al generar PDF del récipe'
    });
  }
}

/**
 * Anula un récipe médico
 */
async function voidPrescription(req, res) {
  try {
    const { id } = req.params;
    const prescription = await prescriptionService.voidPrescription(
      parseInt(id, 10),
      req.user
    );

    return res.json({
      success: true,
      message: 'Récipe anulado exitosamente',
      data: prescription
    });
  } catch (err) {
    console.error('Error in prescriptionController.voidPrescription:', err);
    return res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Error al anular el récipe'
    });
  }
}

/**
 * Verificación pública de récipe médico (sin autenticación, con rate limit)
 */
async function verify(req, res) {
  try {
    const { code } = req.params;
    const result = await prescriptionService.verifyPrescription(code);

    if (!result.valid && result.message === 'Récipe no encontrado') {
      return res.status(404).json({
        success: false,
        valid: false,
        error: 'Récipe no encontrado'
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error in prescriptionController.verify:', err);
    return res.status(500).json({
      success: false,
      error: 'Error al verificar récipe'
    });
  }
}

module.exports = {
  create,
  getByAppointment,
  downloadPdf,
  voidPrescription,
  verify
};
