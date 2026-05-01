import React, { useState } from "react";
import api from "../utils/api";
import "../styles/support.css";
import { CheckCircle, AlertCircle } from "lucide-react";

const Support = () => {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post("/api/support", { email, subject, message });
      setSuccess(true);
      setEmail("");
      setSubject("");
      setMessage("");
      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <h2>Contact Support</h2>
        <p>We're here to help! Send us a message and we'll respond as soon as possible.</p>
      </div>

      {success && (
        <div className="alert-success">
          <CheckCircle size={20} />
          <span>Message sent successfully! We will get back to you soon.</span>
        </div>
      )}

      {error && (
        <div style={{ 
          padding: "1rem", 
          background: "#fee2e2", 
          color: "#b91c1c", 
          borderRadius: "8px", 
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="support-form">
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Subject</label>
          <input
            type="text"
            className="form-input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="How can we help?"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea
            className="form-textarea"
            rows="5"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Describe your issue or question..."
          ></textarea>
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? "Sending Message..." : "Send Message"}
        </button>
      </form>
    </div>
  );
};

export default Support;
