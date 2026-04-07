import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

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
        const res = await axios.get("http://localhost:5400/api/farmer-reports/my-reports", {
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
      <h2 className="text-2xl font-bold mb-6">📊 My Disease Reports</h2>
      {loading ? (
        <div className="text-center text-lg py-10">Loading reports...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : reports.length === 0 ? (
        <div className="text-center text-gray-500 py-10">No reports found.</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {reports.map((report) => (
            <motion.div
              key={report._id}
              whileHover={{ scale: 1.05 }}
              className="bg-white/20 backdrop-blur-lg p-6 rounded-2xl shadow-xl"
            >
              <h3 className="text-xl font-semibold mb-2">{report.crop}</h3>
              <p><b>Location:</b> {report.location}</p>
              <p><b>Problem:</b> {report.problem}</p>
              <p><b>Symptom Location:</b> {report.symptomLocation}</p>
              <p><b>Spread:</b> {report.spread}</p>
              <p><b>Weather:</b> {report.weather}</p>
              <p><b>Status:</b> {report.status}</p>
              {report.image && (
                <img
                  src={`http://localhost:5400/${report.image}`}
                  alt="crop"
                  className="w-40 mt-2 rounded"
                />
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