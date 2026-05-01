// src/components/auth/ForgetPassword.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import '../../styles/auth.css';

export default function ForgetPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Step 1: Request reset code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) return setError("Please enter your email.");

    setLoading(true);
    try {
      const { data } = await api.post("/auth/request-reset", { email });

      let msg = data?.message || "If an account exists, a reset code has been sent.";
      if (data?.hint) {
        msg = (
          <span>
            {data.isPhoneMatch ? "We found your account. " : ""}
            {data.hint}
          </span>
        );
      }
      setSuccess(msg);
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to request reset code.");
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.post("/auth/request-reset", { email });
      setSuccess(data?.message || "Reset code resent.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  };

  // Step 2: Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !code || !newPassword || !confirmPassword)
      return setError("Please fill all fields.");

    if (newPassword !== confirmPassword)
      return setError("Passwords do not match.");

    if (newPassword.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset", {
        email,
        code,
        newPassword,
      });

      setSuccess(data?.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err?.response?.data?.message || "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        {step === 1 ? (
          <>
            <h2>Reset password</h2>
            <p className="subtitle">Enter your email or phone and we'll send a reset code.</p>

            <form onSubmit={handleRequestCode}>
              <input
                className="form-control"
                type="text"
                placeholder="Email or Phone"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {error && <div className="form-error">{error}</div>}
              {success && <div className="form-success">{success}</div>}

              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset code"}
              </button>
            </form>

            <div className="auth-toggle mt-1">
              <Link to="/login">Back to login</Link>
            </div>
          </>
        ) : (
          <>
            <h2>Enter reset code</h2>
            <p className="subtitle">We emailed a 6-digit code — enter it below with your new password.</p>

            <form onSubmit={handleReset}>
              <input
                className="form-control"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                className="form-control"
                type="text"
                inputMode="numeric"
                placeholder="6-digit reset code"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                required
              />

              <div className="row password-row">
                <div className="input-wrapper half">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-wrapper half">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="resend-btn">
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Resending..." : "Resend code"}
                </button>
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </button>

            </form>


            {/* bottom row */}
            <div className='auth-toggle mt-1' >

              <Link to="/login" className="small-btn">Back to login</Link>


            </div>
          </>
        )}

      </div>
    </div>
  );
}
