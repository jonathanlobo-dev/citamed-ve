/**
 * Winston Logger Configuration - CITAMED.VE
 *
 * Sistema de logging estructurado con:
 * - Múltiples niveles (error, warn, info, http, debug)
 * - Logs rotativos diarios
 * - Formato JSON para parsing
 * - Console logging en desarrollo
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Directorio de logs
const logsDir = path.join(__dirname, '../../logs');

// Determinar entorno
const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug');

/**
 * Formato personalizado para logs
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
  winston.format.json()
);

/**
 * Formato para consola (desarrollo)
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}]: ${message} ${meta}`;
  })
);

/**
 * Niveles de log personalizados
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan'
  }
};

// Agregar colores personalizados
winston.addColors(customLevels.colors);

/**
 * Transports para producción
 */
const productionTransports = [
  // Error logs (solo errores)
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    tailable: true
  }),

  // Combined logs (todos los niveles hasta info)
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    level: 'info',
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    tailable: true
  }),

  // HTTP logs rotativos diarios
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
];

/**
 * Transport para desarrollo (consola)
 */
const developmentTransport = new winston.transports.Console({
  format: consoleFormat,
  level: 'debug'
});

/**
 * Crear logger principal
 */
const logger = winston.createLogger({
  levels: customLevels.levels,
  level: logLevel,
  format: logFormat,
  transports: isProduction ? productionTransports : [
    developmentTransport,
    ...productionTransports
  ],
  // No salir en errores no capturados
  exitOnError: false
});

/**
 * Logger para HTTP requests (usado por Morgan)
 */
const httpLogger = {
  write: (message) => {
    logger.http(message.trim());
  }
};

/**
 * Logger para queries de base de datos
 */
const dbLogger = {
  log: (sql, timing) => {
    const time = timing || 0;
    if (time > 200) {
      logger.warn('Slow database query', { sql: sql.substring(0, 200), time: `${time}ms` });
    } else {
      logger.debug('Database query', { sql: sql.substring(0, 100), time: `${time}ms` });
    }
  }
};

/**
 * Logging de inicio de servidor
 */
const logServerStart = (port, env) => {
  logger.info('Server started', {
    port,
    environment: env,
    nodeVersion: process.version,
    pid: process.pid
  });
};

/**
 * Logging de conexión a base de datos
 */
const logDatabaseConnection = (status, details = {}) => {
  if (status === 'connected') {
    logger.info('Database connected', details);
  } else {
    logger.error('Database connection failed', details);
  }
};

/**
 * Logging de error con contexto
 */
const logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
};

/**
 * Logging de request con datos del usuario
 */
const logRequest = (req, responseTime, statusCode) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || 'anonymous'
  };

  if (statusCode >= 500) {
    logger.error('Request failed', logData);
  } else if (statusCode >= 400) {
    logger.warn('Request error', logData);
  } else {
    logger.http('Request completed', logData);
  }
};

module.exports = {
  logger,
  httpLogger,
  dbLogger,
  logServerStart,
  logDatabaseConnection,
  logError,
  logRequest
};
