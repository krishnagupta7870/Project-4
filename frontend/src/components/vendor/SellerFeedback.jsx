import React, { useState } from "react";
import "../../styles/seller.css";

export default function SellerFeedback() {
  const [message, setMessage] = useState("");

  const submitFeedback = () => {
    if (!message.trim()) return alert("Please write feedback");
    alert("Feedback submitted successfully");
    setMessage("");
  };

  return (
    <div className="seller-form-card" style={{ maxWidth: '600px', margin: '0' }}>
      <div className="seller-form-header">
        <h1>Seller Feedback</h1>
        <p>Share your experience or report an issue</p>
      </div>

      <div className="seller-form-body">
        <div className="form-group">
            <textarea
                className="form-textarea"
                placeholder="Write your feedback here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="6"
            />
        </div>
        
        <div className="form-actions">
            <button className="btn-primary" onClick={submitFeedback}>Submit Feedback</button>
        </div>
      </div>
    </div>
  );
}
