const jwt = require('jsonwebtoken');
const { User } = require('../models/index');
const { passwordFingerprint } = require('../utils/tokenFingerprint');
const { stripForPatient } = require('../utils/stripPrivateFields');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado. Acceso denegado.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // La clave cambió después de emitir este token (o es un token antiguo sin huella): sesión vencida
    if (!decoded.pwv || decoded.pwv !== passwordFingerprint(user)) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'Tu sesión venció. Inicia sesión de nuevo.'
      });
    }

    // Notas privadas del médico: nunca en una respuesta a un paciente
    if (user.role === 'patient' && !res.__patientStrip) {
      const originalJson = res.json.bind(res);
      res.json = (body) => originalJson(stripForPatient(body));
      res.__patientStrip = true;
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Tu cuenta está suspendida. Escríbenos a soporte si crees que es un error.'
      });
    }

    // Rol asistente: acceso solo a un listado cerrado de módulos (denegado por defecto).
    // Dentro de ellos, cada ruta sigue exigiendo allowAssistant(permiso) para actuar por un médico.
    if (user.role === 'assistant') {
      const allowed = ['/api/auth', '/api/assistants', '/api/appointments', '/api/waiting-room',
        '/api/payments', '/api/exchange-rate', '/api/sessions', '/api/2fa'];
      // Rutas sueltas que la interfaz necesita: sus propios permisos y el perfil del médico activo
      // (este último exige además allowAssistant('agenda') en su ruta)
      const allowedExact = ['/api/rbac/my-permissions', '/api/doctors/me'];
      const url = req.originalUrl || '';
      const path = url.split('?')[0];
      const exactOk = allowedExact.includes(path) && req.method === 'GET';
      if (!exactOk && !allowed.some((p) => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'))) {
        return res.status(403).json({
          success: false,
          code: 'ASSISTANT_FORBIDDEN',
          message: 'Tu cuenta de asistente no tiene acceso a este módulo'
        });
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  authenticateToken: authMiddleware,
  // Aliases for compatibility
  authenticate: authMiddleware,
  verifyToken: authMiddleware,
  authorize: requireRole
};
