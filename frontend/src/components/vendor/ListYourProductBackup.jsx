import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import { Upload, Check, Sparkles, X, Plus, MapPin } from "lucide-react";
import { getAllCategories, getSubCategories, getCategoryFields } from "../../config/categories";
import LocationMapModal from "../common/LocationMapModal";

export default function ListYourProduct({ isEmbedded, onCancel, onSuccess, initialData }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    brand: "",
    location: "",
    coordinates: null, // { latitude, longitude, address, area }
    hidePreciseLocation: false,
    category: "",
    subCategory: "",
    thirdCategory: "",
    countInStock: "",
    images: [], // Changed from single image to array
    specifications: {}
  });

  const handleOpenMap = () => {
    setShowMapModal(true);
  };

  const handleLocationSelect = (locationData) => {
    setSelectedCoordinates(locationData);
    setFormData(prev => ({
      ...prev,
      location: locationData.buyerVisibleAddress || locationData.area || locationData.address,
      coordinates: locationData
    }));
  };

  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);

  useEffect(() => {
    if (initialData) {
      // Handle images array or single image fallback
      let initImages = [];
      if (initialData.images && initialData.images.length > 0) {
        initImages = initialData.images;
      } else if (initialData.image) {
        initImages = [initialData.image];
      }

      setFormData({
        name: initialData.name || "",
        price: initialData.price || "",
        description: initialData.description || "",
        brand: initialData.brand || "",
        location: initialData.location || "",
        coordinates: initialData.coordinates || null,
        hidePreciseLocation: initialData.hidePreciseLocation || false,
        category: initialData.category || "",
        subCategory: initialData.subCategory || "",
        thirdCategory: initialData.thirdCategory || "",
        countInStock: initialData.countInStock || initialData.stock || "",
        images: initImages,
        specifications: initialData.specifications || {}
      });

      if (initialData.coordinates) {
        setSelectedCoordinates(initialData.coordinates);
      }

      if (initialData.category) {
        setAvailableSubCategories(getSubCategories(initialData.category));
      }
      if (initialData.category && initialData.subCategory) {
        setDynamicFields(getCategoryFields(initialData.category, initialData.subCategory));
      }
    }
  }, [initialData]);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const categories = getAllCategories();

  // AI Feature
  const handleFillWithAI = async () => {
    // Look at first image
    if (!formData.images || formData.images.length === 0) return;

    setAnalyzing(true);
    setError(null);
    try {
      // Send up to 4 images for analysis
      const imagesToSend = formData.images.slice(0, 4);
      const res = await api.post("/ai/analyze", { imagePaths: imagesToSend });
      const aiData = res.data;

      let newCategory = formData.category;
      let newSubCategory = formData.subCategory;
      let newDynamicFields = dynamicFields;
      let newAvailableSubCategories = availableSubCategories;

      if (aiData.category) {
        const matchedCat = categories.find(c => c.toLowerCase() === aiData.category.toLowerCase());
        if (matchedCat) {
          newCategory = matchedCat;
          newAvailableSubCategories = getSubCategories(newCategory);

          if (aiData.subCategory) {
            const matchedSub = newAvailableSubCategories.find(s => s.toLowerCase() === aiData.subCategory.toLowerCase());
            if (matchedSub) {
              newSubCategory = matchedSub;
              newDynamicFields = getCategoryFields(newCategory, newSubCategory);
            }
          }
        }
      }

      setFormData(prev => {
        // Ensure brand is also in specifications if valid
        const newSpecs = { ...prev.specifications, ...aiData.specifications };
        if (aiData.brand) {
          newSpecs.brand = aiData.brand;
        }

        return {
          ...prev,
          name: aiData.name || prev.name,
          description: aiData.description || prev.description,
          brand: aiData.brand || prev.brand,
          category: newCategory,
          subCategory: newSubCategory,
          specifications: newSpecs
        };
      });

      setAvailableSubCategories(newAvailableSubCategories);
      setDynamicFields(newDynamicFields);

    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError("Could not auto-fill details or AI service unavailable. Please fill manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setAvailableSubCategories(getSubCategories(value));
      setDynamicFields([]);
      setFormData({
        ...formData,
        category: value,
        subCategory: "",
        thirdCategory: "",
        specifications: {}
      });
    } else if (name === "subCategory") {
      setDynamicFields(getCategoryFields(formData.category, value));
      setFormData({
        ...formData,
        subCategory: value,
        specifications: {}
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSpecificationChange = (e) => {
    const { name, value } = e.target;
    if (name === "brand") {
      setFormData(prev => ({
        ...prev,
        brand: value,
        specifications: { ...prev.specifications, [name]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specifications: { ...prev.specifications, [name]: value }
      }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const formDataUpload = new FormData();
    files.forEach(file => {
      formDataUpload.append("images", file);
    });

    setUploading(true);
    try {
      const res = await api.post("/upload", formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Backend returns array of paths
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...res.data]
      }));
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploading(false);
      setError("Image upload failed");
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare payload
    const payload = {
      ...formData,
      // Backend handles images array now
    };

    try {
      if (initialData && initialData._id) {
        await api.put(`/products/${initialData._id}`, payload);
      } else {
        await api.post("/products", payload);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/seller");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save product");
      setLoading(false);
    }
  };

  const containerClass = isEmbedded ? "list-product-page embedded" : "list-product-page full-page";
  const cardClass = isEmbedded ? "seller-form-card embedded" : "seller-form-card";

  return (
    <div className={containerClass}>
      <div className={cardClass}>

        {/* Header */}
        <div className="seller-form-header">
          <h1>
            {initialData ? "Edit Product" : "List Your Product"}
          </h1>
          <p>
            Upload photos and details to start selling.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="seller-form-body">
          {error && (
            <div className="error-message" style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* 1. IMAGE UPLOAD SECTION */}
          <div className="form-section">
            <label className="form-label">Product Photos</label>

            {/* Image Grid */}
            <div className="image-upload-grid">
              {formData.images.map((img, index) => (
                <div key={index} className="image-preview">
                  <img
                    src={img.startsWith('http') ? img : `${img}`}
                    alt={`Product ${index}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="btn-remove-image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Upload Placeholder */}
              <label className="upload-placeholder">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {uploading ? (
                  <span style={{ fontSize: '10px' }}>Uploading...</span>
                ) : (
                  <>
                    <Plus size={24} />
                    <span style={{ fontSize: '10px', marginTop: '4px' }}>Add Photo</span>
                  </>
                )}
              </label>
            </div>

            <p className="helper-text" style={{ fontSize: '12px', color: '#6b7280' }}>
              Add at least 1 photo. The first photo will be your main cover image.
            </p>

            {/* AI Magic Button */}
            {formData.images.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleFillWithAI}
                  disabled={analyzing}
                  className="btn-ai"
                >
                  <Sparkles size={16} />
                  {analyzing ? "Analyzing..." : "Auto-fill details with AI"}
                </button>
                <p style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '6px', marginLeft: '4px' }}>
                  *Tapping this will use the first image to detect product details.
                </p>
              </div>
            )}
          </div>

          {/* 2. BASIC DETAILS */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Details</h3>

            <div className="form-group">
              <label className="form-label">Product Title</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="e.g. iPhone 13 Pro Max - 256GB"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Price (Rs.)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                {!dynamicFields.some(f => f.name === 'brand') && (
                  <>
                    <label className="form-label">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="e.g. Apple"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sub Category</label>
                {availableSubCategories.length > 0 ? (
                  <select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Sub Category</option>
                    {availableSubCategories.map((sc) => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. Smartphones"
                  />
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Count In Stock</label>
                <input
                  type="number"
                  name="countInStock"
                  value={formData.countInStock}
                  onChange={handleChange}
                  required
                  min="0"
                  className="form-input"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* 3. DYNAMIC FIELDS (Specifics) */}
          {dynamicFields.length > 0 && (
            <div className="form-section" style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h3 className="form-section-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '20px' }}>
                {formData.subCategory} Specifications
              </h3>
              <div className="form-row">
                {dynamicFields.map((field) => (
                  <div key={field.name} className="form-group">
                    <label className="form-label">
                      {field.label}
                      {field.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData.specifications[field.name] || ""}
                        onChange={handleSpecificationChange}
                        className="form-select"
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData.specifications[field.name] || ""}
                        onChange={handleSpecificationChange}
                        placeholder={field.placeholder || ""}
                        className="form-input"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DESCRIPTION & LOCATION */}
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="5"
                className="form-textarea"
                placeholder="Write a detailed description of your product..."
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="location-input-wrapper">
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Kathmandu, Nepal"
                  readOnly={!!selectedCoordinates}
                  style={{
                    backgroundColor: selectedCoordinates ? '#f0f9ff' : 'white',
                    cursor: selectedCoordinates ? 'default' : 'text'
                  }}
                />
                <button
                  type="button"
                  className="map-toggle-button"
                  onClick={handleOpenMap}
                  title={selectedCoordinates ? "Change location" : "Select location on map"}
                >
                  <div className="map-toggle-slider">
                    <MapPin size={16} />
                  </div>
                </button>
              </div>
              {selectedCoordinates && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <MapPin size={12} />
                  Location set via map (coordinates saved)
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="live-location-toggle">
                <div className="toggle-content">
                  <span className="toggle-label">Location Radius</span>
                  <span className="toggle-description">Hide my precise location</span>
                </div>
                <button
                  type="button"
                  className={`toggle-button ${formData.hidePreciseLocation ? 'enabled' : 'disabled'}`}
                  onClick={() => setFormData(prev => ({ ...prev, hidePreciseLocation: !prev.hidePreciseLocation }))}
                >
                  <div className="toggle-slider"></div>
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="btn-primary"
            >
              {loading ? "Saving..." : (initialData ? "Update Product" : "List Product")}
            </button>
          </div>
        </form>
      </div>

      <LocationMapModal
        isOpen={showMapModal}
        onClose={() => setShowMapModal(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedCoordinates}
      />
    </div>
  );
}
