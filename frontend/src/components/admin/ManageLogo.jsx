import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useLogo } from "../../context/LogoContext";

const DEFAULT_LOGO = "/images/logos/logo.svg";

export default function ManageLogo() {
  const { logo: globalLogo, fetchLogo } = useLogo();
  const [current, setCurrent] = useState(globalLogo);
  const [preview, setPreview] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    setCurrent(globalLogo);
  }, [globalLogo]);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const savePreview = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append("logo", selectedFile);
        
        await api.put("/admin/settings/logo", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        
        await fetchLogo();
        setPreview(null);
        setSelectedFile(null);
        alert("Logo updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update logo");
    } finally {
        setUploading(false);
    }
  };

  const saveUrl = async () => {
    if (!urlInput) return;
    setUploading(true);
    try {
        await api.put("/admin/settings/logo", { url: urlInput });
        await fetchLogo();
        setUrlInput("");
        setPreview(null);
        alert("Logo updated successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to update logo");
    } finally {
        setUploading(false);
    }
  };

  const resetDefault = async () => {
    if (!window.confirm("Are you sure you want to reset to default logo?")) return;
    try {
        await api.put("/admin/settings/logo", { reset: "true" });
        await fetchLogo();
        alert("Logo reset to default");
    } catch (err) {
        alert("Failed to reset logo");
    }
  };

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Manage Logo</h2>
        <div className="header-actions">
          <button className="btn btn-danger-outline" onClick={resetDefault}>Reset Default</button>
        </div>
      </div>

      <div className="card">
        <div className="card-section">
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Current Logo</div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
                <img src={preview || current} alt="Logo" style={{ height: 48 }} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Upload Image</div>
              <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={onFile} />
              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={savePreview} disabled={!selectedFile || uploading}>
                  {uploading ? "Saving..." : "Save Upload"}
                </button>
                <button className="btn btn-secondary" onClick={() => { setPreview(null); setSelectedFile(null); }}>Clear</button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-section">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Set From URL</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="url"
              placeholder="https://example.com/logo.png"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <button className="btn btn-primary" onClick={saveUrl} disabled={!urlInput || uploading}>
               {uploading ? "Saving..." : "Save URL"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
