import { useEffect, useMemo, useState } from "react";
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

function buildEmbedUrl(lat, lon) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.03}%2C${lat - 0.03}%2C${lon + 0.03}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lon}`;
}

export default function MapInsights({ role }) {
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFields = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(apiUrl("/api/field/map-fields"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFields(response.data);
        if (response.data.length) {
          const firstMappable = response.data.find((item) => item.mapLatitude && item.mapLongitude);
          setSelectedFieldId(firstMappable?._id || response.data[0]._id);
        }
      } catch (err) {
        setError("Failed to load field map data");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const selectedField = useMemo(
    () => fields.find((field) => field._id === selectedFieldId) || null,
    [fields, selectedFieldId]
  );

  const mappedFields = fields.filter((field) => field.mapLatitude && field.mapLongitude);
  const districtFallbacks = fields.filter((field) => field.mapSource === "district").length;

  if (loading) return <div className="empty-panel">Loading map insights...</div>;
  if (error) return <div className="empty-panel text-red-600">{error}</div>;

  return (
    <div className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🗺 Field Intelligence Map</h2>
          <p className="section-copy">
            Visualize field locations, district fallbacks, and geographic crop distribution from a single spatial view.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Mapped fields</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{mappedFields.length}</p>
          <p className="mt-2 text-sm text-slate-600">
            {role === "farmer" ? "Your saved fields with map coordinates or district fallback." : "A shared operational view across visible farm records."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total visible fields" value={fields.length} tone="green" />
        <MetricCard label="Mapped by coordinates" value={fields.filter((f) => f.mapSource === "field").length} tone="blue" />
        <MetricCard label="District fallbacks" value={districtFallbacks} tone="amber" />
        <MetricCard label="Unmapped fields" value={fields.filter((f) => f.mapSource === "none").length} tone="amber" />
      </div>

      {fields.length === 0 ? (
        <div className="empty-panel">No field data available for mapping yet.</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <div className="panel-card max-h-[680px] overflow-auto p-4">
            <h3 className="px-2 pb-4 text-lg font-semibold text-green-900">Field Locations</h3>
            <div className="space-y-3">
              {fields.map((field) => (
                <button
                  key={field._id}
                  onClick={() => setSelectedFieldId(field._id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    selectedFieldId === field._id
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-white hover:border-green-100 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{field.fieldName || field.cropName}</p>
                      <p className="mt-1 text-sm text-slate-600">{field.cropName} • {field.village}, {field.district}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      field.mapSource === "field"
                        ? "bg-green-100 text-green-800"
                        : field.mapSource === "district"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {field.mapSource === "field" ? "Exact" : field.mapSource === "district" ? "District" : "Missing"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-1 text-sm text-slate-600">
                    <p><b>Area:</b> {field.area || "--"} acres</p>
                    <p><b>Soil:</b> {field.soilType || "--"}</p>
                    <p><b>Irrigation:</b> {field.irrigation || "--"}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card p-5">
            {!selectedField || !selectedField.mapLatitude || !selectedField.mapLongitude ? (
              <div className="empty-panel min-h-[540px]">
                This field has no usable coordinates yet. Add latitude and longitude for a more accurate map view.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
                  <h3 className="text-2xl font-bold text-slate-900">{selectedField.fieldName || selectedField.cropName}</h3>
                  <p className="text-sm text-slate-600">
                    {selectedField.cropName} in {selectedField.village}, {selectedField.district}
                  </p>
                  <p className="text-sm text-slate-500">
                    Map source: {selectedField.mapSource === "field" ? "Exact field coordinates" : "District fallback coordinates"}
                  </p>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
                  <iframe
                    title="Field map"
                    src={buildEmbedUrl(selectedField.mapLatitude, selectedField.mapLongitude)}
                    className="h-[460px] w-full border-0"
                    loading="lazy"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Latitude</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedField.mapLatitude}</p>
                  </div>
                  <div className="rounded-[24px] bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Longitude</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{selectedField.mapLongitude}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
