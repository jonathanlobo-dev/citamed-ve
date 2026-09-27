/**
 * adminController.js - CITAMED.VE
 * M01 / Semana 7 - Controlador para rutas del panel de Superadministración
 */

const adminService = require('../services/adminService');

class AdminController {
  /**
   * GET /api/admin/overview
   */
  async getOverview(req, res) {
    try {
      const overview = await adminService.getOverview();
      return res.json({
        success: true,
        ...overview,
        data: overview
      });
    } catch (error) {
      console.error('[AdminController] Error en getOverview:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de la plataforma',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/users
   */
  async getUsers(req, res) {
    try {
      const { search, role, status, page, limit } = req.query;
      const result = await adminService.getUsers({ search, role, status, page, limit });
      return res.json({
        success: true,
        users: result.users,
        pagination: result.pagination,
        data: result
      });
    } catch (error) {
      console.error('[AdminController] Error en getUsers:', error);
      return res.status(error.status || 500).json({
        success: false,
        message: error.status ? error.message : 'Error al listar usuarios',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await adminService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      return res.json({
        success: true,
        ...user,
        data: user
      });
    } catch (error) {
      console.error('[AdminController] Error en getUserById:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/admin/users/:id/status
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El campo isActive debe ser booleano'
        });
      }

      const updatedUser = await adminService.updateUserStatus(
        id,
        { isActive, reason },
        req.user
      );

      return res.json({
        success: true,
        message: isActive ? 'Usuario reactivado exitosamente' : 'Usuario suspendido exitosamente',
        user: updatedUser,
        data: updatedUser
      });
    } catch (error) {
      const status = error.status || 500;
      if (status !== 500) {
        return res.status(status).json({
          success: false,
          message: error.message
        });
      }

      console.error('[AdminController] Error en updateUserStatus:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar estado del usuario',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/doctors
   */
  async getDoctors(req, res) {
    try {
      const { search, verification, status, page, limit } = req.query;
      const result = await adminService.getDoctors({ search, verification, status, page, limit });
      return res.json({
        success: true,
        doctors: result.doctors,
        pagination: result.pagination,
        data: result
      });
    } catch (error) {
      console.error('[AdminController] Error en getDoctors:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al listar médicos',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/ai/config
   */
  async getAiConfig(req, res) {
    try {
      const config = await adminService.getAiConfig();
      return res.json({
        success: true,
        ...config
      });
    } catch (error) {
      console.error('[AdminController] Error en getAiConfig:', error.message);
      return res.status(error.status || 500).json({
        success: false,
        message: 'Error al obtener configuración de IA',
        error: error.message
      });
    }
  }

  /**
   * PUT /api/admin/ai/config
   */
  async updateAiConfig(req, res) {
    try {
      const updated = await adminService.updateAiConfig(req.body, req.user);
      return res.json({
        success: true,
        message: 'Configuración de IA actualizada exitosamente',
        ...updated
      });
    } catch (error) {
      const status = error.status || 500;
      if (status !== 500) {
        return res.status(status).json({
          success: false,
          message: error.message
        });
      }
      console.error('[AdminController] Error en updateAiConfig:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al guardar configuración de IA',
        error: error.message
      });
    }
  }

  /**
   * POST /api/admin/ai/test
   */
  async testAiConnection(req, res) {
    try {
      const result = await adminService.testAiConnection(req.body, req.user);
      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      const status = error.status || 500;
      if (status !== 500) {
        return res.status(status).json({
          success: false,
          message: error.message
        });
      }
      console.error('[AdminController] Error en testAiConnection:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al probar conexión de IA',
        error: error.message
      });
    }
  }

  /**
   * GET/POST /api/admin/ai/models
   */
  async getAiModels(req, res) {
    try {
      const provider = req.query.provider || req.body?.provider;
      const entryId = req.query.entryId || req.body?.entryId;
      const apiKey = req.body?.apiKey;

      const result = await adminService.getAiModels({ provider, entryId, apiKey });
      return res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('[AdminController] Error en getAiModels:', error.message);
      return res.status(error.status || 500).json({
        success: false,
        message: 'Error al listar modelos de IA',
        error: error.message
      });
    }
  }

  /**
   * GET /api/admin/ai/usage
   */
  async getAiUsage(req, res) {
    try {
      const { days } = req.query;
      const stats = await adminService.getAiUsageStats({ days });
      return res.json({
        success: true,
        ...stats
      });
    } catch (error) {
      console.error('[AdminController] Error en getAiUsage:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener métricas de IA',
        error: error.message
      });
    }
  }
}

module.exports = new AdminController();
