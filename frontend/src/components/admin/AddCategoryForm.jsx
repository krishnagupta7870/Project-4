import React, { useState } from "react";
import api from "../../utils/api";

export default function AddCategoryForm({ onDone = () => {} }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setPreview("");
    }
  };

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (file) fd.append("image", file);

      try {
        await api.post("/admin/categories", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch {
        await api.post("/categories", fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      onDone();
    } catch (e) {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Add New Category</h2>
      </div>

      <div className="card">
        <div className="card-section">
          <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
            <label>
              <div className="section-title">Category Name</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8
                }}
              />
            </label>

            <div>
              <div className="section-title">Category Image</div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #cbd5e1",
                  borderRadius: 12,
                  width: 240,
                  height: 160,
                  cursor: "pointer",
                  background: "#f8fafc",
                  overflow: "hidden"
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ color: "#64748b", fontSize: 14 }}>Image Upload</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={submitting}
              style={{ width: 260 }}
            >
              {submitting ? "Publishing..." : "PUBLISH AND VIEW"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
