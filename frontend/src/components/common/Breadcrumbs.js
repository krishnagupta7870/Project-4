import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import '../../styles/breadcrumbs.css';

const Breadcrumbs = ({ category, subCategory, brand, productName }) => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    // If we are on Home, don't show breadcrumbs
    if (location.pathname === '/' || location.pathname === '') return null;

    return (
        <nav className="dm-breadcrumbs">
            <div className="dm-breadcrumb-container">
                <Link to="/" className="dm-breadcrumb-item home">
                    <Home size={16} />
                    <span>Home</span>
                </Link>
                <ChevronRight size={14} className="dm-breadcrumb-separator" />

                {/* Dynamic part based on props (for category/product pages) */}
                {(category || pathnames[0] === 'category') && (
                    <>
                        <Link
                            to={`/category/${category || pathnames[1]}`}
                            className={`dm-breadcrumb-item ${!subCategory && !brand && !productName && pathnames[0] === 'category' ? 'active' : ''}`}
                        >
                            {category || decodeURIComponent(pathnames[1] || '')}
                        </Link>
                        {(subCategory || brand || productName) && (
                            <ChevronRight size={14} className="dm-breadcrumb-separator" />
                        )}
                    </>
                )}

                {subCategory && (
                    <>
                        <Link
                            to={`/category/${category}?subCategory=${encodeURIComponent(subCategory)}`}
                            className={`dm-breadcrumb-item ${!brand && !productName ? 'active' : ''}`}
                        >
                            {subCategory}
                        </Link>
                        {(brand || productName) && (
                            <ChevronRight size={14} className="dm-breadcrumb-separator" />
                        )}
                    </>
                )}

                {brand && (
                    <>
                        <Link
                            to={`/browse?category=${encodeURIComponent(category || '')}&subCategory=${encodeURIComponent(subCategory || '')}&brand=${encodeURIComponent(brand)}`}
                            className={`dm-breadcrumb-item ${!productName ? 'active' : ''}`}
                        >
                            {brand}
                        </Link>
                        {productName && (
                            <ChevronRight size={14} className="dm-breadcrumb-separator" />
                        )}
                    </>
                )}

                {productName && (
                    <span className="dm-breadcrumb-item active" title={productName}>
                        {productName}
                    </span>
                )}

                {/* Fallback for other pages (like Profile, Wishlist, etc.) */}
                {!category && !productName && pathnames[0] !== 'category' && pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    // Custom mapping for common paths
                    const labelMap = {
                        'browse': 'All Products',
                        'profile': 'My Profile',
                        'wishlist': 'My Wishlist',
                        'support': 'Support',
                        'help': 'Help Center',
                        'safety': 'Safety Tips',
                        'faqs': 'FAQs',
                        'privacy': 'Privacy Policy',
                        'terms': 'Terms of Service',
                        'cookies': 'Cookies Policy',
                        'seller': 'Seller Dashboard',
                        'list-your-product': 'List Product',
                        'verify-seller': 'Verify Seller'
                    };

                    const label = labelMap[value.toLowerCase()] || decodeURIComponent(value);

                    return last ? (
                        <span key={to} className="dm-breadcrumb-item active">
                            {label}
                        </span>
                    ) : (
                        <React.Fragment key={to}>
                            <Link to={to} className="dm-breadcrumb-item">
                                {label}
                            </Link>
                            <ChevronRight size={14} className="dm-breadcrumb-separator" />
                        </React.Fragment>
                    );
                })}
            </div>
        </nav>
    );
};

export default Breadcrumbs;
