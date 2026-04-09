import { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl, assetUrl } from "../api";

function Disease({ lang }) {

const text = {

en:{
title:"🌿 Report Crop Problem",
crop:"Crop Name",
location:"Village / District",
problem:"Select Problem",
symptom:"Where is the problem?",
spread:"How much spread?",
weather:"Recent Weather",
submit:"Submit Report",
fail:"Failed to send report",
voice:"Speak",

problems:[
"Yellow Leaves",
"Brown Spots",
"White Powder",
"Leaf Holes",
"Plant Drying"
],

symptoms:[
"Leaves",
"Stem",
"Root",
"Whole Plant"
],

spreads:[
"Few Plants",
"Half Field",
"Whole Field"
],

weathers:[
"Heavy Rain",
"Dry Weather",
"High Humidity"
]

},

te:{
title:"🌿 పంట సమస్య నివేదించండి",
crop:"పంట పేరు",
location:"గ్రామం / జిల్లా",
problem:"సమస్య ఎంచుకోండి",
symptom:"సమస్య ఎక్కడ ఉంది?",
spread:"ఎంతగా వ్యాపించింది?",
weather:"ఇటీవల వాతావరణం",
submit:"నివేదిక పంపండి",
fail:"నివేదిక పంపడంలో విఫలమైంది",
voice:"మాట్లాడండి",

problems:[
"పసుపు ఆకులు",
"గోధుమ మచ్చలు",
"తెల్ల పొడి",
"ఆకులలో రంధ్రాలు",
"మొక్క ఎండిపోవడం"
],

symptoms:[
"ఆకులు",
"కొమ్మ",
"వేరు",
"మొత్తం మొక్క"
],

spreads:[
"కొన్ని మొక్కలు",
"పొలం సగం",
"మొత్తం పొలం"
],

weathers:[
"భారీ వర్షం",
"ఎండ వాతావరణం",
"అధిక తేమ"
]

},

hi:{
title:"🌿 फसल समस्या रिपोर्ट करें",
crop:"फसल का नाम",
location:"गाँव / जिला",
problem:"समस्या चुनें",
symptom:"समस्या कहाँ है?",
spread:"कितना फैलाव है?",
weather:"हाल का मौसम",
submit:"रिपोर्ट भेजें",
fail:"रिपोर्ट भेजने में विफल",
voice:"बोलें",

problems:[
"पीले पत्ते",
"भूरे धब्बे",
"सफेद पाउडर",
"पत्तों में छेद",
"पौधा सूखना"
],

symptoms:[
"पत्ते",
"तना",
"जड़",
"पूरा पौधा"
],

spreads:[
"कुछ पौधे",
"आधा खेत",
"पूरा खेत"
],

weathers:[
"भारी बारिश",
"सूखा मौसम",
"अधिक नमी"
]

}

};

const t = text[lang] || text.en;

const [formData,setFormData] = useState({
crop:"",
location:"",
problem:"",
symptomLocation:"",
spread:"",
weather:""
});

const [image,setImage] = useState(null);
const [message,setMessage] = useState("");
const [myReports, setMyReports] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [submitting, setSubmitting] = useState(false);

const fetchReports = async () => {
setLoading(true);
setError("");
try {
const token = localStorage.getItem("token");
const res = await axios.get(apiUrl("/api/farmer-reports/my-reports"), {
headers: { Authorization: `Bearer ${token}` }
});
setMyReports(res.data);
} catch (err) {
setError("Failed to load your reports");
}
setLoading(false);
};

// Fetch farmer's own reports
useEffect(() => {
fetchReports();
}, []);

const handleChange = (e)=>{
setFormData({
...formData,
[e.target.name]: e.target.value
});
};

const startVoice = () => {

const SpeechRecognition =
window.SpeechRecognition || window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();

recognition.lang =
lang === "te" ? "te-IN" :
lang === "hi" ? "hi-IN" :
"en-IN";

recognition.start();

recognition.onresult = (event)=>{

const speechText = event.results[0][0].transcript;

setFormData({
...formData,
crop:speechText
});

};

};

const detectDisease = async ()=>{

try{
setSubmitting(true);
setMessage("");

if(!formData.crop || !formData.location || !formData.problem || !formData.symptomLocation || !formData.spread || !formData.weather){
setMessage("Please complete all report fields before submitting.");
setSubmitting(false);
return;
}

const token = localStorage.getItem("token");

const data = new FormData();

data.append("crop",formData.crop);
data.append("location",formData.location);
data.append("problem",formData.problem);
data.append("symptomLocation",formData.symptomLocation);
data.append("spread",formData.spread);
data.append("weather",formData.weather);

if(image){
data.append("image",image);
}

const res = await axios.post(
apiUrl("/api/disease/report"),
data,
{
headers:{
Authorization:`Bearer ${token}`,
"Content-Type":"multipart/form-data"
}
}
);

setMessage(res.data.message);
setFormData({
crop:"",
location:"",
problem:"",
symptomLocation:"",
spread:"",
weather:""
});
setImage(null);
fetchReports();

}catch(err){

console.log(err);
setMessage(err.response?.data?.message || t.fail);

} finally {
setSubmitting(false);
}

};

const severityTone = {
Low: "bg-emerald-100 text-emerald-800",
Medium: "bg-amber-100 text-amber-800",
High: "bg-red-100 text-red-800",
};

return(

<div className="section-shell">

<div className="section-hero">
<div>
<h2 className="section-title">
{t.title}
</h2>
<p className="section-copy">
Submit field symptoms with location, spread, weather context, and an optional image so the researcher can respond faster.
</p>
</div>
<div className="stat-card">
<p className="text-sm text-slate-500">My reports</p>
<p className="mt-3 text-3xl font-bold text-green-900">{myReports.length}</p>
<p className="mt-2 text-sm text-slate-600">Your most recent submissions appear below with review status and response notes.</p>
</div>
</div>

<div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
<div className="panel-card p-6">
<div className="grid gap-4">

{/* Crop + Voice */}

<div className="flex gap-2">

<input
type="text"
name="crop"
value={formData.crop}
placeholder={t.crop}
onChange={handleChange}
className="auth-input flex-1"
/>

<button
onClick={startVoice}
className="rounded-2xl bg-green-600 px-4 text-white"

>

🎤 </button>

</div>

{/* Location */}

<input
type="text"
name="location"
placeholder={t.location}
onChange={handleChange}
value={formData.location}
className="auth-input"
/>

{/* Problem */}

<select
name="problem"
onChange={handleChange}
value={formData.problem}
className="auth-input"

>

<option value="">{t.problem}</option>

{t.problems.map((item,index)=>(

<option key={index} value={item}>
{item}
</option>
))}

</select>

{/* Symptom */}

<select
name="symptomLocation"
onChange={handleChange}
value={formData.symptomLocation}
className="auth-input"

>

<option value="">{t.symptom}</option>

{t.symptoms.map((item,index)=>(

<option key={index} value={item}>
{item}
</option>
))}

</select>

{/* Spread */}

<select
name="spread"
onChange={handleChange}
value={formData.spread}
className="auth-input"

>

<option value="">{t.spread}</option>

{t.spreads.map((item,index)=>(

<option key={index} value={item}>
{item}
</option>
))}

</select>

{/* Weather */}

<select
name="weather"
onChange={handleChange}
value={formData.weather}
className="auth-input"

>

<option value="">{t.weather}</option>

{t.weathers.map((item,index)=>(

<option key={index} value={item}>
{item}
</option>
))}

</select>

{/* Image */}

<input
type="file"
onChange={(e)=>setImage(e.target.files[0])}
className="auth-input"
/>

{/* Submit */}

<button
onClick={detectDisease}
disabled={submitting}
className="rounded-full bg-green-700 p-3 text-white disabled:cursor-not-allowed disabled:bg-green-300"

>

{submitting ? "Submitting..." : t.submit} </button>

{message && (

<p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${message.toLowerCase().includes("failed") || message.toLowerCase().includes("complete") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
{message}
</p>
)}

</div>
</div>

<div className="panel-card p-6">
<h3 className="mb-4 text-xl font-bold">📝 My Disease Reports</h3>
{loading ? (
  <div className="text-center text-lg py-6">Loading your reports...</div>
) : error ? (
  <div className="text-center text-red-600 py-6">{error}</div>
) : myReports.length === 0 ? (
  <div className="text-center text-gray-500 py-6">No reports found.</div>
) : (
  <div className="grid gap-4">
    {myReports.map((report) => (
      <div key={report._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${report.status==="Pending"?"bg-yellow-200 text-yellow-800":"bg-green-200 text-green-800"}`}>{report.status}</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${severityTone[report.severity] || "bg-slate-100 text-slate-700"}`}>{report.severity || "Low"} severity</span>
          <span className="font-bold">{report.crop}</span>
          <span className="ml-auto text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="text-sm grid grid-cols-2 gap-2">
          <div><b>Location:</b> {report.location}</div>
          <div><b>Problem:</b> {report.problem}</div>
          <div><b>Symptom:</b> {report.symptomLocation}</div>
          <div><b>Spread:</b> {report.spread}</div>
          <div><b>Weather:</b> {report.weather}</div>
          <div><b>AI Triage:</b> {report.probableDisease}</div>
          <div><b>Confidence:</b> {Math.round((report.confidenceScore || 0) * 100)}%</div>
        </div>
        {report.image && (
          <img src={assetUrl(report.image)} alt="crop" className="mt-2 h-28 w-32 rounded object-cover" />
        )}
        {report.recommendedAction && (
          <div className="mt-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
            <b>Recommended Action:</b> {report.recommendedAction}
          </div>
        )}
        {report.status !== "Pending" && report.researchResponse && (
          <div className="mt-2 p-2 bg-green-50 rounded text-green-800">
            <b>Researcher Response:</b> {report.researchResponse}
          </div>
        )}
        {report.status === "Pending" && (
          <div className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800">
            Awaiting researcher review
          </div>
        )}

      </div>
    ))}
  </div>
)}
</div>

</div>

</div>

);

}

export default Disease;
