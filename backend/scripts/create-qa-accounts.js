/**
 * create-qa-accounts.js - CITAMED.VE
 * Crea las cuentas para una ronda de QA usando el registro real de la API (como lo haría una persona):
 * 2 médicos (aprobados y con horario) y 2 pacientes. La asistente la invita uno de los médicos desde su panel.
 *
 * Las claves se generan al azar y se guardan en un archivo FUERA del repositorio (no se imprimen).
 *
 *   API_URL=https://api.citamedve.app/api node scripts/create-qa-accounts.js
 *
 * Opcional: QA_OUT (ruta del archivo de salida), QA_TAG (sufijo para no repetir correos en otra ronda).
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { approveDoctorByEmail } = require('./lib/approveDoctor');

const API = process.env.API_URL;
if (!API) {
  console.error('Falta API_URL (por ejemplo https://api.citamedve.app/api)');
  process.exit(1);
}
const TAG = process.env.QA_TAG || '1';
const OUT = process.env.QA_OUT || path.join(os.homedir(), 'Documents', `CitaMed_cuentas_QA_${TAG}.txt`);

const newPassword = () => `Qa-${crypto.randomBytes(9).toString('base64url')}9!`;
const digits = (n) => String(crypto.randomInt(10 ** (n - 1), 10 ** n));

const doctors = [
  { firstName: 'QA Andrés', lastName: 'Salas', city: 'Caracas', state: 'Distrito Capital', specialtyId: 1, price: 40 },
  { firstName: 'QA Lucía', lastName: 'Ferrer', city: 'Valencia', state: 'Carabobo', specialtyId: 1, price: 30 },
];
const patients = [
  { firstName: 'QA Pedro', lastName: 'Linares', gender: 'male', dateOfBirth: '1988-04-12' },
  { firstName: 'QA Carla', lastName: 'Moreno', gender: 'female', dateOfBirth: '1995-09-30' },
];

async function main() {
  const lines = [`Cuentas QA de CitaMed (${new Date().toISOString().slice(0, 10)}), ${API}`, ''];

  for (const [i, d] of doctors.entries()) {
    const email = `qa.medico${i + 1}.${TAG}@citamedve.app`;
    const password = newPassword();
    const res = await axios.post(`${API}/auth/register/doctor`, {
      email, password, confirmPassword: password, acceptTerms: true,
      firstName: d.firstName, lastName: d.lastName,
      identificationNumber: `V-${digits(8)}`, dateOfBirth: '1982-06-15', gender: i ? 'female' : 'male',
      phone: `+58414${digits(7)}`, mppsNumber: `MPPS${digits(6)}`, specialtyId: d.specialtyId,
      university: 'UCV', graduationYear: 2008,
      clinicName: `Consultorio ${d.firstName}`, consultationAddress: 'Av. Principal, Local 1',
      city: d.city, state: d.state,
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      startTime: '08:00', endTime: '18:00', priceConsultation: d.price,
    });
    const token = res.data.token || res.data.data?.token;
    await approveDoctorByEmail(API, email);
    await axios.post(`${API}/doctors/me/availability`, {
      schedules: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek, startTime: '08:00', endTime: '18:00', slotDuration: 30, consultationType: 'presencial',
      })),
    }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    lines.push(`Médico ${i + 1} (aprobado): ${d.firstName} ${d.lastName}`, `  ${email}`, `  ${password}`, '');
    console.log(`Médico ${i + 1} creado y aprobado: ${email}`);
  }

  for (const [i, p] of patients.entries()) {
    const email = `qa.paciente${i + 1}.${TAG}@citamedve.app`;
    const password = newPassword();
    await axios.post(`${API}/auth/register/patient`, {
      email, password, confirmPassword: password, acceptTerms: true,
      firstName: p.firstName, lastName: p.lastName,
      identificationNumber: `V-${digits(8)}`, dateOfBirth: p.dateOfBirth, gender: p.gender,
      phone: `+58412${digits(7)}`, bloodType: 'O+',
      emergencyContactName: 'Contacto QA', emergencyContactPhone: `+58414${digits(7)}`,
    });
    lines.push(`Paciente ${i + 1}: ${p.firstName} ${p.lastName}`, `  ${email}`, `  ${password}`, '');
    console.log(`Paciente ${i + 1} creado: ${email}`);
  }

  lines.push('Asistente: la invita el Médico 1 desde su panel (Mi equipo). Si el correo no llega, el panel muestra el enlace para copiarlo.');
  fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
  console.log(`\nListo. Correos y claves guardados en: ${OUT}`);
}

main().catch((err) => {
  console.error('Error:', err.response?.status, JSON.stringify(err.response?.data || err.message));
  process.exit(1);
});
