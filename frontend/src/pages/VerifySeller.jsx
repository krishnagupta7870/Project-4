import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/seller.css";

export default function VerifySeller() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle"); // idle, pending, approved, not_applied
  const [rejectionReason, setRejectionReason] = useState("");

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    documentType: "",
    docFront: null,
    docBack: null
  });

  const [preview, setPreview] = useState({
    front: null,
    back: null
  });

  // Check Status on Mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const res = await fetch("http://localhost:5000/api/vendor/verification/status", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.exists) {
          if (data.status === "approved") {
            // Already a seller -> Go to Dashboard
            navigate("/seller");
          } else if (data.status === "pending") {
            setStatus("pending");
          } else if (data.status === "rejected") {
            setStatus("rejected");
            setRejectionReason(data.adminComment);
          } else {
            // Fallback
            setStatus("pending"); 
          }
        } else {
          setStatus("not_applied");
        }
      } catch (err) {
        console.error("Failed to check status", err);
        setStatus("not_applied"); // Fallback
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    const name = e.target.name;
    if (!file) return;

    setForm({ ...form, [name]: file });
    const imageUrl = URL.createObjectURL(file);
    setPreview({ ...preview, [name === "docFront" ? "front" : "back"]: imageUrl });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("firstName", form.firstName);
      data.append("lastName", form.lastName);
      data.append("address", form.address);
      data.append("phone", form.phone);
      data.append("documentType", form.documentType);
      data.append("docFront", form.docFront);

      if (form.documentType !== "license") {
        data.append("docBack", form.docBack);
      }

      const res = await fetch("http://localhost:5000/api/vendor/verification/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data
      });

      if (res.ok) {
        setStatus("pending");
      } else {
        alert("Failed to submit KYC");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting form");
    }
  };

  if (loading) {
    return (
      <div className="seller-app" style={{ justifyContent: "center", alignItems: "center" }}>
        <div className="spinner">Checking status...</div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="seller-app" style={{ justifyContent: "center", padding: "40px" }}>
        <div className="seller-form-card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
          <h2>Verification Pending</h2>
          <p style={{ color: "#6b7280", marginTop: "10px" }}>
            Your seller verification request has been submitted and is under review by our admin team.
            Please check back later.
          </p>
          <button 
            className="btn-primary" 
            style={{ marginTop: "20px" }}
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="seller-app" style={{ justifyContent: "center", padding: "40px" }}>
        <div className="seller-form-card" style={{ padding: "40px", textAlign: "center", maxWidth: "500px", borderTop: "4px solid #ef4444" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
          <h2 style={{ color: "#ef4444" }}>Verification Rejected</h2>
          <p style={{ color: "#374151", marginTop: "10px", fontWeight: "500" }}>
            Reason: {rejectionReason || "Documents did not meet requirements."}
          </p>
          <p style={{ color: "#6b7280", marginTop: "10px" }}>
            Please review your details and try again.
          </p>
          <button 
            className="btn-primary" 
            style={{ marginTop: "20px" }}
            onClick={() => setStatus("not_applied")}
          >
            Re-apply Now
          </button>
        </div>
      </div>
    );
  }

  const showBack = form.documentType === "citizenship" || form.documentType === "passport";
  const showUpload = !!form.documentType;

  return (
    <div className="seller-app" style={{ padding: "40px 20px", display: "block" }}>
      <div className="seller-form-card" style={{ margin: "0 auto", padding: "30px" }}>
        <h2 style={{ marginBottom: "10px", textAlign: "center" }}>Become a Seller</h2>
        <p style={{ marginBottom: "30px", textAlign: "center", color: "#6b7280" }}>
          Complete the KYC verification to start selling on DealMate.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="row" style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">First Name</label>
              <input name="firstName" onChange={handleChange} required className="form-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Last Name</label>
              <input name="lastName" onChange={handleChange} required className="form-input" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input name="address" onChange={handleChange} required className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input name="phone" onChange={handleChange} required className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select name="documentType" onChange={handleChange} required className="form-select">
              <option value="">-- Select --</option>
              <option value="citizenship">Citizenship</option>
              <option value="passport">Passport</option>
              <option value="license">Driving License</option>
            </select>
          </div>

          {showUpload && (
            <>
              <label className="form-label">
                Upload Document {showBack ? "(Front & Back)" : "(Front)"}
              </label>

              <div className="row" style={{ display: "flex", gap: "16px" }}>
                <div className="upload-box">
                  {preview.front ? (
                    <img src={preview.front} alt="Front Preview" className="preview-img" />
                  ) : (
                    <span>Front Side</span>
                  )}
                  <input type="file" name="docFront" accept="image/*" onChange={handleFile} required />
                </div>

                {showBack && (
                  <div className="upload-box">
                    {preview.back ? (
                      <img src={preview.back} alt="Back Preview" className="preview-img" />
                    ) : (
                      <span>Back Side</span>
                    )}
                    <input type="file" name="docBack" accept="image/*" onChange={handleFile} required />
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "30px" }}>
            Submit Verification Request
          </button>
        </form>
      </div>
    </div>
  );
}
