import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/admin/reviews").then(res => setReviews(res.data));
  }, []);

  const remove = async (id) => {
    await api.delete(`/admin/reviews/${id}`);
    setReviews(reviews.filter(r => r._id !== id));
  };

  return (
    <div>
      <h3 className="section-title">Review Moderation</h3>
      {reviews.length === 0 ? <p className="text-muted">No reviews to moderate.</p> : (
        <div className="card">
            <div className="buyer-list">
              {reviews.map(r => (
                <div className="buyer-item" key={r._id}>
                   <div className="buyer-details">
                       <h4>{r.userName || 'Anonymous User'}</h4>
                       <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>{r.comment}</p>
                   </div>
                   <button className="btn btn-danger-outline btn-sm" onClick={() => remove(r._id)}>
                     Delete
                   </button>
                </div>
              ))}
            </div>
        </div>
      )}
    </div>
  );
}
