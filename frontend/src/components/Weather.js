import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

function Weather() {

  const [weather, setWeather] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    } catch(err) {
      setError("Failed to load weather data");
      setWeather([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const getRisk = (temp, rain) => {
    if(temp > 35 && rain < 5) return "High 🔴";
    if(rain > 10) return "Medium 🟡";
    return "Low 🟢";
  };

  return(
    <div className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">
            🌦 Crop Weather Status
          </h2>
          <p className="section-copy">
            Review temperature, humidity, rainfall, and quick risk indicators for the fields already saved in your account.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Weather cards</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{weather.length}</p>
          <p className="mt-2 text-sm text-slate-600">Each card combines local weather conditions with crop-specific guidance.</p>
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

          {weather.map((item,index)=>(
            <motion.div
              key={index}
              whileHover={{scale:1.02}}
              className="panel-card p-6"
            >

              <h3 className="mb-2 text-xl font-bold text-green-900">
                🌱 {item.crop}
              </h3>

              <p className="text-sm text-slate-600">📍 {item.district}</p>

              <p>
                🌡 Temp: {item.temp !== undefined ? `${item.temp}°C` : "--"}
              </p>

              <p>
                💧 Humidity: {item.humidity ?? "--"}%
              </p>

              <p>
                🌧 Rainfall: {item.rain ?? 0} mm
              </p>

              <p className="mt-4 font-semibold">
                Risk: {getRisk(item.temp,item.rain)}
              </p>
              <p className="mt-3 font-semibold text-slate-700">
                🤖 AI Suggestion: {item.suggestion}
              </p>
            </motion.div>
          ))}

        </div>
      )}

    </div>
  );
}

export default Weather;
