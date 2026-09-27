/**
 * storageService.js - CITAMED.VE
 * M03 / Semana 6 - Servicio de almacenamiento privado en Supabase Storage
 */

const { createClient } = require('@supabase/supabase-js');

const BUCKET_NAME = 'clinical-files';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseClient = null;

if (supabaseUrl && supabaseKey) {
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function isStorageEnabled() {
  return Boolean(supabaseClient);
}

/**
 * Valida los magic bytes reales del archivo
 */
function detectFileTypeFromBuffer(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { ext: 'pdf', mimeType: 'application/pdf' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { ext: 'png', mimeType: 'image/png' };
  }

  // JPG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { ext: 'jpg', mimeType: 'image/jpeg' };
  }

  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { ext: 'webp', mimeType: 'image/webp' };
  }

  return null;
}

/**
 * Sube un buffer al bucket privado
 */
async function uploadFile(storagePath, buffer, mimeType) {
  if (!isStorageEnabled()) {
    const err = new Error('El almacenamiento de archivos no está configurado');
    err.statusCode = 503;
    throw err;
  }

  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Genera una URL firmada temporal de descarga
 */
async function createSignedUrl(storagePath, expiresIn = 60) {
  if (!isStorageEnabled()) {
    const err = new Error('El almacenamiento de archivos no está configurado');
    err.statusCode = 503;
    throw err;
  }

  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl;
}

/**
 * Elimina un archivo del bucket
 */
async function deleteFile(storagePath) {
  if (!isStorageEnabled()) {
    const err = new Error('El almacenamiento de archivos no está configurado');
    err.statusCode = 503;
    throw err;
  }

  const { data, error } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  BUCKET_NAME,
  isStorageEnabled,
  detectFileTypeFromBuffer,
  uploadFile,
  createSignedUrl,
  deleteFile
};
