import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  sentimentScore: { type: Number, default: 0 }, // 0 to 1
  sentimentLabel: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' }
}, { timestamps: true });

// Prevent multiple reviews from same user on same product
reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
