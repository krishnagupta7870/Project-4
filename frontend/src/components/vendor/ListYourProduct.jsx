import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus, X, MapPin, Sparkles, ChevronRight, ChevronLeft,
  Check, Image as ImageIcon, FileText, DollarSign, Eye, Star
} from "lucide-react";
import LocationMapModal from "../common/LocationMapModal";
import axios from "axios";
import api, { API_ORIGIN } from "../../utils/api";
import PaymentModal from "./PaymentModal";
import "./ListYourProduct.css";

const ListYourProduct = ({ initialData, isEmbedded = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const editId = params.get("editId");

  // Steps: 1=Photos, 2=Details, 3=Price/Stock/Location, 4=Preview
  const [currentStep, setCurrentStep] = useState(1);
  const [loadedInitialData, setLoadedInitialData] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    priceNegotiable: false, // New field
    description: "",
    brand: "",
    category: "",
    subCategory: "",
    thirdCategory: "",
    stock: "1", // Default 1
    location: "",
    coordinates: null,
    hidePreciseLocation: true, // Default true
    images: [],
    specifications: {},
  });

  // Dynamic category state
  const [categoryStructure, setCategoryStructure] = useState({});
  const [categories, setCategories] = useState([]);
  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  // Store the active AI analysis promise
  const aiPromiseRef = React.useRef(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2500);
      return () => clearTimeout(t);
    }
  }, [toast.show]);
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const effectiveInitialData = initialData || loadedInitialData;

  // --- Effects ---

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/api/categories/full");
        setCategoryStructure(data);
        setCategories(Object.keys(data));
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories. Please refresh the page.");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const pidx = params.get("pidx");
    if (pidx) {
      const savedData = localStorage.getItem("tempProductFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        verifyAndSubmit(pidx, parsedData);
      }
    }
  }, [location.search]);

  useEffect(() => {
    const loadForEdit = async () => {
      if (!editId || initialData) return;
      try {
        const { data } = await api.get(`/products/${editId}`);
        setLoadedInitialData(data);
      } catch (err) {
        console.error("Failed to load product for edit", err);
        setLoadedInitialData(null);
      }
    };
    loadForEdit();
  }, [editId, initialData]);

  useEffect(() => {
    if (!effectiveInitialData) return;

    let initImages = [];
    if (Array.isArray(effectiveInitialData.images) && effectiveInitialData.images.length > 0) {
      initImages = effectiveInitialData.images;
    } else if (effectiveInitialData.image) {
      initImages = [effectiveInitialData.image];
    }

    const initCoords = (() => {
      const c = effectiveInitialData.coordinates;
      if (!c) return null;
      if (Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
        const [lng, lat] = c.coordinates;
        return {
          latitude: lat,
          longitude: lng,
          address: c.address || "",
          area: c.area || "",
        };
      }
      if (c.latitude !== undefined && c.longitude !== undefined) {
        return c;
      }
      return null;
    })();

    const nextCategory = effectiveInitialData.category || "";
    const nextSubCategory = effectiveInitialData.subCategory || "";

    setFormData((prev) => ({
      ...prev,
      name: effectiveInitialData.name || "",
      price: effectiveInitialData.price?.toString() || "",
      priceNegotiable: effectiveInitialData.priceNegotiable || false,
      description: effectiveInitialData.description || "",
      brand: effectiveInitialData.brand || "",
      category: nextCategory,
      subCategory: nextSubCategory,
      thirdCategory: effectiveInitialData.thirdCategory || "",
      stock: (effectiveInitialData.stock ?? effectiveInitialData.countInStock ?? "1").toString(),
      location: effectiveInitialData.location || "",
      coordinates: initCoords,
      // If editing, use existing val, else default true
      hidePreciseLocation: effectiveInitialData.hidePreciseLocation !== undefined
        ? Boolean(effectiveInitialData.hidePreciseLocation)
        : true,
      images: initImages,
      specifications:
        effectiveInitialData.specifications && typeof effectiveInitialData.specifications === "object"
          ? effectiveInitialData.specifications
          : {},
    }));

    if (nextCategory && categoryStructure[nextCategory]) {
      const subs = (categoryStructure[nextCategory].subCategories || []).map(s => s.name);
      setAvailableSubCategories(subs);
      const subObj = (categoryStructure[nextCategory].subCategories || []).find(s => s.name === nextSubCategory);
      if (subObj) {
        setDynamicFields(subObj.fields || []);
      } else {
        setDynamicFields([]);
      }
    } else {
      setAvailableSubCategories([]);
      setDynamicFields([]);
    }
  }, [effectiveInitialData, categoryStructure]);

  // --- Handlers ---

  const verifyAndSubmit = async (pidx, restoredFormData) => {
    try {
      setLoading(true);
      const { data } = await api.post("/api/payment/verify-khalti", { pidx });
      if (data.success) {
        await submitProduct(data.paymentDetails, restoredFormData);
        showToast("Product listed successfully");
        localStorage.removeItem("tempProductFormData");
      } else {
        setError("Payment verification failed: " + data.message);
      }
    } catch (err) {
      console.error(err);
      setError("Payment verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "category") {
      const subs = (categoryStructure[value]?.subCategories || []).map(s => s.name);
      setAvailableSubCategories(subs);
      setDynamicFields([]);
      setFormData((prev) => ({
        ...prev,
        category: value,
        subCategory: "",
        thirdCategory: "",
        specifications: {},
      }));
      return;
    }

    if (name === "subCategory") {
      const fields = (categoryStructure[formData.category]?.subCategories || []).find(s => s.name === value)?.fields || [];
      setDynamicFields(fields);
      setFormData((prev) => ({
        ...prev,
        subCategory: value,
        thirdCategory: "",
        specifications: {},
      }));
      return;
    }

    // Stock validation check (min 1) - actually just allow typing, validate on blur or submit
    // But user asked for "cannot be less than 1". 
    // We'll enforce it on blur or just let type behave naturally but validate step.

    const finalValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSpecificationChange = (e) => {
    const { name, value } = e.target;
    if (name === "brand") {
      setFormData((prev) => ({
        ...prev,
        brand: value,
        specifications: { ...prev.specifications, [name]: value },
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [name]: value },
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setError("");
    setUploading(true);
    try {
      const uploadData = new FormData();
      files.forEach((file) => uploadData.append("images", file));
      const res = await axios.post("/api/upload", uploadData);

      const urls = Array.isArray(res.data) ? res.data : [];
      const newImages = [...formData.images, ...urls];

      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));

      // Trigger background AI analysis immediately
      triggerBackgroundAnalysis(newImages);

      if (e?.target) e.target.value = "";
    } catch (err) {
      console.error("Upload failed", err);
      setError("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const triggerBackgroundAnalysis = (images) => {
    if (images.length === 0) return;
    const token = localStorage.getItem("token");
    const imagePaths = images
      .map((img) => {
        if (typeof img !== "string") return null;
        // Optimization: For local files, strip domain to read from disk (faster)
        // For Cloudinary/Remote, keep full URL so backend can download it
        if (img.startsWith("http") && !img.includes("cloudinary")) {
          try { return new URL(img).pathname; } catch { return img; }
        }
        return img;
      })
      .filter(Boolean)
      .slice(0, 4);

    if (imagePaths.length === 0) return;

    // Start analysis and store promise
    console.log("Starting background AI analysis...");
    aiPromiseRef.current = axios.post(
      "/api/ai/analyze",
      { imagePaths },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(res => res.data).catch(err => {
      console.error("Background analysis error (silent):", err);
      return null;
    });
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleLocationSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      location: locationData.buyerVisibleAddress || locationData.area || locationData.address || "",
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        area: locationData.area,
      },
    }));
    setShowLocationModal(false);
  };

  const handleFillWithAI = async () => {
    if (formData.images.length === 0) {
      setError("Please upload at least one image first.");
      return;
    }
    setAnalyzing(true);
    try {
      let aiData = null;

      // Check if we have a pending or completed promise
      if (aiPromiseRef.current) {
        console.log("Using background analysis result...");
        aiData = await aiPromiseRef.current;
      }

      // If no background task or it failed/returned null, run it now
      if (!aiData) {
        console.log("Background analysis not validation/found, running explicitly...");
        const token = localStorage.getItem("token");
        const imagePaths = (formData.images || [])
          .map((img) => {
            if (typeof img !== "string") return null;
            if (img.startsWith("http") && !img.includes("cloudinary")) {
              try { return new URL(img).pathname; } catch { return img; }
            }
            return img;
          })
          .filter(Boolean)
          .slice(0, 4);

        const res = await axios.post(
          "/api/ai/analyze",
          { imagePaths },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        aiData = res.data;
      }

      aiData = aiData || {};

      let newCategory = formData.category;
      let newSubCategory = formData.subCategory;
      let newDynamicFields = dynamicFields;
      let newAvailableSubCategories = availableSubCategories;

      if (aiData.category) {
        const matchedCat = categories.find(
          (c) => c.toLowerCase() === String(aiData.category).toLowerCase()
        );
        if (matchedCat && categoryStructure[matchedCat]) {
          newCategory = matchedCat;
          // FIX: subCategories is an array of objects, not an object
          const subCatArray = categoryStructure[matchedCat].subCategories || [];
          newAvailableSubCategories = subCatArray.map(s => s.name);

          if (aiData.subCategory) {
            const foundSubObj = subCatArray.find(
              (s) => s.name.toLowerCase() === String(aiData.subCategory).toLowerCase()
            );
            if (foundSubObj) {
              newSubCategory = foundSubObj.name;
              newDynamicFields = foundSubObj.fields || [];
            }
          }
        }
      }

      setFormData((prev) => {
        const newSpecs = {
          ...(prev.specifications || {}),
          ...(aiData.specifications || {}),
        };
        if (aiData.brand) newSpecs.brand = aiData.brand;

        return {
          ...prev,
          name: aiData.name || prev.name,
          description: aiData.description || prev.description,
          // Do not set top-level brand if it's going into specs (user pref)
          // But we keep it in state just in case. 
          // However, we rely on dynamicFields to hide the manual input.
          brand: aiData.brand || prev.brand,
          category: newCategory,
          subCategory: newSubCategory,
          thirdCategory: "",
          specifications: newSpecs,
        };
      });

      setAvailableSubCategories(newAvailableSubCategories);
      setDynamicFields(newDynamicFields);
    } catch (err) {
      console.error("AI analysis failed", err);
      setError("Failed to analyze with AI");
    } finally {
      setAnalyzing(false);
    }
  };

  const submitProduct = async (paymentDetails = null, formDataOverride = null) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = effectiveInitialData
        ? `/api/products/${effectiveInitialData._id}`
        : "/api/products";
      const method = effectiveInitialData ? "put" : "post";

      const dataToSubmit = formDataOverride ? { ...formDataOverride } : { ...formData };

      // Ensure stock is integer
      const stockVal = dataToSubmit.stock || dataToSubmit.countInStock || "0";
      dataToSubmit.countInStock = parseInt(stockVal, 10);
      dataToSubmit.stock = parseInt(stockVal, 10);

      if (paymentDetails) {
        dataToSubmit.payment = paymentDetails;
      }

      const res = await axios({
        method,
        url,
        data: dataToSubmit,
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Product submitted successfully:", res.data);
      showToast("Product listed successfully");
      setTimeout(() => {
        if (isEmbedded) {
          window.location.reload();
        } else {
          navigate("/seller");
        }
      }, 1200);
    } catch (err) {
      console.error("Product submission failed:", err);
      setError(err.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (effectiveInitialData) {
      submitProduct();
    } else {
      localStorage.setItem("tempProductFormData", JSON.stringify(formData));
      setShowPaymentModal(true);
    }
  };

  // --- Wizard Navigation Helpers ---

  const nextStep = () => {
    // Validation per step
    if (currentStep === 1) {
      if (formData.images.length === 0) {
        setError("Please upload at least one photo.");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.name || !formData.category) {
        setError("Name and Category are required.");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.price) {
        setError("Price is required.");
        return;
      }
      if (parseInt(formData.stock) < 1) {
        setError("Stock must be at least 1.");
        return;
      }
    }
    setError("");
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  // --- Render Steps ---

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: "Photos", icon: ImageIcon },
      { num: 2, label: "Details", icon: FileText },
      { num: 3, label: "Specs", icon: MapPin },
      { num: 4, label: "Preview", icon: Eye },
    ];

    return (
      <div className="wizard-progress">
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        {steps.map((s) => {
          const Icon = s.icon;
          let statusClass = "";
          if (s.num < currentStep) statusClass = "completed";
          if (s.num === currentStep) statusClass = "active";

          return (
            <div key={s.num} className={`progress-step ${statusClass}`}>
              <div className="step-circle">
                {s.num < currentStep ? <Check size={20} /> : <Icon size={20} />}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSetCover = (index) => {
    if (index === 0) return;
    setFormData((prev) => {
      const newImages = [...prev.images];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected);
      return { ...prev, images: newImages };
    });
  };

  const handleMoveImage = (index, direction) => {
    setFormData((prev) => {
      const newImages = [...prev.images];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= newImages.length) return prev;

      [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
      return { ...prev, images: newImages };
    });
  };

  const renderPhase1 = () => (
    <div className="phase-content fade-in">
      <div className="phase-title">
        <div className="phase-icon"><ImageIcon size={24} /></div>
        <span>Upload Photos</span>
      </div>

      <div className="form-group">
        <label className="upload-area">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
          />
          {uploading ? (
            <p>Uploading...</p>
          ) : (
            <>
              <div style={{ marginBottom: '16px', color: '#64748b' }}>
                <Plus size={48} style={{ margin: '0 auto' }} />
              </div>
              <p style={{ fontWeight: 500, fontSize: '1.1rem' }}>Click to upload photos</p>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>or drag and drop</p>
            </>
          )}
        </label>

        <div className="uploaded-grid">
          {formData.images.map((img, index) => (
            <div key={index} className={`image-card ${index === 0 ? 'cover-image' : ''}`}>
              <img
                src={img.startsWith('http') ? img : `${API_ORIGIN}${img}`}
                alt={`Product ${index}`}
              />
              {index === 0 && <div className="cover-badge">Cover</div>}

              <div className="image-overlay">
                <div className="image-actions-row">
                  {/* Move Left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, -1)}
                      title="Move Left"
                      className="action-btn-left"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  {/* Set Cover */}
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(index)}
                      title="Set as Cover"
                      className="action-btn-center"
                    >
                      <Star size={16} />
                    </button>
                  )}

                  {/* Move Right */}
                  {index < formData.images.length - 1 && (
                    <button
                      type="button"
                      onClick={() => handleMoveImage(index, 1)}
                      title="Move Right"
                      className="action-btn-right"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                <div className="image-delete-row">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-btn-large"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {formData.images.length > 0 && (
          <p className="helper-text" style={{ textAlign: 'center', marginTop: '16px' }}>
            First 4 photos will be analyzed.
          </p>
        )}
      </div>
    </div>
  );

  const renderPhase2 = () => (
    <div className="phase-content fade-in">
      <button
        type="button"
        onClick={handleFillWithAI}
        disabled={analyzing}
        className="ai-button"
      >
        <Sparkles size={20} />
        {analyzing ? "Analyzing images..." : "Auto-fill with AI"}
      </button>

      <div className="phase-title">
        <div className="phase-icon"><FileText size={24} /></div>
        <span>Product Details</span>
      </div>

      <div className="form-grid">
        <div className="form-group full-width">
          <label className="form-label">Product Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. iPhone 13 Pro Max"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Sub Category</label>
          {availableSubCategories.length > 0 ? (
            <select
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              className="form-select"
              disabled={!formData.category}
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
              placeholder="Sub Category"
              className="form-input"
              disabled={!formData.category}
            />
          )}
        </div>

        {/* Dynamic Specs */}
        {dynamicFields.map((field) => (
          <div key={field.name} className="form-group">
            <label className="form-label">
              {field.label} {field.required && <span style={{ color: 'red' }}>*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                name={field.name}
                value={formData.specifications[field.name] || ''}
                onChange={handleSpecificationChange}
                className="form-select"
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                name={field.name}
                value={formData.specifications[field.name] || ''}
                onChange={handleSpecificationChange}
                placeholder={field.label}
                className="form-input"
              />
            )}
          </div>
        ))}

        {/* Brand Manual Fallback if not in dynamic fields */}
        {!dynamicFields.some((f) => f.name === "brand") && (
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              placeholder="Brand Name"
              className="form-input"
            />
          </div>
        )}

        <div className="form-group full-width">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your product in detail..."
            rows="4"
            className="form-textarea"
          />
        </div>
      </div>
    </div>
  );

  const renderPhase3 = () => (
    <div className="phase-content fade-in">
      <div className="phase-title">
        <div className="phase-icon"><DollarSign size={24} /></div>
        <span>Price, Stock & Location</span>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Price *</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }}>Rs.</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className="form-input"
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div className="toggle-wrapper" style={{ marginTop: '12px', padding: '8px 12px' }}>
            <span className="toggle-label" style={{ fontSize: '0.9rem' }}>Negotiable</span>
            <div
              className={`toggle-switch ${formData.priceNegotiable ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, priceNegotiable: !prev.priceNegotiable }))}
            >
              <div className="toggle-handle" />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Stock Quantity (Min 1)</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="1"
            className="form-input"
          />
        </div>

        <div className="form-group full-width">
          <label className="form-label">Location</label>
          <div className="location-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              name="location"
              value={formData.location}
              readOnly
              className="form-input"
              placeholder="Click map icon to select location"
              onClick={() => setShowLocationModal(true)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="btn-secondary"
              style={{ padding: '0 12px' }}
            >
              <MapPin size={20} />
            </button>
          </div>

          <div className="toggle-wrapper">
            <div className="toggle-info">
              <h4>Hide precise location</h4>
              <p>Show only approximate area to buyers</p>
            </div>
            <div
              className={`toggle-switch ${formData.hidePreciseLocation ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, hidePreciseLocation: !prev.hidePreciseLocation }))}
            >
              <div className="toggle-handle" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPhase4 = () => (
    <div className="phase-content fade-in">
      <div className="phase-title">
        <div className="phase-icon"><Eye size={24} /></div>
        <span>Preview</span>
      </div>

      <div className="preview-card">
        <div className="preview-image">
          {formData.images.length > 0 ? (
            <img
              src={formData.images[0].startsWith('http') ? formData.images[0] : `${API_ORIGIN}${formData.images[0]}`}
              alt="Preview"
            />
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
              <ImageIcon size={48} />
            </div>
          )}
        </div>
        <div className="preview-details">
          <div className="preview-header">
            <h3 className="preview-title">{formData.name || "Product Name"}</h3>
            <span className="preview-price">Rs. {formData.price || "0"}</span>
          </div>
          <div className="preview-meta">
            <span>{formData.brand || "Brand"}</span>
            <span>•</span>
            <span>{formData.subCategory || formData.category || "Category"}</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '12px' }}>
            {formData.location || "Location not set"}
            {formData.hidePreciseLocation && " (Approx)"}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {formData.priceNegotiable && (
              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '4px' }}>
                Negotiable
              </span>
            )}
            <span style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>
              Stock: {formData.stock}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderPhase1();
      case 2: return renderPhase2();
      case 3: return renderPhase3();
      case 4: return renderPhase4();
      default: return null;
    }
  };

  const containerClass = isEmbedded ? "list-product-page embedded" : "list-product-page";

  return (
    <div className={containerClass}>
      <div className="wizard-container">

        <div className="wizard-header">
          <h1>{initialData ? "Edit Product" : "List Your Product"}</h1>
          <p>Follow the steps to post your ad</p>
        </div>

        {renderStepIndicator()}

        {error && (
          <div className="error-message" style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="wizard-card">
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {renderCurrentStep()}

            <div className="wizard-actions">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="btn btn-secondary">
                  <ChevronLeft size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                  Back
                </button>
              )}

              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} className="btn btn-primary">
                  Next
                  <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
                </button>
              ) : (
                <button type="button" onClick={handleFinalSubmit} className="btn btn-primary">
                  {uploading ? "Uploading..." : (initialData ? "Update Product" : "List Product")}
                </button>
              )}
            </div>

          </form>
        </div>
      </div>

      <LocationMapModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={formData.coordinates}
      />

      {showPaymentModal && (
        <PaymentModal
          productPrice={formData.price}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(details) => {
            setShowPaymentModal(false);
            submitProduct(details);
          }}
        />
      )}
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: toast.type === "success" ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontWeight: 600
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ListYourProduct;
