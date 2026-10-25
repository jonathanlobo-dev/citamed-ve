/**
 * assistantController.js - CITAMED.VE
 * Semana 9 / Bloque A - Controlador para gestión de asistentes y vínculos médico-asistente
 */

const crypto = require('crypto');
const { Op } = require('sequelize');
const db = require('../models');
const auditService = require('../services/auditService');
const assistantInviteService = require('../services/assistantInviteService');

const { DoctorAssistant, User, DoctorProfile, Specialty } = db;

class AssistantController {
  /**
   * GET /api/assistants
   * Obtener lista de asistentes del médico autenticado
   */
  async getMyAssistants(req, res) {
    try {
      const doctorId = req.user.id;

      const links = await DoctorAssistant.findAll({
        where: { doctorId },
        include: [
          {
            model: User,
            as: 'assistant',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'accountClaimed', 'isActive']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('[AssistantController] getMyAssistants error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de asistentes',
        error: error.message
      });
    }
  }

  /**
   * POST /api/assistants/invite
   * Invitar a una asistente por correo electrónico
   */
  async inviteAssistant(req, res) {
    try {
      const doctorId = req.user.id;
      const { email, firstName, lastName, permissions } = req.body;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico es obligatorio y debe ser válido'
        });
      }

      if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2 || firstName.trim().length > 60) {
        return res.status(400).json({
          success: false,
          message: 'El nombre es obligatorio (entre 2 y 60 caracteres)'
        });
      }

