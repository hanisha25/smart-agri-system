const express = require("express");

const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/farmer-summary",
  requireAuth,
  requireRole(["farmer"]),
  analyticsController.getFarmerSummary
);

router.get(
  "/research-summary",
  requireAuth,
  requireRole(["researcher"]),
  analyticsController.getResearchSummary
);

router.get(
  "/admin-summary",
  requireAuth,
  requireRole(["admin"]),
  analyticsController.getAdminSummary
);

module.exports = router;
