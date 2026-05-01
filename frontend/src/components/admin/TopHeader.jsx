import React, { useEffect, useRef, useState } from "react";
import { Bell, Menu } from "lucide-react";
import api from "../../utils/api";
import { useNavigate } from "react-router-dom";

export default function TopHeader({ onToggleMenu }) {
  const [logoUrl, setLogoUrl] = useState("/images/logos/logo.svg");
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "K";
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="top-header">
      <div className="header-left">
        <img src={logoUrl} alt="Logo" style={{ height: 28 }} />
        <button className="btn btn-secondary" onClick={onToggleMenu} aria-label="Toggle menu">
          <Menu size={18} />
        </button>
      </div>
      <div className="header-right" ref={profileRef}>
        <div style={{ position: "relative" }}>
          <button className="btn-action" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              fontSize: 10,
              padding: "2px 5px",
              fontWeight: 700
            }}
          >
            4
          </span>
        </div>
        <div
          className="avatar"
          onClick={() => setShowProfile(!showProfile)}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#ef4444",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          {userInitial || "K"}
        </div>
        {showProfile && (
          <div
            className="dm-profile-popup"
            style={{
              position: "absolute",
              right: 16,
              top: 50,
              background: "white",
              borderRadius: 12,
              boxShadow: "var(--card-shadow)",
              padding: 12,
              minWidth: 220
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700
                }}
              >
                {userInitial || "K"}
              </div>
              <div>
                <strong>{user?.name || "Krishna Gupta"}</strong>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {user?.email || "krishna.birgunj2@gmail.com"}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, borderTop: "1px solid #e5e7eb", paddingTop: 10 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer" }}
                onClick={() => {
                  setShowProfile(false);
                  navigate("/profile");
                }}
              >
                <span style={{ fontSize: 16 }}>👤</span>
                <span>Profile</span>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px", cursor: "pointer" }}
                onClick={() => {
                  localStorage.removeItem("user");
                  localStorage.removeItem("token");
                  setShowProfile(false);
                  navigate("/login");
                }}
              >
                <span style={{ fontSize: 16 }}>↻</span>
                <span>Sign Out</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
