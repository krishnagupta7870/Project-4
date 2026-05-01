// frontend/src/utils/api.js
import axios from "axios";

// Works for CRA, Vite, Webpack
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

let redirectingToLogin = false;

/* ===========================
   REQUEST INTERCEPTOR
   Attach JWT token if exists
=========================== */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===========================
   RESPONSE INTERCEPTOR
   Global 401 handler
=========================== */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized — token removed");
      localStorage.removeItem("token");

      // SPA-safe redirect (no infinite reload)
      if (!window.location.pathname.startsWith("/login") && !redirectingToLogin) {
        redirectingToLogin = true;
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
