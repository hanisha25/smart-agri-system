import { useEffect, useState } from "react";
import axios from "axios";

function ResearchDashboard(){
const [reports,setReports] = useState([]);
const [responses,setResponses] = useState({});
const [statusUpdates,setStatusUpdates] = useState({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const fetchReports = async ()=>{
  setLoading(true);
  setError("");
  try{
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://localhost:5400/api/disease/all-reports",
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

const sendUpdate = async(id)=>{
  try{
    const token = localStorage.getItem("token");
    await axios.put(
      `http://localhost:5400/api/disease/update/${id}`,
      {
        response: responses[id] || "",
        status: statusUpdates[id] || "Reviewed"
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    alert("Response/status updated");
    fetchReports();
  }catch(err){
    alert("Failed to update");
  }
};

return(
<div className="p-10">
  <h2 className="text-2xl font-bold mb-6">
    🧑‍🔬 Research Center Dashboard
  </h2>
  {loading ? (
    <div className="text-center text-lg py-10">Loading reports...</div>
  ) : error ? (
    <div className="text-center text-red-600 py-10">{error}</div>
  ) : reports.length === 0 ? (
    <div className="text-center text-gray-500 py-10">No reports found.</div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {reports.map((report)=>(
        <div
          key={report._id}
          className="bg-white shadow-xl rounded-2xl p-8 border border-green-200 flex flex-col gap-2"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-lg">{report.crop}</span>
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${report.status==="Pending"?"bg-yellow-200 text-yellow-800":"bg-green-200 text-green-800"}`}>{report.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><b>Farmer:</b> {report.farmerId?.name}</div>
            <div><b>Location:</b> {report.location}</div>
            <div><b>Problem:</b> {report.problem}</div>
            <div><b>Symptom:</b> {report.symptomLocation}</div>
            <div><b>Spread:</b> {report.spread}</div>
            <div><b>Weather:</b> {report.weather}</div>
          </div>
          {report.image && (
            <img
              src={`http://localhost:5400/${report.image}`}
              alt="crop"
              className="w-40 mt-4 rounded shadow border"
            />
          )}
          <textarea
            placeholder="Write diagnosis / solution"
            className="border p-2 mt-4 w-full rounded"
            value={responses[report._id] || report.researchResponse || ""}
            onChange={(e)=>handleResponseChange(report._id,e.target.value)}
          ></textarea>
          <div className="flex items-center gap-3 mt-2">
            <select
              className="border rounded p-2"
              value={statusUpdates[report._id] || report.status}
              onChange={e=>handleStatusChange(report._id,e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button
              onClick={()=>sendUpdate(report._id)}
              className="bg-green-700 text-white px-4 py-2 rounded ml-auto"
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