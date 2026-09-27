/**
 * Storage Service - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Servicio híbrido de almacenamiento: local (desarrollo) / S3 (producción)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuración
const STORAGE_MODE = process.env.STORAGE_MODE || 'local'; // 'local' o 's3'
const UPLOADS_DIR = path.join(__dirname, '../../uploads/doctor-documents');
const PROFILE_PHOTOS_DIR = path.join(__dirname, '../../uploads/profile-photos');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Configuración S3 (para producción)
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_REGION = process.env.AWS_S3_REGION || 'us-east-1';

// Tipos de archivo permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Asegura que el directorio de uploads existe
 */
function ensureUploadDir(dir = UPLOADS_DIR) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Genera un nombre único para el archivo
 */
function generateUniqueFileName(originalName, doctorProfileId) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `doctor_${doctorProfileId}_${timestamp}_${randomStr}${ext}`;
}

/**
 * Valida el archivo
 */
function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No se proporcionó archivo');
    return { valid: false, errors };
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    errors.push(`Tipo de archivo no permitido. Permitidos: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ═══════════════════════════════════════════════════════════════
// ALMACENAMIENTO LOCAL
// ═══════════════════════════════════════════════════════════════

/**
 * Guarda archivo localmente
 */
async function saveFileLocal(file, doctorProfileId) {
  ensureUploadDir();

  const fileName = generateUniqueFileName(file.originalname, doctorProfileId);
  const filePath = path.join(UPLOADS_DIR, fileName);

  // Escribir archivo
  await fs.promises.writeFile(filePath, file.buffer);

  return {
    fileName,
    fileUrl: `/uploads/doctor-documents/${fileName}`,
    fullUrl: `${BASE_URL}/uploads/doctor-documents/${fileName}`,
    fileSize: file.size,
    mimeType: file.mimetype
  };
}

/**
 * Guarda foto de perfil localmente
 */
async function saveProfilePhotoLocal(file, userId) {
  ensureUploadDir(PROFILE_PHOTOS_DIR);

  const ext = path.extname(file.originalname).toLowerCase();
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(4).toString('hex');
  const fileName = `profile_${userId}_${timestamp}_${randomStr}${ext}`;
  const filePath = path.join(PROFILE_PHOTOS_DIR, fileName);

  // Escribir archivo
  await fs.promises.writeFile(filePath, file.buffer);

  return {
    fileName,
    fileUrl: `/uploads/profile-photos/${fileName}`,
    fullUrl: `${BASE_URL}/uploads/profile-photos/${fileName}`,
    fileSize: file.size,
    mimeType: file.mimetype
  };
}

/**
 * Elimina archivo localmente
 */
async function deleteFileLocal(fileUrl) {
  const fileName = path.basename(fileUrl);
  const filePath = path.join(UPLOADS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }

  return false;
}

/**
 * Obtiene archivo local
 */
async function getFileLocal(fileUrl) {
  const fileName = path.basename(fileUrl);
  const filePath = path.join(UPLOADS_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return {
    path: filePath,
    stream: fs.createReadStream(filePath)
  };
}

// ═══════════════════════════════════════════════════════════════
// ALMACENAMIENTO S3 (Preparado para producción)
// ═══════════════════════════════════════════════════════════════

/**
 * Guarda archivo en S3
 */
async function saveFileS3(file, doctorProfileId) {
  // Importar AWS SDK solo si es necesario
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  const fileName = generateUniqueFileName(file.originalname, doctorProfileId);
  const key = `doctor-documents/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      doctorProfileId: String(doctorProfileId),
      originalName: file.originalname
    }
  });

  await s3Client.send(command);

  const fileUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;

  return {
    fileName,
    fileUrl,
    fullUrl: fileUrl,
    fileSize: file.size,
    mimeType: file.mimetype
  };
}

/**
 * Elimina archivo de S3
 */
async function deleteFileS3(fileUrl) {
  const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

  const s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  // Extraer key del URL
  const url = new URL(fileUrl);
  const key = url.pathname.substring(1); // Remover "/" inicial

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  await s3Client.send(command);
  return true;
}

/**
 * Genera URL firmada para acceso temporal a S3
 */
async function getSignedUrlS3(fileUrl, expiresIn = 3600) {
  const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  const s3Client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });

  // Extraer key del URL
  const url = new URL(fileUrl);
  const key = url.pathname.substring(1);

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// ═══════════════════════════════════════════════════════════════
// API PÚBLICA (HÍBRIDA)
// ═══════════════════════════════════════════════════════════════

/**
 * Guarda un archivo (local o S3 según configuración)
 */
async function saveFile(file, doctorProfileId) {
  // Validar primero
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.errors.join('. '));
  }

  if (STORAGE_MODE === 's3') {
    return await saveFileS3(file, doctorProfileId);
  }

  return await saveFileLocal(file, doctorProfileId);
}

/**
 * Guarda una foto de perfil
 */
async function saveProfilePhoto(file, userId) {
  // Validar tipo de imagen
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!imageTypes.includes(file.mimetype)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WebP');
  }

  // Validar tamaño (5MB max para fotos de perfil)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen excede el tamaño máximo de 5MB');
  }

  // Por ahora solo local, S3 se puede agregar después
  return await saveProfilePhotoLocal(file, userId);
}

/**
 * Elimina un archivo
 */
async function deleteFile(fileUrl) {
  if (!fileUrl) return false;

  try {
    if (STORAGE_MODE === 's3' || fileUrl.includes('s3.amazonaws.com')) {
      return await deleteFileS3(fileUrl);
    }

    return await deleteFileLocal(fileUrl);
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return false;
  }
}

/**
 * Obtiene URL de acceso al archivo
 */
async function getFileUrl(fileUrl, expiresIn = 3600) {
  if (!fileUrl) return null;

  // Si es S3, generar URL firmada
  if (fileUrl.includes('s3.amazonaws.com')) {
    return await getSignedUrlS3(fileUrl, expiresIn);
  }

  // Si es local, devolver la URL directa
  return `${BASE_URL}${fileUrl}`;
}

/**
 * Obtiene el stream de un archivo para descarga
 */
async function getFileStream(fileUrl) {
  if (STORAGE_MODE === 'local') {
    return await getFileLocal(fileUrl);
  }

  // Para S3, redirigir a URL firmada
  const signedUrl = await getSignedUrlS3(fileUrl);
  return { signedUrl };
}

/**
 * Obtiene información del almacenamiento
 */
function getStorageInfo() {
  return {
    mode: STORAGE_MODE,
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
    allowedTypes: ALLOWED_MIME_TYPES,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
    uploadsDir: STORAGE_MODE === 'local' ? UPLOADS_DIR : null,
    s3Bucket: STORAGE_MODE === 's3' ? S3_BUCKET : null
  };
}

module.exports = {
  saveFile,
  saveProfilePhoto,
  deleteFile,
  getFileUrl,
  getFileStream,
  getStorageInfo,
  validateFile,
  generateUniqueFileName,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
