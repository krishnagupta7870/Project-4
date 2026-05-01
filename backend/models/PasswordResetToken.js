// backend/models/PasswordResetToken.js
import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  code: { type: String, required: true }, // 6-digit reset code
  purpose: {
    type: String,
    enum: ['reset-password'],
    default: 'reset-password'
  },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

// TTL index to automatically remove expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
export default PasswordResetToken;
