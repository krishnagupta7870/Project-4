// backend/api/auth/passwordReset.js
import crypto from 'crypto';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import { sendEmail } from '../../utils/emailService.js';

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;
const RESET_CODE_EXP_MIN = Number(process.env.PWD_RESET_EXP_MIN) || 30; // minutes

// Request a password reset: generate a numeric code and send by email
export async function requestPasswordReset(req, res) {
  try {
    // unify input: frontend sends 'email' but it might be phone
    const identifier = req.body.email || req.body.phone;
    if (!identifier) return res.status(400).json({ message: 'Email or Phone required' });

    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      // Per user request: Show error if account not found (sacrifices enumeration protection for UX)
      return res.status(404).json({ message: 'Account not found with this email or phone.' });
    }

    // We always send code to the registered email
    const targetEmail = user.email;

    // Generate 6-digit numeric code
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const expiresAt = new Date(Date.now() + RESET_CODE_EXP_MIN * 60 * 1000);

    // Remove existing reset codes for this email (single active code)
    await PasswordResetToken.deleteMany({ email: targetEmail, purpose: 'reset-password' });

    // Store the reset code record
    const pr = new PasswordResetToken({ email: targetEmail, code, purpose: 'reset-password', expiresAt });
    await pr.save();

    // Send the code by email (do not await blocking)
    const html = `
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the code below to reset your password. The code is valid for <strong>${RESET_CODE_EXP_MIN} minutes</strong>.</p>
      <h2 style="letter-spacing:3px">${code}</h2>
      <p>If you did not request this, you can safely ignore this email.</p>
    `;

    // Send email (best-effort; failures are logged but we still return success to the client)
    sendEmail(targetEmail, 'Dealmate password reset code', html).catch(err => {
      console.error('Failed to send reset code email:', err);
    });

    // Prepare response
    const response = { message: 'If an account exists, a reset code has been sent.' };

    // If user searched by phone, provide masked email hint
    const isPhoneQuery = /^\d+$/.test(identifier) || req.body.phone;
    if (isPhoneQuery) {
      const [local, domain] = targetEmail.split('@');
      const maskedLocal = local.length > 2 ? local.slice(0, 2) + '*'.repeat(local.length - 2) : local + '*';
      response.hint = `Code sent to ${maskedLocal}@${domain}`;
      response.isPhoneMatch = true;
    }

    return res.json(response);
  } catch (err) {
    console.error('requestPasswordReset error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Reset the password using email + code + newPassword
export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code and newPassword are required' });
    }

    // Find the reset record
    const record = await PasswordResetToken.findOne({ email, code, purpose: 'reset-password' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Check expiry
    if (record.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: record._id });
      return res.status(400).json({ message: 'Reset code expired' });
    }

    // Hash and set new password
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await User.findOneAndUpdate({ email }, { password: hashed });

    // Delete all reset tokens for this email (single-use)
    await PasswordResetToken.deleteMany({ email, purpose: 'reset-password' });

    return res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('resetPassword error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
