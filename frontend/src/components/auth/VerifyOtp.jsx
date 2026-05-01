import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/auth.css';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ READ EMAIL FROM URL (no backend change)
  const params = new URLSearchParams(location.search);
  const email = params.get('email');

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (!email || !code) {
      setMsg('Verification code required');
      return;
    }

    setLoading(true);
    try {
      // ✅ SAME API PAYLOAD AS BEFORE
      const { data } = await api.post('/auth/verify-otp', {
        email,
        code
      });

      setMsg(data.message || 'Verified');

      // ✅ redirect after success
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Verify your email</h2>
        <p className="subtitle">Enter the 6-digit code sent to your email</p>

        <form onSubmit={submit}>
          {/* ❌ EMAIL INPUT REMOVED */}

          <input
            className="form-control"
            type="text"
            placeholder="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          {msg && (
            <div
              className={
                msg.toLowerCase().includes('fail')
                  ? 'form-error'
                  : 'form-success'
              }
            >
              {msg}
            </div>
          )}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
