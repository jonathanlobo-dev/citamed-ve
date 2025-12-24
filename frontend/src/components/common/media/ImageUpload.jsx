/**
 * ImageUpload Component - CITAMED.VE
 * Componente profesional para upload de imágenes con preview y validación
 * Reutilizable para foto de perfil de médicos, pacientes y proveedores
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  X,
  Check,
  AlertCircle,
  User,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';

/**
 * Props:
 * @param {string} currentImage - URL de imagen actual
 * @param {function} onImageChange - Callback con la nueva imagen (base64 o File)
 * @param {string} shape - 'circle' | 'square' | 'rounded'
 * @param {number} size - Tamaño en pixels (default: 150)
 * @param {string} placeholder - Tipo de placeholder ('user' | 'building' | 'product')
 * @param {boolean} loading - Estado de carga
 * @param {boolean} disabled - Deshabilitar upload
 * @param {number} maxSizeMB - Tamaño máximo en MB (default: 5)
 * @param {string} label - Label del componente
 * @param {string} hint - Texto de ayuda
 */
const ImageUpload = ({
  currentImage = null,
  onImageChange,
  shape = 'circle',
  size = 150,
  placeholder = 'user',
  loading = false,
  disabled = false,
  maxSizeMB = 5,
  label = 'Foto de perfil',
  hint = 'JPG, PNG o WebP. Máximo 5MB.',
  className = ''
}) => {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  // Configuración de forma
  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-2xl'
  };

  // Iconos de placeholder
  const PlaceholderIcon = {
    user: User,
    building: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 7v14M21 7v14M6 11h.01M6 15h.01M6 19h.01M10 11h.01M10 15h.01M10 19h.01M14 11h.01M14 15h.01M14 19h.01M18 11h.01M18 15h.01M18 19h.01M8 7V3h8v4" />
      </svg>
    ),
    product: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  }[placeholder] || User;

  // Validar archivo
  const validateFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return 'Formato no válido. Use JPG, PNG o WebP.';
    }

    if (file.size > maxSize) {
      return `El archivo es muy grande. Máximo ${maxSizeMB}MB.`;
    }

    return null;
  };

  // Procesar imagen
  const processImage = useCallback(async (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Redimensionar si es necesario
      const resizedImage = await resizeImage(file, 800, 800);

      // Callback con imagen procesada
      if (onImageChange) {
        onImageChange(resizedImage);
      }
    } catch (err) {
      setError('Error al procesar la imagen');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [onImageChange, maxSizeMB]);

  // Redimensionar imagen
  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Handlers de drag & drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  };

  // Handler de input file
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  // Remover imagen
  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageChange) {
      onImageChange(null);
    }
  };

  // Imagen actual a mostrar
  const displayImage = preview || currentImage;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
        </label>
      )}

      {/* Container de imagen */}
      <div
        className={`
          relative group cursor-pointer
          ${shapeClasses[shape]}
          ${isDragging ? 'ring-4 ring-primary ring-offset-2' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ width: size, height: size }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {/* Imagen o Placeholder */}
        {displayImage ? (
          <img
            src={displayImage}
            alt="Preview"
            className={`w-full h-full object-cover ${shapeClasses[shape]}`}
          />
        ) : (
          <div className={`
            w-full h-full flex items-center justify-center
            bg-gradient-to-br from-gray-100 to-gray-200
            ${shapeClasses[shape]}
          `}>
            <PlaceholderIcon className="w-1/3 h-1/3 text-gray-400" />
          </div>
        )}

        {/* Overlay de hover */}
        <AnimatePresence>
          {!disabled && (
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`
                absolute inset-0 bg-black/50 flex items-center justify-center
                ${shapeClasses[shape]}
              `}
            >
              {loading || isProcessing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <div className="flex flex-col items-center text-white">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-medium">
                    {displayImage ? 'Cambiar' : 'Subir'}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botón de eliminar */}
        {displayImage && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Badge de verificado/cargando */}
        {(loading || isProcessing) && (
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Hint o Error */}
      <div className="mt-3 text-center">
        {error ? (
          <div className="flex items-center gap-1 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : hint ? (
          <p className="text-gray-500 text-sm">{hint}</p>
        ) : null}
      </div>

      {/* Instrucciones adicionales */}
      {!displayImage && !disabled && (
        <p className="text-gray-400 text-xs mt-2">
          Arrastra una imagen o haz clic para seleccionar
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
