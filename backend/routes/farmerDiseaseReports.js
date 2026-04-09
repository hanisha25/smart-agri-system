const express = require("express");
const router = express.Router();
const DiseaseReport = require("../models/DiseaseReport");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// Farmer fetches their own disease reports
router.get("/my-reports", requireAuth, requireRole(["farmer"]), async (req, res) => {
  try {
    const reports = await DiseaseReport.find({ farmerId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
