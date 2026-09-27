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
}

module.exports = new AdminController();
