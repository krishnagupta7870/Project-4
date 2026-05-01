// backend/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false }, // set true after OTP/email verification
  isBlocked: { type: Boolean, default: false }, // Admin block
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  trustScore: { type: Number, default: 0 },
  sellerStats: {
    ratingPoints: { type: Number, default: 0 },
    reviewPoints: { type: Number, default: 0 },
    reportPoints: { type: Number, default: 0 },
    chatPoints: { type: Number, default: 0 },
    soldPoints: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    positiveReviews: { type: Number, default: 0 },
    negativeReports: { type: Number, default: 0 },
    avgReplyTimeMinutes: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300, partialFilterExpression: { isVerified: false } });

// hide password in JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
