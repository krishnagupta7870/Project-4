import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function AddSubCategoryForm({ onDone = () => {} }) {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [names, setNames] = useState([""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/admin/categories");
        setCategories(res.data || []);
      } catch {
        const res2 = await api.get("/categories");
        setCategories(res2.data || []);
      }
    };
    load();
  }, []);

  const addField = () => setNames((prev) => [...prev, ""]);
  const removeField = (idx) =>
    setNames((prev) => prev.filter((_, i) => i !== idx));
  const updateField = (idx, value) =>
    setNames((prev) => prev.map((n, i) => (i === idx ? value : n)));

  const submit = async () => {
    const payloadNames = names.map((n) => n.trim()).filter(Boolean);
    if (payloadNames.length === 0 || !categoryId) return;
    setSubmitting(true);
    try {
      if (payloadNames.length === 1) {
        await api.post("/admin/subcategories", { name: payloadNames[0], category: categoryId });
      } else {
        await api.post("/admin/subcategories/bulk", { category: categoryId, names: payloadNames });
      }
    } catch {
      try {
        if (payloadNames.length === 1) {
          await api.post("/subcategories", { name: payloadNames[0], category: categoryId });
        } else {
          await api.post("/subcategories/bulk", { category: categoryId, names: payloadNames });
        }
      } catch {
        setSubmitting(false);
        return;
      }
    }
    onDone();
  };

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Add New Sub Category</h2>
      </div>
      <div className="card">
        <div className="card-section">
          <div style={{ display: "grid", gap: 16, maxWidth: 520 }}>
            <label>
              <div className="section-title">Parent Category</div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option value={c._id} key={c._id}>{c.name}</option>
                ))}
              </select>
            </label>
            <div>
              <div className="section-title">Sub Category Names</div>
              <div style={{ display: "grid", gap: 8 }}>
                {names.map((n, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={n}
                      onChange={(e) => updateField(idx, e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8 }}
                      placeholder={`Name ${idx + 1}`}
                    />
                    {names.length > 1 && (
                      <button type="button" className="btn btn-secondary" onClick={() => removeField(idx)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={addField}>Add another</button>
            </div>
            <button className="btn btn-primary" onClick={submit} disabled={submitting} style={{ width: 260 }}>
              {submitting ? "Publishing..." : "PUBLISH AND VIEW"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
