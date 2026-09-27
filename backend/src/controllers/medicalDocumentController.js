/**
 * medicalDocumentController.js - CITAMED.VE
 * M03 / Semana 6 - Controlador para emisión, consulta, descarga y verificación de documentos médicos
 */

const crypto = require('crypto');
const db = require('../models');
const medicalDocumentService = require('../services/medicalDocumentService');
const { generateMedicalDocumentPdf } = require('../services/medicalDocumentPdfService');
const storageService = require('../services/clinicalFileStorage');

const { MedicalDocument, Appointment, AuditLog } = db;

class MedicalDocumentController {
  /**
   * POST /api/medical-documents
   * Emitir documento médico (doctor/admin)
   */
  async create(req, res) {
    try {
      const doc = await medicalDocumentService.createDocument(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Documento emitido exitosamente',
        data: doc
      });
    } catch (error) {
      console.error('[MedicalDocumentController] create error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/patient/:patientId
   * Obtener documentos de un paciente con reglas de privacidad
   */
  async getByPatient(req, res) {
    try {
      const docs = await medicalDocumentService.getDocumentsByPatient(req.params.patientId, req.user);
      res.json({
        success: true,
        data: docs
      });
    } catch (error) {
      console.error('[MedicalDocumentController] getByPatient error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/:id/pdf
   * Descargar documento médico en PDF
   */
  async downloadPdf(req, res) {
    try {
      const doc = await medicalDocumentService.getDocumentForUser(req.params.id, req.user);

      if (doc.type === 'attachment') {
        return res.status(400).json({
          success: false,
          message: 'Los archivos adjuntos deben descargarse desde el endpoint de archivos'
        });
      }

      const pdfBuffer = await generateMedicalDocumentPdf(doc);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${doc.type}-${doc.verificationCode}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('[MedicalDocumentController] downloadPdf error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * PUT /api/medical-documents/:id/void
   * Anular un documento médico emitido (doctor/admin)
   */
  async void(req, res) {
    try {
      const doc = await medicalDocumentService.voidDocument(req.params.id, req.user);
      res.json({
        success: true,
        message: 'Documento anulado exitosamente',
        data: doc
      });
    } catch (error) {
      console.error('[MedicalDocumentController] void error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/verify/:code
   * Verificación pública unificada
   */
  async verify(req, res) {
    try {
      const result = await medicalDocumentService.verifyDocument(req.params.code);
      if (!result.valid && result.message === 'Documento no encontrado') {
        return res.status(404).json({
          success: false,
          data: result
        });
      }
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('[MedicalDocumentController] verify error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar el documento',
        error: error.message
      });
    }
  }

  /**
   * POST /api/medical-documents/attachments
   * Subir archivo adjunto privado (PDF, JPG, PNG, WEBP)
   */
  async uploadAttachment(req, res) {
    try {
      if (!storageService.isStorageEnabled()) {
        return res.status(503).json({
          success: false,
          message: 'El almacenamiento de archivos no está configurado'
        });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No se ha proporcionado ningún archivo'
        });
      }

      const detected = storageService.detectFileTypeFromBuffer(req.file.buffer);
      if (!detected) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de archivo no permitido. Solo se aceptan PDF, JPG, PNG o WEBP válidos'
        });
      }

      const rawTitle = req.body.title;
      if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El título del archivo es obligatorio'
        });
      }
      const title = rawTitle.trim().slice(0, 200);

      const category = ['Laboratorio', 'Imagen', 'Informe externo', 'Otro'].includes(req.body.category)
        ? req.body.category
        : 'Otro';

      const description = typeof req.body.description === 'string'
        ? req.body.description.trim().slice(0, 2000)
        : null;

      let patientId;
      let doctorId = null;
      let appointmentId = req.body.appointmentId ? parseInt(req.body.appointmentId, 10) : null;

      if (req.user.role === 'doctor') {
        if (!appointmentId) {
          return res.status(400).json({
            success: false,
            message: 'El médico debe asociar el archivo a una cita médica (appointmentId requerido)'
          });
        }
        const appointment = await Appointment.findByPk(appointmentId);
        if (!appointment) {
          return res.status(404).json({
            success: false,
            message: 'Cita no encontrada'
          });
        }
        if (req.user.role !== 'admin' && appointment.doctorId !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'No estás autorizado para adjuntar archivos a esta cita'
          });
        }
        patientId = appointment.patientId;
        doctorId = appointment.doctorId;
      } else if (req.user.role === 'patient') {
        patientId = req.user.id;
        if (appointmentId) {
          const appointment = await Appointment.findByPk(appointmentId);
          if (!appointment || appointment.patientId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: 'La cita indicada no te pertenece'
            });
          }
          doctorId = appointment.doctorId;
        }
      } else {
        // Admin
        patientId = req.body.patientId ? parseInt(req.body.patientId, 10) : req.user.id;
        doctorId = req.body.doctorId ? parseInt(req.body.doctorId, 10) : null;
      }

