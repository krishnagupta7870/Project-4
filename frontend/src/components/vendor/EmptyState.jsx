import React from "react";
import "../../styles/seller.css";

export default function EmptyState({
  icon = "📦",
  title,
  description,
  actionText,
  onAction,
  disabled = false,
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>

      <h3>{title}</h3>
      <p>{description}</p>

      {actionText && (
        <button
          className="btn-primary"
          disabled={disabled}
          onClick={onAction}
          style={{ marginTop: '16px' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
