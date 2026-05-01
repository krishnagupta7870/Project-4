import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { X, Clock, Zap, CreditCard } from "lucide-react";

export default function BoostModal({ product, onClose, onBoosted }) {
  const [tiers, setTiers] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/admin/settings/boost-packages");
        const normalized = Array.isArray(data) ? data : [];
        setTiers(normalized);
        setSelectedIdx(0);
      } catch (err) {
        setError("Failed to load boost packages");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = tiers[selectedIdx] || { label: "6 Hours", hours: 6, price: 100 };

  const pay = async (provider) => {
    if (!product?._id) return;
    setLoading(true);
    setError("");
    try {
      if (provider === "stripe") {
        const { data } = await api.post(`/payment/boost/stripe-session`, {
          productId: product._id,
          hours: selected.hours,
          amount: selected.price
        });
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (data.sessionId) {
          setError("Stripe session created but no URL returned");
          return;
        }
        setError("Failed to create Stripe session");
      } else if (provider === "khalti") {
        const origin = window.location.origin;
        const { data } = await api.post(`/payment/initiate-khalti`, {
          amount: selected.price * 100,
          purchase_order_id: product._id,
          purchase_order_name: `Boost: ${product.name}`,
          return_url: `${origin}/boost-payment/khalti-return?productId=${encodeURIComponent(product._id)}&hours=${encodeURIComponent(selected.hours)}&amount=${encodeURIComponent(selected.price)}`,
          website_url: origin
        });
        if (data?.payment_url) {
          window.location.href = data.payment_url;
          return;
        }
        setError("Failed to initiate Khalti payment");
      } else {
        const { data } = await api.post(`/products/${product._id}/boost`, {
          hours: selected.hours,
          amount: selected.price,
          provider
        });
        if (onBoosted) onBoosted(data.product);
        onClose();
        alert(`Boosted for ${selected.label} via ${provider}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        width: "100%",
        maxWidth: 560,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(18,25,40,0.18)",
        overflow: "hidden"
      }}>
        <div style={{
          padding: 16,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Zap size={18} color="#0b74ff" />
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Boost Ad</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: "none",
              background: "#f3f4f6",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#374151",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#e5e7eb";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f3f4f6";
              e.currentTarget.style.color = "#374151";
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <div>Loading packages...</div>
          ) : tiers.length === 0 ? (
            <div>No boost packages configured. Contact support.</div>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {tiers.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setSelectedIdx(i)}
                    style={{
                      flex: "0 0 auto",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: `2px solid ${selectedIdx === i ? "#0b74ff" : "#e5e7eb"}`,
                      background: selectedIdx === i ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600
                    }}
                  >
                    <Clock size={16} />
                    <span>{t.label}</span>
                    <span style={{ color: "#0b74ff", marginLeft: 6 }}>Rs. {Number(t.price).toLocaleString()}</span>
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: 16,
                padding: 12,
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div>
                  <div style={{ fontWeight: 700 }}>Selected</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>{selected.label}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "#0b74ff" }}>Rs. {Number(selected.price).toLocaleString()}</div>
                </div>
              </div>

              {error && (
                <div style={{ marginTop: 10, color: "#b91c1c", fontWeight: 600 }}>{error}</div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  disabled={loading}
                  onClick={() => pay("stripe")}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #0b74ff",
                    background: "#0b74ff",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  <CreditCard size={18} />
                  Pay with Stripe
                </button>
                <button
                  disabled={loading}
                  onClick={() => pay("khalti")}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #16a34a",
                    background: "#16a34a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  <CreditCard size={18} />
                  Pay with Khalti
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
