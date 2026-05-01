import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { Star, User } from "lucide-react";

export default function ProductReviews({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [eligibilityMessage, setEligibilityMessage] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    fetchReviews();
    if (user) {
      checkEligibility();
    }
  }, [productId, user]);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const { data } = await api.get(`/reviews/check-eligibility/${productId}`);
      setCanReview(data.canReview);
      setEligibilityMessage(data.message || "");
    } catch (err) {
      console.error("Failed to check eligibility", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmitting(true);
    try {
      await api.post("/reviews", {
        productId,
        rating,
        comment
      });
      // Refresh reviews and re-check eligibility (should be false now)
      await fetchReviews();
      setCanReview(false);
      setEligibilityMessage("You have already reviewed this product");
      setComment("");
      setRating(5);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="product-reviews">
      <h3 className="pd-section-title">Reviews ({reviews.length})</h3>

      {user && canReview ? (
        <div className="review-form-card">
          <h4>Write a Review</h4>
          <form onSubmit={handleSubmit}>
            <div className="rating-select">
              <label>Rating:</label>
              <div className="stars-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={24}
                    fill={star <= rating ? "#FFD700" : "none"}
                    color={star <= rating ? "#FFD700" : "#cbd5e1"}
                    onClick={() => setRating(star)}
                    style={{ cursor: "pointer" }}
                  />
                ))}
              </div>
            </div>
            <textarea
              className="review-input"
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      ) : (
        user && (
          <div className="eligibility-message">
            {eligibilityMessage || (reviews.some(r => r.reviewer._id === user._id) ? "You have already reviewed this product." : "You must chat with the seller to review this product.")}
          </div>
        )
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <div className="no-reviews">No reviews yet.</div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    {review.reviewer?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="reviewer-name">{review.reviewer?.name || "User"}</span>
                </div>
                <div className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="review-rating">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < review.rating ? "#FFD700" : "none"}
                    color={i < review.rating ? "#FFD700" : "#cbd5e1"}
                  />
                ))}
              </div>
              <p className="review-text">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .product-reviews {
          margin-top: 20px;
        }
        .review-form-card {
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }
        .rating-select {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .stars-input {
          display: flex;
          gap: 4px;
        }
        .review-input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          min-height: 100px;
          margin-bottom: 12px;
          font-family: inherit;
        }
        .review-item {
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 0;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .reviewer-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
        }
        .reviewer-name {
          font-weight: 600;
          font-size: 14px;
        }
        .review-date {
          font-size: 12px;
          color: #64748b;
        }
        .review-rating {
          display: flex;
          gap: 2px;
          margin-bottom: 8px;
        }
        .review-text {
          color: #334155;
          line-height: 1.5;
        }
        .eligibility-message {
          padding: 12px;
          background: #f1f5f9;
          border-radius: 8px;
          color: #64748b;
          font-size: 14px;
          margin-bottom: 20px;
        }
        .no-reviews {
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
