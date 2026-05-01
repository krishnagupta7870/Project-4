import React from 'react';
import { BookOpen, ShoppingBag, ShieldCheck, User, ArrowRight, Lightbulb, HelpCircle } from 'lucide-react';
import '../styles/support-hub.css';

const HelpCenter = () => {
    const categories = [
        {
            icon: <User size={28} />,
            title: "Getting Started",
            desc: "Learn how to set up your profile and start your DealMate journey."
        },
        {
            icon: <ShoppingBag size={28} />,
            title: "Buying on DealMate",
            desc: "Find out how to search, contact sellers, and close great deals safely."
        },
        {
            icon: <ArrowRight size={28} />,
            title: "Selling on DealMate",
            desc: "Master the art of listing items, managing ads, and chatting with buyers."
        },
        {
            icon: <ShieldCheck size={18} />,
            title: "Trust & Safety",
            desc: "Understand our verification system and how we keep our community safe."
        }
    ];

    return (
        <div className="support-hub-container">
            <div className="support-hub-header">
                <div className="hub-tag">Help Center</div>
                <h1>How can we assist you?</h1>
                <p>Welcome to DealMate Support. Explore our comprehensive guides to mastering the marketplace.</p>
                <div className="search-wrapper">
                    <HelpCircle className="search-icon-float" size={24} />
                    <input className="professional-search" type="text" placeholder="Search guides (e.g., 'how to sell')" />
                </div>
            </div>

            <div className="support-hub-content">
                <div className="support-cards-grid">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="support-card">
                            <div className="card-icon">{cat.icon}</div>
                            <h3>{cat.title}</h3>
                            <p>{cat.desc}</p>
                            <div style={{ color: '#4aa3a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                View Articles <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hub-main-content">
                    <div className="hub-section">
                        <h2><Lightbulb size={24} /> Trending Topics</h2>
                        <div className="faq-list">
                            <div className="faq-item">
                                <div className="faq-question">Making your first successful purchase</div>
                                <div className="faq-answer">Always start by checking the seller's Trust Score. Once you find an item, use our in-app chat to ask questions about the item's condition and history. Always meet in a public place for the handover.</div>
                            </div>
                            <div className="faq-item">
                                <div className="faq-question">Understanding the Trust Score system</div>
                                <div className="faq-answer">Our Trust Score is a dynamic metric ranging from 0-100. It's built on four pillars: identity verification, user reviews, account age, and community activity. Higher scores represent higher reliability.</div>
                            </div>
                            <div className="faq-item">
                                <div className="faq-question">Pro-tips for sellers to sell faster</div>
                                <div className="faq-answer">Listings with 5+ high-quality images under good lighting sell 3x faster. Be descriptive but honest—transparency builds trust and prevents returns or complaints.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
