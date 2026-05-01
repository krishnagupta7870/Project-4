import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { API_ORIGIN } from "../utils/api";
import "../styles/sellerProfile.css";
import { X, Edit2, Trash2, CheckCircle, AlertCircle } from "lucide-react";

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Edit Review State
  const [editingReview, setEditingReview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        const res = await api.get(`/users/${id}/profile`);
        if (!mounted) return;
        setData(res.data);
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, [id]);

  function imageUrl(p) {
    if (!p) return "";
    const s = String(p).replace(/\\/g, "/");
    return s.startsWith("/") ? `${API_ORIGIN}${s}` : s;
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast("Please login to report.", "error");
      return;
    }
    setSubmittingReport(true);
    try {
      await api.post("/reports", {
        targetId: data.user._id,
        reportType: "user",
        reason: reportReason,
        description: reportDescription
      });
      showToast("Report submitted successfully. We will review it shortly.");
      setShowReportModal(false);
      setReportReason("");
      setReportDescription("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit report", "error");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleEditClick = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setShowEditModal(true);
  };

  const handleUpdateReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      setSubmittingEdit(true);
      await api.put(`/reviews/${editingReview._id}`, {
        rating: editRating,
        comment: editComment
      });
      // Refresh data
      const res = await api.get(`/users/${id}/profile`);
      setData(res.data);
      setShowEditModal(false);
      setEditingReview(null);
    } catch (err) {
      console.error(err);
      showToast("Failed to update review", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      // Refresh data
      const res = await api.get(`/users/${id}/profile`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to delete review", "error");
    }
  };

  if (loading) return <div className="seller-profile"><div className="sp-loading">Loading...</div></div>;
  if (!data) return <div className="seller-profile"><div className="sp-loading">Seller not found</div></div>;

  const { user, stats, products, reviews } = data;
  const initial = (user?.name || "S").charAt(0).toUpperCase();
  const memberSince = new Date(user?.createdAt || Date.now()).toLocaleDateString(undefined, { year: "numeric", month: "short" });

  // Calculate quick stats

  const totalSales = products?.filter(p => (p.status || '').toLowerCase() === 'sold').length || 0;
  const activeProducts = products?.filter(p => (p.status || '').toLowerCase() === 'active').length || 0;
  const averageRating = reviews?.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  // Calculate review distributions from the reviews data  
  const reviewDistribution = {
    positive: reviews?.filter(r => r.sentimentLabel === 'positive').length || 0,
    neutral: reviews?.filter(r => r.sentimentLabel === 'neutral').length || 0,
    negative: reviews?.filter(r => r.sentimentLabel === 'negative').length || 0
  };
  const totalReviews = reviews?.length || 0;

  let overallSentimentLabel = "Neutral";
  let overallSentimentColor = "#f59e0b"; // Neutral color

  if (totalReviews > 0) {
    const { positive, neutral, negative } = reviewDistribution;
    const max = Math.max(positive, neutral, negative);
    if (max === positive && positive > 0) {
      overallSentimentLabel = "Positive";
      overallSentimentColor = "#10b981";
    } else if (max === negative && negative > 0) {
      overallSentimentLabel = "Negative";
      overallSentimentColor = "#ef4444";
    } else {
      overallSentimentLabel = "Neutral";
      overallSentimentColor = "#f59e0b";
    }
  }

  return (
    <div className="seller-profile">
      {toast.show && (
        <div className={`toast-notify ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast((prev) => ({ ...prev, show: false }))}>
            <X size={14} />
          </button>
        </div>
      )}
      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '90%', maxWidth: '500px', position: 'relative'
          }}>
            <button
              onClick={() => setShowReportModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#666" />
            </button>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: '600' }}>Report User</h3>
            <form onSubmit={handleReportSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Fraud">Fraud / Scam</option>
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Fake Profile">Fake Profile</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px' }}
                  placeholder="Please provide more details..."
                  required
                />
              </div>
              <button
                type="submit"
                className="sp-btn danger"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={submittingReport}
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="modal-content" style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            width: '90%', maxWidth: '500px', position: 'relative'
          }}>
            <button
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <X size={24} color="#666" />
            </button>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: '600' }}>Edit Review</h3>
            <form onSubmit={handleUpdateReview}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Rating</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Review</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '100px' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="sp-btn"
                style={{ width: '100%', justifyContent: 'center', background: '#4aa3a1', color: 'white' }}
                disabled={submittingEdit}
              >
                {submittingEdit ? "Updating..." : "Update Review"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="sp-header">
        <div className="sp-avatar">{initial}</div>
        <div className="sp-info">
          <div className="sp-name">{user?.name}</div>
          <div className="sp-sub">
            Member since {memberSince}
            {user?.isVerified ? <span className="sp-verified">Verified</span> : null}
          </div>
          <div className="sp-stats">
            <span>{stats?.products || 0} items</span>
            <span>{stats?.followers || 0} followers</span>
          </div>
        </div>
        <div className="sp-actions">
          <button className="sp-btn" onClick={() => navigator.share?.({ title: user?.name, url: window.location.href })}>Share profile</button>
          <button className="sp-btn danger" onClick={() => setShowReportModal(true)}>Report user</button>
        </div>
      </div>

      {/* Quick Stats Cards - Only show if user has products (is a seller) */}
      {/* Quick Stats Cards - Only show if user has products (is a seller) */}
      {stats?.products > 0 && (
        <div className="sp-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="sp-stat-card">
            <div className="sp-stat-icon sales">
              📦
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{totalSales}</div>
              <div className="sp-stat-label">Total Sales</div>
            </div>
          </div>

          <div className="sp-stat-card">
            <div className="sp-stat-icon rating">
              ⭐
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{averageRating}</div>
              <div className="sp-stat-label">Avg Rating</div>
            </div>
          </div>

          <div className="sp-stat-card">
            <div className="sp-stat-icon active">
              ✓
            </div>
            <div className="sp-stat-content">
              <div className="sp-stat-value">{activeProducts}</div>
              <div className="sp-stat-label">Active Listings</div>
            </div>
          </div>
        </div>
      )}

      {/* Trust Score Section - Only show if user has products (is a seller) */}
      {stats?.products > 0 && user?.trustScore !== undefined && (
        <div className="sp-card" style={{ gridColumn: '1 / -1', background: 'white', padding: '24px', marginBottom: '16px', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Seller Trust Score</div>
              <div style={{ fontSize: '48px', fontWeight: '700', lineHeight: 1, color: '#4aa3a1' }}>{Math.round(user.trustScore)}</div>
              <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>out of 100</div>

              {user.trustScore !== undefined && (() => {
                const score = Math.round(user.trustScore);
                let tier = { label: "Untrusted Seller", color: "#EF4444", icon: "⚠️" };
                if (score >= 85) tier = { label: "Trusted Seller", color: "#10B981", icon: "🛡️" };
                else if (score >= 70) tier = { label: "Reliable Seller", color: "#3B82F6", icon: "🔹" };
                else if (score >= 50) tier = { label: "Average Seller", color: "#F59E0B", icon: "⚖️" };
                else if (score >= 30) tier = { label: "Low Trust", color: "#F97316", icon: "🚩" };

                return (
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{tier.icon}</span>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: tier.color }}>{tier.label}</span>
                  </div>
                );
              })()}
            </div>
            {/* Only show breakdown to seller themselves or admin */}
            {(currentUser?._id === user._id || currentUser?.isAdmin) && user.sellerStats && (
              <div style={{ textAlign: 'right', fontSize: '13px', color: '#374151', background: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '6px' }}>
                  ⭐ Rating: <strong>{user.sellerStats.ratingPoints}/35</strong>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  💬 Reviews: <strong>{user.sellerStats.reviewPoints}/35</strong>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  ⚡ Response: <strong>{user.sellerStats.chatPoints}/10</strong>
                </div>
                <div style={{ marginBottom: '6px' }}>
                  📦 Sales: <strong>{user.sellerStats.soldPoints}/10</strong>
                </div>
                <div>
                  🛡️ Reports: <strong>{user.sellerStats.reportPoints}/10</strong>
                </div>
              </div>
            )}
          </div>

          {/* Reviews & Sentiment - Integrated into trust score card */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '16px', color: '#1f2937' }}>Reviews & Sentiment</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {totalReviews > 0 ? `${totalReviews} reviews` : 'No data'}
              </div>
            </div>
            {totalReviews > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Positive ({reviewDistribution.positive})</div>
                    <div style={{ background: '#f3f4f6', height: 8, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(reviewDistribution.positive / totalReviews) * 100}%`, height: 8, background: '#10b981' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Neutral ({reviewDistribution.neutral})</div>
                    <div style={{ background: '#f3f4f6', height: 8, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(reviewDistribution.neutral / totalReviews) * 100}%`, height: 8, background: '#9ca3af' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Negative ({reviewDistribution.negative})</div>
                    <div style={{ background: '#f3f4f6', height: 8, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${(reviewDistribution.negative / totalReviews) * 100}%`, height: 8, background: '#ef4444' }} />
                    </div>
                  </div>
                  <div style={{ width: 120, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Overall</div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: overallSentimentColor }}>
                      {overallSentimentLabel}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                  {reviews.map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', position: 'relative' }}>
                      <div style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        color: r.sentimentLabel === 'positive' ? '#065f46' : r.sentimentLabel === 'negative' ? '#991b1b' : r.sentimentLabel === 'mixed' ? '#92400e' : '#374151',
                        background: r.sentimentLabel === 'positive' ? '#d1fae5' : r.sentimentLabel === 'negative' ? '#fee2e2' : r.sentimentLabel === 'mixed' ? '#fde68a' : '#e5e7eb',
                        textTransform: 'capitalize',
                        flexShrink: 0
                      }}>
                        {r.sentimentLabel}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.5 }}>{r.comment}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                          {' • '}
                          {Array.from({ length: r.rating }).map((_, i) => <span key={i}>★</span>)}
                        </div>
                      </div>
                      {/* Edit/Delete Icons for Author */}
                      {currentUser?._id === (typeof r.reviewer === 'string' ? r.reviewer : r.reviewer?._id) && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleEditClick(r)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                            <Edit2 size={14} color="#6b7280" />
                          </button>
                          <button onClick={() => handleDeleteReview(r._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}>
                            <Trash2 size={14} color="#ef4444" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: 10, color: '#666' }}>No reviews yet.</div>
            )}
          </div>
        </div>
      )}

      <div className="sp-grid">
        {products?.length ? products.map((p) => {
          // Determine status badge class
          const statusClass = (p.status || 'Active').toLowerCase().replace(' ', '-');

          return (
            <div key={p._id} className="sp-card" onClick={() => navigate(`/product/${p._id}`)}>
              <div className="sp-thumb" style={{ backgroundImage: `url(${imageUrl((p.images || [])[0])})` }}>
                <span className={`product-status-badge ${statusClass}`}>
                  {p.status || 'Active'}
                </span>
              </div>
              <div className="sp-title">{p.name}</div>
              <div className="sp-price">Rs {p.price}</div>
            </div>
          );
        }) : <div className="sp-empty">No items</div>}
      </div>
    </div>
  );
}
