// src/components/auth/Register.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../../utils/auth';
import '../../styles/auth.css';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errors, setErrors] = useState({});

  const encodedEmail = encodeURIComponent(email.trim());
  const navigate = useNavigate();

  const validateField = (fieldName, value) => {
    let error = '';
    switch (fieldName) {
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          error = 'Confirm Password is required';
        } else if (value !== password) {
          error = 'Passwords do not match';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value.trim())) {
          error = 'Phone number must be exactly 10 digits';
        }
        break;
      case 'name':
        if (!value.trim()) {
          error = 'Full name is required';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    // Map input name to state name if different, though here they might match or we handle manually
    // Actually, since we control inputs with specific handlers, let's pass the specific key to a helper
    // Or simpler: standardize name attribute on inputs to match our state keys
  };

  // Validate single field on blur (only if not empty)
  const onBlurField = (field, value) => {
    // If field is empty, don't show "Required" error immediately on blur
    // This allows tabbing through without red errors flashing
    if (!value.trim()) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return;
    }

    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Handler to clear error on change
  const onChangeField = (setter, field, value) => {
    setter(value);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // tiny password strength estimator
  const pwStrength = useMemo(() => {
    if (!password) return { label: '', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const label = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
    return { label, score };
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMsg(null);
    // navigate(`/verify-otp?email=${encodedEmail}`);


    // validation
    const newErrors = {};
    newErrors.name = validateField('name', name);
    newErrors.email = validateField('email', email);
    newErrors.phone = validateField('phone', phone);
    newErrors.password = validateField('password', password);
    newErrors.confirmPassword = validateField('confirmPassword', confirmPassword);

    // Remove empty error strings
    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key]) delete newErrors[key];
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // call your helper (keeps the same signature you used previously)
      const resp = await registerUser(name.trim(), email.trim(), phone.trim(), password, confirmPassword);

      // const msg = resp?.data?.message || 'Registered successfully. Please verify your email.';
      // setSuccessMsg(msg);
      toast.success('Verification code sent!', { duration: 4000 });

      // redirect to verify-otp page with email prefilled
      // Immediate redirect
      navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        err?.message ||
        'Registration failed. Try again.';

      // Handle duplicates specifically
      if (err?.response?.status === 409) {
        if (errorMsg.toLowerCase().includes('email')) {
          setErrors(prev => ({ ...prev, email: errorMsg }));
        } else if (errorMsg.toLowerCase().includes('phone')) {
          setErrors(prev => ({ ...prev, phone: errorMsg }));
        } else {
          setServerError(errorMsg);
        }
      } else {
        setServerError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" aria-labelledby="signup-heading">
        <h2 id="signup-heading">Create an Account</h2>
        <p className="subtitle">Sign up to list and buy great products</p>

        <form onSubmit={handleSubmit} noValidate>
          <input
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => onChangeField(setName, 'name', e.target.value)}
            onBlur={(e) => onBlurField('name', e.target.value)}
            required
            aria-label="Full name"
          />
          {errors.name && <div className="form-error">{errors.name}</div>}

          <input
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => onChangeField(setEmail, 'email', e.target.value)}
            onBlur={(e) => onBlurField('email', e.target.value)}
            required
            aria-label="Email address"
          />
          {errors.email && <div className="form-error">{errors.email}</div>}

          <input
            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => onChangeField(setPhone, 'phone', e.target.value)}
            onBlur={(e) => onBlurField('phone', e.target.value)}
            aria-label="Phone number"
          />
          {errors.phone && <div className="form-error">{errors.phone}</div>}

          <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="half">
              <input
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => onChangeField(setPassword, 'password', e.target.value)}
                onBlur={(e) => onBlurField('password', e.target.value)}
                required
                aria-label="Password"
                style={{ width: '100%' }}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <div className="half">
              <input
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => onChangeField(setConfirmPassword, 'confirmPassword', e.target.value)}
                onBlur={(e) => onBlurField('confirmPassword', e.target.value)}
                required
                aria-label="Confirm password"
                style={{ width: '100%' }}
              />
              {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
            </div>
          </div>
          {serverError && <div className="form-error" role="alert">{serverError}</div>}
          {successMsg && <div className="form-success" role="status">{successMsg}</div>}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <div className="auth-toggle">
            Already have an account?
            <Link to="/login" style={{ marginLeft: 8 }}>Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;
