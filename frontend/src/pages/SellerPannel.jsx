import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/seller.css";
import "../styles/admin-dashboard.css";
import "../styles/navbar.css";

import SellerDashboard from "../components/vendor/SellerDashboard";
import ProductUpload from "../components/vendor/ProductUpload";
import ListYourProduct from "../components/vendor/ListYourProduct";
import OrderManagement from "../components/vendor/OrderManagement";
import InventoryTracker from "../components/vendor/InventoryTracker";
import SellerFeedback from "../components/vendor/SellerFeedback";
import SellerVerificationModal from "../components/vendor/SellerVerificationModal";
import NotificationsBell from "../components/common/NotificationsBell";

import { useLogo } from "../context/LogoContext";

export default function SellerPanel() {
  const navigate = useNavigate();
  const { logo: logoUrl } = useLogo();

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get("tab") || "overview";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [sellerVerified, setSellerVerified] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [kycExists, setKycExists] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const products = [];
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "S";
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowProfile(false);
    navigate("/login");
  };

  // 🔥 FETCH KYC STATUS ON PAGE LOAD
  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          "http://localhost:5000/api/vendor/verification/status",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (data.exists) {
          setKycExists(true);

          if (data.status === "pending") {
            setVerificationPending(true);
          }

          if (data.status === "approved") {
            setSellerVerified(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch KYC status", error);
      }
    };

    fetchKycStatus();
  }, []);

  const handleKycSubmit = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/vendor/verification/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      setShowKyc(false);
      setVerificationPending(true);
      setKycExists(true);
      alert("KYC submitted successfully. Verification pending.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <SellerDashboard />;

      case "products":
        return (
          <ProductUpload
            products={products}
            sellerVerified={sellerVerified}
            verificationPending={verificationPending}
            onRequestVerification={() => {
              if (!kycExists) setShowKyc(true);
            }}
            onListProduct={() => {
              setEditingProduct(null);
              setActiveTab("list-product");
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setActiveTab("list-product");
            }}
          />
        );

      case "list-product":
        return (
          <ListYourProduct
            isEmbedded={true}
            initialData={editingProduct}
            onCancel={() => {
              setEditingProduct(null);
              setActiveTab("products");
            }}
            onSuccess={() => {
              setEditingProduct(null);
              setActiveTab("products");
            }}
          />
        );

      case "inventory":
        return <InventoryTracker />;

      case "feedback":
        return <SellerFeedback />;

      default:
        return <SellerDashboard />;
    }
  };

  return (
    <div className="seller-app">
      <aside className="seller-sidebar">
        <div className="brand">
          <a href="/">
            <img src={logoUrl} alt="DealMate" style={{ height: 54 }} />
          </a>
        </div>
        <nav className="menu">
          <button
            onClick={() => setActiveTab("overview")}
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`menu-item ${activeTab === 'products' ? 'active' : ''}`}
          >
            Products
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setActiveTab("list-product");
            }}
            className={`menu-item ${activeTab === 'list-product' ? 'active' : ''}`}
          >
            List Your Product
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab("feedback")}
            className={`menu-item ${activeTab === 'feedback' ? 'active' : ''}`}
          >
            Feedback
          </button>
        </nav>
      </aside>

      <main className="seller-main">
        <div className="top-header" ref={profileRef}>
          <div className="header-left">
            <div className="brand-select">Seller Panel</div>
          </div>
          <div className="header-right">
            <div className="notification-wrapper">
              <NotificationsBell />
            </div>
            <div
              className="user-profile"
              onClick={() => setShowProfile((s) => !s)}
              style={{ position: "relative" }}
            >
              <div className="dm-avatar">{userInitial}</div>
              {showProfile && (
                <div className="dm-profile-popup">
                  <div className="popup-header">
                    <div className="popup-avatar">{userInitial}</div>
                    <div>
                      <div className="user-name">{user?.name || "Seller"}</div>
                      <div className="popup-email">{user?.email || ""}</div>
                    </div>
                  </div>
                  <button
                    className="popup-btn"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/profile");
                    }}
                  >
                    Profile
                  </button>
                  <div className="popup-footer">
                    <div className="popup-item logout" onClick={handleLogout}>
                      Sign Out
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {verificationPending && (
          <div className="verification-msg">
            ⏳ Verification under process. Admin approval required.
          </div>
        )}

        {renderContent()}
      </main>

      {showKyc && !kycExists && (
        <SellerVerificationModal
          onClose={() => setShowKyc(false)}
          onSubmit={handleKycSubmit}
        />
      )}
    </div>
  );
}
