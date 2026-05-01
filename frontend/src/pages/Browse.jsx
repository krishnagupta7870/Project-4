import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import api, { API_ORIGIN } from "../utils/api";
import "../styles/browse.css";
import { Heart } from "lucide-react";
import Breadcrumbs from "../components/common/Breadcrumbs";

function LikeButton() {
  const [liked, setLiked] = useState(false);
  return (
    <div
      className="browse-like-btn"
      onClick={(e) => {
        e.stopPropagation();
        setLiked(!liked);
      }}
      title={liked ? "Unsave" : "Save"}
    >
      <Heart
        size={24}
        fill={liked ? "#ef4444" : "none"}
        color={liked ? "#ef4444" : "#1f2937"}
        strokeWidth={2}
      />
    </div>
  );
}

const SEARCH_SYNONYMS = {
  // Vehicles
  "bike": ["motorcycle", "two wheeler", "pulsar", "bullet", "enfield"],
  "bikes": ["motorcycle"],
  "motorcycle": ["bike", "two wheeler", "pulsar", "bullet"],
  "motorcycles": ["bike"],
  "motercycle": ["motorcycle"],
  "motercycles": ["motorcycle"],
  "scooty": ["scooter", "dio"],
  "scooties": ["scooter"],
  "scooter": ["scooty", "dio", "vespa"],
  "car": ["suv", "sedan", "hatchback", "jeep", "four wheeler", "4 wheeler", "taxi", "cab"],
  "cars": ["car"],
  "jeep": ["car", "suv", "4x4", "scorpio", "bolero"],
  "truck": ["tipper", "lorry", "commercial vehicle"],
  "bus": ["micro", "van", "hiace"],
  "cycle": ["bicycle", "mtb", "gear cycle"],
  "bicycle": ["cycle"],

  // Electronics & Gadgets
  "redmi": ["xiaomi"],
  "xiaomi": ["redmi", "mi"],
  "mi": ["xiaomi", "redmi"],
  "iphone": ["apple", "ios"],
  "apple": ["iphone", "ipad", "macbook", "mac"],
  "phone": ["mobile", "cellphone", "android", "smartphone"],
  "mobile": ["phone", "cellphone", "smartphone", "android"],
  "cellphone": ["mobile"],
  "pc": ["laptop", "computer", "desktop", "cpu", "monitor"],
  "computer": ["laptop", "pc", "desktop"],
  "laptop": ["pc", "notebook", "macbook"],
  "tab": ["tablet", "ipad"],
  "tablet": ["tab", "ipad"],
  "ipad": ["tablet", "tab"],
  "tv": ["television", "led", "lcd", "smart tv"],
  "television": ["tv", "led"],
  "fridge": ["refrigerator", "deep fridge"],
  "refrigerator": ["fridge"],
  "ac": ["air conditioner", "cooler"],
  "air conditioner": ["ac"],
  "printer": ["photocopy", "scanner"],
  "watch": ["smartwatch", "apple watch"],
  "smartwatch": ["watch"],
  "earphone": ["headphone", "buds", "airpods", "earbuds", "bluetooth"],
  "headphone": ["earphone", "headset"],
  "camera": ["dslr", "mirrorless", "gopro", "lens", "drone"],
  "lens": ["camera"],
  "speaker": ["soundbar", "home theater", "bluetooth speaker"],

  // Home Appliances
  "washing machine": ["washer", "dryer"],
  "microwave": ["oven", "kitchen appliance"],
  "oven": ["microwave"],
  "cooker": ["induction", "gas stove"],

  // Property / Real Estate
  "house": ["home", "flat", "apartment", "room", "building", "bungalow"],
  "home": ["house"],
  "flat": ["apartment", "room", "rent"],
  "apartment": ["flat", "rent"],
  "land": ["plot", "jagga", "khet"],
  "jagga": ["land"],
  "room": ["flat", "rent", "accommodation"],
  "office": ["commercial space", "shutter"],
  "shutter": ["shop", "office"],

  // Furniture
  "bed": ["khat", "mattress", "double bed", "single bed"],
  "khat": ["bed"],
  "sofa": ["couch", "settee", "sofa set"],
  "couch": ["sofa"],
  "chair": ["seat", "stool", "office chair"],
  "table": ["desk", "dining table", "study table"],
  "cupboard": ["wardrobe", "almirah", "closet"],
  "wardrobe": ["cupboard", "almirah"],
  "almirah": ["wardrobe", "cupboard"],

  // Fashion
  "clothes": ["clothing", "shirt", "pant", "jacket", "hoody", "apparel", "dress"],
  "clothing": ["clothes"],
  "shirt": ["tshirt", "top"],
  "pant": ["jeans", "trouser"],
  "shoe": ["sneaker", "boot", "footwear", "sandal"],
  "shoes": ["shoe"],
  "sneaker": ["shoe"],
  "bag": ["backpack", "handbag", "purse"],

  // Books & Sports
  "book": ["novel", "textbook", "magazine"],
  "books": ["book"],
  "bat": ["cricket", "sports"],
  "football": ["soccer", "ball"],
  "gym": ["dumbbell", "weights", "fitness"],

  // Pets
  "dog": ["puppy", "pet", "german shepherd", "labrador"],
  "cat": ["kitten", "pet"],
  "pet": ["dog", "cat", "animal", "bird"],
  "bird": ["parrot", "pigeon"],

  // Others
  "ps5": ["playstation", "console", "game", "gaming"],
  "playstation": ["ps5", "ps4", "console", "game"],
  "xbox": ["console", "game"],
  "guitar": ["instrument", "musical"]
};

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // URL Params
  const query = searchParams.get("q") || "";
  const categoryParam = routeCategory || searchParams.get("category") || "All Categories";
  const subCategoryParam = searchParams.get("subCategory") || "";
  const brandParam = searchParams.get("brand") || "";

  // Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubCategory, setSelectedSubCategory] = useState(subCategoryParam);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSpecs, setSelectedSpecs] = useState({});

  // Location State
  const [userLocation, setUserLocation] = useState(null);
  const [range, setRange] = useState(10);
  const [locationError, setLocationError] = useState(null);

  // Helper: Haversine Distance (in km)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // Return infinite distance if coordinates missing
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Request Location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        console.error("Location error:", error);
        setLocationError("Location access denied.");
      }
    );
  };

  // 1. Auto-request on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Handlers for Range
  const handleRangeChange = (e) => {
    setRange(Number(e.target.value));
  };

  const handleRangeInteraction = () => {
    if (!userLocation) {
      requestLocation();
    }
  };

  useEffect(() => {
    setSelectedCategory(categoryParam);
    setSelectedSubCategory(subCategoryParam);
    if (brandParam) {
      setSelectedBrands([brandParam]);
    } else {
      setSelectedBrands([]);
    }
    // Reset filters when category changes via URL
    setSelectedSpecs({});
  }, [categoryParam, subCategoryParam, brandParam]);

  // Fetch Data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const prodRes = await api.get("/api/products");
        if (!mounted) return;
        setProducts(prodRes.data || []);
      } catch (err) {
        console.error("Browse load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  // Derived Filter Options
  const { availableBrands, availableSpecs } = useMemo(() => {
    // Extract from ALL products or filtered products? 
    // Usually facets are based on current search/category context but NOT other filters.
    // Let's base it on category + query filtered products for better UX.

    const baseList = products.filter(p => {
      // Apply Search
      if (query) {
        const q = query.toLowerCase();
        let searchTerms = [q];
        Object.entries(SEARCH_SYNONYMS).forEach(([key, aliases]) => {
          if (q.includes(key)) searchTerms = [...searchTerms, ...aliases];
        });

        const isMatch = searchTerms.some(term =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.subCategory?.toLowerCase().includes(term)
        );
        if (!isMatch) return false;
      }
      // Apply Category
      if (selectedCategory && selectedCategory !== "All Categories") {
        const pCat = typeof p.category === 'object' ? p.category?.name : p.category;
        const catName = String(pCat || "").toLowerCase();
        const filterName = String(selectedCategory).toLowerCase();

        let isCatMatch = catName === filterName || catName.includes(filterName) || filterName.includes(catName);

        if (!isCatMatch) {
          const map = { "cars": "car", "motorcycles": "motorcycle", "mobiles": "mobile", "houses-sale": "house", "scooters": "scooter" };
          const mapped = map[filterName] || filterName;
          isCatMatch = catName.includes(mapped);
        }

        if (!isCatMatch) return false;

        // SubCategory Check
        if (selectedSubCategory) {
          const pSub = p.subCategory;
          const subName = String(pSub || "").toLowerCase();
          const filterSub = String(selectedSubCategory).toLowerCase();
          if (subName !== filterSub && !subName.includes(filterSub) && !filterSub.includes(subName)) return false;
        }
      }
      return true;
    });

    const brands = new Set();
    const specsMap = {};

    baseList.forEach(p => {
      if (p.brand) brands.add(p.brand);

      // Specs extraction
      if (p.specifications && typeof p.specifications === 'object') {
        Object.entries(p.specifications).forEach(([key, val]) => {
          if (!val) return;
          // Clean key: Title Case roughly
          // We stick to original keys but might want to filter out internal stuff if any
          // For now, allow all keys found in specs
          if (!specsMap[key]) specsMap[key] = new Set();
          specsMap[key].add(String(val));
        });
      }
    });

    const finalSpecs = {};
    Object.keys(specsMap).forEach(key => {
      // Only include if there are values (already checked !val but set size check)
      if (specsMap[key].size > 0) {
        finalSpecs[key] = Array.from(specsMap[key]).sort();
      }
    });

    return {
      availableBrands: Array.from(brands).sort(),
      availableSpecs: finalSpecs
    };
  }, [products, query, selectedCategory, selectedSubCategory]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // 0. Filter by Status (Only show Active/Available products)
      const pStatus = String(p.status || "").toLowerCase();
      if (pStatus === "sold" || pStatus === "expired") return false;

      // 1. Search Query
      if (query) {
        const q = query.toLowerCase();
        let searchTerms = [q];
        Object.entries(SEARCH_SYNONYMS).forEach(([key, aliases]) => {
          if (q.includes(key)) searchTerms = [...searchTerms, ...aliases];
        });

        const isMatch = searchTerms.some(term =>
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          p.subCategory?.toLowerCase().includes(term)
        );
        if (!isMatch) return false;
      }

      // 2. Category
      if (selectedCategory && selectedCategory !== "All Categories") {
        const pCat = typeof p.category === 'object' ? p.category?.name : p.category;
        const catName = String(pCat || "").toLowerCase();
        const filterName = String(selectedCategory).toLowerCase();

        let isCatMatch = catName === filterName || catName.includes(filterName) || filterName.includes(catName);

        if (!isCatMatch) {
          const map = { "cars": "car", "motorcycles": "motorcycle", "mobiles": "mobile", "houses-sale": "house", "scooters": "scooter" };
          const mapped = map[filterName] || filterName;
          isCatMatch = catName.includes(mapped);
        }

        if (!isCatMatch) return false;

        // SubCategory Check
        if (selectedSubCategory) {
          const pSub = p.subCategory;
          const subName = String(pSub || "").toLowerCase();
          const filterSub = String(selectedSubCategory).toLowerCase();
          if (subName !== filterSub && !subName.includes(filterSub) && !filterSub.includes(subName)) return false;
        }
      }

      // 3. Price
      const price = Number(p.price) || 0;
      if (minPrice && price < Number(minPrice)) return false;
      if (maxPrice && price > Number(maxPrice)) return false;

      // 4. Brand
      if (selectedBrands.length > 0) {
        if (!p.brand || !selectedBrands.includes(p.brand)) return false;
      }

      // 5. Specs
      if (Object.keys(selectedSpecs).length > 0) {
        const matchesSpecs = Object.entries(selectedSpecs).every(([key, values]) => {
          if (!values || values.length === 0) return true;
          const pVal = p.specifications?.[key];
          return values.includes(String(pVal));
        });
        if (!matchesSpecs) return false;
      }

      // 6. Location Range (New)
      if (userLocation) {
        // Check if product has coordinates
        if (p.coordinates && p.coordinates.coordinates && p.coordinates.coordinates.length === 2) {
          const [pLon, pLat] = p.coordinates.coordinates;
          const dist = calculateDistance(userLocation.lat, userLocation.lng, pLat, pLon);
          // If range is 50, treat as "50+" (unlimited/very far), so don't filter out
          if (range < 50 && dist > range) return false;
        } else {
          // Product has no location data -> exclude if filtering by location?
          // OR include? Usually if location filter is active, we expect nearby items.
          // Let's exclude for now as "unknown distance" is not "within 10km".
          // If range is 50+ (unlimited), maybe we show them? Let's keep excluding for consistency with "Location Active"
          return false;
        }
      }

      return true;
    });

    // 7. Sort
    result.sort((a, b) => {
      // Prioritize nearby items if location active?
      // For now keep standard sort but maybe add "distance" sort later.
      if (userLocation && sortBy === "distance") {
        // TODO: implement distance sort
      }

      if (sortBy === "price_low") return (a.price || 0) - (b.price || 0);
      if (sortBy === "price_high") return (b.price || 0) - (a.price || 0);
      // newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    return result;
  }, [products, query, selectedCategory, selectedSubCategory, minPrice, maxPrice, selectedBrands, selectedSpecs, sortBy, userLocation, range]);

  const handleApplyBudget = () => {
    // Triggers re-render via state
  };

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const toggleSpec = (key, val) => {
    setSelectedSpecs(prev => {
      const currentValues = prev[key] || [];
      const newValues = currentValues.includes(val)
        ? currentValues.filter(v => v !== val)
        : [...currentValues, val];

      // Clean up empty keys
      const newSpecs = { ...prev, [key]: newValues };
      if (newValues.length === 0) delete newSpecs[key];

      return newSpecs;
    });
  };

  const imageUrl = (src) => {
    if (!src) return "https://via.placeholder.com/200x150?text=No+Image";
    return src.startsWith("/") ? `${API_ORIGIN}${src}` : src;
  };

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "Just now";
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  // Infer Category/SubCategory for breadcrumbs if "All Categories" is selected
  const breadcrumbHierarchy = useMemo(() => {
    let cat = selectedCategory !== "All Categories" ? selectedCategory : "";
    let sub = selectedSubCategory;
    let bnd = selectedBrands.length === 1 ? selectedBrands[0] : "";

    // If query matches a brand exactly, treat it as selected brand for breadcrumb
    if (!bnd && query && availableBrands.some(b => b.toLowerCase() === query.toLowerCase())) {
      bnd = availableBrands.find(b => b.toLowerCase() === query.toLowerCase());
    }

    // Logic to infer category if missing but products share one
    if (!cat && filteredProducts.length > 0) {
      const firstProduct = filteredProducts[0];
      const pCat = typeof firstProduct.category === 'object' ? firstProduct.category?.name : firstProduct.category;
      const allSameCat = filteredProducts.every(p => {
        const otherCat = typeof p.category === 'object' ? p.category?.name : p.category;
        return otherCat === pCat;
      });
      if (allSameCat) {
        cat = pCat;
        // Check subcategory too
        const pSub = firstProduct.subCategory;
        const allSameSub = filteredProducts.every(p => p.subCategory === pSub);
        if (allSameSub) sub = pSub;
      }
    }

    return { category: cat, subCategory: sub, brand: bnd };
  }, [selectedCategory, selectedSubCategory, selectedBrands, filteredProducts, query, availableBrands]);

  return (
    <>
      <Breadcrumbs
        category={breadcrumbHierarchy.category}
        subCategory={breadcrumbHierarchy.subCategory}
        brand={breadcrumbHierarchy.brand}
      />
      <div className="browse-container">
        {/* Sidebar */}
        <aside className="browse-sidebar">
          {/* Budget */}
          <div className="filter-section">
            <div className="filter-title">Budget</div>
            <div className="filter-content">
              <div className="budget-inputs">
                <input
                  type="number"
                  className="budget-input"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  className="budget-input"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <button className="budget-apply" onClick={handleApplyBudget}>Apply</button>
            </div>
          </div>

          {/* Location / Distance Filter */}
          <div className="filter-section">
            <div className="filter-title">Distance</div>
            <div className="filter-content">
              {!userLocation ? (
                <button className="location-btn-request" onClick={requestLocation}>
                  📍 Use My Location
                </button>
              ) : (
                <div className="location-active-info">
                  <span style={{ fontSize: '0.85rem', color: '#10b981' }}>
                    📍 Location Active
                  </span>
                </div>
              )}

              <div className="range-container" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                  <span>Range</span>
                  <strong>{range >= 50 ? "50+ km" : `${range} km`}</strong>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={range}
                  className="range-slider"
                  onChange={handleRangeChange}
                  onMouseDown={handleRangeInteraction}
                  onTouchStart={handleRangeInteraction} // Mobile support
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                  <span>1km</span>
                  <span>50+ km</span>
                </div>
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          {availableBrands.length > 0 && (
            <div className="filter-section">
              <div className="filter-title">Brand & Model</div>
              <div className="filter-content scrollable">
                {availableBrands.map(b => (
                  <label key={b} className="filter-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(b)}
                      onChange={() => toggleBrand(b)}
                    />
                    <span>{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Specs Filters */}
          {Object.entries(availableSpecs).map(([key, values]) => (
            <div className="filter-section" key={key}>
              <div className="filter-title">{key}</div>
              <div className="filter-content scrollable">
                {values.map(val => (
                  <label key={val} className="filter-checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedSpecs[key]?.includes(val) || false}
                      onChange={() => toggleSpec(key, val)}
                    />
                    <span>{val}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <main className="browse-main">
          <div className="browse-header">
            <div className="browse-controls" style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div className="browse-count">{filteredProducts.length} results</div>
              <select
                className="browse-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="browse-grid">
              {filteredProducts.length === 0 ? (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#666" }}>
                  No products found matching your criteria.
                </div>
              ) : (
                filteredProducts.map((p, index) => (
                  <React.Fragment key={p._id}>
                    {index === 4 && (
                      <div className="browse-promo-card">
                        <div className="promo-title">Want to see your stuff here?</div>
                        <div className="promo-text">
                          Make some extra cash by selling things in your community. Go on, it's quick and easy.
                        </div>
                        <button className="promo-btn" onClick={() => navigate("/list-your-product")}>
                          Start selling
                        </button>
                      </div>
                    )}

                    <div className="browse-card" onClick={() => navigate(`/product/${p._id}`)}>
                      <div
                        className="browse-thumb"
                        style={{ backgroundImage: `url(${imageUrl((p.images && p.images[0]) || p.image)})` }}
                      >
                        {p.isFeatured && <div className="browse-featured">FEATURED</div>}
                        <LikeButton />
                      </div>
                      <div className="browse-info">
                        <div className="browse-price">Rs {p.price?.toLocaleString()}</div>
                        <div className="browse-name" title={p.name}>
                          {p.name}
                        </div>
                        <div className="browse-meta">
                          <span>{p.location || "Location"}</span>
                          <span>{timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
