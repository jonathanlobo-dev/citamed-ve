/**
 * Prescription PDF Service - CITAMED.VE
 * Generación de récipes médicos en PDF formato Carta con QR verificable
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://citamed-ve.pages.dev';

/**
 * Formatea fecha en zona horaria de Caracas
 */
function formatCaracasDate(date) {
  try {
    return new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
}

function doctorTitle(gender) {
  if (gender === 'femenino' || gender === 'female') return 'Dra.';
  if (gender === 'masculino' || gender === 'male') return 'Dr.';
  return 'Dr(a).';
}

/**
 * Calcula la edad a partir de la fecha de nacimiento
 */
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age} años` : 'Menor de 1 año';
}

/**
 * Genera el Buffer del PDF del récipe médico
 * @param {Object} prescription - Objeto Prescription con includes (doctor, patient, appointment)
 * @returns {Promise<Buffer>}
 */
async function generatePrescriptionPdf(prescription) {
  // 1. Preparar datos
  const doctor = prescription.doctor || {};
  const doctorProfile = doctor.doctorProfile || {};
  const specialtyName = doctorProfile.specialty?.name || prescription.appointment?.specialty?.name || 'Medicina General';
  
  const patient = prescription.patient || {};
  const patientProfile = patient.patientProfile || {};
  
  const appointment = prescription.appointment || {};
  const clinic = appointment.clinic || {};
  const clinicLocation = appointment.clinicLocation || {};

  const doctorFullName = `${doctorTitle(doctor.gender)} ${doctorProfile.firstName || doctor.firstName || ''} ${doctorProfile.lastName || doctor.lastName || ''}`.trim();
  const patientFullName = `${patientProfile.firstName || patient.firstName || ''} ${patientProfile.lastName || patient.lastName || ''}`.trim();
  
  const mpps = doctorProfile.mppsNumber || doctorProfile.mpps_number || 'N/A';
  const license = doctorProfile.licenseNumber || 'N/A';
  
  const clinicDisplay = clinic.name || doctorProfile.clinicName || 'Consultorio Médico';
  const addressDisplay = clinicLocation.address || doctorProfile.clinicAddress || '';
  const phoneDisplay = doctorProfile.phoneNumber || doctorProfile.whatsappNumber || doctor.phone || '';

  const idDoc = patientProfile.identificationNumber 
    ? `${patientProfile.identificationType || 'CI'}: ${patientProfile.identificationNumber}` 
    : 'No registrada';
  const ageDisplay = calculateAge(patientProfile.dateOfBirth) || 'No especificada';
  const issueDateStr = formatCaracasDate(prescription.createdAt);

  const verifyUrl = `${FRONTEND_URL}/verificar-recipe/${prescription.verificationCode}`;
  
  // Generar QR en buffer
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 85,
    margin: 1,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  });

  // 2. Construir documento PDF
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 36, bottom: 36, left: 40, right: 40 },
      info: {
        Title: `Récipe Médico - ${prescription.verificationCode}`,
        Author: doctorFullName,
        Subject: 'Récipe Médico Electrónico CitaMed'
      }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const isVoided = prescription.status === 'voided';

    // Marca de agua si está anulado
    if (isVoided) {
      doc.save();
      doc.rotate(-35, { origin: [306, 396] });
      doc.fontSize(70);
      doc.fillColor('#ef4444', 0.25);
      doc.text('ANULADO', 120, 360, { align: 'center', width: 400 });
      doc.restore();
    }

    // Encabezado decorativo CitaMed
    doc.rect(40, 36, 532, 4).fill('#0d9488'); // Barra Teal

    // Membrete del Médico
    doc.moveDown(0.8);
    doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(doctorFullName, 40, 48);
    doc.fillColor('#0d9488').fontSize(11).font('Helvetica-Bold').text(specialtyName);
    
    doc.moveDown(0.2);
    doc.fillColor('#475569').fontSize(9).font('Helvetica')
      .text(`MPPS: ${mpps}   |   Colegio de Médicos / Matrícula: ${license}`);
    
    if (clinicDisplay || addressDisplay || phoneDisplay) {
      const locationText = [clinicDisplay, addressDisplay, phoneDisplay ? `Telf: ${phoneDisplay}` : '']
        .filter(Boolean)
        .join(' - ');
      doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(locationText);
    }

    // Línea separadora
    doc.moveDown(0.6);
    const line1Y = doc.y;
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, line1Y).lineTo(572, line1Y).stroke();

    // Datos del Paciente
    doc.moveDown(0.6);
    const patientY = doc.y;
    
    // Caja gris suave para datos del paciente
    doc.rect(40, patientY, 532, 42).fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold')
      .text('Paciente:', 50, patientY + 8)
      .font('Helvetica').text(patientFullName, 100, patientY + 8)
      .font('Helvetica-Bold').text('Cédula:', 330, patientY + 8)
      .font('Helvetica').text(idDoc, 380, patientY + 8);

    doc.font('Helvetica-Bold')
      .text('Fecha:', 50, patientY + 24)
      .font('Helvetica').text(issueDateStr, 100, patientY + 24)
      .font('Helvetica-Bold').text('Edad:', 330, patientY + 24)
      .font('Helvetica').text(ageDisplay, 380, patientY + 24);

    doc.y = patientY + 50;
    doc.x = 40;

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
    const footerTop = 640;
    if (doc.y > footerTop - 10) {
      doc.addPage();
    }
    
    // Línea separadora pie
    doc.strokeColor('#e2e8f0').lineWidth(0.8).moveTo(40, footerTop).lineTo(572, footerTop).stroke();

    // Firma del Médico (lado izquierdo)
    const signY = footerTop + 25;
    doc.strokeColor('#64748b').lineWidth(1).moveTo(60, signY).lineTo(230, signY).stroke();
    doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(doctorFullName, 60, signY + 6, { width: 170, align: 'center' });
    doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`MPPS: ${mpps}`, 60, signY + 18, { width: 170, align: 'center' });

    // Código QR y verificación (lado derecho)
    doc.image(qrBuffer, 320, footerTop + 10, { width: 68, height: 68 });
    
    const qrTextX = 398;
    const qrTextY = footerTop + 14;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text('Verificación de autenticidad', qrTextX, qrTextY);
    doc.fillColor('#475569').fontSize(7.5).font('Helvetica')
      .text('Escanee el código QR o verifique con el código:', qrTextX, qrTextY + 12, { width: 174 });
    doc.fillColor('#0d9488').fontSize(9).font('Helvetica-Bold')
      .text(prescription.verificationCode, qrTextX, qrTextY + 26);
    doc.fillColor('#64748b').fontSize(7).font('Helvetica')
      .text('citamed-ve.pages.dev/verificar-recipe', qrTextX, qrTextY + 40);

    // Marca de agua / footer CitaMed
    doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
      .text('CitaMed · Plataforma de Salud Digital de Venezuela · Documento médico emitido electrónicamente', 40, 746, { align: 'center', width: 532 });

    doc.end();
  });
}

module.exports = {
  generatePrescriptionPdf,
  doctorTitle,
  formatCaracasDate
};
