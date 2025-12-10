const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { authenticateToken } = require("../middleware/auth");

router.use(authenticateToken);

router.get("/me", profileController.getMyProfile);
router.put("/me", profileController.updateMyProfile);

module.exports = router;
