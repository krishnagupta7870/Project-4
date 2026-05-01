import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../utils/api';
import '../../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      // ✅ STORE TOKEN
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }

      // ✅ STORE USER (needed for Navbar avatar)
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // ✅ REDIRECT BASED ON ROLE
      if (data?.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login failed:', err);
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/google', {
        token: credentialResponse.credential
      });

      if (data?.token) localStorage.setItem('token', data.token);
      if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err?.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" role="region" aria-label="Login">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            className="form-control"
            type="text"
            placeholder="Email or Phone"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email or Phone"
          />

          <input
            className="form-control"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div style={{ margin: '20px 0', textAlign: 'center', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
          <span style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            padding: '0 10px',
            color: '#666',
            fontSize: '14px'
          }}>or</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
          />
        </div>

        <div className="forgot-wrap mt-1">
          <div>
            <span className="muted">Don't have an account?</span>{' '}
            <Link to="/signup">Sign up</Link>
          </div>

          <Link
            to="/forgot-password"
            className="small-btn"
            style={{ textDecoration: 'none' }}
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
