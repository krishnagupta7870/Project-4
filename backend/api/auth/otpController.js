// backend/api/auth/otpController.js
import crypto from 'crypto';
import Otp from '../../models/Otp.js';
import User from '../../models/User.js';
import { sendEmail } from '../../utils/emailService.js';

// Verify OTP (6-digit code)
export async function verifyOtp(req, res) {
  try {
    const { email, code, purpose } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code required' });

    const record = await Otp.findOne({ email, code, purpose: purpose || 'verify-email' });
    if (!record) return res.status(400).json({ message: 'Invalid or expired code' });

    // If verify-email purpose, mark user verified
    if (record.purpose === 'verify-email') {
      const user = await User.findOne({ email });
      if (user) {
        user.isVerified = true;
        await user.save();
      }
    }

    // delete OTP record(s)
    await Otp.deleteMany({ email, purpose: purpose || 'verify-email' });

    return res.json({ message: 'Verified' });
  } catch (err) {
    console.error('verifyOtp error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Verify email by token (link) - supports GET (redirect) and POST (AJAX)
export async function verifyEmailToken(req, res) {
  try {
    const token = req.method === 'GET' ? req.query.token : req.body.token;
    const email = req.method === 'GET' ? req.query.email : req.body.email;

    if (!token || !email) return res.status(400).json({ message: 'Invalid verification link' });

    const record = await Otp.findOne({ email, token, purpose: 'verify-email' });
    if (!record) return res.status(400).json({ message: 'Invalid or expired verification link' });

    // optional expiry double-check
    if (record.expiresAt && record.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Verification link expired' });
    }

    const user = await User.findOne({ email });
    if (user) {
      user.isVerified = true;
      await user.save();
    }

    // delete all related verification records
    await Otp.deleteMany({ email, purpose: 'verify-email' });

    if (req.method === 'GET') {
      const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendBase}/verify-success`);
    }

    return res.json({ message: 'Email verified' });
  } catch (err) {
    console.error('verifyEmailToken error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Resend OTP (create new code + token and send email)
export async function resendOtp(req, res) {
  try {
    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const finalPurpose = purpose || 'verify-email';

    // generate new code & token
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes
    const token = crypto.randomBytes(24).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    // delete old records then create new
    await Otp.deleteMany({ email, purpose: finalPurpose });
    await Otp.create({
      email,
      code,
      token,
      purpose: finalPurpose,
      expiresAt: tokenExpiresAt
    });

    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendBase}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const html = `
      <p>Your verification code: <strong>${code}</strong></p>
      <p>Or click to verify: <a href="${verifyLink}">Verify my email</a></p>
      <p>Code valid 15 minutes. Link valid 24 hours.</p>
    `;

    await sendEmail(email, 'Your verification code', html);

    return res.json({ message: 'OTP resent' });
  } catch (err) {
    console.error('resendOtp error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
