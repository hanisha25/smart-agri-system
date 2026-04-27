import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import AddField from "./AddField";
import axios from "axios";
import { apiUrl } from "../api";

function Crops() {
  const [showAdd, setShowAdd] = useState(false);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchFields = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(apiUrl("/api/field/my-fields"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFields(res.data);
    } catch (err) {
      setError("Failed to load fields");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🌾 My Fields</h2>
          <p className="section-copy">
            Keep a structured view of your crop locations, soil profile, irrigation setup, and acreage.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="mt-6 w-full rounded-full bg-green-700 px-5 py-3 text-white sm:w-auto"
          >
            ➕ Add New Field
          </button>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Tracked fields</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{fields.length}</p>
          <p className="mt-2 text-sm text-slate-600">Use this section as the base record for weather, rotation, and planning workflows.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-panel">Loading field records...</div>
      ) : error ? (
        <div className="empty-panel text-red-600">{error}</div>
      ) : fields.length === 0 ? (
        <div className="empty-panel">No fields added yet. Add your first field to unlock crop planning.</div>
      ) : (
        <div className="content-grid">
          {fields.map((field) => (
            <motion.div key={field._id} whileHover={{ scale: 1.03 }} className="panel-card p-6">
              <h3 className="text-lg font-semibold text-green-900">🌱 {field.cropName}</h3>
              <p className="mt-4 text-sm text-slate-600">📍 {field.village}, {field.district}</p>
              <p className="mt-2 text-sm text-slate-600">🧪 Soil: {field.soilType || "--"}</p>
              <p className="mt-2 text-sm text-slate-600">💧 Irrigation: {field.irrigation || "--"}</p>
              <p className="mt-2 text-sm text-slate-600">📏 Area: {field.area || "--"} Acres</p>
            </motion.div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddField
          onClose={() => {
            setShowAdd(false);
            fetchFields();
          }}
        />
      )}
    </motion.div>
  );
}

export default Crops;
