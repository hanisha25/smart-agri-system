const express = require("express");
const router = express.Router();

const weatherController = require("../controllers/weatherController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.get("/my-weather", requireAuth, requireRole(["farmer"]), weatherController.getMyWeather);

module.exports = router;
