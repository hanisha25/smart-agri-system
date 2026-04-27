const express = require("express");
const router = express.Router();

const cropPlanningController = require("../controllers/cropPlanningController");
const cropRecommendationController = require("../controllers/cropRecommendationController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.get(
  "/overview",
  requireAuth,
  requireRole(["farmer", "researcher", "admin"]),
  cropPlanningController.getCropPlanning
);

router.post(
  "/recommend",
  requireAuth,
  requireRole(["farmer", "researcher", "admin"]),
  cropRecommendationController.recommend
);

module.exports = router;
