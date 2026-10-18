/**
 * paymentReceiptPdfService.js - CITAMED.VE
 * M05 / Semana 8 - Generación de Recibo de Pago en PDF formato Carta con QR verificable
 */

const PDFDocument = require('pdfkit');
const {
  FRONTEND_URL,
  formatCaracasDate,
  formatCaracasDateOnly,
  extractDoctorData,
  extractPatientData,
  generateQrBuffer,
  drawVoidWatermark,
  drawHeader,
  drawPatientBox,
  drawFooter
} = require('./pdf/pdfLayout');

const METHOD_LABELS = {
  pago_movil: 'Pago Móvil',
  transferencia: 'Transferencia bancaria',
  zelle: 'Zelle',
  efectivo_usd: 'Efectivo (USD)',
  efectivo_ves: 'Efectivo (Bs)'
};

/**
 * Genera el Buffer PDF de un recibo de pago
 * @param {Object} payment - Objeto Payment con relaciones doctor, patient, appointment
 * @returns {Promise<Buffer>}
 */
async function generatePaymentReceiptPdf(payment) {
  const doctorData = extractDoctorData(payment.doctor, payment.appointment);
  const patientData = extractPatientData(payment.patient, payment.createdAt);

  const verificationCode = payment.verificationCode || 'PENDIENTE';
  const verifyUrl = `${FRONTEND_URL}/verificar/${verificationCode}`;
  const qrBuffer = await generateQrBuffer(verifyUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      info: {
        Title: `Recibo de Pago - ${payment.receiptNumber || verificationCode}`,
        Author: doctorData.doctorFullName,
        Subject: 'Recibo Oficial de Pago CitaMed'
      }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const isVoided = payment.status === 'voided';
    if (isVoided) {
      drawVoidWatermark(doc);
    }

    // Membrete del médico
    drawHeader(doc, doctorData);

    // Caja de datos del paciente
    drawPatientBox(doc, patientData);

    // Título del Recibo
    doc.moveDown(0.6);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Recibo de Pago');
    doc.rect(40, doc.y - 2, 532, 1.5).fill('#0d9488');
    doc.moveDown(0.5);

    // Cuadrícula con los detalles del pago
    const startY = doc.y;

    // Caja de fondo para el recibo
    doc.rect(40, startY, 532, 160).fillAndStroke('#f8fafc', '#e2e8f0');

    const col1X = 55;
    const col2X = 320;
    let rowY = startY + 12;

    // Fila 1: Número de Recibo y Fecha
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('N° de Recibo:', col1X, rowY);
    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(payment.receiptNumber || 'N/A', col1X + 80, rowY);

    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Fecha de emisión:', col2X, rowY);
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(formatCaracasDate(payment.reviewedAt || payment.createdAt), col2X + 90, rowY);

    rowY += 22;

    // Fila 2: Concepto y Fecha de Consulta
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Concepto:', col1X, rowY);
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text('Consulta médica profesional', col1X + 80, rowY);

    if (payment.appointment?.appointmentDate) {
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Fecha consulta:', col2X, rowY);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(formatCaracasDateOnly(payment.appointment.appointmentDate), col2X + 90, rowY);
    }

    rowY += 22;

    // Fila 3: Método y Referencia
    const methodLabel = METHOD_LABELS[payment.method] || payment.method;
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Forma de pago:', col1X, rowY);
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(methodLabel, col1X + 80, rowY);

    if (payment.reference) {
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('N° Referencia:', col2X, rowY);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(payment.reference, col2X + 90, rowY);
    }

    rowY += 22;

    // Fila 4: Banco emisor si aplica
    if (payment.payerBank) {
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica-Bold').text('Banco emisor:', col1X, rowY);
      doc.fillColor('#0f172a').fontSize(9).font('Helvetica').text(payment.payerBank, col1X + 80, rowY);
      rowY += 20;
    }

    // Línea separadora de totales
    doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(50, rowY).lineTo(560, rowY).stroke();
    rowY += 10;

    // Fila 5: Monto USD
    doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Monto en Dólares (USD):', col1X, rowY);
    doc.fillColor('#0d9488').fontSize(12).font('Helvetica-Bold').text(`$ ${Number(payment.amountUsd).toFixed(2)}`, col1X + 140, rowY - 1);

    // Fila 6: Tasa y Monto VES si aplica
    if (payment.amountVes) {
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(
        `(Tasa BCV bloqueada: ${Number(payment.exchangeRate).toFixed(4)} Bs/USD)`,
        col2X - 40,
        rowY
      );
      rowY += 18;

      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Monto en Bolívares (VES):', col1X, rowY);
      doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(`Bs. ${Number(payment.amountVes).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, col1X + 140, rowY - 1);
    }

    // Leyenda regulatoria de CitaMed
    doc.y = startY + 180;
    doc.fillColor('#64748b').fontSize(8).font('Helvetica-Oblique').text(
      'Aviso importante: CitaMed no procesa pagos ni es intermediario financiero. Este recibo confirma que el médico tratante recibió directamente del paciente la cantidad indicada como honorarios profesionales de la consulta médica.',
      40,
      doc.y,
      { align: 'justify', width: 532, lineGap: 2 }
    );

    // Pie de página fijo con QR y firma
    drawFooter(doc, {
      doctorFullName: doctorData.doctorFullName,
      mpps: doctorData.mpps,
      verificationCode,
      qrBuffer,
      verifyDomainText: 'citamed-ve.pages.dev/verificar'
    });

    doc.end();
  });
}

module.exports = {
  generatePaymentReceiptPdf,
  METHOD_LABELS
};
