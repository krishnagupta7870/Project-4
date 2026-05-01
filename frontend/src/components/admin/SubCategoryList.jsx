import React, { useEffect, useState } from "react";
import api, { API_ORIGIN } from "../../utils/api";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";

export default function SubCategoryList({ onAdd = () => {} }) {
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState([]);
  const [openIds, setOpenIds] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        api.get("/admin/categories").catch(() => api.get("/categories")),
        api.get("/admin/subcategories").catch(() => api.get("/subcategories"))
      ]);
      setCategories(catRes.data || []);
      setSubs(subRes.data || []);
    } catch {
      setCategories([]);
      setSubs([]);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const toggle = (id) => {
    const next = new Set(openIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpenIds(next);
  };

  const grouped = categories.map((c) => ({
    category: c,
    items: subs.filter((s) => (s.category === c._id) || (s.category?._id === c._id))
  }));

  const beginEdit = (item) => {
    setEditing(item);
    setEditName(item.name || "");
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const id = editing._id || editing.id;
    try {
      await api.put(`/admin/subcategories/${id}`, { name: editName });
    } catch {
      try {
        await api.put(`/subcategories/${id}`, { name: editName });
      } catch {
        setSaving(false);
        return;
      }
    }
    await fetchAll();
    setSaving(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/subcategories/${id}`);
    } catch {
      try {
        await api.delete(`/subcategories/${id}`);
      } catch {}
    }
    await fetchAll();
  };

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Sub Category List</h2>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={onAdd}>ADD NEW SUB CATEGORY</button>
        </div>
      </div>

      <div className="card">
        <div className="card-section" style={{ display: "grid", gap: 12 }}>
          {grouped.map(({ category, items }) => (
            <div key={category._id} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
              <div
                onClick={() => toggle(category._id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: "#f3f4f6",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {category.image ? <img src={category.image.startsWith("/") ? `${API_ORIGIN}${category.image}` : category.image} alt={category.name} style={{ width: 24, height: 24, borderRadius: 4, objectFit: "cover" }} /> : null}
                  <strong>{category.name}</strong>
                </div>
                <ChevronDown size={18} />
              </div>

              {openIds.has(category._id) && (
                <div style={{ padding: "8px 16px", display: "grid", gap: 8 }}>
                  {items.length === 0 ? (
                    <div style={{ color: "#6b7280", padding: "6px 0" }}>No sub categories</div>
                  ) : (
                    items.map((item) => (
                      <div key={item._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                        <div>{item.name}</div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button className="icon-btn" aria-label="Edit" onClick={() => beginEdit(item)}>
                            <Pencil size={18} />
                          </button>
                          <button className="icon-btn" aria-label="Delete" onClick={() => handleDelete(item._id)}>
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {editing && (
        <div className="card">
          <div className="card-section">
            <div className="section-title">Edit Sub Category</div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, width: 280 }}
            />
            <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
