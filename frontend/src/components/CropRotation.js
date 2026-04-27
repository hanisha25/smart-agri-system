import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

function Panel({ title, children }) {
  return (
    <div className="panel-card p-6">
      <h3 className="text-lg font-semibold text-green-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Badge({ children, tone = "green" }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-sky-100 text-sky-800",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.green}`}>
      {children}
    </span>
  );
}

export default function CropRotation() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlanning = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl("/api/crop-planning/overview"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err) {
        console.error("Crop rotation fetch error:", err);
        setError("Failed to load crop rotation data");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanning();
  }, []);

  if (loading) return <div className="empty-panel">Loading crop rotation...</div>;
  if (error) return <div className="empty-panel text-red-600">{error}</div>;
  if (!data?.fields?.length) {
    return <div className="empty-panel">Add a field first to generate crop rotation plans.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🔄 Crop Rotation</h2>
          <p className="section-copy">
            Rotation guidance avoids repeating the same crop and favours soil-restoring options.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Rotation coverage</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{data.fields.length}</p>
          <p className="mt-2 text-sm text-slate-600">Generated from your saved fields.</p>
        </div>
      </div>

      <Panel title="Crop Rotation Plan">
        <div className="space-y-4">
          {data.rotationPlans.map((plan) => (
            <div key={plan.fieldId} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{plan.fieldName || plan.cropName}</p>
              <p className="text-sm text-slate-600">
                {plan.village}, {plan.district}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="blue">Current: {plan.currentCrop}</Badge>
                <Badge tone="amber">Last seen: {plan.lastCrop}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-800">Next crop options</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {plan.nextCropOptions.map((crop) => (
                    <Badge key={crop}>{crop}</Badge>
                  ))}
                </div>
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {plan.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}
