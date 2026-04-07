import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

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
        "http://localhost:5400/api/weather/my-weather",
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
    <div>

      <h2 className="text-2xl font-bold mb-6">
        🌦 Crop Weather Status
      </h2>

      {loading ? (
        <div className="text-center text-lg py-10">Loading weather data...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : weather.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No weather data found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">

          {weather.map((item,index)=>(
            <motion.div
              key={index}
              whileHover={{scale:1.05}}
              className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl"
            >

              <h3 className="text-xl font-bold mb-2">
                🌱 {item.crop}
              </h3>

              <p>📍 {item.district}</p>

              <p>
                🌡 Temp: {item.temp !== undefined ? `${item.temp}°C` : "--"}
              </p>

              <p>
                💧 Humidity: {item.humidity ?? "--"}%
              </p>

              <p>
                🌧 Rainfall: {item.rain ?? 0} mm
              </p>

              <p className="mt-3 font-semibold">
                Risk: {getRisk(item.temp,item.rain)}
              </p>
              <p className="mt-3 font-semibold">
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