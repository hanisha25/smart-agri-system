import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

function MetricCard({ label, value, tone = "green" }) {
  const tones = {
    green: "bg-green-50 text-green-900 border-green-100",
    amber: "bg-amber-50 text-amber-900 border-amber-100",
    blue: "bg-sky-50 text-sky-900 border-sky-100",
  };

  return (
    <div className={`rounded-[24px] border p-5 shadow-sm ${tones[tone]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function CountList({ title, data }) {
  const entries = Object.entries(data || {});

  return (
    <div className="panel-card p-6">
      <h3 className="text-lg font-semibold text-green-900">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No data yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {entries.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
              <span className="text-sm text-slate-700">{label}</span>
              <span className="text-sm font-semibold text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl("/api/analytics/admin-summary"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(response.data);
      } catch (err) {
        setError("Failed to load admin summary");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <div className="empty-panel">Loading admin summary...</div>;
  if (error) return <div className="empty-panel text-red-600">{error}</div>;

  return (
    <div className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🛠 System Overview</h2>
          <p className="section-copy">
            Monitor platform usage, report severity distribution, notification traffic, and role-level adoption from one admin console.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Recent reports</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{data.recentReports.length}</p>
          <p className="mt-2 text-sm text-slate-600">This admin view gives your project a complete system-monitoring story for final review.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Farmers" value={data.totals.farmers} tone="green" />
        <MetricCard label="Researchers" value={data.totals.researchers} tone="blue" />
        <MetricCard label="Admins" value={data.totals.admins} tone="amber" />
        <MetricCard label="Fields" value={data.totals.fields} tone="green" />
        <MetricCard label="Reports" value={data.totals.reports} tone="blue" />
        <MetricCard label="Notifications" value={data.totals.notifications} tone="amber" />
      </div>

      <div className="grid gap-5 xl:grid-cols-4">
        <CountList title="Reports By Status" data={data.reportsByStatus} />
        <CountList title="Reports By Severity" data={data.reportsBySeverity} />
        <CountList title="Fields By Crop" data={data.fieldsByCrop} />
        <CountList title="Notifications By Type" data={data.notificationsByType} />
      </div>
    </div>
  );
}
