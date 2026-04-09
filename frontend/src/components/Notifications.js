import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../api";

const toneMap = {
  field: "bg-sky-50 text-sky-900 border-sky-100",
  report: "bg-amber-50 text-amber-900 border-amber-100",
  "report-update": "bg-green-50 text-green-900 border-green-100",
  research: "bg-violet-50 text-violet-900 border-violet-100",
  general: "bg-slate-50 text-slate-900 border-slate-100",
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(apiUrl("/api/notifications/my-notifications"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        apiUrl(`/api/notifications/mark-read/${id}`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (err) {
      setError("Failed to update notification");
    }
  };

  return (
    <div className="section-shell">
      <div className="section-hero">
        <div>
          <h2 className="section-title">🔔 Notifications</h2>
          <p className="section-copy">
            Track reminders, new submissions, and report updates in one inbox-like feed.
          </p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-slate-500">Unread notifications</p>
          <p className="mt-3 text-3xl font-bold text-green-900">{unreadCount}</p>
          <p className="mt-2 text-sm text-slate-600">This inbox can later be connected to SMS, email, or push alerts.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-panel">Loading notifications...</div>
      ) : error ? (
        <div className="empty-panel text-red-600">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="empty-panel">No notifications yet.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`panel-card border p-5 ${toneMap[notification.type] || toneMap.general}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-semibold">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm opacity-80">{notification.message}</p>
                  <p className="mt-3 text-xs opacity-60">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-800"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
