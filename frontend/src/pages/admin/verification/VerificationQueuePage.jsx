/**
 * VerificationQueuePage - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Página de administración para revisar solicitudes de verificación
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useVerificationQueue } from '../../../hooks/useKYCVerification';
import * as kycService from '../../../services/kycVerificationService';

// Colores por estado de solicitud
const requestStatusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800'
};

const requestStatusLabels = {
  submitted: 'Enviada',
  in_review: 'En Revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  on_hold: 'En Espera'
};

export default function VerificationQueuePage() {
  // Hook de cola de verificación
  const {
    queue,
    pagination,
    stats,
    loading,
    loadQueue,
    loadStats,
    assignRequest,
    approveDocument,
    rejectDocument,
    approveVerification,
    rejectVerification,
    getRequestDetails
  } = useVerificationQueue();

  // Estado local
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    page: 1
  });
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Cargar detalles de solicitud
  const handleViewDetails = async (request) => {
    setSelectedRequest(request);
    setLoadingDetails(true);

    try {
      const response = await getRequestDetails(request.id);
      if (response.success) {
        setRequestDetails(response.data);
      }
    } catch (error) {
      console.error('Error loading details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Cerrar detalles
  const closeDetails = () => {
    setSelectedRequest(null);
    setRequestDetails(null);
  };

  // Asignarme la solicitud
  const handleAssignToMe = async (requestId) => {
    setActionLoading(true);
    await assignRequest(requestId);
    if (requestDetails) {
      handleViewDetails({ id: requestId });
    }
    setActionLoading(false);
  };

  // Aprobar documento
  const handleApproveDocument = async (documentId) => {
    setActionLoading(true);
    const result = await approveDocument(documentId);
    if (result.success && requestDetails) {
      handleViewDetails({ id: requestDetails.request.id });
    }
    setActionLoading(false);
  };

  // Iniciar rechazo de documento
  const startRejectDocument = (documentId) => {
    setRejectingItem({ type: 'document', id: documentId });
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Iniciar rechazo de verificación
  const startRejectVerification = (requestId) => {
    setRejectingItem({ type: 'verification', id: requestId });
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Confirmar rechazo
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    let result;

    if (rejectingItem.type === 'document') {
      result = await rejectDocument(rejectingItem.id, rejectReason);
      if (result.success && requestDetails) {
        handleViewDetails({ id: requestDetails.request.id });
      }
    } else {
      result = await rejectVerification(rejectingItem.id, rejectReason);
      if (result.success) {
        closeDetails();
      }
    }

    setShowRejectModal(false);
    setRejectingItem(null);
    setRejectReason('');
    setActionLoading(false);
  };

  // Aprobar verificación completa
  const handleApproveVerification = async (requestId) => {
    if (window.confirm('¿Confirmas la aprobación de este médico? Se le otorgará el badge de Verificado.')) {
      setActionLoading(true);
      const result = await approveVerification(requestId);
      if (result.success) {
        closeDetails();
      }
      setActionLoading(false);
    }
  };

  // Cambiar filtro
  const handleFilterChange = (key, value) => {
    const newFilter = { ...filter, [key]: value, page: 1 };
    setFilter(newFilter);
    loadQueue(newFilter);
  };

  // Cambiar página
  const handlePageChange = (page) => {
    const newFilter = { ...filter, page };
    setFilter(newFilter);
    loadQueue(newFilter);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/dashboard"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Cola de Verificación KYC</h1>
              <p className="text-sm text-gray-500">Revisa y aprueba solicitudes de médicos</p>
            </div>
          </div>

          <button
            onClick={() => { loadQueue(filter); loadStats(); }}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Actualizar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.requests?.pending || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">En Revisión</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.requests?.in_review || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Sin Asignar</p>
              <p className="text-2xl font-bold text-orange-600">{stats.unassignedRequests || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Hoy Completadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedToday || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <p className="text-sm text-gray-500">Docs Pendientes</p>
              <p className="text-2xl font-bold text-purple-600">{stats.pendingDocuments || 0}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos los estados</option>
              <option value="submitted">Enviadas</option>
              <option value="in_review">En Revisión</option>
              <option value="on_hold">En Espera</option>
            </select>
          </div>
        </div>

        {/* Lista de solicitudes */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {loading && queue.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Cargando solicitudes...</p>
            </div>
          ) : queue.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Médico</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Documentos</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Días Espera</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {queue.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Dr. {request.doctorProfile?.firstName} {request.doctorProfile?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            MPPS: {request.doctorProfile?.mppsNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${requestStatusColors[request.status]}`}>
                        {requestStatusLabels[request.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">{request.documentsCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${request.waitingDays > 3 ? 'text-red-600' : 'text-gray-600'}`}>
                        {request.waitingDays} días
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.assignedAdmin ? (
                        <span className="text-gray-600">
                          {request.assignedAdmin.firstName || request.assignedAdmin.email}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(request)}
                        className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {queue.length} de {pagination.total} solicitudes
              </p>
              <div className="flex gap-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded ${
                      page === pagination.page
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Panel lateral de detalles */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl">
            {/* Header del panel */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Detalles de Solicitud</h2>
              <button
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
              </div>
            ) : requestDetails ? (
              <div className="p-6 space-y-6">
                {/* Info del doctor */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    {requestDetails.request.doctorProfile?.profilePhoto ? (
                      <img
                        src={requestDetails.request.doctorProfile.profilePhoto}
                        alt=""
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center">
                        <User className="h-8 w-8 text-teal-600" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Dr. {requestDetails.request.doctorProfile?.firstName} {requestDetails.request.doctorProfile?.lastName}
                      </h3>
                      <p className="text-gray-500">
                        MPPS: {requestDetails.request.doctorProfile?.mppsNumber || 'N/A'}
                      </p>
                      <p className="text-gray-500">
                        Licencia: {requestDetails.request.doctorProfile?.licenseNumber || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estado de solicitud */}
                <div className="flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-full font-medium ${requestStatusColors[requestDetails.request.status]}`}>
                    {requestStatusLabels[requestDetails.request.status]}
                  </span>
                  <span className="text-gray-500">
                    {requestDetails.request.waitingDays} días en espera
                  </span>
                </div>

                {/* Botón asignar */}
                {!requestDetails.request.assignedTo && (
                  <button
                    onClick={() => handleAssignToMe(requestDetails.request.id)}
                    disabled={actionLoading}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Asignarme esta solicitud
                  </button>
                )}

                {/* Documentos */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Documentos ({requestDetails.documents?.length || 0})</h4>
                  <div className="space-y-3">
                    {requestDetails.documents?.map((doc) => (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border ${
                          doc.status === 'approved' ? 'border-green-200 bg-green-50' :
                          doc.status === 'rejected' ? 'border-red-200 bg-red-50' :
                          'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {doc.typeName}
                              {doc.isRequired && (
                                <span className="ml-2 text-xs text-red-500">(Requerido)</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{doc.fileName}</p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-teal-600 hover:underline"
                            >
                              Ver documento
                            </a>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                              doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {doc.status === 'approved' ? 'Aprobado' :
                               doc.status === 'rejected' ? 'Rechazado' :
                               'Pendiente'}
                            </span>

                            {doc.status === 'pending' && requestDetails.request.status !== 'approved' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveDocument(doc.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => startRejectDocument(doc.id)}
                                  disabled={actionLoading}
                                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {doc.reviewNotes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                            Nota: {doc.reviewNotes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documentos requeridos faltantes */}
                {requestDetails.requiredDocuments?.some(d => !d.uploaded) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Documentos Faltantes
                    </p>
                    <ul className="mt-2 space-y-1">
                      {requestDetails.requiredDocuments
                        .filter(d => !d.uploaded)
                        .map(d => (
                          <li key={d.type} className="text-sm text-yellow-700">
                            - {d.name}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Acciones finales */}
                {requestDetails.request.status !== 'approved' && requestDetails.request.status !== 'rejected' && (
                  <div className="border-t pt-4 space-y-3">
                    {/* Verificar si todos los requeridos están aprobados */}
                    {requestDetails.requiredDocuments?.every(d => d.approved) && (
                      <button
                        onClick={() => handleApproveVerification(requestDetails.request.id)}
                        disabled={actionLoading}
                        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="h-5 w-5" />
                        Aprobar Verificación
                      </button>
                    )}

                    <button
                      onClick={() => startRejectVerification(requestDetails.request.id)}
                      disabled={actionLoading}
                      className="w-full py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                      Rechazar Verificación
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Razón del Rechazo
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explica la razón del rechazo..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