      if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2 || lastName.trim().length > 60) {
        return res.status(400).json({
          success: false,
          message: 'El apellido es obligatorio (entre 2 y 60 caracteres)'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Buscar si el usuario ya existe
      let assistantUser = await User.findOne({ where: { email: cleanEmail } });

      if (assistantUser) {
        // No se puede invitar a un médico o admin como asistente
        if (assistantUser.role === 'doctor' || assistantUser.role === 'admin') {
          return res.status(400).json({
            success: false,
            message: 'Ese correo pertenece a una cuenta médica o de administrador'
          });
        }

        // Si ya es un usuario activo y no es assistant
        if (assistantUser.role !== 'assistant') {
          // Nunca se convierte una cuenta existente (por ejemplo un paciente creado en una consulta
          // sin cita) en asistente: perdería su historia y su rol.
          return res.status(400).json({
            success: false,
            message: 'Ese correo ya está registrado con otro rol en la plataforma'
          });
        }
      } else {
        // Crear nueva cuenta de asistente no reclamada
        const randomPassword = crypto.randomBytes(32).toString('hex');
        assistantUser = await User.create({
          email: cleanEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: 'assistant',
          password: randomPassword,
          isActive: true,
          accountClaimed: false
        });
      }

      // Validar si ya existe un vínculo previo con este médico
      let link = await DoctorAssistant.findOne({
        where: {
          doctorId,
          assistantId: assistantUser.id
        }
      });

      const canAgenda = permissions?.canAgenda !== false; // true por defecto
      const canPayments = permissions?.canPayments !== false; // true por defecto
      const canVoidReceipts = Boolean(canPayments && permissions?.canVoidReceipts); // false por defecto

      if (link) {
        if (link.status === 'active') {
          return res.status(409).json({
            success: false,
            message: 'Esta asistente ya tiene un vínculo activo contigo'
          });
        }
        if (link.status === 'pending') {
          return res.status(409).json({
            success: false,
            message: 'Ya enviaste una invitación a esta asistente que está pendiente de aceptación'
          });
        }

        // Si estaba revocado, se reactiva como pending
        link.status = 'pending';
        link.canAgenda = canAgenda;
        link.canPayments = canPayments;
        link.canVoidReceipts = canVoidReceipts;
        link.invitedAt = new Date();
        link.acceptedAt = null;
        link.revokedAt = null;
        await link.save();
      } else {
        // Crear nuevo vínculo
        link = await DoctorAssistant.create({
          doctorId,
          assistantId: assistantUser.id,
          status: 'pending',
          canAgenda,
          canPayments,
          canVoidReceipts,
          invitedAt: new Date()
        });
      }

      // Auditoría
      await auditService.log({
        userId: doctorId,
        action: 'assistant_invited',
        resource: 'doctor_assistant',
        resourceId: String(link.id),
        metadata: {
          assistantId: assistantUser.id,
          assistantEmail: cleanEmail,
          permissions: {
            canAgenda,
            canPayments,
            canVoidReceipts
          }
        }
      });

      // Devolver vínculo con datos del usuario
      const fullLink = await DoctorAssistant.findByPk(link.id, {
        include: [
          {
            model: User,
            as: 'assistant',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'accountClaimed', 'isActive']
          }
        ]
      });

      // Correo de invitación (con enlace de activación si la cuenta es nueva)
      const doctorUser = await User.findByPk(doctorId, { attributes: ['id', 'firstName', 'lastName'] });
      const invite = await assistantInviteService.issueInvite(link, assistantUser, doctorUser);

      res.status(201).json({
        success: true,
        message: invite.emailSent
          ? 'Invitación enviada por correo'
          : 'Invitación creada. El correo no está disponible: envíale el enlace por WhatsApp',
        data: fullLink,
        invite
      });
    } catch (error) {
      console.error('[AssistantController] inviteAssistant error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al enviar invitación a la asistente',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/assistants/:linkId/permissions
   * Modificar permisos delegados a una asistente
   */
  async updatePermissions(req, res) {
    try {
      const doctorId = req.user.id;
      const { linkId } = req.params;
      const { canAgenda, canPayments, canVoidReceipts } = req.body;

      const link = await DoctorAssistant.findOne({
        where: {
          id: linkId,
          doctorId
        }
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Vínculo de asistente no encontrado'
        });
      }

      if (link.status === 'revoked') {
        return res.status(400).json({
          success: false,
          message: 'No puedes modificar permisos de un vínculo revocado'
        });
      }

      if (typeof canAgenda === 'boolean') {
        link.canAgenda = canAgenda;
      }
      if (typeof canPayments === 'boolean') {
        link.canPayments = canPayments;
        // Si se apaga cobros, anular recibos también se apaga obligatoriamente
        if (!canPayments) {
          link.canVoidReceipts = false;
        }
      }
      if (typeof canVoidReceipts === 'boolean') {
        link.canVoidReceipts = Boolean(link.canPayments && canVoidReceipts);
      }

      await link.save();

      // Auditoría
      await auditService.log({
        userId: doctorId,
        action: 'assistant_permissions_changed',
        resource: 'doctor_assistant',
        resourceId: String(link.id),
        metadata: {
          assistantId: link.assistantId,
          permissions: {
            canAgenda: link.canAgenda,
            canPayments: link.canPayments,
            canVoidReceipts: link.canVoidReceipts
          }
        }
      });

      res.json({
        success: true,
        message: 'Permisos actualizados exitosamente',
        data: link
      });
    } catch (error) {
      console.error('[AssistantController] updatePermissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar permisos',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/assistants/:linkId
   * Revocar vínculo con una asistente
   */
  async revokeAssistant(req, res) {
    try {
      const doctorId = req.user.id;
      const { linkId } = req.params;

      const link = await DoctorAssistant.findOne({
        where: {
          id: linkId,
          doctorId
        }
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Vínculo de asistente no encontrado'
        });
      }

      link.status = 'revoked';
      link.revokedAt = new Date();
      await link.save();

      // Auditoría
      await auditService.log({
        userId: doctorId,
        action: 'assistant_revoked',
        resource: 'doctor_assistant',
        resourceId: String(link.id),
        metadata: {
          assistantId: link.assistantId
        }
      });

      res.json({
        success: true,
        message: 'Vínculo con asistente revocado exitosamente'
      });
    } catch (error) {
      console.error('[AssistantController] revokeAssistant error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al revocar vínculo',
        error: error.message
      });
    }
  }

  /**
   * GET /api/assistants/my-doctors
   * Lista de médicos con los que la asistente tiene vínculo activo o pendiente
   */
  async getMyDoctors(req, res) {
    try {
      const assistantId = req.user.id;

      const links = await DoctorAssistant.findAll({
        where: {
          assistantId,
          status: { [Op.in]: ['active', 'pending'] }
        },
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            include: [
              {
                model: DoctorProfile,
                as: 'doctorProfile',
                attributes: ['id', 'clinicName', 'clinicAddress', 'profilePhoto', 'consultationFee', 'whatsappNumber'],
                include: [
                  {
                    model: Specialty,
                    as: 'specialty',
                    attributes: ['id', 'name']
                  }
                ]
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.json({
        success: true,
        data: links
      });
    } catch (error) {
      console.error('[AssistantController] getMyDoctors error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener lista de médicos',
        error: error.message
      });
    }
  }

  /**
   * POST /api/assistants/:linkId/accept
   * Asistente acepta una invitación de un médico
   */
  async acceptInvitation(req, res) {
    try {
      const assistantId = req.user.id;
      const { linkId } = req.params;

      const link = await DoctorAssistant.findOne({
        where: {
          id: linkId,
          assistantId,
          status: 'pending'
        }
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Invitación no encontrada o ya procesada'
        });
      }

      link.status = 'active';
      link.acceptedAt = new Date();
      await link.save();

      // Auditoría
      await auditService.log({
        userId: assistantId,
        action: 'assistant_accepted',
        resource: 'doctor_assistant',
        resourceId: String(link.id),
        metadata: {
          doctorId: link.doctorId
        }
      });

      res.json({
        success: true,
        message: 'Invitación aceptada exitosamente',
        data: link
      });
    } catch (error) {
      console.error('[AssistantController] acceptInvitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aceptar invitación',
        error: error.message
      });
    }
  }

  /**
   * POST /api/assistants/:linkId/decline
   * Asistente rechaza una invitación de un médico
   */
  async declineInvitation(req, res) {
    try {
      const assistantId = req.user.id;
      const { linkId } = req.params;

      const link = await DoctorAssistant.findOne({
        where: {
          id: linkId,
          assistantId,
          status: 'pending'
        }
      });

      if (!link) {
        return res.status(404).json({
          success: false,
          message: 'Invitación no encontrada o ya procesada'
        });
      }

      link.status = 'revoked';
      link.revokedAt = new Date();
      await link.save();

      // Auditoría
      await auditService.log({
        userId: assistantId,
        action: 'assistant_revoked',
        resource: 'doctor_assistant',
        resourceId: String(link.id),
        metadata: {
          doctorId: link.doctorId,
          reason: 'declined'
        }
      });

      res.json({
        success: true,
        message: 'Invitación rechazada'
      });
    } catch (error) {
      console.error('[AssistantController] declineInvitation error:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar invitación',
        error: error.message
      });
    }
  }

  /**
   * POST /api/assistants/:linkId/resend-invite (médico)
   */
  async resendInvite(req, res) {
    try {
      const link = await DoctorAssistant.findByPk(req.params.linkId, {
        include: [{ model: User, as: 'assistant', attributes: ['id', 'firstName', 'lastName', 'email', 'accountClaimed'] }]
      });
      if (!link || (req.user.role !== 'admin' && link.doctorId !== req.user.id)) {
        return res.status(404).json({ success: false, message: 'Invitación no encontrada' });
      }
      if (link.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Solo se reenvían invitaciones pendientes' });
      }
      const doctorUser = await User.findByPk(link.doctorId, { attributes: ['id', 'firstName', 'lastName'] });
      const invite = await assistantInviteService.issueInvite(link, link.assistant, doctorUser);
      return res.json({
        success: true,
        message: invite.emailSent ? 'Invitación reenviada por correo' : 'El correo no está disponible: envíale el enlace por WhatsApp',
        invite
      });
    } catch (error) {
      console.error('[AssistantController] resendInvite error:', error);
      return res.status(500).json({ success: false, message: 'Error al reenviar la invitación' });
    }
  }

  /**
   * GET /api/assistants/invitation/:token (público)
   */
  async getInvitation(req, res) {
    try {
      const data = await assistantInviteService.getInviteInfo(req.params.token);
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Error al consultar la invitación' });
    }
  }

  /**
   * POST /api/assistants/invitation/:token/activate (público) { password }
   */
  async activateInvitation(req, res) {
    try {
      const data = await assistantInviteService.activate(req.params.token, req.body?.password);
      return res.json({ success: true, message: 'Cuenta activada. Ya puedes iniciar sesión', data });
    } catch (error) {
      if (!error.statusCode) console.error('[AssistantController] activateInvitation error:', error);
      return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Error al activar la cuenta' });
    }
  }
}

module.exports = new AssistantController();
