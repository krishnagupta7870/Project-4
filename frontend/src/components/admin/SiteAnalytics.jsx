import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function SiteAnalytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data));
  }, []);

  if (!stats) return <p className="text-muted">Loading analytics...</p>;

  return (
    <div>
      <h3 className="section-title">Site Analytics</h3>
      <div className="dashboard-grid">
        <div className="stat-card">
           <div className="stat-info">
             <h3>Total Users</h3>
             <p className="value">{stats.totalUsers}</p>
           </div>
        </div>
        <div className="stat-card">
           <div className="stat-info">
             <h3>Sellers</h3>
             <p className="value">{stats.sellers}</p>
           </div>
        </div>
        <div className="stat-card">
           <div className="stat-info">
             <h3>Admins</h3>
             <p className="value">{stats.admins}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
