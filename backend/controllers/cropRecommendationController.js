/**
 * Crop Recommendation Controller
 *
 * Provides a two-layer recommendation system:
 *   1. Rule-based  — always available; uses soil type, irrigation, NPK, pH, season
 *   2. ML-based    — calls the Flask sidecar with soil + climate features
 *
 * Key design decisions
 * --------------------
 * - Live weather (OpenWeatherMap) supplies temperature and humidity.
 * - Rainfall is sourced from a district-level monthly-average lookup table
 *   rather than the live "rain.1h" field.  The ML model was trained on
 *   monthly-average rainfall (mm/month), not hourly accumulation — sending
 *   live 1h rain (almost always 0 or near-0) produces systematically wrong
 *   predictions (the model would think every field is a desert).
 * - If the field has explicit latitude/longitude we use those for weather;
 *   otherwise we fall back to a district → coordinates lookup.
 * - ML result is only returned when confidence >= MIN_ML_CONFIDENCE (35 %).
 *   Below this threshold the rule-based result is more reliable.
 */

const axios    = require("axios");
const mongoose = require("mongoose");
const Field    = require("../models/Field");
const { getRecommendations, buildRotationPlan } = require("../services/cropPlanningService");

const ML_SERVICE_URL   = process.env.ML_SERVICE_URL || "http://localhost:5401";
const ML_TIMEOUT_MS    = 5000;
const WEATHER_TIMEOUT_MS = 5000;
const MIN_ML_CONFIDENCE  = 0.35;   // discard ML result if below this threshold

// ---------------------------------------------------------------------------
// District → coordinates (Andhra Pradesh + major agricultural districts
// across India so the service works beyond a single state)
// ---------------------------------------------------------------------------
const DISTRICT_COORDS = {
  // Andhra Pradesh
  "east godavari":  { lat: 16.9891, lon: 81.7787 },
  "west godavari":  { lat: 16.7107, lon: 81.0952 },
  "krishna":        { lat: 16.5062, lon: 80.6480 },
  "guntur":         { lat: 16.3067, lon: 80.4365 },
  "prakasam":       { lat: 15.5057, lon: 80.0499 },
  "nellore":        { lat: 14.4426, lon: 79.9865 },
  "kurnool":        { lat: 15.8281, lon: 78.0373 },
  "anantapur":      { lat: 14.6819, lon: 77.6006 },
  "chittoor":       { lat: 13.2172, lon: 79.1003 },
  "visakhapatnam":  { lat: 17.6868, lon: 83.2185 },
  "srikakulam":     { lat: 18.2949, lon: 83.8939 },
  "vizianagaram":   { lat: 18.1067, lon: 83.3956 },
  "kadapa":         { lat: 14.4674, lon: 78.8242 },

  // Telangana
  "hyderabad":      { lat: 17.3850, lon: 78.4867 },
  "warangal":       { lat: 17.9784, lon: 79.5941 },
  "karimnagar":     { lat: 18.4386, lon: 79.1288 },
  "nizamabad":      { lat: 18.6725, lon: 78.0941 },
  "khammam":        { lat: 17.2473, lon: 80.1514 },
  "nalgonda":       { lat: 17.0575, lon: 79.2677 },

  // Karnataka
  "bangalore":      { lat: 12.9716, lon: 77.5946 },
  "mysore":         { lat: 12.2958, lon: 76.6394 },
  "dharwad":        { lat: 15.4589, lon: 75.0078 },
  "bellary":        { lat: 15.1394, lon: 76.9214 },
  "hassan":         { lat: 13.0033, lon: 76.1004 },
  "tumkur":         { lat: 13.3379, lon: 77.1173 },

  // Maharashtra
  "pune":           { lat: 18.5204, lon: 73.8567 },
  "nashik":         { lat: 19.9975, lon: 73.7898 },
  "ahmednagar":     { lat: 19.0948, lon: 74.7480 },
  "aurangabad":     { lat: 19.8762, lon: 75.3433 },
  "amravati":       { lat: 20.9333, lon: 77.7500 },
  "nagpur":         { lat: 21.1458, lon: 79.0882 },
  "solapur":        { lat: 17.6853, lon: 75.9049 },

  // Tamil Nadu
  "coimbatore":     { lat: 11.0168, lon: 76.9558 },
  "madurai":        { lat:  9.9252, lon: 78.1198 },
  "thanjavur":      { lat: 10.7870, lon: 79.1378 },
  "tirunelveli":    { lat:  8.7139, lon: 77.7567 },
  "salem":          { lat: 11.6643, lon: 78.1460 },
  "vellore":        { lat: 12.9165, lon: 79.1325 },

  // Kerala
  "thiruvananthapuram": { lat:  8.5241, lon: 76.9366 },
  "kozhikode":      { lat: 11.2588, lon: 75.7804 },
  "thrissur":       { lat: 10.5276, lon: 76.2144 },
  "palakkad":       { lat: 10.7867, lon: 76.6548 },

  // Punjab
  "ludhiana":       { lat: 30.9010, lon: 75.8573 },
  "amritsar":       { lat: 31.6340, lon: 74.8723 },
  "jalandhar":      { lat: 31.3260, lon: 75.5762 },
  "patiala":        { lat: 30.3398, lon: 76.3869 },

  // Haryana
  "hisar":          { lat: 29.1492, lon: 75.7217 },
  "karnal":         { lat: 29.6857, lon: 76.9905 },
  "rohtak":         { lat: 28.8955, lon: 76.6066 },

  // Uttar Pradesh
  "lucknow":        { lat: 26.8467, lon: 80.9462 },
  "varanasi":       { lat: 25.3176, lon: 82.9739 },
  "agra":           { lat: 27.1767, lon: 78.0081 },
  "meerut":         { lat: 28.9845, lon: 77.7064 },
  "gorakhpur":      { lat: 26.7606, lon: 83.3732 },
  "allahabad":      { lat: 25.4358, lon: 81.8463 },

  // Madhya Pradesh
  "indore":         { lat: 22.7196, lon: 75.8577 },
  "bhopal":         { lat: 23.2599, lon: 77.4126 },
  "jabalpur":       { lat: 23.1815, lon: 79.9864 },
  "gwalior":        { lat: 26.2183, lon: 78.1828 },

  // Rajasthan
  "jaipur":         { lat: 26.9124, lon: 75.7873 },
  "jodhpur":        { lat: 26.2389, lon: 73.0243 },
  "bikaner":        { lat: 28.0229, lon: 73.3119 },
  "kota":           { lat: 25.2138, lon: 75.8648 },

  // Gujarat
  "ahmedabad":      { lat: 23.0225, lon: 72.5714 },
  "surat":          { lat: 21.1702, lon: 72.8311 },
  "rajkot":         { lat: 22.3039, lon: 70.8022 },
  "vadodara":       { lat: 22.3072, lon: 73.1812 },

  // West Bengal
  "kolkata":        { lat: 22.5726, lon: 88.3639 },
  "burdwan":        { lat: 23.2324, lon: 87.8615 },
  "murshidabad":    { lat: 24.1800, lon: 88.2700 },

  // Bihar
  "patna":          { lat: 25.5941, lon: 85.1376 },
  "gaya":           { lat: 24.7914, lon: 85.0002 },
  "muzaffarpur":    { lat: 26.1209, lon: 85.3647 },

  // Odisha
  "bhubaneswar":    { lat: 20.2961, lon: 85.8245 },
  "cuttack":        { lat: 20.4625, lon: 85.8828 },
  "sambalpur":      { lat: 21.4669, lon: 83.9812 },

  // Assam
  "guwahati":       { lat: 26.1445, lon: 91.7362 },
  "dibrugarh":      { lat: 27.4728, lon: 94.9120 },
};

