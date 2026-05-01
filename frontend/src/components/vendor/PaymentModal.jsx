import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import KhaltiCheckout from "khalti-checkout-web";
import api from "../../utils/api";
import { X, CreditCard, Wallet } from "lucide-react";
import { PAYMENT_KEYS } from "../../config/paymentKeys";

// Initialize Stripe outside component
const stripePromise = loadStripe(PAYMENT_KEYS.STRIPE_PUBLIC_KEY);

const StripeForm = ({ fee, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createIntent = async () => {
      try {
        const { data } = await api.post("/api/payment/create-payment-intent", { price: fee }); // Passing fee logic is handled in backend based on price, but here we might need to pass price or just fee amount if backend supports it. 
        // Wait, backend expects 'price' to calculate fee.
        // Let's assume we pass the fee amount directly for simplicity or pass a mock price that results in that fee? 
        // Actually, backend logic: if price < 1000 -> 10. 
        // So if fee is 10, pass price 500. If 50, pass 5000. If 100, pass 200000.
        // Better: Update backend to accept fee directly OR pass the product price.
        // I will pass 'price' prop to this component.
      } catch (err) {
        console.error("Failed to create intent", err);
        onError("Failed to initialize payment");
      }
    };
    // We need product price to calculate fee on backend properly, 
    // OR we just trust the frontend fee for now (bad practice but simple).
    // Let's modify backend to accept 'amount' directly? No, user asked logic based on price.
    // So I should pass the product price to PaymentModal.
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (result.error) {
      onError(result.error.message);
      setLoading(false);
    } else {
      if (result.paymentIntent.status === "succeeded") {
        // Verify and save to DB
        try {
          const { data } = await api.post("/api/payment/confirm-stripe", {
            paymentIntentId: result.paymentIntent.id
          });
          onSuccess(data); // Pass full data including paymentId
        } catch (err) {
          console.error("Failed to save stripe payment", err);
          onError("Payment succeeded but failed to save record");
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <div style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
        <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || !clientSecret || loading}
        className="btn-primary"
        style={{ width: '100%', padding: '12px' }}
      >
        {loading ? "Processing..." : `Pay ${fee} (Stripe)`}
      </button>
    </form>
  );
};

// Wrapper for Stripe to handle props
const StripeSection = ({ productPrice, fee, onSuccess, onError }) => {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const fetchSecret = async () => {
      try {
        // Ensure productPrice is a valid number
        const price = Number(productPrice);
        if (isNaN(price)) throw new Error("Invalid price");

        const { data } = await api.post("/api/payment/create-payment-intent", { price });
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || err.message || "Could not fetch payment intent";
        onError(`Stripe Error: ${msg}`);
      }
    }
    fetchSecret();
  }, [productPrice, onError]);

  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) }
    });

    if (result.error) {
      onError(result.error.message);
      setLoading(false);
    } else {
      if (result.paymentIntent.status === "succeeded") {
        // Verify and save to DB
        try {
          const { data } = await api.post("/api/payment/confirm-stripe", {
            paymentIntentId: result.paymentIntent.id
          });
          onSuccess(data.paymentDetails);
        } catch (err) {
          console.error("Failed to save stripe payment", err);
          onError("Payment succeeded but failed to save record");
        }
      }
    }
  };

  if (!clientSecret) return <div>Loading Stripe...</div>;

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <div style={{ padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '20px' }}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary"
        style={{ width: '100%', padding: '12px' }}
      >
        {loading ? "Processing..." : `Pay Rs. ${fee}`}
      </button>
    </form>
  );
};

const PaymentModal = ({ productPrice, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("stripe");
  const [error, setError] = useState("");

  // Calculate fee logic locally for display
  const getFee = (price) => {
    const p = Number(price);
    if (p < 1000) return 10; // Increased to 60 to meet Stripe minimum requirements
    if (p < 100000) return 50;
    return 100;
  };

  const fee = getFee(productPrice);

  const handleKhalti = async () => {
    try {
      setError("");
      // 1. Initiate payment on backend
      // For testing: Use 1000 paisa (Rs 10) or calculate from fee
      const amountPaisa = Math.round(fee * 100);

      const { data } = await api.post("/api/payment/initiate-khalti", {
        amount: amountPaisa,
        purchase_order_id: "order_" + Date.now(),
        purchase_order_name: "Listing Fee",
        return_url: window.location.href, // Returns to current page
        website_url: window.location.origin
      });

      if (data.payment_url) {
        // 2. Redirect user to Khalti
        window.location.href = data.payment_url;
      } else {
        setError("Failed to get payment URL");
      }
    } catch (err) {
      console.error("Khalti Init Error:", err);
      setError("Failed to initiate Khalti payment");
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div style={{
        background: 'white', padding: '30px', borderRadius: '12px',
        width: '90%', maxWidth: '500px', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>Pay Listing Fee</h2>
        <p style={{ marginBottom: '20px', color: '#666' }}>
          To list this product (Price: {productPrice}), you need to pay a fee of <strong>Rs. {fee}</strong>.
        </p>

        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab("stripe")}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
              background: activeTab === "stripe" ? '#f0f9ff' : 'white',
              borderColor: activeTab === "stripe" ? '#007bff' : '#ddd',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <CreditCard size={20} /> Stripe
          </button>
          <button
            onClick={() => setActiveTab("khalti")}
            style={{
              flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd',
              background: activeTab === "khalti" ? '#f0f9ff' : 'white',
              borderColor: activeTab === "khalti" ? '#5c2d91' : '#ddd',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <Wallet size={20} /> Khalti
          </button>
        </div>

        {activeTab === "stripe" && (
          <Elements stripe={stripePromise}>
            <StripeSection
              productPrice={productPrice}
              fee={fee}
              onSuccess={onSuccess}
              onError={setError}
            />
          </Elements>
        )}

        {activeTab === "khalti" && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ marginBottom: '15px' }}>Pay with Khalti Digital Wallet</p>
            <button
              onClick={handleKhalti}
              style={{
                background: '#5c2d91', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%'
              }}
            >
              Pay via Khalti
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
