const express = require("express");
const router = express.Router();

const diseaseController = require("../controllers/diseaseController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

// Farmer sends report (with image upload support)
router.post(
  "/report",
  requireAuth,
  requireRole(["farmer"]),
  upload.single("image"),
  diseaseController.reportDisease
);

// Researcher fetch all reports
router.get("/all-reports", requireAuth, requireRole(["researcher"]), diseaseController.getAllReports);

// Researcher updates report
router.put("/update/:id", requireAuth, requireRole(["researcher"]), diseaseController.updateReport);

module.exports = router;
