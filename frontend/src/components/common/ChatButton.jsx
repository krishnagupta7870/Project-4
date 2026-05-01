import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import api from "../../utils/api";
import { useSocket } from "../../context/SocketContext";

export default function ChatButton() {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const socket = useSocket();

  // Initial fetch of unread count
  useEffect(() => {
    let mounted = true;
    async function fetchUnread() {
      try {
        const res = await api.get("/chat/unread-count");
        if (mounted) setUnread(res.data?.count || 0);
      } catch {
        if (mounted) setUnread(0);
      }
    }
    fetchUnread();
    return () => { mounted = false; };
  }, []);

  // Listen for real-time unread count updates
  useEffect(() => {
    if (!socket) return;

    const handleUnreadUpdate = (data) => {
      setUnread(data?.count || 0);
    };

    socket.on("unread_count_update", handleUnreadUpdate);

    return () => {
      socket.off("unread_count_update", handleUnreadUpdate);
    };
  }, [socket]);

  return (
    <div className="chat-wrapper">
      <button
        onClick={() => navigate("/chat")}
        className="icon-btn"
        aria-label="Chat"
        title="Chat"
      >
        <MessageSquare size={20} />
        {unread > 0 && <span className="badge badge-warning">{unread}</span>}
      </button>
    </div>
  );
}
