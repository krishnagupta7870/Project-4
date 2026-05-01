import React from 'react';
import { Scale, Users, AlertCircle, ShieldAlert } from 'lucide-react';
import '../styles/legal.css';

const TermsOfService = () => {
    return (
        <div className="legal-page-container">
            <div className="legal-header" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
                <div className="hub-tag" style={{ color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)' }}>User Agreement</div>
                <h1>Terms of Service</h1>
                <p>The rules and guidelines for our community members.</p>
            </div>

            <div className="legal-layout" style={{ gridTemplateColumns: '1fr' }}>
                <main className="legal-body">
                    <div className="last-updated-badge">Version 1.2 • Jan 2026</div>

                    <div className="legal-sections">
                        <section className="legal-section-block">
                            <h2><Scale size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 1. Acceptance of Terms</h2>
                            <p>By accessing or using the DealMate website or mobile application, you agree to be bound by these Terms of Service and all applicable laws and regulations in Nepal. If you do not agree with any of these terms, you are prohibited from using the platform.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2><Users size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 2. User Accounts</h2>
                            <p>To use certain features, you must create an account. You agree to provide accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your account credentials.</p>
                        </section>

                        <section className="legal-section-block">
                            <h2><ShieldAlert size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 3. Marketplace Policies</h2>
                            <p>DealMate is a venue that allows users to offer, sell, and buy goods. We are not directly involved in the transaction between buyers and sellers. You agree that:</p>
                            <ul>
                                <li>You will not post any prohibited or illegal items.</li>
                                <li>All descriptions and images will be honest and accurate.</li>
                                <li>You will respect the intellectual property rights of others.</li>
                                <li>Fraudulent activity will result in immediate account termination.</li>
                            </ul>
                        </section>

                        <section className="legal-section-block">
                            <h2><AlertCircle size={24} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> 4. Limitation of Liability</h2>
                            <p>DealMate shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our services, including transactions between users.</p>
                        </section>
                    </div>

                    <div className="legal-footer-contact">
                        By continuing to use our platform, you acknowledge that you have read and understood these terms. <br />
                        Questions? Contact us at <a href="mailto:legal@dealmate.com">legal@dealmate.com</a>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TermsOfService;
