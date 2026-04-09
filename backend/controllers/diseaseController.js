const DiseaseReport = require("../models/DiseaseReport");
const { buildTriage } = require("../services/triageService");
const { createNotification, notifyAllResearchers } = require("../services/notificationService");

/* FARMER SEND REPORT */
exports.reportDisease = async (req, res) => {
  try {
    const { crop, location, problem, symptomLocation, spread, weather } = req.body;
    let image = req.file ? req.file.path : "";
    const farmerId = req.user.id;

    if (!crop?.trim() || !location?.trim() || !problem || !symptomLocation || !spread || !weather) {
      return res.status(400).json({
        message: "Complete all disease report fields before submitting",
      });
    }

    const triage = buildTriage(problem, symptomLocation, spread, weather);

    const report = new DiseaseReport({
      farmerId,
      crop,
      location,
      problem,
      symptomLocation,
      spread,
      weather,
      image,
      probableDisease: triage.probableDisease,
      severity: triage.severity,
      confidenceScore: triage.confidenceScore,
      triageNotes: triage.triageNotes,
      recommendedAction: triage.recommendation,
    });
    await report.save();

    await createNotification({
      userId: req.user.id,
      role: "farmer",
      type: "report",
      title: "Disease report submitted",
      message: `Your ${crop} report has been submitted with ${triage.severity.toLowerCase()} severity triage.`,
      meta: { reportId: report._id },
    });

    await notifyAllResearchers({
      title: "New farmer report received",
      message: `A new ${crop} case from ${location} is waiting for review.`,
      type: "research",
      meta: { reportId: report._id, severity: triage.severity },
    });

    res.json({ message: "Report submitted successfully", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* RESEARCHER GET ALL REPORTS */
exports.getAllReports = async (req, res) => {
  try {
    if (req.user.role !== "researcher") {
      return res.status(403).json({ message: "Access denied" });
    }
    const reports = await DiseaseReport.find()
      .sort({ createdAt: -1 })
      .populate("farmerId", "name");
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* RESEARCHER UPDATE RESPONSE */
exports.updateReport = async (req, res) => {
  try {
    if (req.user.role !== "researcher") {
      return res.status(403).json({ message: "Access denied" });
    }
    const { response, status, recommendation } = req.body;
    const allowedStatuses = ["Pending", "Reviewed", "Resolved"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const update = {};
    if (response !== undefined) update.researchResponse = response;
    if (recommendation !== undefined) update.recommendedAction = recommendation;
    if (status !== undefined) update.status = status;
    if (status === "Reviewed") update.reviewedAt = new Date();
    if (status === "Resolved") update.resolvedAt = new Date();
    const report = await DiseaseReport.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!report) return res.status(404).json({ message: "Report not found" });

    await createNotification({
      userId: report.farmerId,
      role: "farmer",
      type: "report-update",
      title: "Your report was updated",
      message: `Your ${report.crop} report is now marked as ${report.status}.`,
      meta: { reportId: report._id, status: report.status },
    });

    res.json({ message: "Response updated", report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
