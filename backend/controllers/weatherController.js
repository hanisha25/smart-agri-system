const Field = require("../models/Field");
const axios = require("axios");
const { spawn } = require("child_process");

// ✅ NEW Gemini SDK
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


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


// 🤖 ML Prediction
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
      if (code === 0) resolve(result.trim());
      else reject("Prediction failed");
    });

  });
}


// 🤖 Gemini AI Suggestion + Fallback
async function getAISuggestion(temp, humidity, rain, prediction, crop) {
  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `
Crop: ${crop}
Temperature: ${temp}
Humidity: ${humidity}
Rainfall: ${rain}

Prediction: ${prediction}

Give simple farming advice in 2 lines.
`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;

  } catch (err) {
    console.log("Gemini REST ERROR:", err.response?.data || err.message);

    // 🔥 fallback
    let p = prediction.toLowerCase();

    if (p.includes("extreme")) {
      return "Extreme heat risk. Irrigate frequently and avoid afternoon work.";
    } else if (p.includes("heat")) {
      return "High temperature stress. Water crops in morning or evening.";
    } else if (p.includes("irrigation")) {
      return "Low soil moisture. Provide irrigation.";
    } else if (p.includes("good")) {
      return "Good conditions. Maintain regular farming practices.";
    } else {
      return "Monitor crop and adjust irrigation.";
    }
  }
}


// 💾 Save real-time data
function saveData(temp, humidity, rain, prediction) {
  spawn("python3", [
    "../ml-model/append_data.py",
    temp,
    humidity,
    rain,
    prediction
  ]);
}


// 🌦 MAIN CONTROLLER
exports.getMyWeather = async (req, res) => {
  try {

    const farmerId = req.user.id;
    const fields = await Field.find({ farmerId });

    if (!fields.length) return res.status(200).json([]);

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

        // 🌦 Weather API
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

        // 🧠 Gemini AI
        let aiAdvice = "No advice";

        try {
          await new Promise(res => setTimeout(res, 200));
          aiAdvice = await getAISuggestion(temp, humidity, rain, prediction, field.cropName);
        } catch {
          console.log("AI failed");
        }

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

      } catch {
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