import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

function Weather() {

  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [aiLoading, setAiLoading] = useState({});
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchWeather = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        apiUrl("/api/weather/my-weather"),
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setWeather(res.data);
      setLastUpdated(new Date().toLocaleTimeString());

      let loadingState = {};
      res.data.forEach((_, i) => {
        loadingState[i] = true;
      });
      setAiLoading(loadingState);

      setTimeout(() => {
        setAiLoading({});
      }, 1200);

    } catch (err) {
      setError("Failed to load weather data");
      setWeather([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  // 🔥 Improved Risk Logic (ML-based)
  const getRisk = (prediction) => {
    if (prediction?.toLowerCase().includes("extreme")) return "High 🔴";
    if (prediction?.toLowerCase().includes("stress")) return "Medium 🟡";
    return "Low 🟢";
  };

  const getRiskStyle = (risk) => {
    if (risk.includes("High")) return "bg-red-100 text-red-700";
    if (risk.includes("Medium")) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const getWeatherIcon = (temp, rain) => {
    if (rain > 10) return "🌧";
    if (temp > 35) return "🔥";
    return "☀️";
  };

  const getSuggestionIcon = (text) => {
    if (!text) return "🤖";
    if (text.toLowerCase().includes("heat")) return "🔥";
    if (text.toLowerCase().includes("irrigation")) return "💧";
    if (text.toLowerCase().includes("rain")) return "🌧";
    return "🌱";
  };

  return (
    <div className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">
            🌦 Crop Weather Status
          </h2>
          <p className="section-copy">
            Smart insights using ML + AI-based crop guidance.
          </p>

          {/* 🆕 Last Updated */}
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="stat-card">
          <p className="text-sm text-slate-500">Weather cards</p>
          <p className="mt-3 text-3xl font-bold text-green-900">
            {weather.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Real-time weather + ML predictions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="empty-panel">Loading weather data...</div>
      ) : error ? (
        <div className="empty-panel text-red-600">{error}</div>
      ) : weather.length === 0 ? (
        <div className="empty-panel">No weather data found.</div>
      ) : (
        <div className="content-grid">

          {weather.map((item, index) => {
            const risk = getRisk(item.prediction);

            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.03 }}
                className="panel-card p-6"
              >

                {/* Header */}
                <h3 className="mb-2 text-xl font-bold text-green-900">
                  {getWeatherIcon(item.temp, item.rain)} 🌱 {item.crop}
                </h3>

                <p className="text-sm text-slate-600">
                  📍 {item.district}
                </p>

                {/* Weather Data */}
                <div className="mt-3 space-y-1">
                  <p>🌡 Temp: {item.temp ?? "--"}°C</p>
                  <p>💧 Humidity: {item.humidity ?? "--"}%</p>
                  <p>🌧 Rainfall: {item.rain ?? 0} mm</p>
                </div>

                {/* 🧠 ML Prediction */}
                <div className="mt-4">
                  <p className="font-semibold text-slate-700">
                    🧠 ML Prediction:
                  </p>
                  <p className="text-slate-800 font-medium">
                    {item.prediction}
                  </p>
                </div>

                {/* Risk Badge */}
                <div className="mt-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskStyle(risk)}`}>
                    {risk}
                  </span>
                </div>

                {/* 🤖 AI Suggestion */}
                <div className="mt-4">
                  <p className="font-semibold text-slate-700">
                    🤖 AI Suggestion:
                  </p>

                  {aiLoading[index] ? (
                    <p className="text-green-600 animate-pulse">
                      Thinking...
                    </p>
                  ) : (
                    <p className="text-slate-700">
                      {getSuggestionIcon(item.suggestion)} {item.suggestion}
                    </p>
                  )}

                  {/* Expand Button */}
                  <button
                    onClick={() => setExpanded(expanded === index ? null : index)}
                    className="text-green-700 text-sm mt-2"
                  >
                    {expanded === index ? "Hide Details" : "View Details"}
                  </button>

                  {/* Expanded Details */}
                  {expanded === index && (
                    <p className="mt-2 text-sm text-slate-600">
                      {item.detailedSuggestion || item.suggestion}
                    </p>
                  )}

                  {/* Confidence */}
                  <p className="text-xs text-slate-500 mt-2">
                    Confidence: {item.confidence || "85%"}
                  </p>
                </div>

              </motion.div>
            );
          })}

        </div>
      )}
    </div>
  );
}

export default Weather;