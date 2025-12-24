/**
 * Upload Middleware - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Middleware para manejo de uploads con multer (memory storage)
 */

const multer = require('multer');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

// Tipos de archivo permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

// Tamaño máximo: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ═══════════════════════════════════════════════════════════════
// FILTRO DE ARCHIVOS
// ═══════════════════════════════════════════════════════════════

const fileFilter = (req, file, cb) => {
  // Verificar extensión
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Extensión no permitida: ${ext}. Permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`), false);
  }

  // Verificar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`), false);
  }

  cb(null, true);
};

// ═══════════════════════════════════════════════════════════════
// STORAGE (Memory para compatibilidad con S3)
// ═══════════════════════════════════════════════════════════════

const storage = multer.memoryStorage();

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE MULTER
// ═══════════════════════════════════════════════════════════════

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1 // Un archivo a la vez
  }
});

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware para subir un solo documento
 */
const uploadSingleDocument = upload.single('document');

/**
 * Middleware para subir foto de perfil
 */
const uploadProfilePhoto = upload.single('profilePhoto');

/**
 * Middleware para subir fotos del consultorio (hasta 10)
 */
const uploadClinicPhotos = upload.array('photos', 10);

/**
 * Middleware para subir múltiples documentos (hasta 5)
 */
const uploadMultipleDocuments = upload.array('documents', 5);

/**
 * Middleware para manejar errores de multer
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Errores de multer
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: `El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Se excedió el número máximo de archivos permitidos'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Campo de archivo inesperado'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Error de carga: ${err.message}`
        });
    }
  } else if (err) {
    // Otros errores (como validación de tipo)
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al procesar el archivo'
    });
  }

  next();
};

/**
 * Middleware combinado: upload + manejo de errores
 */
const uploadDocument = (req, res, next) => {
  uploadSingleDocument(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

/**
 * Middleware para validar que el archivo fue recibido
 */
const requireFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No se proporcionó ningún archivo'
    });
  }
  next();
};

/**
 * Middleware para agregar metadata del archivo al request
 */
const addFileMetadata = (req, res, next) => {
  if (req.file) {
    req.fileMetadata = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size),
      extension: path.extname(req.file.originalname).toLowerCase()
    };
  }
  next();
};

/**
 * Formatea el tamaño de archivo para display
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Obtiene información de configuración de uploads
 */
function getUploadConfig() {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    allowedMimeTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS,
    maxFiles: 5
  };
}

module.exports = {
  // Middlewares principales
  uploadDocument,
  uploadSingleDocument,
  uploadProfilePhoto,
  uploadClinicPhotos,
  uploadMultipleDocuments,
  handleUploadError,
  requireFile,
  addFileMetadata,

  // Utilidades
  getUploadConfig,
  formatFileSize,

  // Constantes
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
