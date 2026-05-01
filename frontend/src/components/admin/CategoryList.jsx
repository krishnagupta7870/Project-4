import React, { useEffect, useState } from "react";
import api, { API_ORIGIN } from "../../utils/api";
import { Pencil, Trash2 } from "lucide-react";

export default function CategoryList({ onAdd = () => {} }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingCat, setEditingCat] = useState(null);
  const [editName, setEditName] = useState("");
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data || []);
    } catch (err1) {
      try {
        const res2 = await api.get("/categories");
        setCategories(res2.data || []);
      } catch (err2) {
        setCategories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const total = categories.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const visible = categories.slice(startIndex, startIndex + pageSize);

  const resolveImageSrc = (img) => {
    if (!img) return "";
    if (img.startsWith("/")) return `${API_ORIGIN}${img}`;
    if (img.startsWith("http")) return img;
    return `${API_ORIGIN}/${img}`;
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/categories/${id}`);
      await fetchCategories();
      return;
    } catch (e1) {}
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
    } catch (e2) {}
  };

  const beginEdit = (cat) => {
    setEditingCat(cat);
    setEditName(cat.name || "");
    const src = resolveImageSrc(cat.image || "");
    setEditPreview(src);
    setEditFile(null);
  };

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    setEditFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setEditPreview(reader.result);
      reader.readAsDataURL(f);
    } else {
      setEditPreview(resolveImageSrc(editingCat?.image || ""));
    }
  };

  const saveEdit = async () => {
    if (!editingCat) return;
    setSaving(true);
    const id = editingCat._id || editingCat.id;
    try {
      const fd = new FormData();
      if (editName) fd.append("name", editName);
      if (editFile) fd.append("image", editFile);
      await api.put(`/admin/categories/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
    } catch (e1) {
      try {
        const fd = new FormData();
        if (editName) fd.append("name", editName);
        if (editFile) fd.append("image", editFile);
        await api.put(`/categories/${id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } catch (e2) {
        setSaving(false);
        return;
      }
    }
    await fetchCategories();
    setSaving(false);
    setEditingCat(null);
  };

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Category List</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAdd}>ADD CATEGORY</button>
        </div>
      </div>

      {editingCat && (
        <div className="card">
          <div className="card-section">
            <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
              <div>
                <div className="section-title">Edit Name</div>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, width: 280 }}
                />
              </div>
              <div>
                <div className="section-title">Edit Image</div>
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
                  {editPreview ? (
                    <img src={editPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ color: "#64748b", fontSize: 14 }}>Image Upload</div>
                  )}
                  <input type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                </label>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingCat(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>IMAGE</th>
                <th>CATEGORY NAME</th>
                <th style={{ width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center p-4">Loading...</td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center p-4">No categories found.</td>
                </tr>
              ) : (
                visible.map((cat) => {
                  const raw = cat.image || cat.imageUrl || cat.icon || "";
                  const img = resolveImageSrc(raw);
                  return (
                    <tr key={cat._id || cat.id}>
                      <td>
                        {img ? (
                          <img src={img} alt={cat.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover" }} />
                        ) : (
                          <div className="avatar">{(cat.name || "C").charAt(0).toUpperCase()}</div>
                        )}
                      </td>
                      <td className="product-name">{cat.name || cat.title || "Unnamed"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button className="icon-btn" aria-label="Edit" onClick={() => beginEdit(cat)}>
                            <Pencil size={18} />
                          </button>
                          <button className="icon-btn" aria-label="Delete" onClick={() => handleDelete(cat._id || cat.id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 16, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Rows per page:</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div>
            {startIndex + 1}-{Math.min(startIndex + pageSize, total)} of {total}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{`<`}</button>
            <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{`>`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
