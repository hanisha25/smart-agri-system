const Field = require("../models/Field");
const axios = require("axios");
const { spawn } = require("child_process");


// 🌱 Crop-based extra advice
function generateCropAdvice(crop, suggestion) {
  if (!crop) return suggestion;

  const cropName = crop.toLowerCase();

  if (cropName === "paddy") {
    return suggestion + " | Maintain standing water and monitor fungal diseases.";
  }

  if (cropName === "cotton") {
    return suggestion + " | Watch for bollworm pests and irrigate properly.";
  }

  if (cropName === "groundnut") {
    return suggestion + " | Check soil moisture and irrigate if needed.";
  }

  return suggestion;
}


// 📍 District coordinates
const districtLatLonMap = {
  "east godavari": { lat: 16.9891, lon: 81.7787 },
  "west godavari": { lat: 16.7107, lon: 81.0952 },
  "krishna": { lat: 16.5062, lon: 80.6480 },
  "guntur": { lat: 16.3067, lon: 80.4365 },
  "prakasam": { lat: 15.5057, lon: 80.0499 },
  "nellore": { lat: 14.4426, lon: 79.9865 },
  "kurnool": { lat: 15.8281, lon: 78.0373 },
  "anantapur": { lat: 14.6819, lon: 77.6006 },
  "chittoor": { lat: 13.2172, lon: 79.1003 },
  "visakhapatnam": { lat: 17.6868, lon: 83.2185 }
};


// 🤖 ML Prediction (Python)
function getMLPrediction(temp, humidity, rain) {
  return new Promise((resolve, reject) => {

    let result = "";

    const python = spawn("python3", [
      "../ml-model/predict.py",
      temp,
      humidity,
      rain
    ]);

    python.stdout.on("data", (data) => {
      result += data.toString();
    });

    python.stderr.on("data", (err) => {
      console.log("ML Error:", err.toString());
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve(result.trim());
      } else {
        reject("Prediction failed");
      }
    });

  });
}


// 🧠 Smart AI-like Suggestion (Fallback Logic)
async function getAISuggestion(temp, humidity, rain, prediction, crop) {
  try {
    let advice = "";

    if (prediction.toLowerCase().includes("heat")) {
      advice = "Crop is under high temperature stress. Irrigate early morning or evening and avoid watering during peak sunlight hours.";
    } 
    else if (prediction.toLowerCase().includes("irrigation")) {
      advice = "Soil moisture is low. Provide irrigation and regularly check soil condition to maintain crop health.";
    } 
    else if (prediction.toLowerCase().includes("water")) {
      advice = "Heavy rainfall expected. Ensure proper drainage to prevent waterlogging and root damage.";
    } 
    else if (prediction.toLowerCase().includes("good")) {
      advice = "Weather conditions are favorable. Continue regular farming practices and monitor crop growth.";
    } 
    else {
      advice = "Crop is under moderate stress. Monitor conditions and adjust irrigation based on weather changes.";
    }

    return advice;

  } catch (err) {
    console.log("AI logic error:", err);
    return "Unable to generate advice at this moment.";
  }
}


// 💾 Save real-time data (Hybrid learning)
function saveData(temp, humidity, rain, prediction) {
  spawn("python3", [
    "../ml-model/append_data.py",
    temp,
    humidity,
    rain,
    prediction
  ]);
}


// 🌦 Main Controller
exports.getMyWeather = async (req, res) => {

  try {

    const farmerId = req.user.id;
    const fields = await Field.find({ farmerId });

    if (!fields.length) {
      return res.status(200).json([]);
    }

    let weatherData = [];

    for (let field of fields) {

      try {

        const districtKey = field.district?.trim().toLowerCase();
        const coords = districtLatLonMap[districtKey];

        if (!coords) {
          weatherData.push({
            crop: field.cropName,
            district: field.district,
            temp: "--",
            humidity: "--",
            rain: 0,
            prediction: "N/A",
            suggestion: "District not supported",
            confidence: "0%"
          });
          continue;
        }

        // 🌦 Fetch weather
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        const temp = response.data.main.temp;
        const humidity = response.data.main.humidity;
        const rain = response.data.rain?.["1h"] || 0;

        // 🤖 ML Prediction
        let prediction = "Unknown";

        try {
          prediction = await getMLPrediction(temp, humidity, rain);
          saveData(temp, humidity, rain, prediction);
        } catch {
          console.log("ML failed");
        }

        // 🧠 AI-like Suggestion
        let aiAdvice = "No advice";

        try {
          await new Promise(res => setTimeout(res, 200)); // small delay
          aiAdvice = await getAISuggestion(
            temp,
            humidity,
            rain,
            prediction,
            field.cropName
          );
        } catch (err) {
          console.log("AI ERROR:", err.message || err);
        }

        // 📦 Response
        weatherData.push({
          crop: field.cropName,
          district: field.district,
          temp,
          humidity,
          rain,
          prediction,
          suggestion: generateCropAdvice(field.cropName, aiAdvice),
          confidence: prediction === "Unknown" ? "60%" : "85%"
        });

      } catch (apiError) {

        weatherData.push({
          crop: field.cropName,
          district: field.district,
          temp: "--",
          humidity: "--",
          rain: 0,
          prediction: "Unavailable",
          suggestion: "Weather unavailable",
          confidence: "0%"
        });

      }

    }

    res.json(weatherData);

  } catch (err) {

    console.log("Weather Controller Error:", err);
    res.status(500).json({ error: "Weather Fetch Failed" });

  }

};