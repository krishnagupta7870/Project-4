// src/utils/auth.js
import api from './api'; // use the single axios instance

// helpers using api.post(...)
export const loginUser = (email, password) =>
  api.post("/api/auth/login", { email, password });

export const registerUser = (name, email, phone, password, confirmPassword) =>
  api.post("/api/auth/register", { name, email, phone, password, confirmPassword });

export const verifyOtp = (email, code) =>
  api.post("/api/auth/verify-otp", { email, code });

export const requestReset = (email) =>
  api.post("/api/auth/request-reset", { email });

export const resetPassword = (data) =>
  api.post("/api/auth/reset", data);

// named export with all helpers (optional convenience)
export const authHelpers = {
  loginUser,
  registerUser,
  verifyOtp,
  requestReset,
  resetPassword,
};

// default export is the axios instance so `import api from '../../utils/auth'` works
export default api;
