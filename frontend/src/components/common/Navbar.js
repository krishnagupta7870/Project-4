import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogo } from "../../context/LogoContext";
import SearchBar from "./SearchBar";
import "../../styles/components.css";
import "../../styles/navbar.css";
import { ChevronDown } from "lucide-react";
import NotificationsBell from "./NotificationsBell";
import ChatButton from "./ChatButton";
import { categoryConfig } from "../../config/categories";
import api from "../../utils/api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logo: logoUrl } = useLogo();

  // Hide category bar on chat pages
  const isChatPage = location.pathname.startsWith("/chat");

  // ===== AUTH =====
  const user = JSON.parse(localStorage.getItem("user"));
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "";

  // ===== STATES =====
  const [showProfile, setShowProfile] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const profileRef = useRef(null);
  const categoryRef = useRef(null);

  // ===== UI FILTER: Hide specific categories from front-page UI only (DB unchanged) =====
  const shouldHideCategory = (name) => {
    const n = String(name || "").toLowerCase().trim();
    if (!n) return true;
    if (n === "pets") return true;
    if (n === "properties") return true;
    if (n.includes("commercial") && n.includes("vehicle")) return true;
    if (n.includes("spare") && n.includes("part")) return true;
    return false;
  };

  const visibleTopLinks = [
    { label: "Car", category: "Vehicles", subCategory: "Cars" },
    { label: "Motorcycle", category: "Vehicles", subCategory: "Motorcycles" },
    { label: "Mobile Phone", category: "Mobiles", subCategory: "Mobile Phones" },
    { label: "Laptop", category: "Electronics", subCategory: "Laptops" },
    { label: "For Sale: Houses & Apartments", category: "Properties", subCategory: "House & Apartments" },
    { label: "For Rent: Houses & Apartments", external: "https://avas-frontend.onrender.com/" },
  ];

  const megaMenuSections = Object.keys(categoryConfig).map(catName => ({
    title: catName,
    items: Object.keys(categoryConfig[catName].subCategories || {}).map(subName => ({
      label: subName,
      category: catName,
      subCategory: subName
    }))
  })).sort((a, b) => {
    const order = [
      "Mobiles", "Electronics", "Home Appliances", "Vehicles",
      "Furniture", "Fashion", "Books & Sports", "Properties",
      "Commercial Vehicles & Spare Parts", "Pets", "Other"
    ];
    const indexA = order.indexOf(a.title);
    const indexB = order.indexOf(b.title);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const visibleMegaMenuSections = megaMenuSections;

  // ===== CLICK OUTSIDE =====
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ===== HANDLERS =====
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setShowProfile(false);
    navigate("/login");
  };

  const goToCategory = (link) => {
    setShowCategories(false);
    if (link.external) {
      window.open(link.external, "_blank");
      return;
    }
    let url = `/category/${link.category || link.slug}`;
    if (link.subCategory) {
      url += `?subCategory=${encodeURIComponent(link.subCategory)}`;
    }
    navigate(url);
  };

  const handleSearch = ({ q, category }) => {
    const query = String(q || "").trim();
    let url = `/browse?q=${encodeURIComponent(query)}`;
    if (category && category !== "All Categories") {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (query) {
      api
        .post("/activity/search", {
          raw: query,
          source: "searchBox",
          filters: {
            category: category && category !== "All Categories" ? category : null
          }
        })
        .catch(() => { });
    }
    navigate(url);
  };

  return (
    <header className="dm-header">
      {/* ================= TOP NAV ================= */}
      <div className="dm-header-top">
        {/* LEFT */}
        <div className="dm-left">
          <a href="/" className="dm-logo">
            <img src={logoUrl} alt="DealMate" style={{ height: '54px' }} />
          </a>
        </div>

        {/* CENTER */}
        <div className="dm-center">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* RIGHT */}
        <div className="dm-right" ref={profileRef}>
          {!user ? (
            /* 🔴 NOT LOGGED IN */
            <div className="hm-nav-actions">
              <button
                className="btn btn-ghost"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
            </div>
          ) : (
            /* 🟢 LOGGED IN */
            <>
              <NotificationsBell />
              <ChatButton />
              {/* AVATAR */}
              <div
                className="dm-avatar"
                title={user.name}
                onClick={() => setShowProfile(!showProfile)}
              >
                {userInitial}
              </div>

              {/* ✅ SELL BUTTON (RIGHT SIDE OF PROFILE) */}
              <button
                className="dm-sell-btn"
                onClick={() => navigate("/verify-seller")}
              >
                + SELL
              </button>

              {/* PROFILE POPUP */}
              {showProfile && (
                <div className="dm-profile-popup">
                  <div className="popup-header">
                    <div className="popup-avatar">{userInitial}</div>
                    <div>
                      <strong>{user.name}</strong>
                      <div className="popup-email">{user.email}</div>
                    </div>
                  </div>

                  <button
                    className="popup-btn"
                    onClick={() => {
                      setShowProfile(false);
                      navigate("/profile");
                    }}
                  >
                    View and edit profile
                  </button>

                  <div className="popup-section">
                    <div className="popup-item" onClick={() => navigate("/seller")}>My Ads</div>
                    <div className="popup-item" onClick={() => { setShowProfile(false); navigate("/wishlist"); }}>
                      My Wishlist
                    </div>
                    <div className="popup-item" onClick={() => { setShowProfile(false); navigate("/support"); }}>
                      Contact Support
                    </div>
                  </div>

                  <div className="popup-footer">
                    <div
                      className="popup-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= CATEGORY BAR ================= */}
      {!isChatPage && (
        <nav className="dm-category-bar">
          <div className="dm-cats-wrapper" ref={categoryRef}>
            <button
              className="dm-allcats"
              onClick={() => setShowCategories(!showCategories)}
              aria-expanded={showCategories}
            >
              ALL CATEGORIES
              <span className={`dm-arrow ${showCategories ? "open" : ""}`}>
                <ChevronDown size={16} />
              </span>
            </button>

            <ul className="dm-cat-links" aria-hidden="false">
              {visibleTopLinks.map((link, idx) => (
                <li key={idx} onClick={() => goToCategory(link)}>
                  {link.label}
                </li>
              ))}
            </ul>

            {showCategories && (
              <div className="dm-mega-menu">
                {visibleMegaMenuSections.map((section, idx) => (
                  <div key={idx} className="mega-col">
                    <h4>{section.title}</h4>
                    {section.items.map((item) => (
                      <p key={item.label} onClick={() => goToCategory(item)}>
                        {item.label}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
