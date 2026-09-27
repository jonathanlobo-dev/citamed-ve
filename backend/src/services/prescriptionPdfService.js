/**
 * Prescription PDF Service - CITAMED.VE
 * Generación de récipes médicos en PDF formato Carta con QR verificable
 */

const PDFDocument = require('pdfkit');
const {
  FRONTEND_URL,
  formatCaracasDate,
  doctorTitle,
  extractDoctorData,
  extractPatientData,
  generateQrBuffer,
  drawVoidWatermark,
  drawHeader,
  drawPatientBox,
  drawFooter
} = require('./pdf/pdfLayout');

/**
 * Genera el Buffer del PDF del récipe médico
 * @param {Object} prescription - Objeto Prescription con includes (doctor, patient, appointment)
 * @returns {Promise<Buffer>}
 */
async function generatePrescriptionPdf(prescription) {
  const doctorData = extractDoctorData(prescription.doctor, prescription.appointment);
  const patientData = extractPatientData(prescription.patient, prescription.createdAt);

  const verifyUrl = `${FRONTEND_URL}/verificar-recipe/${prescription.verificationCode}`;
  const qrBuffer = await generateQrBuffer(verifyUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      info: {
        Title: `Récipe Médico - ${prescription.verificationCode}`,
        Author: doctorData.doctorFullName,
        Subject: 'Récipe Médico Electrónico CitaMed'
      }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const isVoided = prescription.status === 'voided';
    if (isVoided) {
      drawVoidWatermark(doc);
    }

    // Encabezado y membrete del médico
    drawHeader(doc, doctorData);

    // Datos del Paciente
    drawPatientBox(doc, patientData);

    // Sección "Rp." (Récipe)
    doc.moveDown(0.6);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Rp.');
    doc.rect(40, doc.y - 2, 532, 1.5).fill('#0d9488');
    doc.moveDown(0.4);

    const items = Array.isArray(prescription.items) ? prescription.items : [];
    items.forEach((item, index) => {
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold')
        .text(`${index + 1}. ${item.medication || ''}${item.presentation ? ` - ${item.presentation}` : ''}`);
      if (item.duration) {
        doc.fillColor('#64748b').fontSize(8.5).font('Helvetica')
          .text(`    Duración prevista: ${item.duration}`);
      }
      doc.moveDown(0.2);
    });

    // Sección "Indicaciones" (Instrucciones)
    doc.moveDown(0.8);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text('Indicaciones');
    doc.rect(40, doc.y - 2, 532, 1.5).fill('#0d9488');
    doc.moveDown(0.4);

    items.forEach((item, index) => {
      const doseText = item.dose ? `Dosis: ${item.dose}` : '';
      const freqText = item.frequency ? `Frecuencia: ${item.frequency}` : '';
      const durText = item.duration ? `Tiempo: ${item.duration}` : '';
      const details = [doseText, freqText, durText].filter(Boolean).join(' | ');

      doc.fillColor('#1e293b').fontSize(9.5).font('Helvetica-Bold')
        .text(`${index + 1}. ${item.medication}: `)
        .font('Helvetica').text(`   ${details ? details + '.' : ''} ${item.instructions || ''}`);
      doc.moveDown(0.3);
    });

    // Indicaciones generales si existen
    if (prescription.indications && prescription.indications.trim()) {
      doc.moveDown(0.4);
      doc.fillColor('#0f172a').fontSize(9.5).font('Helvetica-Bold').text('Indicaciones generales:');
      doc.fillColor('#334155').fontSize(9).font('Helvetica').text(prescription.indications.trim(), {
        align: 'justify',
        lineGap: 2
      });
    }

    // Pie de página fijo al final
    drawFooter(doc, {
      doctorFullName: doctorData.doctorFullName,
      mpps: doctorData.mpps,
      verificationCode: prescription.verificationCode,
      qrBuffer,
      verifyDomainText: 'citamed-ve.pages.dev/verificar-recipe'
    });

    doc.end();
  });
}

module.exports = {
  generatePrescriptionPdf,
  doctorTitle,
  formatCaracasDate
};
