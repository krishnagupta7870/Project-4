import React from "react";
import { Navigate } from "react-router-dom";
import AdminDashboard from "../components/admin/AdminDashboard";

export default function AdminPanel() {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const u = localStorage.getItem("user");
    if (u) user = JSON.parse(u);
  } catch {
    localStorage.removeItem("user");
  }

  if (!token || !user || String(user.role || "").toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'auto' }}>
      <AdminDashboard />
    </div>
  );
}
