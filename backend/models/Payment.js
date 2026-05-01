import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'NPR'
  },
  method: {
    type: String,
    enum: ['khalti', 'stripe'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String, // Khalti pidx or Stripe paymentIntentId
    required: true,
    unique: true
  },
  paymentGatewayData: {
    type: Object // Store full response from gateway for audit
  },
  purpose: {
    type: String,
    default: 'product_listing_fee'
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;