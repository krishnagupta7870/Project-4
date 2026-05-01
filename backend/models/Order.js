import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true } // Price at time of purchase
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  paymentMethod: { type: String, default: 'card' },
  invoiceNumber: { type: String, unique: true }
}, {
  timestamps: true
});

// Generate simple invoice number before saving
orderSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = 'INV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