// ---------------------------------------------------------------------------
// District → average monthly rainfall (mm/month, annual avg ÷ 12)
// Source: IMD district-level rainfall normals
// This value is sent to the ML model instead of live 1h rain because the
// model was trained on monthly averages (typical range 18–300 mm/month).
// ---------------------------------------------------------------------------
const DISTRICT_AVG_MONTHLY_RAINFALL = {
  // Andhra Pradesh — coastal / delta (high)
  "east godavari": 130, "west godavari": 110, "krishna": 95, "guntur": 85,
  "visakhapatnam": 105, "srikakulam": 120, "vizianagaram": 100,
  // AP interior (medium)
  "prakasam": 75, "nellore": 80,
  // AP dry interior
  "kurnool": 60, "anantapur": 50, "chittoor": 70, "kadapa": 60,
  // Telangana
  "hyderabad": 75, "warangal": 85, "karimnagar": 88, "nizamabad": 90,
  "khammam": 100, "nalgonda": 78,
  // Karnataka wet
  "hassan": 130, "tumkur": 80,
  // Karnataka dry
  "bangalore": 85, "mysore": 70, "bellary": 55, "dharwad": 75,
  // Maharashtra
  "pune": 70, "nashik": 75, "ahmednagar": 60, "aurangabad": 65,
  "amravati": 85, "nagpur": 100, "solapur": 55,
  // Tamil Nadu
  "thanjavur": 100, "coimbatore": 65, "madurai": 75, "tirunelveli": 70,
  "salem": 85, "vellore": 90,
  // Kerala (very high)
  "thiruvananthapuram": 170, "kozhikode": 280, "thrissur": 230, "palakkad": 145,
  // Punjab / Haryana
  "ludhiana": 65, "amritsar": 60, "jalandhar": 65, "patiala": 70,
  "hisar": 45, "karnal": 60, "rohtak": 55,
  // UP
  "lucknow": 85, "varanasi": 90, "agra": 65, "meerut": 75,
  "gorakhpur": 115, "allahabad": 90,
  // MP
  "indore": 85, "bhopal": 100, "jabalpur": 120, "gwalior": 70,
  // Rajasthan (arid)
  "jaipur": 55, "jodhpur": 35, "bikaner": 25, "kota": 65,
  // Gujarat
  "ahmedabad": 65, "surat": 110, "rajkot": 60, "vadodara": 80,
  // West Bengal
  "kolkata": 145, "burdwan": 135, "murshidabad": 130,
  // Bihar
  "patna": 105, "gaya": 100, "muzaffarpur": 115,
  // Odisha
  "bhubaneswar": 150, "cuttack": 145, "sambalpur": 145,
  // Assam (high)
  "guwahati": 180, "dibrugarh": 210,
};

