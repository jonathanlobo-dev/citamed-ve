/**
 * DocumentUploadPage - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Página para que los doctores suban documentos de verificación
 */

import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CloudUpload,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  FileUp
} from 'lucide-react';
import { useKYCVerification } from '../../../hooks/useKYCVerification';

// Íconos por tipo de documento
const documentIcons = {
  medical_degree: '🎓',
  mpps_certificate: '📜',
  national_id: '🆔',
  professional_id: '💼',
  specialty_certificate: '📋',
  other: '📄'
};

// Colores por estado
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200'
};

const statusLabels = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  expired: 'Expirado'
};

export default function DocumentUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Hook de verificación KYC
  const {
    status,
    documentTypes,
    uploadConfig,
    loading,
    uploading,
    submitting,
    uploadProgress,
    isVerified,
    isPending,
    canSubmit,
    missingDocuments,
    uploadedDocuments,
    uploadDocument,
    deleteDocument,
    submitVerification,
    getStatusName,
    formatFileSize
  } = useKYCVerification();

  // Estado local
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Subir documento
  const handleUpload = async () => {
    if (!selectedFile || !selectedType) return;

    const result = await uploadDocument(selectedFile, selectedType, expirationDate || null);

    if (result.success) {
      setSelectedFile(null);
      setSelectedType('');
      setExpirationDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Eliminar documento
  const handleDelete = async (documentId) => {
    if (window.confirm('¿Estás seguro de eliminar este documento?')) {
      await deleteDocument(documentId);
    }
  };

  // Enviar solicitud de verificación
  const handleSubmitVerification = async () => {
    const result = await submitVerification();
    if (result.success) {
      setShowConfirmSubmit(false);
    }
  };

  // Loading state
  if (loading && !status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/medico/dashboard"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Verificación de Cuenta</h1>
              <p className="text-sm text-gray-500">Sube tus documentos para obtener el badge de Médico Verificado</p>
            </div>
          </div>

          {/* Badge de estado */}
          <div className={`px-4 py-2 rounded-full font-medium ${
            isVerified ? 'bg-green-100 text-green-800' :
            isPending ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isVerified && <ShieldCheck className="h-5 w-5 inline mr-2" />}
            {getStatusName(status?.status || 'unverified')}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Alerta de verificación aprobada */}
        {isVerified && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
            <ShieldCheck className="h-8 w-8 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-800">¡Cuenta Verificada!</h3>
              <p className="text-green-700 mt-1">
                Tu cuenta ha sido verificada exitosamente. Ahora apareces con el badge de Médico Verificado
                en el directorio y tus pacientes pueden confiar en tus credenciales.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de verificación pendiente */}
        {isPending && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
            <Clock className="h-8 w-8 text-yellow-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800">Verificación en Proceso</h3>
              <p className="text-yellow-700 mt-1">
                Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos cuando el proceso termine.
                Tiempo estimado: 1-3 días hábiles.
              </p>
            </div>
          </div>
        )}

        {/* Alerta de rechazo */}
        {status?.status === 'rejected' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Verificación Rechazada</h3>
              <p className="text-red-700 mt-1">{status?.rejectionReason}</p>
              <p className="text-red-600 mt-2 text-sm">
                Puedes subir nuevos documentos y enviar otra solicitud.
              </p>
            </div>
          </div>
        )}

        {/* Sección de documentos requeridos */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            Documentos Requeridos
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {documentTypes.filter(dt => dt.required).map((docType) => {
              const uploaded = uploadedDocuments.find(d => d.type === docType.type);
              const isMissing = missingDocuments.includes(docType.type);

              return (
                <div
                  key={docType.type}
                  className={`p-4 rounded-lg border-2 ${
                    uploaded?.status === 'approved' ? 'border-green-300 bg-green-50' :
                    uploaded ? 'border-yellow-300 bg-yellow-50' :
                    'border-dashed border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{documentIcons[docType.type]}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{docType.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{docType.description}</p>

                      {uploaded ? (
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[uploaded.status]}`}>
                            {statusLabels[uploaded.status]}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Pendiente de subir
                        </p>
                      )}
                    </div>

                    {uploaded?.status === 'approved' && (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario de subida (solo si no está verificado ni pendiente) */}
        {!isVerified && !isPending && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CloudUpload className="h-6 w-6 text-teal-600" />
              Subir Documento
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Selector de tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Seleccionar tipo...</option>
                  {documentTypes.map((type) => (
                    <option key={type.type} value={type.type}>
                      {documentIcons[type.type]} {type.name} {type.required ? '(Requerido)' : '(Opcional)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha de expiración */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Expiración (opcional)
                </label>
                <input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {/* Área de drop/selección */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo *
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  selectedFile ? 'border-teal-300 bg-teal-50' : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileUp className="h-8 w-8 text-teal-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <CloudUpload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      Click para seleccionar o arrastra un archivo aquí
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG, WebP o PDF. Máximo {uploadConfig?.maxFileSize || 10}MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Barra de progreso */}
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Subiendo documento...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón subir */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedType || uploading}
              className="mt-4 w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Subiendo...
                </>
              ) : (
                <>
                  <CloudUpload className="h-5 w-5" />
                  Subir Documento
                </>
              )}
            </button>
          </div>
        )}

        {/* Lista de documentos subidos */}
        {uploadedDocuments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos Subidos</h2>

            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${statusColors[doc.status]}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{documentIcons[doc.type]}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.typeName}</h4>
                      <p className="text-sm text-gray-500">{doc.fileName}</p>
                      <p className="text-xs text-gray-400">
                        Subido: {new Date(doc.uploadedAt).toLocaleDateString('es-VE')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status]}
                    </span>

                    {doc.status === 'pending' && !isPending && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón enviar solicitud */}
        {canSubmit && !isVerified && !isPending && (
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-10 w-10 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">¡Documentos Completos!</h3>
                <p className="text-teal-100 mt-1">
                  Has subido todos los documentos requeridos. Envía tu solicitud para que nuestro equipo
                  revise tu información y verifique tu cuenta.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="mt-4 w-full py-3 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-5 w-5" />
              Enviar Solicitud de Verificación
            </button>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirmar Envío de Solicitud
              </h3>
              <p className="text-gray-600 mb-6">
                Una vez enviada la solicitud, no podrás modificar los documentos hasta que se complete
                la revisión. ¿Deseas continuar?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmSubmit(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitVerification}
                  disabled={submitting}
                  className="flex-1 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>Confirmar Envío</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
