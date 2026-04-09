import React from "react";

const items = [
  { key: "overview", label: "System Overview", icon: "🛠" },
  { key: "map", label: "Field Map", icon: "🗺" },
  { key: "research", label: "All Reports", icon: "📊" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

export default function AdminSidebar({ section, setSection }) {
  return (
    <aside className="sidebar-shell h-full w-full">
      <div className="sidebar-scroll p-4">
      <h2 className="px-2 pb-3 text-lg font-bold text-green-900">Admin Panel</h2>
      <div className="grid gap-2">
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
