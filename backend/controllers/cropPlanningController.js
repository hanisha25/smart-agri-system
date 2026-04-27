const Field = require("../models/Field");
const { getRecommendations, buildRotationPlan } = require("../services/cropPlanningService");

function pickRecentCrop(fields, currentFieldId) {
  const recent = fields
    .filter((field) => String(field._id) !== String(currentFieldId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  return recent?.cropName?.trim().toLowerCase() || "";
}

exports.getCropPlanning = async (req, res) => {
  try {
    const fields = await Field.find({ farmerId: req.user.id }).lean();

    if (!fields.length) {
      return res.json({
        fields: [],
        recommendations: [],
        rotationPlans: [],
      });
    }

    const recommendations = fields.map((field) => {
      const recentCropKey = pickRecentCrop(fields, field._id);
      return {
        fieldId: field._id,
        fieldName: field.fieldName,
        cropName: field.cropName,
        district: field.district,
        village: field.village,
        soilType: field.soilType,
        irrigation: field.irrigation,
        season: field.season,
        recommendations: getRecommendations(field, recentCropKey),
      };
    });

    const rotationPlans = fields.map((field) => {
      const recentCropKey = pickRecentCrop(fields, field._id);
      return {
        fieldId: field._id,
        fieldName: field.fieldName,
        cropName: field.cropName,
        district: field.district,
        village: field.village,
        ...buildRotationPlan(field, recentCropKey),
      };
    });

    res.json({
      fields,
      recommendations,
      rotationPlans,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load crop planning data" });
  }
};
