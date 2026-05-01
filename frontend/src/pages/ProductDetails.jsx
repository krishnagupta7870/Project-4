import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../utils/api";
import "../styles/productDetails.css";
import "../styles/home.css";
import { Heart, MessageCircle, Share2, Flag, X, Star, CheckCircle, AlertCircle, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import ProductReviews from "../components/products/ProductReviews";
import LocationMap from "../components/common/LocationMap";
import Breadcrumbs from "../components/common/Breadcrumbs";
import { getDrivingRoute } from "../utils/routingService";
import { fetchSimilarProducts } from "../utils/recommendations";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [user, setUser] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [sellerData, setSellerData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [showDirections, setShowDirections] = useState(false);
  const similarRef = useRef(null);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Get logged-in user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
        setLikesCount(data.likes?.length || 0);

        // Check if current user has liked this product
        if (user && data.likes) {
          setIsLiked(data.likes.includes(user._id));
        }

        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0]);
        } else if (data.image) {
          setActiveImage(data.image);
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, user]);

  useEffect(() => {
    if (!product) return;

    const viewTimeout = setTimeout(async () => {
      try {
        await api.put(`/products/${id}/view`);
      } catch (err) {
        console.error("Failed to track view", err);
      }
    }, 3000);

    return () => clearTimeout(viewTimeout);
  }, [product, id]);

  useEffect(() => {
    if (!product || !user) return;
    api.post("/api/activity/track-click", { productId: id }).catch(() => { });
  }, [product, id, user]);

  useEffect(() => {
    if (!product) return;
    const startTime = Date.now();
    return () => {
      const durationMs = Date.now() - startTime;
      if (durationMs <= 0) return;
      api
        .post("/activity/product-view", {
          productId: id,
          durationMs
        })
        .catch(() => { });
    };
  }, [product, id]);

  // Fetch seller profile data
  useEffect(() => {
    if (!product || !product.seller) return;

    const fetchSellerData = async () => {
      try {
        const sellerId = product.seller?._id || product.seller?.id;
        if (!sellerId) return;
        const { data } = await api.get(`/users/${sellerId}/profile`);
        setSellerData(data);
      } catch (err) {
        console.error("Failed to fetch seller data", err);
      }
    };

    fetchSellerData();
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const fetchSimilar = async () => {
      try {
        const items = await fetchSimilarProducts(product._id);
        if (items && items.length > 0) {
          setSimilarProducts(items.slice(0, 10));
          return;
        }
      } catch (err) {
        console.error("Failed to fetch hybrid similar products", err);
      }

      try {
        const { data } = await api.get("/api/products");
        const currentCat = typeof product.category === "object" ? product.category?.name : product.category;
        const similar = data
          .filter((p) => {
            if (p._id === product._id) return false;
            const s = String(p.status || "").toLowerCase();
            if (s === "sold" || s === "expired") return false;
            const pCat = typeof p.category === "object" ? p.category?.name : p.category;
            return pCat === currentCat;
          })
          .slice(0, 10);
        setSimilarProducts(similar);
      } catch (err) {
        console.error("Failed to fetch fallback similar products", err);
      }
    };

    fetchSimilar();
  }, [product]);

  // Calculate route when user location is available
  useEffect(() => {
    if (userLocation && product) {
      const calculateRoute = async () => {
        let productLat, productLng;

        // Handle different coordinate structures
        if (product.coordinates && product.coordinates.coordinates) {
          productLng = product.coordinates.coordinates[0];
          productLat = product.coordinates.coordinates[1];
        } else if (product.location && product.location.coordinates) {
          productLng = product.location.coordinates[0];
          productLat = product.location.coordinates[1];
        } else {
          return;
        }

        if (productLat && productLng) {
          try {
            const route = await getDrivingRoute(
              userLocation.lat,
              userLocation.lng,
              productLat,
              productLng
            );

            if (route) {
              setRouteInfo(route);
            }
          } catch (err) {
            console.error("Error calculating route:", err);
          }
        }
      };

      calculateRoute();
    }
  }, [userLocation, product]);

  if (loading) return <div className="container py-4">Loading...</div>;

  if (!product) return <div className="container py-4">Product not found</div>;

  const imageUrl = (src) => {
    if (!src) return "https://via.placeholder.com/600x400?text=No+Image";
    return src.startsWith("/") ? `${API_ORIGIN}${src}` : src;
  };

  const images = product.images?.length > 0 ? product.images : [product.image];
  const stockCount = parseInt(product.stock ?? product.countInStock ?? 0, 10) || 0;
  const coordinatesArray = product.coordinates?.coordinates;
  const initialMapPosition = Array.isArray(coordinatesArray) && coordinatesArray.length === 2
    ? [coordinatesArray[1], coordinatesArray[0]]
    : null;
  const rawCondition = (product.specifications && product.specifications.condition) || product.condition || "";
  const conditionLabel = typeof rawCondition === "string" ? rawCondition.trim() : "";

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const scrollSimilar = (dir) => {
    if (similarRef.current) {
      const scrollAmt = 252;
      similarRef.current.scrollBy({ left: dir === "left" ? -scrollAmt : scrollAmt, behavior: "smooth" });
    }
  };

  const getSellerInitial = (name) => {
    return (name || "S").charAt(0).toUpperCase();
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const handleLike = async () => {
    if (!user) {
      showToast("Please login to save products", "error");
      return;
    }

    try {
      const { data } = await api.put(`/products/${id}/like`);
      setIsLiked(data.liked);
      setLikesCount(data.likes);
    } catch (err) {
      console.error("Failed to like product", err);
      if (err.response?.status === 401) {
        showToast("Please login to save products", "error");
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on DealMate!`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!");
      } catch (err) {
        console.error("Failed to copy:", err);
        showToast("Failed to copy link", "error");
      }
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please login to report.", "error");
      return;
    }
    setSubmittingReport(true);
    try {
      const sellerId = product.seller?._id || product.seller?.id;
      await api.post("/api/reports", {
        targetId: sellerId,
        reportType: "user",
        reason: reportReason,
        description: reportDescription
      });
      showToast("Report submitted successfully. We will review it shortly.");
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit report", "error");
    } finally {
      setSubmittingReport(false);
    }
  };
  const getUserLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        console.log('User location:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location access.');
        setLoadingLocation(false);
        console.error('Location error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="product-details-container">
      <Breadcrumbs
        category={typeof product?.category === 'object' ? product?.category?.name : product?.category}
        subCategory={product?.subCategory}
        brand={product?.brand}
        productName={product?.name}
      />
      {toast.show && (
        <div className={`toast-notify ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))}>
            <X size={14} />
          </button>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '90%', maxWidth: '500px', position: 'relative'
          }}>
            <button
              onClick={() => setShowReportModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#666" />
            </button>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: '600' }}>Report User</h3>
            <form onSubmit={handleReportSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Fraud">Fraud / Scam</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Fake Profile">Fake Profile</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px' }}
                  placeholder="Please provide more details..."
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', background: '#ef4444', border: 'none', borderRadius: '8px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                disabled={submittingReport}
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="pd-main-layout">
        {/* Left Column */}
        <div className="pd-left-col">
          <div className="pd-image-gallery">
            <div className="pd-main-image-wrapper">
              <img
                src={imageUrl(activeImage)}
                alt={product.name}
                className="pd-main-image"
              />
              <div className="pd-price-tag">Rs. {product.price?.toLocaleString()}</div>
            </div>
            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={imageUrl(img)}
                    alt={`Thumbnail ${idx}`}
                    className={`pd-thumb ${activeImage === img ? "active" : ""}`}
                    onClick={() => setActiveImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="pd-meta-row">
            <span>{product.views || 0} Views</span>
            {conditionLabel && (
              <span className="pd-condition-badge">{conditionLabel}</span>
            )}
            {stockCount > 1 && (
              <span className="pd-condition-badge">
                {stockCount} in stock
              </span>
            )}
          </div>

          <div className="pd-seller-card">
            <div
              className="pd-seller-link"
              onClick={() => navigate(`/seller/${product.seller?._id || product.seller?.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', flex: 1 }}
            >
              <div
                className="pd-seller-avatar"
                style={{
                  backgroundColor: "#4aa3a1",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "bold",
                  flexShrink: 0
                }}
              >
                {getSellerInitial(product.seller?.name)}
              </div>
              <div className="pd-seller-info">
                <h4>{product.seller?.name || "Seller"}</h4>
                <div className="pd-seller-stats">
                  {product.seller?.email}
                  <span className="pd-bullet">•</span>
                  {sellerData?.stats?.products || 0} Ads
                </div>

                <div style={{ marginTop: '8px' }}>
                  {sellerData?.user?.trustScore !== undefined ? (
                    (() => {
                      const score = sellerData.user.trustScore;
                      let tier = { label: "Untrusted Seller", color: "#EF4444", textColor: "white", icon: "⚠️" };

                      if (score >= 85) tier = { label: "Trusted Seller", color: "#10B981", textColor: "white", icon: "🛡️" };
                      else if (score >= 70) tier = { label: "Reliable Seller", color: "#3B82F6", textColor: "white", icon: "🔹" };
                      else if (score >= 50) tier = { label: "Average Seller", color: "#F59E0B", textColor: "black", icon: "⚖️" }; // Black text for yellow
                      else if (score >= 30) tier = { label: "Low Trust", color: "#F97316", textColor: "white", icon: "🚩" };

                      return (
                        <div className="pd-trust-row">
                          <div
                            className="pd-trust-badge"
                            style={{ color: tier.color, borderColor: tier.color }}
                            title={`Trust score: ${score}/100`}
                          >
                            <span className="pd-icon">
                              <Star size={14} fill={tier.color} strokeWidth={0} />
                            </span>
                            <span className="pd-score">{score}</span>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div
                      className="pd-trust-badge"
                      style={{ color: '#64748b', borderColor: '#cbd5e1' }}
                      title="New Seller (Less than 15 days or no reviews)"
                    >
                      <span className="pd-score" style={{ fontSize: '0.8rem' }}>🌱 New Seller</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "10px", alignItems: "center" }}>
              <Share2 size={20} style={{ cursor: "pointer", color: "#666" }} onClick={handleShare} />
              <div
                title="Report User"
                onClick={() => setShowReportModal(true)}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#ef4444"
                }}
              >
                <Flag size={20} />
                <span style={{ fontSize: "0.85rem", fontWeight: "500" }}>Report</span>
              </div>
            </div>
          </div>

          <div className="pd-actions">
            <button
              className="pd-btn pd-btn-save"
              onClick={handleLike}
              style={{
                backgroundColor: isLiked ? '#ef4444' : 'transparent',
                color: isLiked ? '#fff' : '#666',
                border: isLiked ? 'none' : '1px solid #ddd'
              }}
            >
              <Heart size={18} fill={isLiked ? '#fff' : 'none'} />
              {isLiked ? 'Saved' : 'Save'} {likesCount > 0 && `(${likesCount})`}
            </button>
            <button
              className="pd-btn pd-btn-chat"
              onClick={async () => {
                if (!user) {
                  showToast("Please login to chat with the seller", "error");
                  return;
                }
                try {
                  const sellerId = product.seller?._id || product.seller?.id;
                  if (!sellerId) return;
                  const res = await api.post(`/chat/conversations`, {
                    participantId: sellerId,
                    product: product._id,
                    title: product.name || ""
                  });
                  const convoId = res.data?._id;
                  if (convoId) navigate(`/chat/${convoId}`);
                } catch { }
              }}
            >
              <MessageCircle size={18} /> Chat Now
            </button>
          </div>

          <div className="pd-safety-note">
            Note: We recommend you to physically inspect the product/Service before making payment. Avoid paying fees or advance payment to sellers.
          </div>
        </div>

        {/* Right Column */}
        <div className="pd-right-col">
          <h1 className="pd-title">{product.name}</h1>

          <div className="pd-tabs">
            <div
              className={`pd-tab ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </div>
            <div
              className={`pd-tab ${activeTab === "comments" ? "active" : ""}`}
              onClick={() => setActiveTab("comments")}
            >
              Reviews
            </div>
            <div
              className={`pd-tab ${activeTab === "location" ? "active" : ""}`}
              onClick={() => setActiveTab("location")}
            >
              Location
            </div>
          </div>

          {activeTab === "description" && (
            <>
              <div className="pd-description">
                {isExpanded
                  ? product.description
                  : `${product.description?.substring(0, 150)}...`}
                {product.description?.length > 150 && (
                  <div
                    className="pd-show-more"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? "SHOW LESS" : "SHOW MORE"}
                  </div>
                )}
              </div>

              <h3 className="pd-section-title">General</h3>
              <div className="pd-table">
                <div className="pd-table-row">
                  <div className="pd-table-label">AD ID</div>
                  <div className="pd-table-value">{product._id.substring(product._id.length - 8).toUpperCase()}</div>
                </div>
                <div className="pd-table-row">
                  <div className="pd-table-label">Location</div>
                  <div className="pd-table-value">{product.location || "N/A"}</div>
                </div>
                <div className="pd-table-row">
                  <div className="pd-table-label">Category</div>
                  <div className="pd-table-value">{product.category || "N/A"}</div>
                </div>
                <div className="pd-table-row">
                  <div className="pd-table-label">Brand</div>
                  <div className="pd-table-value">{product.brand || "N/A"}</div>
                </div>
                <div className="pd-table-row">
                  <div className="pd-table-label">Ads Posted</div>
                  <div className="pd-table-value">{formatDate(product.createdAt)}</div>
                </div>
              </div>

              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <>
                  <h3 className="pd-section-title">Specifications</h3>
                  <div className="pd-table">
                    {Object.entries(product.specifications)
                      .filter(([_, value]) => {
                        if (value === null || value === undefined) return false;
                        if (typeof value === "string" && value.trim() === "") return false;
                        return true;
                      })
                      .map(([key, value]) => (
                        <div className="pd-table-row" key={key}>
                          <div className="pd-table-label">{key}</div>
                          <div className="pd-table-value">{value}</div>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === "comments" && (
            <div className="pd-reviews-tab">
              <ProductReviews productId={product._id} />
            </div>
          )}

          {activeTab === "location" && (
            <div className="pd-location-tab">
              <LocationMap
                onLocationSelect={() => { }}
                initialPosition={initialMapPosition}
                height="400px"
                readOnly={true}
                userLocation={userLocation}
                locationError={locationError}
                loadingLocation={loadingLocation}
                getUserLocation={getUserLocation}
                routeGeometry={showDirections && routeInfo ? routeInfo.geometry : null}
              />
              {product.location && (
                <div className="pd-location-card">
                  <div className="pd-location-info">
                    <div className="pd-location-name">{product.name}</div>
                    <div className="pd-location-address">
                      <MapPin size={16} style={{ marginTop: '-2px' }} />
                      {product.location}
                    </div>
                  </div>

                  {routeInfo && (
                    <div className="pd-location-actions">
                      <div className="pd-distance-text-small">
                        {routeInfo.distanceKm} km away
                      </div>
                      <button
                        className={`pd-btn-directions ${showDirections ? 'active' : ''}`}
                        onClick={() => setShowDirections(!showDirections)}
                      >
                        {showDirections ? 'Hide Route' : 'Get Directions'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {similarProducts.length > 0 && (
        <section className="hm-trending" style={{ marginTop: 40 }}>
          <div className="hm-container">
            <div className="hm-trending-header">
              <h3>Similar Products</h3>
            </div>
            <div className="trending-slider-wrapper">
              <button
                className="scroll-nav-btn left"
                onClick={() => scrollSimilar("left")}
                aria-label="Scroll Left"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="trending-row" ref={similarRef}>
                {similarProducts.map((prod) => (
                  <div
                    key={prod._id}
                    className="trending-card"
                    onClick={() => {
                      navigate(`/product/${prod._id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    <div
                      className="trending-thumb"
                      style={{
                        backgroundImage: `url(${imageUrl(prod.images?.[0] || prod.image)})`,
                      }}
                    />
                    <div className="trending-body">
                      <div className="trending-title">{prod.name}</div>
                      <div className="trending-meta">
                        <span>{prod.location || "N/A"}</span>
                        <span>{formatDate(prod.createdAt)}</span>
                      </div>
                      <div className="trending-price">
                        Rs. {prod.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="scroll-nav-btn right"
                onClick={() => scrollSimilar("right")}
                aria-label="Scroll Right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;
