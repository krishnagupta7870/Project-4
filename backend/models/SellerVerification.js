import mongoose from "mongoose";

const sellerVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },

    documentType: {
      type: String,
      enum: ["citizenship", "passport", "license"],
      required: true
    },

    documentFront: {
      type: String,
      required: true
    },

    documentBack: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    adminComment: { type: String },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model(
  "SellerVerification",
  sellerVerificationSchema
);
