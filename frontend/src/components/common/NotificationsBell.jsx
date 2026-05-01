import React, { useEffect, useState, useRef } from "react";
import { Bell, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { useSocket } from "../../context/SocketContext";
import "../../styles/notifications.css";

const timeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return "Just now";
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const unread = items.filter(i => !i.read).length;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/my");
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNewNotif = (notif) => {
      setItems(prev => {
        if (prev.find(n => n._id === notif._id)) return prev;
        return [notif, ...prev];
      });
    };
    socket.on("new_notification", onNewNotif);
    return () => {
      socket.off("new_notification", onNewNotif);
    };
  }, [socket]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setItems(items.map(i => ({ ...i, read: true })));
    } catch { }
  };

  const onItemClick = async (n) => {
    if (!n.read) {
      try {
        await api.put(`/ notifications / ${n._id}/read`);
        setItems(items.map(i => (i._id === n._id ? { ...i, read: true } : i)));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }

    if (n.link) {
      if (n.link === '/admin/reports') {
        navigate('/admin?tab=reports');
      } else {
        navigate(n.link);
      }
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="notification-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className="notification-btn"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && <span className="notification-badge">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unread > 0 && (
              <button className="mark-read-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {loading && items.length === 0 ? (
              <div className="notification-empty">Loading...</div>
            ) : items.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  className={`notification-item ${!n.read ? "unread" : ""}`}
                  onClick={() => onItemClick(n)}
                >
                  <div className="notification-title">{n.title}</div>
                  {n.message && <div className="notification-message">{n.message}</div>}
                  <div className="notification-time">
                    <Clock size={10} />
                    {timeAgo(n.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
