import React, { useState, useEffect, useRef, useCallback } from "react";
import api, { API_ORIGIN } from "../../utils/api";
import { categoryConfig } from "../../config/categories";
import { Plus, Trash2, Edit2, Save, X, Upload, CheckCircle, ChevronRight, Layout, Info, AlertCircle } from "lucide-react";
import "./CategoryManagement.css";


export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Edit states
    const [editingCategory, setEditingCategory] = useState(null);
    const [editName, setEditName] = useState("");
    const [editFile, setEditFile] = useState(null);
    const fileInputRef = useRef(null);
    const [editingSubId, setEditingSubId] = useState(null);
    const [editSubName, setEditSubName] = useState("");

    // Form states
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newSubCategoryName, setNewSubCategoryName] = useState("");
    const [showFieldModal, setShowFieldModal] = useState(false);
    const [activeSubForFields, setActiveSubForFields] = useState(null);
    const [isEditingField, setIsEditingField] = useState(false);
    const [fieldIdxToEdit, setFieldIdxToEdit] = useState(null);
    const [newField, setNewField] = useState({
        name: "", label: "", type: "text", options: "", required: false, placeholder: ""
    });

    // Auto-dismiss toast
    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast(prev => ({ ...prev, show: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const showToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const { data } = await api.get("/categories");
            setCategories(data);
            setLoading(false);
        } catch (err) {
            showToast("Failed to load categories", "error");
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const fetchSubcategories = async (categoryId) => {
        try {
            const { data } = await api.get(`/subcategories?categoryId=${categoryId}`);
            setSubcategories(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            await api.post("/categories", { name: newCategoryName });
            setNewCategoryName("");
            showToast("Category created successfully");
            fetchCategories();
        } catch (err) {
            showToast("Failed to create category", "error");
        }
    };

    const handleEditFile = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            setEditFile(f);
        }
    };

    const handleCreateSubcategory = async (e) => {
        e.preventDefault();
        if (!newSubCategoryName.trim() || !selectedCategory) return;
        try {
            await api.post("/subcategories", {
                name: newSubCategoryName,
                category: selectedCategory._id
            });
            setNewSubCategoryName("");
            showToast("Subcategory created");
            fetchSubcategories(selectedCategory._id);
        } catch (err) {
            showToast("Failed to create subcategory", "error");
        }
    };

    const handleUpdateCategory = async (id) => {
        try {
            const fd = new FormData();
            fd.append("name", editName.trim());
            if (editFile) fd.append("image", editFile);

            await api.put(`/categories/${id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            showToast("Category updated");
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            showToast("Update failed", "error");
        }
    };

    const handleUpdateSub = async (subId) => {
        if (!editSubName.trim()) return;
        try {
            await api.put(`/subcategories/${subId}`, { name: editSubName.trim() });
            setEditingSubId(null);
            fetchSubcategories(selectedCategory._id);
            showToast("Subcategory updated");
        } catch (err) {
            showToast("Update failed", "error");
        }
    };

    const handleSaveField = async (e) => {
        e.preventDefault();
        try {
            const fieldData = {
                ...newField,
                options: typeof newField.options === 'string' ? newField.options.split(",").map(o => o.trim()).filter(Boolean) : newField.options
            };
            let updatedFields = [...(activeSubForFields.fields || [])];
            if (isEditingField) {
                updatedFields[fieldIdxToEdit] = fieldData;
            } else {
                updatedFields.push(fieldData);
            }

            await api.put(`/subcategories/${activeSubForFields._id}`, { fields: updatedFields });
            showToast(isEditingField ? "Field updated" : "Field added");
            setShowFieldModal(false);
            fetchSubcategories(selectedCategory._id);
            localStorage.removeItem("categoriesCache");
        } catch (err) {
            showToast("Save failed", "error");
        }
    };

    const handleDeleteField = async (sub, fieldIdx) => {
        if (!window.confirm('Remove field?')) return;
        try {
            const fields = sub.fields.filter((_, i) => i !== fieldIdx);
            await api.put(`/subcategories/${sub._id}`, { fields });
            fetchSubcategories(selectedCategory._id);
            showToast('Field removed');
            localStorage.removeItem("categoriesCache");
        } catch (err) {
            showToast("Failed to remove field", "error");
        }
    };

    const handleSeedFromConfig = async () => {
        if (!window.confirm("Import categories from categories.js?")) return;
        setSeeding(true);
        try {
            await api.post("/categories/seed", { categoriesData: categoryConfig });
            showToast("Configuration imported successfully");
            fetchCategories();
            if (selectedCategory) fetchSubcategories(selectedCategory._id);
        } catch (err) {
            showToast("Import failed", "error");
        } finally {
            setSeeding(false);
        }
    };

    // Reorder fields
    const handleMoveField = async (sub, fieldName, direction) => {
        const fields = [...sub.fields];
        const index = fields.findIndex(f => f.name === fieldName);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= fields.length) return;

        // Swap
        [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];

        try {
            setLoading(true);
            const updatedSub = { ...sub, fields };
            const { data } = await api.put(`/subcategories/${sub._id}`, updatedSub);

            // Update local state
            setSubcategories(prev => prev.map(s => s._id === data._id ? data : s));
            localStorage.removeItem("categoriesCache");
            showToast("Field reordered successfully");
        } catch (err) {
            showToast("Failed to reorder field", "error");
            console.error("Failed to reorder field:", err);
        } finally {
            setLoading(false);
        }
    };

    // Reorder Categories
    const handleMoveCategory = async (cat, direction) => {
        const index = categories.findIndex(c => c._id === cat._id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const newCategories = [...categories];
        // Swap
        [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];

        // Update order values
        const targetCat = newCategories[newIndex];
        const adjacentCat = newCategories[index];

        try {
            setLoading(true);
            // We only need to swap order values if they exist, or set them sequentially
            // Simple approach: set order to index for both
            await api.put(`/categories/${targetCat._id}`, { order: newIndex });
            await api.put(`/categories/${adjacentCat._id}`, { order: index });

            fetchCategories();
            showToast("Category reordered");
        } catch (err) {
            showToast("Failed to reorder category", "error");
        } finally {
            setLoading(false);
        }
    };

    // Reorder Subcategories
    const handleMoveSubcategory = async (sub, direction) => {
        const index = subcategories.findIndex(s => s._id === sub._id);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= subcategories.length) return;

        const newSubcategories = [...subcategories];
        [newSubcategories[index], newSubcategories[newIndex]] = [newSubcategories[newIndex], newSubcategories[index]];

        const targetSub = newSubcategories[newIndex];
        const adjacentSub = newSubcategories[index];

        try {
            setLoading(true);
            await api.put(`/subcategories/${targetSub._id}`, { order: newIndex });
            await api.put(`/subcategories/${adjacentSub._id}`, { order: index });

            fetchSubcategories(selectedCategory._id);
            showToast("Subcategory reordered");
        } catch (err) {
            showToast("Failed to reorder subcategory", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncToConfig = async () => {
        if (!window.confirm("WARNING: This will OVERWRITE your categories.js file with data from the database. Any manual code organization (like commonFields) will be lost. Proceed?")) return;
        setSyncing(true);
        try {
            await api.post("/categories/sync-to-config");
            showToast("Synced to categories.js file");
        } catch (err) {
            showToast("Sync failed", "error");
        } finally {
            setSyncing(false);
        }
    };

    const getFullImageUrl = (path) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `${API_ORIGIN}${path}`;
    };

    if (loading) return <div className="loading-overlay"><span>Loading Catalog...</span></div>;

    return (
        <div className="cat-workspace">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`toast-notify ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{toast.message}</span>
                    <button onClick={() => setToast({ ...toast, show: false })}><X size={14} /></button>
                </div>
            )}

            <div className="cat-layout">
                {/* Sidebar: Categories */}
                <aside className="cat-sidebar">
                    <div className="sidebar-header">
                        <h2><Layout size={20} /> Catalog</h2>
                        <div className="sync-tools">
                            <button
                                onClick={handleSeedFromConfig}
                                disabled={seeding}
                                className={seeding ? 'loading' : ''}
                                title="Push categories.js to Database"
                            >
                                <Upload size={16} />
                                <span>{seeding ? "Pushing..." : "Push Config"}</span>
                            </button>
                            <button
                                onClick={handleSyncToConfig}
                                disabled={syncing}
                                className={syncing ? 'loading' : ''}
                                title="Pull Database to categories.js (WARNING: Overwrites file!)"
                            >
                                <Save size={16} />
                                <span>{syncing ? "Pulling..." : "Pull to File"}</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleCreateCategory} className="sidebar-add-cat">
                        <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category..." />
                        <button type="submit"><Plus size={18} /></button>
                    </form>

                    <div className="cat-list">
                        {categories.map((cat, idx) => (
                            <div
                                key={cat._id}
                                className={`cat-card ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                                onClick={() => { setSelectedCategory(cat); fetchSubcategories(cat._id); }}
                            >
                                <div className="cat-card-thumb">
                                    {cat.image ? (
                                        <img src={getFullImageUrl(cat.image)} alt={cat.name} />
                                    ) : (
                                        <Layout size={16} color="#94a3b8" />
                                    )}
                                </div>

                                {editingCategory === cat._id ? (
                                    <div className="cat-card-edit" onClick={e => e.stopPropagation()}>
                                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                                        <div className="edit-mini-btns">
                                            <button onClick={() => handleUpdateCategory(cat._id)}><CheckCircle size={14} /></button>
                                            <button onClick={() => setEditingCategory(null)}><X size={14} /></button>
                                            <button onClick={() => fileInputRef.current.click()} className="btn-img-swap">IMG</button>
                                            <input type="file" ref={fileInputRef} onChange={handleEditFile} style={{ display: "none" }} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cat-card-info">
                                        <div className="cat-card-main">
                                            <span className="cat-title">{cat.name}</span>
                                            <div className="cat-reorder">
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveCategory(cat, 'up'); }} disabled={idx === 0} title="Move Up"><ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleMoveCategory(cat, 'down'); }} disabled={idx === categories.length - 1} title="Move Down"><ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} /></button>
                                            </div>
                                        </div>
                                        <div className="cat-ops">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingCategory(cat._id); setEditName(cat.name); }}><Edit2 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete?')) api.delete(`/categories/${cat._id}`).then(() => { fetchCategories(); setSelectedCategory(null); showToast('Category deleted'); }); }} className="del"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="cat-main">
                    {selectedCategory ? (
                        <div className="cat-details">
                            <header className="details-header">
                                <div className="header-breadcrumbs">
                                    <span>Categories</span>
                                    <ChevronRight size={14} />
                                    <span className="current">{selectedCategory.name}</span>
                                </div>
                                <form onSubmit={handleCreateSubcategory} className="add-sub-form">
                                    <input type="text" value={newSubCategoryName} onChange={e => setNewSubCategoryName(e.target.value)} placeholder="Add New Subcategory..." />
                                    <button type="submit">Create Subcategory</button>
                                </form>
                            </header>

                            <div className="subcat-grid">
                                {subcategories.length === 0 ? (
                                    <div className="no-data-msg">
                                        <Info size={32} />
                                        <p>No subcategories found for this category.</p>
                                    </div>
                                ) : subcategories.map((sub, idx) => (
                                    <section key={sub._id} className="subcat-panel">
                                        <div className="panel-head">
                                            {editingSubId === sub._id ? (
                                                <div className="sub-edit-inline">
                                                    <input type="text" value={editSubName} onChange={e => setEditSubName(e.target.value)} autoFocus />
                                                    <button onClick={() => handleUpdateSub(sub._id)}><CheckCircle size={14} /></button>
                                                    <button onClick={() => setEditingSubId(null)}><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <div className="sub-header-title">
                                                    <h3>{sub.name}</h3>
                                                    <div className="sub-reorder">
                                                        <button onClick={() => handleMoveSubcategory(sub, 'up')} disabled={idx === 0} title="Move Up">↑</button>
                                                        <button onClick={() => handleMoveSubcategory(sub, 'down')} disabled={idx === subcategories.length - 1} title="Move Down">↓</button>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="panel-actions">
                                                {editingSubId !== sub._id && <button onClick={() => { setEditingSubId(sub._id); setEditSubName(sub.name); }} title="Rename"><Edit2 size={14} /></button>}
                                                <button onClick={() => { setActiveSubForFields(sub); setIsEditingField(false); setShowFieldModal(true); setNewField({ name: "", label: "", type: "text", options: "", required: false, placeholder: "" }); }} className="btn-add-spec"><Plus size={14} /> Specification</button>
                                                <button onClick={() => { if (window.confirm('Delete?')) api.delete(`/subcategories/${sub._id}`).then(() => { fetchSubcategories(selectedCategory._id); showToast('Subcategory deleted'); }); }} className="btn-del-sub"><Trash2 size={14} /></button>
                                            </div>
                                        </div>

                                        <div className="spec-tokens">
                                            {sub.fields?.length > 0 ? (
                                                sub.fields.map((field, idx) => (
                                                    <div key={field.name} className="spec-field-item">
                                                        <div className="field-info">
                                                            <span className="field-label">{field.label}</span>
                                                            <span className="field-meta">({field.type}{field.required ? ', required' : ''})</span>
                                                            {field.placeholder && <span className="field-placeholder"> - "{field.placeholder}"</span>}
                                                        </div>
                                                        <div className="field-actions">
                                                            <div className="reorder-buttons">
                                                                <button
                                                                    onClick={() => handleMoveField(sub, field.name, 'up')}
                                                                    className="btn-reorder"
                                                                    disabled={idx === 0}
                                                                    title="Move Up"
                                                                >
                                                                    ↑
                                                                </button>
                                                                <button
                                                                    onClick={() => handleMoveField(sub, field.name, 'down')}
                                                                    className="btn-reorder"
                                                                    disabled={idx === sub.fields.length - 1}
                                                                    title="Move Down"
                                                                >
                                                                    ↓
                                                                </button>
                                                            </div>
                                                            <button onClick={() => { setActiveSubForFields(sub); setIsEditingField(true); setFieldIdxToEdit(idx); setNewField({ ...field, options: field.options?.join(', ') || '', placeholder: field.placeholder || '' }); setShowFieldModal(true); }} className="btn-edit-field"><Edit2 size={11} /></button>
                                                            <button onClick={() => handleDeleteField(sub, idx)} className="btn-delete-field"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="spec-empty">No specification fields defined.</span>
                                            )}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="content-placeholder">
                            <Layout size={48} strokeWidth={1} />
                            <h2>Select a Category</h2>
                            <p>Pick a category from the left to start managing its structure.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Specification Modal */}
            {showFieldModal && (
                <div className="modal-backdrop">
                    <div className="modal-window">
                        <header>
                            <h4>{isEditingField ? 'Modify' : 'New'} Specification</h4>
                            <button onClick={() => setShowFieldModal(false)}><X size={20} /></button>
                        </header>
                        <form onSubmit={handleSaveField}>
                            <div className="form-field">
                                <label>Internal Key</label>
                                <input type="text" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} placeholder="e.g. brand_name" required disabled={isEditingField} />
                            </div>
                            <div className="form-field">
                                <label>Display Label</label>
                                <input type="text" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} placeholder="e.g. Brand" required />
                            </div>
                            <div className="form-field">
                                <label>Placeholder Text</label>
                                <input type="text" value={newField.placeholder} onChange={e => setNewField({ ...newField, placeholder: e.target.value })} placeholder="e.g. Enter brand name..." />
                            </div>
                            <div className="form-grid">
                                <div className="form-field">
                                    <label>Field Type</label>
                                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })}>
                                        <option value="text">Standard Text</option>
                                        <option value="textarea">Long Text (Textarea)</option>
                                        <option value="number">Numeric Input</option>
                                        <option value="select">Dropdown Menu</option>
                                        <option value="file">File Upload</option>
                                    </select>
                                </div>
                                <div className="form-field-check">
                                    <label><input type="checkbox" checked={newField.required} onChange={e => setNewField({ ...newField, required: e.target.checked })} /> Required</label>
                                </div>
                            </div>
                            {newField.type === "select" && (
                                <div className="form-field">
                                    <label>Menu Options (comma separated)</label>
                                    <textarea value={newField.options} onChange={e => setNewField({ ...newField, options: e.target.value })} placeholder="e.g. Toyota, Honda, Ford" />
                                </div>
                            )}
                            <footer>
                                <button type="submit" className="btn-save">{isEditingField ? 'Update' : 'Create'} Spec</button>
                                <button type="button" onClick={() => setShowFieldModal(false)} className="btn-cancel">Cancel</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
}
