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
    purple: "bg-purple-100 text-purple-800",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.green}`}>
      {children}
    </span>
  );
}

function MLRecommendationPanel({ fieldId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        apiUrl("/api/crop-planning/recommend"),
        { fieldId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(res.data);
    } catch (err) {
      console.error("ML recommendation error:", err);
      setError("Failed to get ML recommendation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-purple-200 bg-purple-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-purple-800">🤖 ML Crop Recommendation</p>
        <button
          onClick={handleRequest}
          disabled={loading}
          className="rounded-full bg-purple-700 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-800 disabled:opacity-60"
        >
          {loading ? "Analysing…" : result ? "Refresh" : "Get ML Recommendation"}
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {result && (
        <div className="mt-3 space-y-2 text-sm">
          {result.mlRecommendation ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="purple">
                  🌱 {result.mlRecommendation.recommended_crop.charAt(0).toUpperCase() +
                    result.mlRecommendation.recommended_crop.slice(1)}
                </Badge>
                <Badge tone="green">
                  {Math.round(result.mlRecommendation.confidence * 100)}% confidence
                </Badge>
              </div>
              {result.mlRecommendation.top3?.length > 1 && (
                <div>
                  <p className="mb-1 mt-2 text-xs text-slate-500">Other candidates</p>
                  <div className="flex flex-wrap gap-2">
                    {result.mlRecommendation.top3.slice(1).map((item) => (
                      <Badge key={item.crop} tone="blue">
                        {item.crop} ({Math.round(item.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              {result.mlSource === "missing_npk"
                ? "⚠️ Add soil test data (N, P, K, pH) when registering the field to unlock ML recommendations."
                : result.mlSource === "weather_unavailable"
                ? "⚠️ Live weather data unavailable for this district."
                : result.mlSource === "ml_unavailable"
                ? "⚠️ ML service offline — rule-based results are shown above."
                : "ML recommendation unavailable."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CropPlanning() {
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
        console.error("Crop planning fetch error:", err);
        setError("Failed to load crop planning data");
      } finally {
        setLoading(false);
      }
    };

    fetchPlanning();
  }, []);

  if (loading) return <div className="empty-panel">Loading crop recommendations...</div>;
  if (error) return <div className="empty-panel text-red-600">{error}</div>;
  if (!data?.fields?.length) {
    return <div className="empty-panel">Add a field first to generate crop recommendations.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🧭 Crop Recommendations</h2>
          <p className="section-copy">
            Crop recommendations are ranked from your soil, irrigation, season, and crop history.
            Provide soil test data (N, P, K, pH) when adding a field to unlock ML-powered suggestions.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Planning coverage</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{data.fields.length}</p>
          <p className="mt-2 text-sm text-slate-600">Generated from your saved fields.</p>
        </div>
      </div>

      <Panel title="Top Crop Recommendations">
        <div className="space-y-4">
          {data.recommendations.map((item) => (
            <div key={item.fieldId} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.fieldName || item.cropName}</p>
                  <p className="text-sm text-slate-600">
                    {item.village}, {item.district}
                  </p>
                </div>
                <Badge tone="green">Current: {item.cropName || "--"}</Badge>
              </div>

              <div className="mt-4 space-y-3">
                {item.recommendations.map((rec) => (
                  <div key={rec.crop} className="rounded-2xl bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{rec.crop}</p>
                      <Badge tone={rec.score >= 70 ? "green" : rec.score >= 55 ? "amber" : "blue"}>
                        {rec.score}/100
                      </Badge>
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {rec.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <MLRecommendationPanel fieldId={item.fieldId} />
            </div>
          ))}
        </div>
      </Panel>
    </motion.div>
  );
}
