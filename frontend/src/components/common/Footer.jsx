import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Mail,
    Phone,
    MapPin,
    ArrowRight
} from 'lucide-react';
import '../../styles/footer.css';

const Footer = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    const handleCategoryClick = (slug) => {
        navigate(`/category/${slug}`);
        window.scrollTo(0, 0);
    };

    return (
        <footer className="dm-footer">
            <div className="dm-footer-container">
                <div className="dm-footer-grid">
                    {/* Brand Section */}
                    <div className="dm-footer-brand">
                        <div className="footer-brand-text">
                            <a href="/">DEAL<span>MATE</span></a>
                        </div>
                        <p>
                            Your trusted marketplace for buying and selling second-hand goods.
                            Join thousands of users and find great deals today.
                        </p>
                        <div className="dm-footer-social">
                            <a href="#" className="dm-social-icon" aria-label="Facebook"><Facebook size={18} /></a>
                            <a href="#" className="dm-social-icon" aria-label="Twitter"><Twitter size={18} /></a>
                            <a href="#" className="dm-social-icon" aria-label="Instagram"><Instagram size={18} /></a>
                            <a href="#" className="dm-social-icon" aria-label="Youtube"><Youtube size={18} /></a>
                        </div>
                    </div>

                    {/* Marketplace */}
                    <div className="dm-footer-section">
                        <h4>Marketplace</h4>
                        <ul className="dm-footer-links">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('cars'); }}>Cars & Vehicles</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('mobiles'); }}>Mobile Phones</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('computers-laptops'); }}>Electronics</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); handleCategoryClick('houses-sale'); }}>Real Estate</a></li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="dm-footer-section">
                        <h4>Quick Links</h4>
                        <ul className="dm-footer-links">
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/browse'); }}>Browse All Ads</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/list-your-product'); }}>Post an Ad</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/verify-seller'); }}>Verify Seller</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/wishlist'); }}>My Wishlist</a></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="dm-footer-section">
                        <h4>Support</h4>
                        <ul className="dm-footer-links">
                            <li><a href="/help" onClick={(e) => { e.preventDefault(); navigate('/help'); window.scrollTo(0, 0); }}>Help Center</a></li>
                            <li><a href="/safety" onClick={(e) => { e.preventDefault(); navigate('/safety'); window.scrollTo(0, 0); }}>Safety Tips</a></li>
                            <li><a href="/support" onClick={(e) => { e.preventDefault(); navigate('/support'); window.scrollTo(0, 0); }}>Contact Us</a></li>
                            <li><a href="/faqs" onClick={(e) => { e.preventDefault(); navigate('/faqs'); window.scrollTo(0, 0); }}>FAQs</a></li>
                        </ul>
                    </div>

                    {/* Contact & Community */}
                    <div className="dm-footer-section dm-footer-newsletter">
                        <h4>Community</h4>
                        <p>Subscribe for exclusive deals and local updates.</p>
                        <form className="dm-newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Email address"
                                className="dm-newsletter-input"
                                required
                            />
                            <button type="submit" className="dm-newsletter-btn" aria-label="Subscribe">
                                <ArrowRight size={20} />
                            </button>
                        </form>

                        <div className="dm-contact-info">
                            <div className="dm-contact-item">
                                <Mail size={16} /> <span>support@dealmate.com</span>
                            </div>
                            <div className="dm-contact-item">
                                <Phone size={16} /> <span>+977 1-4000000</span>
                            </div>
                            <div className="dm-contact-item">
                                <MapPin size={16} /> <span>Nepal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="dm-footer-bottom">
                    <div className="dm-copyright">
                        © {currentYear} DEALMATE. All rights reserved.
                    </div>
                    <div className="dm-footer-legal">
                        <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); window.scrollTo(0, 0); }}>Privacy Policy</a>
                        <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms'); window.scrollTo(0, 0); }}>Terms of Service</a>
                        <a href="/cookies" onClick={(e) => { e.preventDefault(); navigate('/cookies'); window.scrollTo(0, 0); }}>Cookies Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
