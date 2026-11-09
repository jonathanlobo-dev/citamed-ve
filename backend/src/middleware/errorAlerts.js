/**
 * errorAlerts.js - CITAMED.VE
 * Engancha el aviso por correo a toda respuesta 5xx, la haya generado un controlador o el manejador de errores.
 * No cambia nada de lo que ve el usuario y no espera al correo.
 */

const { getErrorAlertService } = require('../services/errorAlertService');

function serverErrorAlerts(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode < 500) return;
    const service = getErrorAlertService();
    if (!service.enabled()) return;
    service.notify({
      status: res.statusCode,
      method: req.method,
      path: req.originalUrl || req.url,
      message: res.locals?.errorMessage || res.statusMessage || '',
      userId: req.user?.id || null
    }).catch(() => {});
  });
  next();
}

/** Para excepciones y promesas sin atender, que no pasan por ninguna petición */
function notifyProcessError(kind, error) {
  const service = getErrorAlertService();
  if (!service.enabled()) return Promise.resolve('disabled');
  return service.notify({
    status: 500,
    method: 'PROCESO',
    path: `/${kind}`,
    message: error instanceof Error ? error.message : String(error)
  }).catch(() => 'error');
}

module.exports = { serverErrorAlerts, notifyProcessError };
