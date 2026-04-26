const axios = require("axios");
const mongoose = require("mongoose");
const Field = require("../models/Field");
const { getRecommendations, buildRotationPlan } = require("../services/cropPlanningService");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5401";

// ---------------------------------------------------------------------------
// Helper: fetch live weather for a field's district
// ---------------------------------------------------------------------------
const districtLatLonMap = {
  "east godavari":  { lat: 16.9891, lon: 81.7787 },
  "west godavari":  { lat: 16.7107, lon: 81.0952 },
  krishna:          { lat: 16.5062, lon: 80.648  },
  guntur:           { lat: 16.3067, lon: 80.4365 },
  prakasam:         { lat: 15.5057, lon: 80.0499 },
  nellore:          { lat: 14.4426, lon: 79.9865 },
  kurnool:          { lat: 15.8281, lon: 78.0373 },
  anantapur:        { lat: 14.6819, lon: 77.6006 },
  chittoor:         { lat: 13.2172, lon: 79.1003 },
  visakhapatnam:    { lat: 17.6868, lon: 83.2185 },
};

async function getWeatherForField(field) {
  const key = field.district?.trim().toLowerCase();
  const coords = districtLatLonMap[key];
  if (!coords || !process.env.WEATHER_API_KEY) return null;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`,
      { timeout: 5000 }
    );
    return {
      temperature: response.data.main.temp,
      humidity:    response.data.main.humidity,
      rainfall:    response.data.rain?.["1h"] || 0,
    };
  } catch (weatherErr) {
    console.log("Weather fetch failed for district:", field.district, weatherErr.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/crop-planning/recommend
// Body: { fieldId }
// ---------------------------------------------------------------------------
exports.recommend = async (req, res) => {
  try {
    const { fieldId } = req.body;

    if (!fieldId) {
      return res.status(400).json({ message: "fieldId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(fieldId)) {
      return res.status(400).json({ message: "Invalid fieldId" });
    }

    const field = await Field.findOne({
      _id:      fieldId,
      farmerId: req.user.id,
    }).lean();

    if (!field) {
      return res.status(404).json({ message: "Field not found" });
    }

    // -----------------------------------------------------------------------
    // Rule-based recommendations (always available as fallback)
    // -----------------------------------------------------------------------
    const ruleRecommendations = getRecommendations(field, "");
    const rotationPlan        = buildRotationPlan(field, "");

    // -----------------------------------------------------------------------
    // Attempt ML prediction via Flask sidecar
    // -----------------------------------------------------------------------
    let mlRecommendation = null;
    let mlSource = "unavailable";

    const hasNPK =
      typeof field.nitrogen   === "number" &&
      typeof field.phosphorus === "number" &&
      typeof field.potassium  === "number" &&
      typeof field.ph         === "number";

    if (hasNPK) {
      const weather = await getWeatherForField(field);

      if (weather) {
        const payload = {
          N:           field.nitrogen,
          P:           field.phosphorus,
          K:           field.potassium,
          ph:          field.ph,
          temperature: weather.temperature,
          humidity:    weather.humidity,
          rainfall:    weather.rainfall,
        };

        try {
          const mlRes = await axios.post(
            `${ML_SERVICE_URL}/predict-crop`,
            payload,
            { timeout: 5000 }
          );
          mlRecommendation = mlRes.data;
          mlSource = "ml";
        } catch (mlErr) {
          console.log("ML service unreachable — using rule-based fallback:", mlErr.message);
          mlSource = "ml_unavailable";
        }
      } else {
        mlSource = "weather_unavailable";
      }
    } else {
      mlSource = "missing_npk";
    }

    return res.json({
      fieldId:          field._id,
      fieldName:        field.fieldName,
      mlRecommendation,
      mlSource,
      ruleRecommendations,
      rotationPlan,
    });
  } catch (error) {
    console.log("Crop recommendation error:", error.message);
    res.status(500).json({ message: "Failed to generate crop recommendation" });
  }
};