// Default monthly rainfall when district is unknown (India annual avg ≈ 1200mm)
const DEFAULT_MONTHLY_RAINFALL = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeDistrict(raw) {
  return (raw || "").trim().toLowerCase();
}

/**
 * Resolve {lat, lon} from field.  Prefers explicit latitude/longitude
 * stored on the field record; falls back to district lookup.
 */
function resolveCoordsForField(field) {
  const lat = parseFloat(field.latitude);
  const lon = parseFloat(field.longitude);
  if (!isNaN(lat) && !isNaN(lon)) return { lat, lon };

  const key = normalizeDistrict(field.district);
  return DISTRICT_COORDS[key] || null;
}

/**
 * Return the average monthly rainfall for the field's district.
 * This is passed to the ML model as the `rainfall` feature because
 * the model was trained on monthly averages, not live hourly values.
 */
function getAvgMonthlyRainfall(field) {
  const key = normalizeDistrict(field.district);
  return DISTRICT_AVG_MONTHLY_RAINFALL[key] ?? DEFAULT_MONTHLY_RAINFALL;
}

async function fetchWeatherForField(field) {
  if (!process.env.WEATHER_API_KEY) return null;

  const coords = resolveCoordsForField(field);
  if (!coords) return null;

  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat:   coords.lat,
          lon:   coords.lon,
          appid: process.env.WEATHER_API_KEY,
          units: "metric",
        },
        timeout: WEATHER_TIMEOUT_MS,
      }
    );
    return {
      temperature: response.data.main.temp,
      humidity:    response.data.main.humidity,
      // NOTE: do NOT use response.data.rain?.["1h"] here —
      // that value is almost always 0 or absent, and the model
      // was trained on monthly-average rainfall, not hourly rain.
      // Monthly-average rainfall is sourced from DISTRICT_AVG_MONTHLY_RAINFALL.
    };
  } catch (err) {
    console.log(`[CropRec] Weather fetch failed (${field.district}): ${err.message}`);
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
    // Rule-based recommendations — always available, no external dependencies
    // -----------------------------------------------------------------------
    const ruleRecommendations = getRecommendations(field, "");
    const rotationPlan        = buildRotationPlan(field, "");

    // -----------------------------------------------------------------------
    // ML recommendations — requires NPK/pH + weather
    // -----------------------------------------------------------------------
    let mlRecommendation = null;
    let mlSource         = "unavailable";

    const hasNPK = (
      typeof field.nitrogen   === "number" &&
      typeof field.phosphorus === "number" &&
      typeof field.potassium  === "number" &&
      typeof field.ph         === "number"
    );

    if (!hasNPK) {
      mlSource = "missing_npk";
    } else {
      const weather         = await fetchWeatherForField(field);
      const avgMonthlyRain  = getAvgMonthlyRainfall(field);

      if (!weather) {
        mlSource = "weather_unavailable";
      } else {
        const payload = {
          N:           field.nitrogen,
          P:           field.phosphorus,
          K:           field.potassium,
          ph:          field.ph,
          temperature: weather.temperature,
          humidity:    weather.humidity,
          rainfall:    avgMonthlyRain,   // monthly average, not live 1h value
        };

        try {
          const mlRes = await axios.post(
            `${ML_SERVICE_URL}/predict-crop`,
            payload,
            {
              timeout: ML_TIMEOUT_MS,
              headers: { "Content-Type": "application/json" },
            }
          );
          const data       = mlRes.data;
          const confidence = data.confidence ?? 0;

          if (confidence >= MIN_ML_CONFIDENCE) {
            mlRecommendation = data;
            mlSource         = "ml";
          } else {
            // Low-confidence prediction — still surface it but flag it
            mlRecommendation = { ...data, lowConfidence: true };
            mlSource         = "ml_low_confidence";
            console.log(
              `[CropRec] ML confidence ${(confidence * 100).toFixed(1)}% < threshold — flagged as low`
            );
          }
        } catch (mlErr) {
          console.log(`[CropRec] ML service unreachable: ${mlErr.message}`);
          mlSource = "ml_unavailable";
        }
      }
    }

    return res.json({
      fieldId:          field._id,
      fieldName:        field.fieldName,
      mlRecommendation,
      mlSource,
      ruleRecommendations,
      rotationPlan,
    });
  } catch (err) {
    console.error("[CropRec] Unhandled error:", err.message);
    res.status(500).json({ message: "Failed to generate crop recommendation" });
  }
};
