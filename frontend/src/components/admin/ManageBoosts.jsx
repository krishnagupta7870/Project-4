import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { CheckCircle, X, Plus, Trash2 } from "lucide-react";
import "../../styles/admin-dashboard.css";

export default function ManageBoosts() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: "success", message: "" });

  useEffect(() => {
    const timer = toast.show ? setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500) : null;
    return () => timer && clearTimeout(timer);
  }, [toast.show]);

  const showToast = (message, type = "success") => setToast({ show: true, type, message });

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/admin/settings/boost-packages");
        setPackages(Array.isArray(data) ? data : []);
      } catch {
        showToast("Failed to load boost packages", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const addPackage = () => {
    setPackages(prev => [...prev, { label: "", hours: 1, price: 0 }]);
  };

  const updatePackage = (idx, field, value) => {
    setPackages(prev => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const removePackage = (idx) => {
    setPackages(prev => prev.filter((_, i) => i !== idx));
  };

  const save = async () => {
    setSaving(true);
    try {
      const sanitized = packages.map(p => ({
        label: (p.label || "").trim() || `${Number(p.hours)} Hours`,
        hours: Number(p.hours),
        price: Number(p.price)
      })).filter(p => p.hours > 0 && p.price >= 0);
      await api.put("/admin/settings/boost-packages", { packages: sanitized });
      showToast("Boost packages saved");
    } catch (err) {
      showToast(err.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-overlay"><span>Loading Boost Settings...</span></div>;

  return (
    <div className="dashboard-home">
      {toast.show && (
        <div className={`toast-notify ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <X size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, show: false }))}><X size={14} /></button>
        </div>
      )}
      <div className="page-header">
        <h2 className="page-title">Boost Pricing</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={addPackage}><Plus size={16} /> Add Package</button>
          <button className="btn btn-secondary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>

      <div className="card">
        <div className="card-section">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 600 }}>Label</div>
            <div style={{ fontWeight: 600 }}>Hours</div>
            <div style={{ fontWeight: 600 }}>Price (Rs)</div>
            <div />
          </div>
          {packages.length === 0 ? (
            <div style={{ padding: 12, color: "#666" }}>No packages. Add one.</div>
          ) : (
            packages.map((p, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "center", marginTop: 10 }}>
                <input
                  type="text"
                  value={p.label || ""}
                  onChange={e => updatePackage(idx, "label", e.target.value)}
                  placeholder="e.g. 6 Hours"
                  className="form-control"
                />
                <input
                  type="number"
                  value={p.hours}
                  onChange={e => updatePackage(idx, "hours", Number(e.target.value))}
                  min={1}
                  className="form-control"
                />
                <input
                  type="number"
                  value={p.price}
                  onChange={e => updatePackage(idx, "price", Number(e.target.value))}
                  min={0}
                  className="form-control"
                />
                <button className="btn btn-danger-outline" onClick={() => removePackage(idx)}><Trash2 size={16} /></button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
