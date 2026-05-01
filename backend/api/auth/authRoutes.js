// backend/api/auth/authRoutes.js
import express from 'express';
import { register, login, googleLogin } from './authController.js';
import { verifyOtp, resendOtp, verifyEmailToken } from './otpController.js';
import { requestPasswordReset, resetPassword } from './passwordReset.js';
import authMiddleware from '../../middleware/auth.js';

const router = express.Router();

// public
router.post('/register', register);          // POST /api/auth/register
router.post('/login', login);                // POST /api/auth/login
router.post('/google', googleLogin);         // POST /api/auth/google

// OTP flows
router.post('/verify-otp', verifyOtp);       // POST /api/auth/verify-otp
router.post('/resend-otp', resendOtp);       // POST /api/auth/resend-otp

// Email verification by link (GET -> redirect; POST -> AJAX verify)
router.get('/verify-email', verifyEmailToken);   // GET /api/auth/verify-email?token=...&email=...
router.post('/verify-email', verifyEmailToken);  // POST /api/auth/verify-email { token, email }

// password reset
router.post('/request-reset', requestPasswordReset); // POST /api/auth/request-reset
router.post('/reset', resetPassword);                // POST /api/auth/reset

// protected example
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
