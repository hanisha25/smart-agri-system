const DiseaseReport = require("../models/DiseaseReport");
const Field = require("../models/Field");
const Farmer = require("../models/Farmer");
const Researcher = require("../models/Researcher");
const Notification = require("../models/Notification");

function toCountMap(items, key) {
  return items.reduce((acc, item) => {
    const mapKey = item[key] || "Unknown";
    acc[mapKey] = (acc[mapKey] || 0) + 1;
    return acc;
  }, {});
}

exports.getFarmerSummary = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const [fields, reports] = await Promise.all([
      Field.find({ farmerId }).lean(),
      DiseaseReport.find({ farmerId }).sort({ createdAt: -1 }).lean(),
    ]);

    const resolvedReports = reports.filter((report) => report.status === "Resolved").length;
    const reviewedReports = reports.filter((report) => report.status === "Reviewed").length;
    const pendingReports = reports.filter((report) => report.status === "Pending").length;

    res.json({
      totals: {
        fields: fields.length,
        reports: reports.length,
        pendingReports,
        reviewedReports,
        resolvedReports,
      },
      fieldsByCrop: toCountMap(fields, "cropName"),
      reportsByStatus: toCountMap(reports, "status"),
      reportsByProblem: toCountMap(reports, "problem"),
      recentReports: reports.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load farmer analytics" });
  }
};

exports.getResearchSummary = async (req, res) => {
  try {
    const reports = await DiseaseReport.find()
      .sort({ createdAt: -1 })
      .populate("farmerId", "name")
      .lean();

    const pendingReports = reports.filter((report) => report.status === "Pending").length;
    const reviewedReports = reports.filter((report) => report.status === "Reviewed").length;
    const resolvedReports = reports.filter((report) => report.status === "Resolved").length;

    res.json({
      totals: {
        reports: reports.length,
        pendingReports,
        reviewedReports,
        resolvedReports,
      },
      reportsByCrop: toCountMap(reports, "crop"),
      reportsByDistrict: toCountMap(reports, "location"),
      reportsByStatus: toCountMap(reports, "status"),
      recentReports: reports.slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load researcher analytics" });
  }
};

exports.getAdminSummary = async (req, res) => {
  try {
    const [farmers, researchers, fields, reports, notifications] = await Promise.all([
      Farmer.find().lean(),
      Researcher.find().lean(),
      Field.find().lean(),
      DiseaseReport.find().sort({ createdAt: -1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      totals: {
        farmers: farmers.length,
        researchers: researchers.filter((item) => item.role === "researcher").length,
        admins: researchers.filter((item) => item.role === "admin").length,
        fields: fields.length,
        reports: reports.length,
        notifications: notifications.length,
      },
      reportsByStatus: toCountMap(reports, "status"),
      reportsBySeverity: toCountMap(reports, "severity"),
      fieldsByCrop: toCountMap(fields, "cropName"),
      notificationsByType: toCountMap(notifications, "type"),
      recentReports: reports.slice(0, 8),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load admin summary" });
  }
};
