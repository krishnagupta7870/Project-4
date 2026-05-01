import React from 'react';
import { Database, Settings, Info, Cookie, CheckCircle, Mail } from 'lucide-react';
import '../styles/legal.css';

const CookiesPolicy = () => {
    return (
        <div className="legal-page-container">
            <div className="legal-header" style={{ background: 'linear-gradient(135deg, #0f172a 10%, #172554 100%)' }}>
                <div className="hub-tag" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.15)' }}>Tracking Technologies</div>
                <h1>Cookies Policy</h1>
                <p>How we use cookies to improve your experience.</p>
            </div>

            <div className="legal-layout" style={{ gridTemplateColumns: '1fr' }}>
                <main className="legal-body">
                    <div className="last-updated-badge">Last Reviewed: January 12, 2026</div>

                    <div className="legal-sections">
                        <section className="legal-section-block">
                            <h2><Cookie size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 1. What are Cookies?</h2>
                            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide a better, more personalized experience.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2><Database size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 2. Categorization of Cookies</h2>
                            <p>We use the following types of cookies on DealMate:</p>
                            <ul>
                                <li><strong>Essential Cookies:</strong> Required for core site functionality like logging in and security.</li>
                                <li><strong>Preference Cookies:</strong> Remember settings like your language or city.</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our site so we can improve it.</li>
                            </ul>
                        </section>

                        <section className="legal-section-block">
                            <h2><Settings size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 3. Managing Your Preferences</h2>
                            <p>You can control and manage cookies through your browser settings. Please note that removing or blocking cookies can impact your user experience and parts of the website may no longer be fully accessible.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2 style={{ color: '#0ea5e9' }}><CheckCircle size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Consent</h2>
                            <p>By continuing to use our platform, you agree to our use of cookies as described in this policy.</p>
                        </section>
                    </div>

                    <div className="legal-footer-contact">
                        Want a more technical breakdown? Email our support team at <a href="mailto:support@dealmate.com">support@dealmate.com</a>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CookiesPolicy;
