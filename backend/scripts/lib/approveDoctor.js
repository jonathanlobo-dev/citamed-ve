/**
 * approveDoctor.js - CITAMED.VE
 * Los médicos nuevos nacen sin verificar y no pueden atender, emitir ni cobrar hasta que un admin
 * los aprueba. Las pruebas que registran un médico nuevo lo aprueban con esta ayuda, igual que lo
 * haría el admin desde la cola de verificación. Solo para el servidor de Pruebas.
 */

const axios = require('axios');

const ADMIN = { email: 'admin@citamed.ve', password: 'Admin123!' };

async function approveDoctorByEmail(apiBase, email) {
  const login = await axios.post(`${apiBase}/auth/login`, ADMIN);
  const headers = { Authorization: `Bearer ${login.data.data.token}` };

  const queue = await axios.get(`${apiBase}/kyc/admin/queue`, { headers, params: { limit: 100 } });
  const request = (queue.data.data.requests || []).find((r) => r.doctorProfile?.user?.email === email);
  if (!request) throw new Error(`No hay solicitud de verificación para ${email}`);

  await axios.post(`${apiBase}/kyc/admin/requests/${request.id}/approve`, { notes: 'Aprobado por la prueba automática' }, { headers });
  return request.id;
}

/** Atajo: recibe la respuesta del registro del médico */
async function approveRegisteredDoctor(apiBase, registerResponse) {
  const data = registerResponse.data?.data || registerResponse.data;
  const email = data?.user?.email;
  if (!email) throw new Error('La respuesta del registro no trae el correo del médico');
  return approveDoctorByEmail(apiBase, email);
}

module.exports = { approveDoctorByEmail, approveRegisteredDoctor };
