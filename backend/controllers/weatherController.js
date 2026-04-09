const Field = require("../models/Field");
const axios = require("axios");
const { spawn } = require("child_process");


function generateCropAdvice(crop, suggestion){

  if(!crop) return suggestion;

  const cropName = crop.toLowerCase();

  if(cropName === "paddy"){
    return suggestion + " | Maintain standing water in field and monitor fungal diseases.";
  }

  if(cropName === "cotton"){
    return suggestion + " | Monitor bollworm pests and ensure proper irrigation.";
  }

  if(cropName === "groundnut"){
    return suggestion + " | Check soil moisture and irrigate if needed.";
  }

  return suggestion;
}


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


// Run ML model
function getAISuggestion(temp, humidity, rain) {

  return new Promise((resolve, reject) => {
    let settled = false;

    const python = spawn("python3", [
      "../ml-model/predict.py",
      temp,
      humidity,
      rain
    ]);

    python.stdout.on("data", (data) => {
      if (!settled) {
        settled = true;
        resolve(data.toString());
      }
    });

    python.stderr.on("data", (err) => {
      console.log("ML Error:", err.toString());
      if (!settled) {
        settled = true;
        reject("No suggestion");
      }
    });

    python.on("close", (code) => {
      if (code !== 0 && !settled) {
        settled = true;
        reject("No suggestion");
      }
    });

  });

}


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
            suggestion: "District not supported for weather lookup"
          });
          continue;
        }

        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${process.env.WEATHER_API_KEY}&units=metric`
        );

        const temp = response.data.main.temp;
        const humidity = response.data.main.humidity;
        const rain = response.data.rain?.["1h"] || 0;

        // AI suggestion
        let suggestion = "No suggestion";

        try {
          suggestion = await getAISuggestion(temp, humidity, rain);
        } catch {
          console.log("ML failed");
        }

        weatherData.push({
  crop: field.cropName,
  district: field.district,
  temp,
  humidity,
  rain,
  suggestion: generateCropAdvice(field.cropName, suggestion.trim())
});

      } catch (apiError) {

        weatherData.push({
          crop: field.cropName,
          district: field.district,
          temp: "--",
          humidity: "--",
          rain: 0,
          suggestion: "Weather unavailable"
        });

      }

    }

    res.json(weatherData);

  } catch (err) {

    console.log("Weather Controller Error:", err);
    res.status(500).json({ error: "Weather Fetch Failed" });

  }

};
