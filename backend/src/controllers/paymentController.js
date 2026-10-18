/**
 * paymentController.js - CITAMED.VE
 * M05 / Semana 8 - Controlador para cobros, métodos de pago y validación
 */

const paymentService = require('../services/paymentService');
const { VENEZUELAN_BANKS } = require('../utils/venezuelanBanks');
const { generatePaymentReceiptPdf } = require('../services/paymentReceiptPdfService');

// Una carrera entre dos reportes iguales choca con los índices únicos: se responde 409, no 500
const statusOf = (error, fallback) =>
  error.name === 'SequelizeUniqueConstraintError' ? 409 : (error.statusCode || fallback);

class PaymentController {
  /**
   * GET /api/payments/banks
   * Lista de bancos venezolanos oficiales
   */
  async getBanks(req, res) {
    try {
      res.json({
        success: true,
        data: VENEZUELAN_BANKS
      });
    } catch (error) {
      console.error('[PaymentController] getBanks error:', error);
      res.status(500).json({ success: false, message: 'Error al obtener la lista de bancos' });
    }
  }

  /**
   * GET /api/payments/settings
   * Métodos de cobro del médico autenticado
   */
  async getSettings(req, res) {
    try {
      const settings = await paymentService.getSettings(req.user.id);
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('[PaymentController] getSettings error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * PUT /api/payments/settings
   * Actualiza los métodos de cobro del médico
   */
  async updateSettings(req, res) {
    try {
      const updated = await paymentService.updateSettings(req.user.id, req.body, req.user);
      res.json({
        success: true,
        message: 'Métodos de cobro actualizados exitosamente',
        data: updated
      });
    } catch (error) {
      console.error('[PaymentController] updateSettings error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/appointment/:appointmentId
   * Resumen de pago de una consulta
   */
  async getAppointmentSummary(req, res) {
    try {
      const summary = await paymentService.getAppointmentSummary(req.params.appointmentId, req.user);
      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('[PaymentController] getAppointmentSummary error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * POST /api/payments/report
   * Paciente reporta su pago
   */
  async reportPayment(req, res) {
    try {
      const payload = {
        ...req.body,
        appointmentId: req.params.appointmentId || req.body.appointmentId
      };
      const payment = await paymentService.reportPayment(payload, req.user);
      res.status(201).json({
        success: true,
        message: 'Pago reportado exitosamente. El médico validará la recepción.',
        data: payment
      });
    } catch (error) {
      console.error('[PaymentController] reportPayment error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * POST /api/payments/record
   * Médico registra un cobro directo en consulta
   */
  async recordPayment(req, res) {
    try {
      const payload = {
        ...req.body,
        appointmentId: req.params.appointmentId || req.body.appointmentId
      };
      const payment = await paymentService.recordPayment(payload, req.user);
      res.status(201).json({
        success: true,
        message: 'Cobro registrado exitosamente y recibo emitido.',
        data: payment
      });
    } catch (error) {
      console.error('[PaymentController] recordPayment error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * PUT /api/payments/:id/approve
   * Médico aprueba un pago reportado
   */
  async approve(req, res) {
    try {
      const payment = await paymentService.approve(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Pago aprobado y recibo generado exitosamente',
        data: payment
      });
    } catch (error) {
      console.error('[PaymentController] approve error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * PUT /api/payments/:id/reject
   * Médico rechaza un pago reportado con motivo
   */
  async reject(req, res) {
    try {
      const reason = req.body.reason || req.body.rejectionReason || req.body.reviewNote;
      const payment = await paymentService.reject(req.params.id, reason, req.user);
      res.json({
        success: true,
        message: 'Pago rechazado exitosamente',
        data: payment
      });
    } catch (error) {
      console.error('[PaymentController] reject error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * PUT /api/payments/:id/void
   * Médico anula un cobro aprobado
   */
  async voidPayment(req, res) {
    try {
      const reason = req.body.reason || req.body.voidReason || req.body.reviewNote;
      const payment = await paymentService.voidPayment(req.params.id, reason, req.user);
      res.json({
        success: true,
        message: 'Cobro anulado exitosamente',
        data: payment
      });
    } catch (error) {
      console.error('[PaymentController] voidPayment error:', error);
      const status = statusOf(error, 400);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/pending
   * Cobros pendientes de validar (Médico)
   */
  async listPending(req, res) {
    try {
      const items = await paymentService.listPending(req.user);
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('[PaymentController] listPending error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/receivable
   * Consultas por cobrar (Médico)
   */
  async listReceivable(req, res) {
    try {
      const result = await paymentService.listReceivable(req.user);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[PaymentController] listReceivable error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/history
   * Historial de cobros (Médico)
   */
  async listHistory(req, res) {
    try {
      const result = await paymentService.listHistory(req.user, req.query);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[PaymentController] listHistory error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/mine
   * Pagos del paciente autenticado
   */
  async listMine(req, res) {
    try {
      const items = await paymentService.listMine(req.user);
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error('[PaymentController] listMine error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }

  /**
   * GET /api/payments/:id/receipt
   * Descarga de recibo PDF
   */
  async downloadReceipt(req, res) {
    try {
      const payment = await paymentService.getPaymentForUser(req.params.id, req.user);

      if (!['approved', 'voided'].includes(payment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Solo se puede descargar el recibo de cobros aprobados o anulados'
        });
      }

      const pdfBuffer = await generatePaymentReceiptPdf(payment);

      const filename = `recibo-${payment.receiptNumber || payment.verificationCode || payment.id}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      return res.send(pdfBuffer);
    } catch (error) {
      console.error('[PaymentController] downloadReceipt error:', error);
      const status = statusOf(error, 500);
      res.status(status).json({ success: false, message: status === 409 && error.name === 'SequelizeUniqueConstraintError' ? 'Ese pago ya fue reportado o la referencia ya está registrada' : error.message });
    }
  }
}

module.exports = new PaymentController();
