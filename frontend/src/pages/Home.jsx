import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import api, { API_ORIGIN } from "../utils/api";
import { getDrivingRoute } from "../utils/routingService";
import { fetchUserRecommendations, fetchTrendingProducts } from "../utils/recommendations";
import { Heart, ShieldCheck, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [boosted, setBoosted] = useState([]);
  const [saved, setSaved] = useState([]);
  const [userRecs, setUserRecs] = useState([]);
  const [apiTrending, setApiTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [userLocation, setUserLocation] = useState(null);
  const [exactDistances, setExactDistances] = useState({});
  const trendingRef = useRef(null);
  const recsRef = useRef(null);

  const visibleCats = useMemo(() => {
    return (cats || []).filter((c) => c && c.name);
  }, [cats]);

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Straight-line distance in km

    // Approximation: Multiply by 1.4 to estimate driving distance (tortuosity factor)
    // This helps match the OSRM driving distance better without API calls
    return d * 1.4;
  };

  // Background fetch for exact distances


  const trendingProducts = useMemo(() => {
    // 1. Get active boosted products
    const baseList = apiTrending && apiTrending.length > 0 ? apiTrending : products;

    const activeBoosted = (boosted || []).filter(b => {
      const s = String(b.status || "").toLowerCase();
      return s !== "sold" && s !== "expired";
    });
    const boostedIds = new Set(activeBoosted.map((b) => String(b._id)));

    // 2. Get other non-boosted products, sorted strictly by views
    const otherProducts = (baseList || [])
      .filter(p => {
        const s = String(p.status || "").toLowerCase();
        return !boostedIds.has(String(p._id)) && s !== "sold" && s !== "expired";
      })
      .sort((a, b) => (b.views || 0) - (a.views || 0));

    // 3. Combine: Boosted first, then most viewed
    const limit = 20;
    const tail = otherProducts.slice(0, Math.max(0, limit - (activeBoosted.length || 0)));

    return [...activeBoosted, ...tail];
  }, [boosted, products]);

  const displayProducts = useMemo(() => {
    // 1. Filter out sold/expired items
    let list = (products || []).filter(p => {
      const s = String(p.status || "").toLowerCase();
      return s !== "sold" && s !== "expired";
    });

    // 2. Map with distance if location available
    if (userLocation) {
      list = list.map(p => {
        let dist = null;
        if (p.coordinates && p.coordinates.coordinates) {
          dist = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            p.coordinates.coordinates[1],
            p.coordinates.coordinates[0]
          );
        }
        return { ...p, _distance: dist };
      });

      // 3. Sort: Nearest first
      list.sort((a, b) => {
        if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
        if (a._distance !== null) return -1; // a has distance, put first
        if (b._distance !== null) return 1;  // b has distance, put first
        return new Date(b.createdAt) - new Date(a.createdAt); // Fallback to newest
      });
    } else {
      // 4. Fallback Sort: Newest first
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [products, userLocation]);

  const recommendedProducts = useMemo(() => {
    if (!userRecs || userRecs.length === 0) return [];
    if (!userLocation) return userRecs;
    const list = userRecs.map(p => {
      let dist = null;
      if (p.coordinates && p.coordinates.coordinates) {
        dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          p.coordinates.coordinates[1],
          p.coordinates.coordinates[0]
        );
      }
      return { ...p, _distance: dist };
    });
    return list;
  }, [userRecs, userLocation]);

  // Background fetch for exact distances
  useEffect(() => {
    if (!userLocation || !displayProducts || displayProducts.length === 0) return;

    // 1. Try to load valid cache first to avoid re-fetching/jumping
    const cacheKey = "dealmate_distance_cache";
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && cached.location) {
        const distMoved = calculateDistance(
          userLocation.latitude, userLocation.longitude,
          cached.location.lat, cached.location.lng
        );
        // If moved less than 100m, use cache
        if (distMoved < 0.1 && cached.distances) {
          setExactDistances(prev => ({ ...prev, ...cached.distances }));
        }
      }
    } catch (e) {
      console.error("Cache load error", e);
    }

    const fetchExactRoutes = async () => {
      // Limit to top 20 to avoid rate limits
      const topProducts = displayProducts.slice(0, 20);
      let updated = false;
      const newDistances = {};

      // We'll process them sequentially or in small parallel batches
      for (const p of topProducts) {
        // Skip if already fetched/cached or no coordinates
        if (exactDistances[p._id] || !p.coordinates?.coordinates) continue;

        try {
          const route = await getDrivingRoute(
            userLocation.latitude,
            userLocation.longitude,
            p.coordinates.coordinates[1],
            p.coordinates.coordinates[0]
          );

          if (route && route.distanceKm) {
            const val = parseFloat(route.distanceKm);

            // Update State
            setExactDistances(prev => {
              const next = { ...prev, [p._id]: val };
              return next;
            });

            // Update Cache Immediately
            const currentCache = JSON.parse(localStorage.getItem(cacheKey)) || {};
            const newCache = {
              location: { lat: userLocation.latitude, lng: userLocation.longitude },
              distances: { ...(currentCache.distances || {}), [p._id]: val }
            };
            localStorage.setItem(cacheKey, JSON.stringify(newCache));
          }
        } catch (err) {
          // Silent fail
        }
        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 100));
      }
    };

    fetchExactRoutes();
  }, [userLocation, displayProducts]); // Re-run when list changes or location found

  useEffect(() => {
    // Request location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied or error:", error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [catRes, prodRes, boostedRes] = await Promise.all([
          api.get("/categories"),
          api.get("/products"),
          api.get("/products/boosted/list"),
        ]);
        if (!mounted) return;
        setCats(catRes.data || []);
        // prodRes.data might contain sold items, we filter them in useMemo
        setProducts(prodRes.data || []);
        setBoosted(boostedRes.data || []);
        try {
          const trendingRes = await fetchTrendingProducts();
          if (Array.isArray(trendingRes)) {
            setApiTrending(trendingRes);
          }
        } catch { }
      } catch (err) {
        console.error("Home load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function getRecs() {
      try {
        const recRes = await fetchUserRecommendations(
          userLocation?.latitude,
          userLocation?.longitude
        );
        if (mounted && Array.isArray(recRes)) {
          setUserRecs(recRes);
        }
      } catch (err) {
        // console.error("Rec fetch error", err);
      }
    }
    getRecs();
    return () => { mounted = false; };
  }, [userLocation]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.get("/wishlist")
        .then(res => setSaved(res.data || []))
        .catch(() => { });
    }
  }, []);

  const savedSet = useMemo(() => new Set(saved.map(String)), [saved]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const scrollTrending = (dir) => {
    if (trendingRef.current) {
      const scrollAmt = 252;
      trendingRef.current.scrollBy({ left: dir === "left" ? -scrollAmt : scrollAmt, behavior: "smooth" });
    }
  };

  const scrollRecs = (dir) => {
    if (recsRef.current) {
      const scrollAmt = 252;
      recsRef.current.scrollBy({ left: dir === "left" ? -scrollAmt : scrollAmt, behavior: "smooth" });
    }
  };

  function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  const imageUrl = (src) => {
    if (!src) return "https://via.placeholder.com/200x150?text=No+Image";
    return src.startsWith("/") ? `${API_ORIGIN}${src}` : src;
  };

  async function toggleSave(id) {
    const isSaved = savedSet.has(id);
    const nextSaved = isSaved ? saved.filter(s => s !== id) : [...saved, id];
    setSaved(nextSaved); // Optimistic update

    try {
      const { data } = await api.post(`/wishlist/${id}`);
      setSaved(data.map(String));
    } catch (err) {
      showToast("Login required to save items", "error");
      setSaved(saved); // Revert
    }
  }

  const renderProductCard = (p) => (
    <div
      key={p._id}
      className="gallery-card"
      onClick={() => navigate(`/product/${p._id}`)}
      style={{ cursor: "pointer" }}
    >
      <div className="gallery-thumb">
        <img
          className="gallery-image"
          src={imageUrl(p.images?.[0] || p.image)}
          alt={p.name}
          loading="lazy"
          width="360"
          height="240"
          onError={(e) => { e.currentTarget.src = "https://via.placeholder.com/360x240?text=Image"; }}
        />
        <button
          className={`save-btn ${savedSet.has(p._id) ? "saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleSave(p._id);
          }}
          aria-label="Save to wishlist"
          title={savedSet.has(p._id) ? "Unsave" : "Save"}
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          <Heart
            size={24}
            fill={savedSet.has(p._id) ? "#ef4444" : "none"}
            color={savedSet.has(p._id) ? "#ef4444" : "currentColor"}
            strokeWidth={2}
          />
        </button>
        <div className="thumb-time">
          {(() => {
            const hasDistance =
              exactDistances[p._id] !== undefined ||
              (p._distance !== undefined && p._distance !== null);
            if (hasDistance) {
              const dist =
                exactDistances[p._id] !== undefined
                  ? exactDistances[p._id]
                  : p._distance;
              const value =
                dist < 1
                  ? `${(dist * 1000).toFixed(0)} m`
                  : `${Number(dist).toFixed(1)} km`;
              return (
                <>
                  <span style={{ marginRight: 4 }}>📍</span>
                  {value}
                </>
              );
            }
            return timeAgo(p.createdAt);
          })()}
        </div>
      </div>
      <div className="gallery-body">
        <div className="gallery-header">
          <div className="gallery-title" title={p.name}>{p.name}</div>
          <div className="gallery-price">Rs. {p.price?.toLocaleString()}</div>
        </div>

        <div className="gallery-row-muted">
          <span>{p.brand || "Brand"}</span>
          <span>•</span>
          <span>{p.category || "General"}</span>
          {(p.specifications?.Size || p.specifications?.size) && (
            <>
              <span>•</span>
              <span>{p.specifications.Size || p.specifications.size}</span>
            </>
          )}
        </div>

        <div className="gallery-location">
          {p.location || "Location not specified"}
        </div>

        <div className="gallery-badges">
          {(p.negotiable || p.specifications?.negotiable === 'Yes') && (
            <span className="badge-negotiable">Negotiable</span>
          )}

          {p.seller?.trustScore >= 80 && (
            <span className="badge-trust">
              <ShieldCheck size={12} strokeWidth={2.5} /> Trusted
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="hm-page">
      {toast.show && (
        <div className={`toast-notify ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))}>
            <X size={14} />
          </button>
        </div>
      )}
      <section className="hm-cat-strip">
        <div className="hm-container">
          <div className="hm-cats">
            {visibleCats.map((c) => (
              <div
                key={c._id}
                className="hm-cat"
                onClick={() => navigate(`/category/${encodeURIComponent(c.name)}`)}
                style={{ cursor: "pointer" }}
              >
                {c.image ? (
                  <img
                    src={imageUrl(c.image)}
                    alt={c.name}
                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }}
                  />
                ) : (
                  <div className="hm-cat-icon">{(c.name || "C")[0]}</div>
                )}
                <div className="hm-cat-label">{c.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {trendingProducts.length > 0 && (
        <section className="hm-trending">
          <div className="hm-container">
            <div className="hm-trending-header">
              <h2>Trending</h2>
              <button className="boost-btn" onClick={() => navigate('/seller?tab=products')}>Boost Ads</button>
            </div>
            <div style={{ position: 'relative' }} className="trending-slider-wrapper">
              <button
                className="scroll-nav-btn left"
                onClick={() => scrollTrending('left')}
                aria-label="Scroll Left"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="trending-row" ref={trendingRef}>
                {trendingProducts.map(renderProductCard)}
              </div>

              <button
                className="scroll-nav-btn right"
                onClick={() => scrollTrending('right')}
                aria-label="Scroll Right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {recommendedProducts && recommendedProducts.length > 0 && (
        <section className="hm-trending">
          <div className="hm-container">
            <div className="hm-trending-header">
              <h2>Recommended for you</h2>
            </div>
            <div className="trending-slider-wrapper">
              <button
                className="scroll-nav-btn left"
                onClick={() => scrollRecs("left")}
                aria-label="Scroll Left"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="trending-row" ref={recsRef}>
                {recommendedProducts.map(renderProductCard)}
              </div>

              <button
                className="scroll-nav-btn right"
                onClick={() => scrollRecs("right")}
                aria-label="Scroll Right"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="hm-latest">
        <div className="hm-container">
          <h2>{userLocation ? "Nearby Products" : "Latest Products"}</h2>
          <div className="gallery-grid">
            {loading ? (
              <div style={{ padding: 12 }}>Loading...</div>
            ) : displayProducts.length === 0 ? (
              <div style={{ padding: 12 }}>No products found.</div>
            ) : (
              displayProducts.map(renderProductCard)
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
