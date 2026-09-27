/**
 * medicalDocumentPdfService.js - CITAMED.VE
 * M03 / Semana 6 - Generación de PDFs para Orden de Exámenes, Reposo, Constancia e Informe Médico
 */

const PDFDocument = require('pdfkit');
const {
  FRONTEND_URL,
  extractDoctorData,
  extractPatientData,
  generateQrBuffer,
  drawVoidWatermark,
  drawHeader,
  drawPatientBox,
  drawFooter,
  formatCaracasDateOnly
} = require('./pdf/pdfLayout');

const DOCUMENT_TITLES = {
  lab_order: 'Orden de Exámenes',
  rest_note: 'Reposo Médico',
  certificate: 'Constancia Médica',
  medical_report: 'Informe Médico'
};

/**
 * Genera el Buffer PDF de un documento médico emitido
 * @param {Object} document - Objeto MedicalDocument con relaciones cargadas (doctor, patient, appointment)
 * @returns {Promise<Buffer>}
 */
async function generateMedicalDocumentPdf(document) {
  const doctorData = extractDoctorData(document.doctor, document.appointment);
  const patientData = extractPatientData(document.patient, document.createdAt);
  const docTitle = DOCUMENT_TITLES[document.type] || document.title || 'Documento Médico';

  const verifyUrl = `${FRONTEND_URL}/verificar/${document.verificationCode}`;
  const qrBuffer = await generateQrBuffer(verifyUrl);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      info: {
        Title: `${docTitle} - ${document.verificationCode}`,
        Author: doctorData.doctorFullName,
        Subject: `${docTitle} Electrónico CitaMed`
      }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const isVoided = document.status === 'voided';
    if (isVoided) {
      drawVoidWatermark(doc);
    }

    // Membrete del médico
    drawHeader(doc, doctorData);

    // Datos del paciente
    drawPatientBox(doc, patientData);

    // Título del tipo de documento
    doc.moveDown(0.6);
    doc.fillColor('#0f172a').fontSize(13).font('Helvetica-Bold').text(docTitle);
    doc.rect(40, doc.y - 2, 532, 1.5).fill('#0d9488');
    doc.moveDown(0.5);

    const content = document.content || {};

    // ==========================================
    // CONTENIDO SEGÚN TIPO
    // ==========================================
    switch (document.type) {
      case 'lab_order': {
        const exams = Array.isArray(content.exams) ? content.exams : [];
        if (exams.length > 0) {
          doc.fillColor('#0f172a').fontSize(10.5).font('Helvetica-Bold').text('Estudios solicitados:');
          doc.moveDown(0.3);

          exams.forEach((ex, idx) => {
            doc.fillColor('#1e293b').fontSize(9.5).font('Helvetica')
              .text(`  •  ${ex.name || ex} ${ex.category ? `(${ex.category})` : ''}`);
            doc.moveDown(0.2);
          });
        }

        if (content.otherExams && content.otherExams.trim()) {
          doc.moveDown(0.3);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Otros exámenes / indicaciones específicas:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.otherExams.trim(), { lineGap: 2 });
        }

        if (content.presumptiveDiagnosis && content.presumptiveDiagnosis.trim()) {
          doc.moveDown(0.4);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Diagnóstico presuntivo:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.presumptiveDiagnosis.trim());
        }

        if (content.clinicalIndication && content.clinicalIndication.trim()) {
          doc.moveDown(0.4);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Indicación clínica:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.clinicalIndication.trim(), { lineGap: 2 });
        }
        break;
      }

      case 'rest_note': {
        const days = content.days || 1;
        const startDateStr = content.startDate ? formatCaracasDateOnly(content.startDate) : patientData.issueDateStr;
        const endDateStr = content.endDate ? formatCaracasDateOnly(content.endDate) : startDateStr;

        doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica').text(
          `Se indica reposo médico por un período de ${days} día(s), desde el ${startDateStr} hasta el ${endDateStr} inclusive.`,
          { align: 'justify', lineGap: 3 }
        );

        if (content.includeDiagnosis && content.diagnosis && content.diagnosis.trim()) {
          doc.moveDown(0.5);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Diagnóstico:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.diagnosis.trim());
        }

        if (content.observations && content.observations.trim()) {
          doc.moveDown(0.5);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Observaciones y recomendaciones:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.observations.trim(), { lineGap: 2 });
        }
        break;
      }

      case 'certificate': {
        const fromTime = content.attendedFrom || 'inicio de consulta';
        const toTime = content.attendedTo || 'finalización';
        const dateStr = formatCaracasDateOnly(document.createdAt);

        const baseText = `Quien suscribe, ${doctorData.doctorFullName}, titular de la matrícula MPPS ${doctorData.mpps}, hace constar que el paciente ${patientData.patientFullName}, titular de la cédula de identidad ${patientData.idDoc}, asistió a consulta médica el día ${dateStr}, de ${fromTime} a ${toTime}.`;

        doc.fillColor('#1e293b').fontSize(10.5).font('Helvetica').text(baseText, {
          align: 'justify',
          lineGap: 4
        });

        if (content.reason && content.reason.trim()) {
          doc.moveDown(0.5);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Motivo de la asistencia:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.reason.trim(), { lineGap: 2 });
        }

        if (content.observations && content.observations.trim()) {
          doc.moveDown(0.5);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text('Observaciones:');
          doc.fillColor('#334155').fontSize(9.5).font('Helvetica').text(content.observations.trim(), { lineGap: 2 });
        }
        break;
      }

      case 'medical_report': {
        const bodyText = content.body || document.title || '';
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(bodyText, {
          align: 'justify',
          lineGap: 3
        });
        break;
      }

      default: {
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(document.title || 'Documento emitido');
      }
    }

    // Pie de página fijo al final
    drawFooter(doc, {
      doctorFullName: doctorData.doctorFullName,
      mpps: doctorData.mpps,
      verificationCode: document.verificationCode,
      qrBuffer,
      verifyDomainText: 'citamed-ve.pages.dev/verificar'
    });

    doc.end();
  });
}

module.exports = {
  generateMedicalDocumentPdf,
  DOCUMENT_TITLES
};
