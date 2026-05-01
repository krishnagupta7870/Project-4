import React from 'react';
import { Shield, Eye, Lock, CheckCircle2, AlertTriangle, Users, MapPin, DollarSign } from 'lucide-react';
import '../styles/support-hub.css';

const SafetyTips = () => {
    return (
        <div className="support-hub-container">
            <div className="support-hub-header" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)' }}>
                <div className="hub-tag" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' }}>Safe Trading</div>
                <h1>Your Safety, Our Priority</h1>
                <p>Learn how to stay protected and trade with confidence on Nepal's most trusted marketplace.</p>
            </div>

            <div className="support-hub-content">
                <div className="support-cards-grid">
                    <div className="support-card">
                        <div className="card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><Users size={28} /></div>
                        <h3>Trusted Interactions</h3>
                        <p>Communicate exclusively through DealMate's secure chat to maintain a record of your conversation.</p>
                    </div>
                    <div className="support-card">
                        <div className="card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><MapPin size={28} /></div>
                        <h3>Smart Meetups</h3>
                        <p>Prefer public locations like malls or cafes. Never share your home address with strangers.</p>
                    </div>
                    <div className="support-card">
                        <div className="card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}><DollarSign size={28} /></div>
                        <h3>Secure Payments</h3>
                        <p>Always inspect the item first. We recommend cash or secure digital transfers only after physical verification.</p>
                    </div>
                </div>

                <div className="hub-main-content">
                    <div className="hub-section">
                        <h2><CheckCircle2 size={24} style={{ color: '#16a34a' }} /> Mandatory Safety Checklist</h2>
                        <div className="safety-checklist">
                            <div className="safety-item">
                                <div className="safety-check"><Shield size={16} /></div>
                                <div>
                                    <h4>Verify Member Profiles</h4>
                                    <p>Check the member's join date and trust score. Verified members are generally more reliable.</p>
                                </div>
                            </div>
                            <div className="safety-item">
                                <div className="safety-check"><Shield size={16} /></div>
                                <div>
                                    <h4>Daylight Meetings</h4>
                                    <p>Try to schedule meetups during daylight hours in busy areas with CCTV coverage for extra security.</p>
                                </div>
                            </div>
                            <div className="safety-item">
                                <div className="safety-check"><Shield size={16} /></div>
                                <div>
                                    <h4>Bring a Friend</h4>
                                    <p>When meeting a buyer/seller for the first time, take a friend or family member along with you.</p>
                                </div>
                            </div>
                            <div className="safety-item">
                                <div className="safety-check"><Shield size={16} /></div>
                                <div>
                                    <h4>Trust Your Gut</h4>
                                    <p>If a deal feels suspicious or the user is pressuring you, walk away and report the user immediately.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hub-section" style={{ background: '#fff7ed', padding: '40px', borderRadius: '20px', border: '1px solid #ffedd5' }}>
                        <h2 style={{ color: '#9a3412', marginBottom: '20px' }}><AlertTriangle size={24} /> What to Avoid</h2>
                        <ul style={{ color: '#c2410c', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <li style={{ display: 'flex', gap: '10px' }}>• Never pay an 'advance' or 'shipping fee' to see an item.</li>
                            <li style={{ display: 'flex', gap: '10px' }}>• Avoid users who ask to move the conversation to WhatsApp or Telegram immediately.</li>
                            <li style={{ display: 'flex', gap: '10px' }}>• Do not click on suspicious payment links sent via chat or SMS.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyTips;
