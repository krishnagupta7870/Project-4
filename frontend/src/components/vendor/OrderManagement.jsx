import React from "react";
import EmptyState from "./EmptyState";

export default function OrderManagement() {
  const orders = []; // later fetch from backend

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No Orders Yet"
        description="Orders will appear once customers start purchasing."
      />
    );
  }

  return <div>Orders table will appear here</div>;
}
