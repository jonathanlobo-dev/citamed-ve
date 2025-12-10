const { User, DoctorProfile, PatientProfile } = require("../models/index.js");

const profileController = {
  getMyProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      
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
      const userId = req.user.userId;
      const updateData = req.body;

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
