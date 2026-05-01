import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogo } from "../../context/LogoContext";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  ChevronDown,
  ShieldCheck,
  Flag
} from 'lucide-react';

const AdminSidebar = ({ activePage, setActivePage }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState({ category: false, products: false });
  const { logo: logoUrl } = useLogo();

  const categorySubItems = [
    { id: 'category_management', label: 'Category Management' },
    { id: 'add_category', label: 'Add A Category' },
  ];

  const productSubItems = [
    { id: 'product_list', label: 'Product List' },
    { id: 'product_upload', label: 'Product Upload' },
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'category', label: 'Category', icon: <LayoutDashboard size={20} />, hasSubmenu: true },
    { id: 'products', label: 'Products', icon: <ShoppingBag size={20} />, hasSubmenu: true },
    { id: 'customers', label: 'Users', icon: <Users size={20} /> },
    { id: 'banners', label: 'Banners', icon: <ShoppingBag size={20} /> },
    { id: 'verification', label: 'Seller Verification', icon: <ShieldCheck size={20} /> },
    { id: 'reports', label: 'Reports & Moderation', icon: <Flag size={20} /> },
    { id: 'settings', label: 'Manage Logo', icon: <Settings size={20} /> },
    { id: 'boost_pricing', label: 'Boost Pricing', icon: <Settings size={20} /> },
    { id: 'logout', label: 'Logout', icon: <Users size={20} /> },
  ];

  const handleMenuClick = (id) => {
    if (id === 'category') {
      setExpanded(prev => ({ ...prev, category: !prev.category }));
      setIsMobileMenuOpen(false);
      return;
    }
    if (id === 'products') {
      setExpanded(prev => ({ ...prev, products: !prev.products }));
      setIsMobileMenuOpen(false);
      return;
    }
    setActivePage(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-logo">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
          title="Go to Homepage"
        >
          <img src={logoUrl} alt="DealMate" style={{ maxHeight: '54px' }} />
        </div>
        {/* <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button> */}
      </div>

      <div className={`sidebar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {menuItems.map((item) => (
          <div key={item.id}>
            <div
              className={`menu-item ${activePage === item.id ||
                (item.id === 'category' && categorySubItems.some(s => s.id === activePage)) ||
                (item.id === 'products' && productSubItems.some(s => s.id === activePage))
                ? 'active' : ''
                }`}
              onClick={() => handleMenuClick(item.id)}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.hasSubmenu && (
                <ChevronDown
                  size={16}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                  }}
                  style={{
                    transition: 'transform 0.2s ease',
                    transform: expanded[item.id] ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              )}
            </div>

            {item.hasSubmenu && item.id === 'category' && expanded.category && (
              <div className="submenu">
                {categorySubItems.map(sub => (
                  <div
                    key={sub.id}
                    className={`submenu-item ${activePage === sub.id ? 'active' : ''}`}
                    onClick={() => setActivePage(sub.id)}
                  >
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
            {item.hasSubmenu && item.id === 'products' && expanded.products && (
              <div className="submenu">
                {productSubItems.map(sub => (
                  <div
                    key={sub.id}
                    className={`submenu-item ${activePage === sub.id ? 'active' : ''}`}
                    onClick={() => setActivePage(sub.id)}
                  >
                    {sub.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSidebar;
