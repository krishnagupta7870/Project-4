import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Info, MessageSquare } from 'lucide-react';
import '../styles/support-hub.css';

const FAQs = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const faqs = [
        {
            category: "General Information",
            items: [
                { q: "Is DealMate available all over Nepal?", a: "Yes, DealMate is a nationwide platform serving users from Kathmandu to Pokhara and beyond." },
                { q: "Is it free to use DealMate?", a: "Registering, browsing, and posting standard ads is completely free. We may offer premium boosting features in the future." }
            ]
        },
        {
            category: "Buying & Selling",
            items: [
                { q: "How do I know if a seller is trustworthy?", a: "Always look for the 'Trust Score' on the seller's profile. You can also view their history and reviews from other buyers." },
                { q: "What should I do if an item is faulty?", a: "Since we are a C2C marketplace, we recommend thorough inspection before payment. If a user misrepresented an item, report them via the 'Report' button." }
            ]
        },
        {
            category: "Account Management",
            items: [
                { q: "Can I edit my listed ad?", a: "Yes, you can manage and edit your ads anytime from your 'My Listings' dashboard." },
                { q: "How do I reset my password?", a: "Go to the login page and click 'Forgot Password' to receive a reset link via your registered email." }
            ]
        }
    ];

    return (
        <div className="support-hub-container">
            <div className="support-hub-header" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)' }}>
                <div className="hub-tag" style={{ color: '#60a5fa', background: 'rgba(96, 165, 250, 0.15)' }}>Knowledge Base</div>
                <h1>Frequently Asked Questions</h1>
                <p>Everything you need to know about DealMate, all in one place.</p>
                <div className="search-wrapper">
                    <Search className="search-icon-float" size={24} />
                    <input
                        className="professional-search"
                        type="text"
                        placeholder="Search for answers..."
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="support-hub-content">
                <div className="hub-main-content">
                    {faqs.map((group, idx) => (
                        <div key={idx} className="hub-section">
                            <h2>{group.category}</h2>
                            <div className="faq-list">
                                {group.items.filter(item =>
                                    item.q.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((item, i) => (
                                    <div key={i} className="faq-item">
                                        <div className="faq-question">
                                            {item.q}
                                            <ChevronDown size={20} style={{ color: '#94a3b8' }} />
                                        </div>
                                        <div className="faq-answer">
                                            {item.a}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: '80px', textAlign: 'center', background: '#f8fafc', padding: '40px', borderRadius: '24px' }}>
                        <MessageSquare size={40} style={{ color: '#4aa3a1', marginBottom: '20px' }} />
                        <h3>Still have questions?</h3>
                        <p style={{ color: '#64748b', marginBottom: '24px' }}>Our dedicated support team is ready to help you with any issues.</p>
                        <a href="/support" className="contact-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>Contact Support Team</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQs;
