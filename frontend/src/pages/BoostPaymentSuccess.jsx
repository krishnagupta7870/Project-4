import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

export default function BoostPaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing payment...");

  useEffect(() => {
    const applyBoost = async () => {
      const productId = params.get("productId");
      const hours = Number(params.get("hours") || 0);
      const amount = Number(params.get("amount") || 0);
      if (!productId || !hours || !amount) {
        setStatus("Invalid payment details");
        return;
      }
      try {
        await api.post(`/products/${productId}/boost`, {
          hours,
          amount,
          provider: "stripe"
        });
        setStatus("Boost applied successfully");
        setTimeout(() => navigate("/seller"), 1200);
      } catch (err) {
        setStatus(err.response?.data?.message || "Failed to apply boost");
      }
    };
    applyBoost();
  }, [params, navigate]);

  return (
    <div className="container py-4">
      <h3>{status}</h3>
    </div>
  );
}
