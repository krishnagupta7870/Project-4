import React from 'react';
import { Shield, Eye, Lock, FileText, Globe, Mail } from 'lucide-react';
import '../styles/legal.css';

const PrivacyPolicy = () => {
    return (
        <div className="legal-page-container">
            <div className="legal-header" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
                <div className="hub-tag" style={{ color: '#4aa3a1', background: 'rgba(74, 163, 161, 0.15)' }}>Data Protection</div>
                <h1>Privacy Policy</h1>
                <p>Your privacy is paramount. Learn how we handle your data with care.</p>
            </div>

            <div className="legal-layout" style={{ gridTemplateColumns: '1fr' }}>
                <main className="legal-body">
                    <div className="last-updated-badge">Effective Date: January 12, 2026</div>

                    <div className="legal-sections">
                        <section className="legal-section-block">
                            <h2><Eye size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 1. Overview</h2>
                            <p>This Privacy Policy describes how DealMate ("we", "us", or "our") collects, uses, and shares your personal information when you visit or use our platform. By using DealMate, you consent to the practices described in this policy.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2><FileText size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 2. Information We Collect</h2>
                            <p>We collect information that you provide to us directly, as well as information collected automatically:</p>
                            <ul>
                                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register.</li>
                                <li><strong>Listing Data:</strong> Images, descriptions, and location data associated with the items you post for sale.</li>
                                <li><strong>Communications:</strong> Content of messages exchanged through our in-app chat system.</li>
                                <li><strong>Technical Data:</strong> IP address, browser type, and device information collected via cookies.</li>
                            </ul>
                        </section>

                        <section className="legal-section-block">
                            <h2><Lock size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 3. How We Secure Your Data</h2>
                            <p>We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure. This includes encryption of sensitive data and regular security audits of our systems.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2><Globe size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 4. Data Retention</h2>
                            <p>We retain your personal information only for as long as necessary to provide you with our services and as described in this policy. You may request the deletion of your account and associated data at any time.</p>
                        </section>
                    </div>

                    <div className="legal-footer-contact">
                        <Mail size={20} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#4aa3a1' }} />
                        For privacy-related inquiries, contact our Data Protection Officer at <a href="mailto:privacy@dealmate.com">privacy@dealmate.com</a>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
