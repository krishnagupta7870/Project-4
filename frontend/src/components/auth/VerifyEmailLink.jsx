// frontend/src/components/auth/VerifyEmailLink.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/auth.css';

export default function VerifyEmailLink() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [status, setStatus] = useState('Verifying...');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !email) {
      setStatus('Invalid verification link.');
      return;
    }

    (async () => {
      try {
        const { data } = await api.post('/auth/verify-email', { token, email });
        setStatus(data?.message || 'Email verified successfully.');
        setTimeout(() => navigate('/login'), 1200);
      } catch (err) {
        setStatus(err?.response?.data?.message || 'Verification failed or expired.');
      }
    })();
  }, [token, email, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Email verification</h2>
        <p className="subtitle">We are verifying your email — please wait.</p>
        <div style={{ marginTop: 12 }}>
          <div className={status.toLowerCase().includes('failed') ? 'form-error' : 'form-success'}>{status}</div>
        </div>
      </div>
    </div>
  );
}
