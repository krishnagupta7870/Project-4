import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../utils/api";
import "../styles/wishlist.css";
import { MapPin } from "lucide-react";

const Wishlist = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const { data } = await api.get("/wishlist/populated");
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch wishlist", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, []);

  const imageUrl = (src) => {
    if (!src) return "https://via.placeholder.com/300x200?text=No+Image";
    return src.startsWith("/") ? `${API_ORIGIN}${src}` : src;
  };

  if (loading) return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h2>My Wishlist</h2>
      </div>
      <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>Loading...</div>
    </div>
  );

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h2>My Wishlist</h2>
      </div>
      
      {products.length === 0 ? (
        <div className="wishlist-empty">
          <h3>Your wishlist is empty</h3>
          <p>Save items you like to see them here.</p>
          <button 
            onClick={() => navigate("/")}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              background: "#002f34",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Start Browsing
          </button>
        </div>
      ) : (
        <div className="wishlist-grid">
          {products.map((product) => (
            <div 
              key={product._id} 
              className="wishlist-card"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <div className="wishlist-img-wrapper">
                <img
                  src={imageUrl(product.images?.[0] || product.image)}
                  alt={product.name}
                  className="wishlist-img"
                />
              </div>
              <div className="wishlist-details">
                <div className="wishlist-price">₹ {product.price?.toLocaleString()}</div>
                <div className="wishlist-title" title={product.name}>
                  {product.name}
                </div>
                <div className="wishlist-location">
                  <MapPin size={14} />
                  <span>{product.location || "Location not specified"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
