import React from "react";

const items = [
  { key: "overview", label: "Overview", icon: "📌" },
  { key: "weather", label: "Weather", icon: "🌦" },
  { key: "map", label: "Field Map", icon: "🗺" },
  { key: "crops", label: "My Crops", icon: "🌱" },
  { key: "planning", label: "Crop Planning", icon: "🧭" },
  { key: "rotation", label: "Crop Rotation", icon: "🔄" },
  { key: "disease", label: "Disease", icon: "📸" },
  { key: "reports", label: "Reports", icon: "📊" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

export default function Sidebar({ section, setSection }) {
  return (
    <aside className="sidebar-shell h-full w-full">
      <div className="sidebar-scroll p-4">
      <h3 className="px-2 pb-3 text-lg font-bold text-green-900">Farmer Panel</h3>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setSection(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
              section === item.key
                ? "bg-green-700 text-white shadow-lg"
                : "bg-slate-50 text-slate-700 hover:bg-green-50 hover:text-green-800"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      </div>
    </aside>
  );
}
