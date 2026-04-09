const express = require("express");
const router = express.Router();

const fieldController = require("../controllers/fieldController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.post("/add", requireAuth, requireRole(["farmer"]), fieldController.addField);
router.get("/my-fields", requireAuth, requireRole(["farmer"]), fieldController.getMyFields);
router.get("/map-fields", requireAuth, requireRole(["farmer", "researcher", "admin"]), fieldController.getMapFields);

module.exports = router;
