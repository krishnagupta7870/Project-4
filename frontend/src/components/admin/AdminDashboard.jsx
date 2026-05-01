import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../../styles/admin-dashboard.css";
import AdminSidebar from "./AdminSidebar";
import DashboardHome from "./DashboardHome";
import ProductList from "./ProductList";
import UserManagement from "./UserManagement";
import SellerApproval from "./SellerApproval";
import ListYourProduct from "../vendor/ListYourProduct";
import ManageLogo from "./ManageLogo";
import CategoryManagement from "./CategoryManagement";
import AddCategoryForm from "./AddCategoryForm";
import ReportManagement from "./ReportManagement";
import ManageBoosts from "./ManageBoosts";

import api from "../../utils/api";
import NotificationsBell from "../common/NotificationsBell";
import { Toaster, toast } from "react-hot-toast";

// Wrapper for SellerApproval to match new style
const SellerVerificationSection = () => {
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycEmail, setKycEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestKyc = async (e) => {
    e.preventDefault();
    if (!kycEmail) return;
    setLoading(true);
    try {
      await api.post("/admin/verifications/request-kyc", { email: kycEmail });
      toast.success(`KYC Request sent to ${kycEmail}`);
      setKycEmail("");
      setShowKycModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-home">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

      </div>
      <div className="card">
        <SellerApproval />
        <div className="card-section">
          <h3 className="section-title">Manual KYC Request</h3>
          <p className="text-muted">Send a manual KYC verification request to a specific seller.</p>
          <button className="btn btn-kyc" onClick={() => setShowKycModal(true)}>Request KYC Verification</button>
        </div>
      </div>

      {showKycModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3>Request KYC</h3>
            <p className="text-muted" style={{ marginBottom: '16px' }}>
              Enter the email of the user you want to request KYC from.
            </p>
            <form onSubmit={handleRequestKyc}>
              <input
                type="email"
                className="form-control"
                placeholder="User Email"
                value={kycEmail}
                onChange={(e) => setKycEmail(e.target.value)}
                required
                style={{ marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowKycModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper for UserManagement
const CustomersSection = () => {
  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Customers</h2>
      </div>
      <div className="table-card">
        <div className="table-container">
          <UserManagement />
        </div>
      </div>
    </div>
  )
}

const PlaceholderSection = ({ title, description }) => {
  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
      </div>
      <div className="card">
        <div className="card-section">
          <p className="text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Category sections removed - using CategoryManagement instead

const ProductUploadSection = () => (
  <div className="dashboard-home">
    <div className="page-header">
      <h2 className="page-title">Product Upload</h2>
    </div>
    <div className="card">
      <ListYourProduct isEmbedded={true} />
    </div>
  </div>
);

const AdminProfileSection = () => {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h2 className="page-title">Profile</h2>
      </div>
      <div className="card">
        <div className="card-section">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="popup-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user?.name || "Admin"}</div>
              <div className="user-role">{user?.email || "admin@example.com"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = JSON.parse(localStorage.getItem("user"));
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "A";

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActivePage(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <DashboardHome onNavigate={setActivePage} />;
      case "product_list":
        return <ProductList />;
      case "product_upload":
        return <ProductUploadSection />;
      case "category_management":
        return <CategoryManagement />;
      case "add_category":
        return <AddCategoryForm onDone={() => setActivePage("category_management")} />;
      case "customers":
        return <CustomersSection />;
      case "verification":
        return <SellerVerificationSection />;
      case "banners":
        return <PlaceholderSection title="Banners" description="Manage banners." />;
      case "settings":
        return <ManageLogo />;
      case "boost_pricing":
        return <ManageBoosts />;
      case "profile":
        return <AdminProfileSection />;
      case "reports":
        return <ReportManagement />;
      case "logout":
        return <PlaceholderSection title="Logout" description="Use top navigation to logout." />;
      default:
        return <DashboardHome onNavigate={setActivePage} />;
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="admin-main">
        <div className="top-header" ref={profileRef}>
          <div className="header-left">
            <div className="brand-select">
              Admin Panel
            </div>
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
                      <div className="user-name">{user?.name || "Admin"}</div>
                      <div className="popup-email">{user?.email || "admin@example.com"}</div>
                    </div>
                  </div>
                  <button
                    className="popup-btn"
                    onClick={() => {
                      setShowProfile(false);
                      setActivePage("profile");
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
        {renderContent()}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
