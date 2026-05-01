import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // ❌ was required → caused crashes
    // ✅ now optional
    description: { type: String, default: "" },

    brand: { type: String, default: "" },

    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    originalPrice: { type: Number, min: 0 },

    category: { type: String, required: true },
    subCategory: { type: String, default: "" },
    thirdCategory: { type: String, default: "" },

    location: { type: String, default: "" },

    // GeoJSON Point for precise location (only set when valid)
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude] as per GeoJSON standard
      },
      address: { type: String },
      area: { type: String }
    },

    hidePreciseLocation: { type: Boolean, default: false },

    stock: { type: Number, min: 0, default: 0 },

    images: {
      type: [String],
      default: [],
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "on_hold", "sold", "expired", "pending_approval"],
      default: "active"
    },
    sales: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiryDate: { type: Date },
    soldPrice: { type: Number },
    soldAt: { type: Date },
    reasonOnHold: { type: String },
    buyerInfo: { type: String },

    // 🔥 MAJOR FIX (AI SAFE)
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    paymentInfo: {
      id: String,
      status: String,
      amount: Number,
      provider: String,
    },

    boostedUntil: { type: Date },
    boostAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Create 2dsphere index for geospatial queries
productSchema.index({ coordinates: '2dsphere' });

const Product = mongoose.model("Product", productSchema);
export default Product;
