/**
 * ImageGallery Component - CITAMED.VE
 * Galería de imágenes con upload múltiple, drag & drop y reordenamiento
 * Para fotos de consultorio, productos, etc.
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  X,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  GripVertical,
  Maximize2,
  Trash2
} from 'lucide-react';

/**
 * Props:
 * @param {Array} images - Array de URLs de imágenes
 * @param {function} onImagesChange - Callback con nuevo array de imágenes
 * @param {number} maxImages - Máximo de imágenes permitidas (default: 10)
 * @param {number} maxSizeMB - Tamaño máximo por imagen en MB (default: 5)
 * @param {boolean} loading - Estado de carga
 * @param {boolean} disabled - Deshabilitar interacción
 * @param {boolean} reorderable - Permitir reordenar (default: true)
 * @param {string} label - Label del componente
 * @param {string} hint - Texto de ayuda
 */
const ImageGallery = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
  loading = false,
  disabled = false,
  reorderable = true,
  label = 'Galería de imágenes',
  hint = 'Arrastra para reordenar. La primera imagen será la principal.',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);

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

  // Procesar múltiples imágenes
  const processImages = useCallback(async (files) => {
    if (images.length + files.length > maxImages) {
      setError(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const newImages = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        // Convertir a base64 para preview
        const base64 = await fileToBase64(file);
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url: base64,
          file: file,
          isNew: true
        });
      }

      if (newImages.length > 0 && onImagesChange) {
        onImagesChange([...images, ...newImages]);
      }
    } catch (err) {
      setError('Error al procesar las imágenes');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [images, maxImages, maxSizeMB, onImagesChange]);

  // Convertir File a Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
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

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      processImages(files);
    }
  };

  // Handler de input file
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processImages(files);
    }
    e.target.value = '';
  };

  // Eliminar imagen
  const handleRemove = (imageId) => {
    if (onImagesChange) {
      onImagesChange(images.filter(img =>
        typeof img === 'string' ? img !== imageId : img.id !== imageId
      ));
    }
  };

  // Reordenar imágenes
  const handleReorder = (newOrder) => {
    if (onImagesChange) {
      onImagesChange(newOrder);
    }
  };

  // Obtener URL de imagen (soporta objetos y strings)
  const getImageUrl = (image) => {
    if (typeof image === 'string') return image;
    return image.url || image.src;
  };

  // Obtener ID de imagen
  const getImageId = (image) => {
    if (typeof image === 'string') return image;
    return image.id;
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
          <span className="text-gray-400 font-normal ml-2">
            ({images.length}/{maxImages})
          </span>
        </label>
      )}

      {/* Grid de imágenes */}
      <div className="space-y-4">
        {images.length > 0 && (
          <Reorder.Group
            axis="x"
            values={images}
            onReorder={handleReorder}
            className="flex flex-wrap gap-4"
          >
            {images.map((image, index) => (
              <Reorder.Item
                key={getImageId(image)}
                value={image}
                disabled={!reorderable || disabled}
                className="relative group"
                whileDrag={{ scale: 1.05, zIndex: 10 }}
              >
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                  {/* Imagen */}
                  <img
                    src={getImageUrl(image)}
                    alt={`Imagen ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Badge de principal */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                      Principal
                    </div>
                  )}

                  {/* Overlay de acciones */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {/* Expandir */}
                    <button
                      type="button"
                      onClick={() => setLightboxImage(getImageUrl(image))}
                      className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center text-white transition-colors"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Eliminar */}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemove(getImageId(image))}
                        className="w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Handle de drag */}
                  {reorderable && !disabled && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-black/30 rounded flex items-center justify-center cursor-grab active:cursor-grabbing">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {/* Zona de upload */}
        {canAddMore && !disabled && (
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
              }
              ${images.length === 0 ? 'min-h-[200px] flex items-center justify-center' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {isProcessing || loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-600">Procesando imágenes...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">
                    Arrastra imágenes aquí
                  </p>
                  <p className="text-gray-500 text-sm">
                    o haz clic para seleccionar
                  </p>
                </div>
                <p className="text-gray-400 text-xs">
                  JPG, PNG o WebP. Máximo {maxSizeMB}MB por imagen.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Hint */}
        {hint && !error && (
          <p className="text-gray-500 text-sm">{hint}</p>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={() => setLightboxImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Vista ampliada"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGallery;
