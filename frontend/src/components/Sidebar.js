import React from "react";

export default function Sidebar({ setSection }) {
  return (
    <div className="w-64 bg-green-800 text-white p-6 space-y-4 min-h-screen">
      <button onClick={()=>setSection("weather")} className="block w-full text-left hover:bg-green-700 p-2 rounded">🌦 Weather</button>
      <button onClick={()=>setSection("crops")} className="block w-full text-left hover:bg-green-700 p-2 rounded">🌱 My Crops</button>
      <button onClick={()=>setSection("disease")} className="block w-full text-left hover:bg-green-700 p-2 rounded">📸 Disease</button>
      <button onClick={()=>setSection("reports")} className="block w-full text-left hover:bg-green-700 p-2 rounded">📊 Reports</button>
    </div>
  );
}