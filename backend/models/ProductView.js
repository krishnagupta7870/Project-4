import mongoose from 'mongoose';

const productViewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null for guest users
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // Using custom timestamp field
});

// Compound index for efficient duplicate detection
productViewSchema.index({ product: 1, user: 1, timestamp: -1 });
productViewSchema.index({ product: 1, ipAddress: 1, userAgent: 1, timestamp: -1 });

// Auto-delete old view records after 7 days (optional cleanup)
productViewSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const ProductView = mongoose.model('ProductView', productViewSchema);
export default ProductView;
