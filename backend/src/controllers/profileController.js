const { User, DoctorProfile, PatientProfile } = require("../models/index.js");

const profileController = {
  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        include: [
          { model: DoctorProfile, as: "doctorProfile", required: false },
          { model: PatientProfile, as: "patientProfile", required: false }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Usuario no encontrado"
        });
      }

      res.json({
        success: true,
        message: "Perfil obtenido exitosamente",
        data: { user }
      });

    } catch (error) {
      console.error("Error obteniendo perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  },

  updateMyProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      // Solo campos personales no sensibles. Rol, correo, clave, verificación y estado nunca se cambian aquí
      // (correo y clave van por Mi cuenta; nombre y cédula por solicitud al admin).
      const ALLOWED = ['phone', 'dateOfBirth', 'gender'];
      const updateData = {};
      for (const k of ALLOWED) if (req.body && req.body[k] !== undefined) updateData[k] = req.body[k];
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, message: 'No hay campos válidos para actualizar' });
      }

      const [affectedRows] = await User.update(updateData, {
        where: { id: userId }
      });

      res.json({
        success: true,
        message: "Perfil actualizado exitosamente",
        data: { affectedRows }
      });

    } catch (error) {
      console.error("Error actualizando perfil:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      });
    }
  }
};

module.exports = profileController;
