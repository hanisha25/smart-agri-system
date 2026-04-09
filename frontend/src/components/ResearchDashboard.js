import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl, assetUrl } from "../api";

function ResearchDashboard(){
const [reports,setReports] = useState([]);
const [responses,setResponses] = useState({});
const [statusUpdates,setStatusUpdates] = useState({});
const [recommendations,setRecommendations] = useState({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchReports = async ()=>{
  setLoading(true);
  setError("");
  try{
    const token = localStorage.getItem("token");
    const res = await axios.get(
      apiUrl("/api/disease/all-reports"),
      {
        headers:{ Authorization:`Bearer ${token}` }
      }
    );
    setReports(res.data);
  }catch(err){
    setError("Failed to load reports");
    setReports([]);
  }
  setLoading(false);
};

useEffect(()=>{
  fetchReports();
},[]);

const handleResponseChange = (id,value)=>{
  setResponses({
    ...responses,
    [id]:value
  });
};

const handleStatusChange = (id,value)=>{
  setStatusUpdates({
    ...statusUpdates,
    [id]:value
  });
};

const handleRecommendationChange = (id, value) => {
  setRecommendations({
    ...recommendations,
    [id]: value
  });
};

const sendUpdate = async(id)=>{
  try{
    const token = localStorage.getItem("token");
    await axios.put(
      apiUrl(`/api/disease/update/${id}`),
      {
        response: responses[id] || "",
        status: statusUpdates[id] || "Reviewed",
        recommendation: recommendations[id]
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert("Response updated");
    fetchReports();
  }catch(err){
    alert("Failed to update");
  }
};

return(
<div className="section-shell">
  <div className="section-hero">
    <div>
      <h2 className="section-title">
        🧑‍🔬 Research Center Dashboard
      </h2>
      <p className="section-copy">
        Review all incoming field reports, write recommendations, and update case status from one workspace.
      </p>
    </div>
    <div className="stat-card">
      <p className="text-sm text-slate-500">Open queue</p>
      <p className="mt-3 text-3xl font-bold text-green-900">{reports.length}</p>
      <p className="mt-2 text-sm text-slate-600">Use this board to move reports from pending review to resolved guidance.</p>
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
      {reports.map((report)=>(
        <div
          key={report._id}
          className="panel-card flex flex-col gap-3 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg">{report.crop}</span>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${report.status==="Pending"?"bg-yellow-200 text-yellow-800":"bg-green-200 text-green-800"}`}>{report.status}</span>
          </div>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div><b>Farmer:</b> {report.farmerId?.name}</div>
            <div><b>Location:</b> {report.location}</div>
            <div><b>Problem:</b> {report.problem}</div>
            <div><b>Symptom:</b> {report.symptomLocation}</div>
            <div><b>Spread:</b> {report.spread}</div>
            <div><b>Weather:</b> {report.weather}</div>
            <div><b>AI Triage:</b> {report.probableDisease}</div>
            <div><b>Severity:</b> {report.severity}</div>
            <div><b>Confidence:</b> {Math.round((report.confidenceScore || 0) * 100)}%</div>
          </div>
          {report.triageNotes && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <b>Triage Notes:</b> {report.triageNotes}
            </div>
          )}
          {report.image && (
            <img
              src={assetUrl(report.image)}
              alt="crop"
              className="mt-4 h-40 w-full rounded-2xl border object-cover shadow sm:max-w-sm"
            />
          )}
          <textarea
            placeholder="Refine the recommendation for the farmer"
            className="mt-2 w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-green-500"
            value={recommendations[report._id] ?? report.recommendedAction ?? ""}
            onChange={(e)=>handleRecommendationChange(report._id,e.target.value)}
          ></textarea>
          <textarea
            placeholder="Write diagnosis / solution"
            className="mt-4 w-full rounded-2xl border border-slate-200 p-3 outline-none focus:border-green-500"
            value={responses[report._id] || report.researchResponse || ""}
            onChange={(e)=>handleResponseChange(report._id,e.target.value)}
          ></textarea>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              className="rounded-2xl border border-slate-200 p-3"
              value={statusUpdates[report._id] || report.status}
              onChange={e=>handleStatusChange(report._id,e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={()=>sendUpdate(report._id)}
              className="rounded-full bg-green-700 px-5 py-3 text-white sm:ml-auto"
            >
              Save
            </button>
          </div>
          {report.researchResponse && (
            <div className="mt-2 p-2 bg-green-50 rounded text-green-800">
              <b>Diagnosis:</b> {report.researchResponse}
            </div>
          )}
        </div>
      ))}
    </div>
  )}
</div>
);
}

export default ResearchDashboard;
