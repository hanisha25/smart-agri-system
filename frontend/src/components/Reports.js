import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { apiUrl, assetUrl } from "../api";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(apiUrl("/api/farmer-reports/my-reports"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) {
        setError("Failed to load reports");
      }
      setLoading(false);
    };
    fetchReports();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">📊 My Disease Reports</h2>
          <p className="section-copy">
            Track the reports you submitted, check status changes, and review researcher responses without reopening each form.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Submitted reports</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{reports.length}</p>
          <p className="mt-2 text-sm text-slate-600">Pending and reviewed updates stay visible in one timeline-style board.</p>
        </div>
      </div>
      {loading ? (
        <div className="empty-panel">Loading reports...</div>
      ) : error ? (
        <div className="empty-panel text-red-600">{error}</div>
      ) : reports.length === 0 ? (
        <div className="empty-panel">No reports found.</div>
      ) : (
        <div className="content-grid">
          {reports.map((report) => (
            <motion.div
              key={report._id}
              whileHover={{ scale: 1.02 }}
              className="panel-card p-6"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className="text-xl font-semibold text-green-900">{report.crop}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${report.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {report.status}
                </span>
              </div>
              <p><b>Location:</b> {report.location}</p>
              <p><b>Problem:</b> {report.problem}</p>
              <p><b>Symptom Location:</b> {report.symptomLocation}</p>
              <p><b>Spread:</b> {report.spread}</p>
              <p><b>Weather:</b> {report.weather}</p>
              <p className="mt-3"><b>AI Triage:</b> {report.probableDisease}</p>
              <p><b>Severity:</b> {report.severity}</p>
              <p><b>Confidence:</b> {Math.round((report.confidenceScore || 0) * 100)}%</p>
              {report.image && (
                <img
                  src={assetUrl(report.image)}
                  alt="crop"
                  className="mt-3 h-32 w-full max-w-xs rounded-2xl object-cover"
                />
              )}
              {report.recommendedAction && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  <b>Recommended Action:</b> {report.recommendedAction}
                </div>
              )}
              {report.status === "Reviewed" && report.researchResponse && (
                <div className="mt-3 p-3 bg-green-100 rounded">
                  <b>Researcher Response:</b>
                  <div>{report.researchResponse}</div>
                </div>
              )}
              {report.status === "Pending" && (
                <div className="mt-3 p-3 bg-yellow-100 rounded">
                  <b>Status:</b> Awaiting researcher review
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Reports;