      const fileUuid = crypto.randomUUID();
      const storagePath = `patients/${patientId}/${fileUuid}.${detected.ext}`;

      await storageService.uploadFile(storagePath, req.file.buffer, detected.mimeType);

      const doc = await MedicalDocument.create({
        type: 'attachment',
        appointmentId: appointmentId || null,
        patientId,
        doctorId,
        uploadedBy: req.user.id,
        title,
        content: {
          category,
          description
        },
        verificationCode: null,
        status: 'active',
        storagePath,
        mimeType: detected.mimeType,
        sizeBytes: req.file.size
      });

      res.status(201).json({
        success: true,
        message: 'Archivo adjunto subido exitosamente',
        data: doc
      });
    } catch (error) {
      console.error('[MedicalDocumentController] uploadAttachment error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/medical-documents/:id/file
   * Obtiene URL firmada de 60 segundos para visualizar/descargar el archivo adjunto
   */
  async getFileSignedUrl(req, res) {
    try {
      if (!storageService.isStorageEnabled()) {
        return res.status(503).json({
          success: false,
          message: 'El almacenamiento de archivos no está configurado'
        });
      }

      const doc = await medicalDocumentService.getDocumentForUser(req.params.id, req.user);

      if (doc.type !== 'attachment' || !doc.storagePath) {
        return res.status(400).json({
          success: false,
          message: 'Este documento no es un archivo adjunto'
        });
      }

      const url = await storageService.createSignedUrl(doc.storagePath, 60);

      res.json({
        success: true,
        url
      });
    } catch (error) {
      console.error('[MedicalDocumentController] getFileSignedUrl error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * DELETE /api/medical-documents/:id/file
   * Eliminar archivo adjunto (solo uploaded_by o admin)
   */
  async deleteAttachmentFile(req, res) {
    try {
      if (!storageService.isStorageEnabled()) {
        return res.status(503).json({
          success: false,
          message: 'El almacenamiento de archivos no está configurado'
        });
      }

      const doc = await MedicalDocument.findByPk(req.params.id);
      if (!doc || doc.status === 'deleted') {
        return res.status(404).json({
          success: false,
          message: 'Archivo no encontrado'
        });
      }

      if (doc.type !== 'attachment') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar archivos adjuntos'
        });
      }

      if (req.user.role !== 'admin' && doc.uploadedBy !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Solo el usuario que subió el archivo puede eliminarlo'
        });
      }

      doc.status = 'deleted';
      await doc.save();

      if (doc.storagePath) {
        try {
          await storageService.deleteFile(doc.storagePath);
        } catch (e) {
          console.error('[MedicalDocumentController] Error deleting file from bucket:', e);
        }
      }

      // Registro en audit_logs
      try {
        if (AuditLog) {
          await AuditLog.create({
            userId: req.user.id,
            action: 'medical_document.attachment.deleted',
            resource: 'medical_documents',
            resourceId: String(doc.id),
            method: 'DELETE',
            endpoint: req.originalUrl,
            statusCode: 200,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            details: {
              title: doc.title,
              storagePath: doc.storagePath,
              sizeBytes: doc.sizeBytes
            }
          });
        }
      } catch (auditErr) {
        console.error('[MedicalDocumentController] Audit log error:', auditErr);
      }

      res.json({
        success: true,
        message: 'Archivo adjunto eliminado exitosamente'
      });
    } catch (error) {
      console.error('[MedicalDocumentController] deleteAttachmentFile error:', error);
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new MedicalDocumentController();
