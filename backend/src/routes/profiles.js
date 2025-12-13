const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     tags: [Profiles]
 *     summary: Obtener mi perfil
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
router.get("/me", profileController.getMyProfile);

/**
 * @swagger
 * /api/profiles/me:
 *   put:
 *     tags: [Profiles]
 *     summary: Actualizar mi perfil
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *       401:
 *         description: No autorizado
 */
router.put("/me", profileController.updateMyProfile);

module.exports = router;
