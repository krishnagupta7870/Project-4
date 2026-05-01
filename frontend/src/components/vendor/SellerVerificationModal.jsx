import React, { useState } from "react";

export default function SellerVerificationModal({ onClose, onSubmit }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();

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

    onSubmit(data);
  };

  const showBack =
    form.documentType === "citizenship" ||
    form.documentType === "passport";

  const showUpload = !!form.documentType;

  return (
    <div className="kyc-overlay">
      <div className="kyc-modal">
        <button className="kyc-close" onClick={onClose}>✕</button>

        <h2>KYC Verification</h2>
        <p>Submit following to initiate KYC Process</p>

        <form onSubmit={handleSubmit}>
          <div className="row">
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

          {/* UPLOAD + PREVIEW */}
          {showUpload && (
            <>
              <label className="form-label">
                Upload Document {showBack ? "(Front & Back)" : "(Front)"}
              </label>

              <div className="row">
                {/* FRONT */}
                <div className="upload-box">
                  {preview.front ? (
                    <img src={preview.front} alt="Front Preview" className="preview-img" />
                  ) : (
                    <span>Front</span>
                  )}
                  <input
                    type="file"
                    name="docFront"
                    accept="image/*"
                    onChange={handleFile}
                    required
                  />
                </div>

                {/* BACK */}
                {showBack && (
                  <div className="upload-box">
                    {preview.back ? (
                      <img src={preview.back} alt="Back Preview" className="preview-img" />
                    ) : (
                      <span>Back</span>
                    )}
                    <input
                      type="file"
                      name="docBack"
                      accept="image/*"
                      onChange={handleFile}
                      required
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px' }}>
            Submit KYC
          </button>
        </form>
      </div>
    </div>
  );
}
