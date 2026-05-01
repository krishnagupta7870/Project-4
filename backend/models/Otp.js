// backend/models/Otp.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String },   // 6-digit OTP
  token: { type: String },  // verification token for link flow
  purpose: {
    type: String,
    enum: ['verify-email', 'reset-password'],
    default: 'verify-email'
  },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// TTL index: remove documents after expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
