// This file ensures keys are available even if .env isn't reloaded immediately
// In production, these should still come from environment variables

export const PAYMENT_KEYS = {
  STRIPE_PUBLIC_KEY: process.env.REACT_APP_STRIPE_PUBLIC_KEY || "pk_test_51QnKHcHv15qt8VfKPQCgL5566tPovTZguwuNdvpd8t9zwXHADFqryhpIc9yIXjQ4nRS9k5Xg3NRD8bKtC1iX90Pd00C5Aj2Rbb",
  KHALTI_PUBLIC_KEY: process.env.REACT_APP_KHALTI_PUBLIC_KEY || "test_public_key_dc74e0fd57cb46cd93832aee0a390234"
};
