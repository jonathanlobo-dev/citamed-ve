/**
 * pdfLayout.js - CITAMED.VE
 * M03 / Semana 6 - Componentes y diseño común para PDFs clínicos (Récipes y Documentos Médicos)
 */

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

/**
 * Formatea solo fecha (sin hora) en zona horaria de Caracas
 */
function formatCaracasDateOnly(date) {
  try {
    return new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  } catch {
    return String(date).split('T')[0];
  }
}

/**
 * Título de cortesía según género
 */
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
 * Extrae y formatea datos del médico y consultorio
 */
function extractDoctorData(doctor = {}, appointment = {}) {
  const doctorProfile = doctor.doctorProfile || {};
  const specialtyName = doctorProfile.specialty?.name || appointment.specialty?.name || 'Medicina General';
  const doctorFullName = `${doctorTitle(doctor.gender)} ${doctorProfile.firstName || doctor.firstName || ''} ${doctorProfile.lastName || doctor.lastName || ''}`.trim();
  const mpps = doctorProfile.mppsNumber || doctorProfile.mpps_number || 'N/A';
  const license = doctorProfile.licenseNumber || 'N/A';

  const clinic = appointment.clinic || {};
  const clinicLocation = appointment.clinicLocation || {};
  const clinicDisplay = clinic.name || doctorProfile.clinicName || 'Consultorio Médico';
  const addressDisplay = clinicLocation.address || doctorProfile.clinicAddress || '';
  const phoneDisplay = doctorProfile.phoneNumber || doctorProfile.whatsappNumber || doctor.phone || '';

  return {
    doctorFullName,
    specialtyName,
    mpps,
    license,
    clinicDisplay,
    addressDisplay,
    phoneDisplay
  };
}

/**
 * Extrae y formatea datos del paciente
 */
function extractPatientData(patient = {}, createdAt = new Date()) {
  const patientProfile = patient.patientProfile || {};
  const patientFullName = `${patientProfile.firstName || patient.firstName || ''} ${patientProfile.lastName || patient.lastName || ''}`.trim();
  const idDoc = patientProfile.identificationNumber
    ? `${patientProfile.identificationType || 'CI'}: ${patientProfile.identificationNumber}`
    : 'No registrada';
  const ageDisplay = calculateAge(patientProfile.dateOfBirth) || 'No especificada';
  const issueDateStr = formatCaracasDate(createdAt);

  return {
    patientFullName,
    idDoc,
    ageDisplay,
    issueDateStr,
    identificationNumber: patientProfile.identificationNumber || '',
    identificationType: patientProfile.identificationType || 'V'
  };
}

/**
 * Genera buffer de código QR para verificación
 */
async function generateQrBuffer(url) {
  return await QRCode.toBuffer(url, {
    width: 85,
    margin: 1,
    color: {
      dark: '#1e293b',
      light: '#ffffff'
    }
  });
}

/**
 * Dibuja la marca de agua ANULADO
 */
function drawVoidWatermark(doc) {
  doc.save();
  doc.rotate(-35, { origin: [306, 396] });
  doc.fontSize(70);
  doc.fillColor('#ef4444', 0.25);
  doc.text('ANULADO', 120, 360, { align: 'center', width: 400 });
  doc.restore();
}

/**
 * Dibuja el encabezado y membrete del médico
 */
function drawHeader(doc, doctorData) {
  // Encabezado decorativo CitaMed (Barra Teal)
  doc.rect(40, 36, 532, 4).fill('#0d9488');

  // Membrete del Médico
  doc.moveDown(0.8);
  doc.fillColor('#0f172a').fontSize(16).font('Helvetica-Bold').text(doctorData.doctorFullName, 40, 48);
  doc.fillColor('#0d9488').fontSize(11).font('Helvetica-Bold').text(doctorData.specialtyName);

  doc.moveDown(0.2);
  doc.fillColor('#475569').fontSize(9).font('Helvetica')
    .text(`MPPS: ${doctorData.mpps}   |   Colegio de Médicos / Matrícula: ${doctorData.license}`);

  if (doctorData.clinicDisplay || doctorData.addressDisplay || doctorData.phoneDisplay) {
    const locationText = [doctorData.clinicDisplay, doctorData.addressDisplay, doctorData.phoneDisplay ? `Telf: ${doctorData.phoneDisplay}` : '']
      .filter(Boolean)
      .join(' - ');
    doc.fillColor('#64748b').fontSize(8.5).font('Helvetica').text(locationText);
  }

  // Línea separadora
  doc.moveDown(0.6);
  const line1Y = doc.y;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, line1Y).lineTo(572, line1Y).stroke();
  doc.y = line1Y + 8;
}

/**
 * Dibuja la caja de datos del paciente
 */
function drawPatientBox(doc, patientData) {
  doc.moveDown(0.6);
  const patientY = doc.y;

  // Caja gris suave para datos del paciente
  doc.rect(40, patientY, 532, 42).fillAndStroke('#f8fafc', '#e2e8f0');

  doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold')
    .text('Paciente:', 50, patientY + 8)
    .font('Helvetica').text(patientData.patientFullName, 100, patientY + 8)
    .font('Helvetica-Bold').text('Cédula:', 330, patientY + 8)
    .font('Helvetica').text(patientData.idDoc, 380, patientY + 8);

  doc.font('Helvetica-Bold')
    .text('Fecha:', 50, patientY + 24)
    .font('Helvetica').text(patientData.issueDateStr, 100, patientY + 24)
    .font('Helvetica-Bold').text('Edad:', 330, patientY + 24)
    .font('Helvetica').text(patientData.ageDisplay, 380, patientY + 24);

  doc.y = patientY + 50;
  doc.x = 40;
}

/**
 * Dibuja el pie de página fijo con firma, QR y leyenda de CitaMed
 */
function drawFooter(doc, { doctorFullName, mpps, verificationCode, qrBuffer, verifyDomainText = 'citamed-ve.pages.dev/verificar' }) {
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
    .text(verificationCode, qrTextX, qrTextY + 26);
  doc.fillColor('#64748b').fontSize(7).font('Helvetica')
    .text(verifyDomainText, qrTextX, qrTextY + 40);

  // Marca de agua / footer CitaMed
  doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica')
    .text('CitaMed · Plataforma de Salud Digital de Venezuela · Documento médico emitido electrónicamente', 40, 746, { align: 'center', width: 532 });
}

module.exports = {
  FRONTEND_URL,
  formatCaracasDate,
  formatCaracasDateOnly,
  doctorTitle,
  calculateAge,
  extractDoctorData,
  extractPatientData,
  generateQrBuffer,
  drawVoidWatermark,
  drawHeader,
  drawPatientBox,
  drawFooter
};
