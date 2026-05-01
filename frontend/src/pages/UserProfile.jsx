import React, { useState, useEffect } from "react";
import api from "../utils/api";
import {
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldIcon,
  ArrowRight
} from "lucide-react";
import "../styles/profile.css";

const UserProfile = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await api.put("/users/profile", {
        name,
        email,
        password: password || undefined,
      });

      localStorage.setItem("user", JSON.stringify(data));
      setMessage({ type: "success", text: "Profile updated successfully" });
      setPassword("");
      setConfirmPassword("");

      // Re-sync name/email in state just in case
      setName(data.name);
      setEmail(data.email);
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-placeholder">
              {name ? name.charAt(0).toUpperCase() : <User />}
            </div>
          </div>
          <h1>Account Settings</h1>
          <p>Manage your profile information and security preferences.</p>
        </div>

        {/* Form Section */}
        <div className="profile-body">
          {message && (
            <div className={`profile-alert ${message.type === "error" ? "profile-alert-error" : "profile-alert-success"}`}>
              {message.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="profile-form">
            <div className="profile-section-title">
              <User size={14} /> Personal Information
            </div>

            <div className="profile-form-group">
              <label>Full Name</label>
              <div className="profile-input-wrapper">
                <User className="profile-input-icon" size={18} />
                <input
                  type="text"
                  className="profile-form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Email Address</label>
              <div className="profile-input-wrapper">
                <Mail className="profile-input-icon" size={18} />
                <input
                  type="email"
                  className="profile-form-control"
                  value={email}
                  disabled
                  placeholder="your@email.com"
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                Email cannot be changed for security purposes.
              </span>
            </div>

            <div className="profile-section-title" style={{ marginTop: '20px' }}>
              <Lock size={14} /> Security & Password
            </div>

            <div className="profile-form-group">
              <label>New Password</label>
              <div className="profile-input-wrapper">
                <Lock className="profile-input-icon" size={18} />
                <input
                  type="password"
                  className="profile-form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>

            <div className="profile-form-group">
              <label>Confirm Password</label>
              <div className="profile-input-wrapper">
                <ShieldCheck className="profile-input-icon" size={18} />
                <input
                  type="password"
                  className="profile-form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  "Saving Changes..."
                ) : (
                  <>
                    <Save size={18} /> Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
