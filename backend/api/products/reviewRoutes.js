import express from "express";
import mongoose from "mongoose";
import { protect } from "../../middleware/auth.js";
import Review from "../../models/Review.js";
import Product from "../../models/Product.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import { analyzeSentiment } from "../../utils/sentimentService.js";
import { calculateTrustScore } from "../../services/TrustScoreService.js";
import { recordReviewSignal } from "../../services/UserActivityService.js";

const router = express.Router();

// Check if user is eligible to review
router.get("/check-eligibility/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const sellerId = product.seller;

    // Cannot review own product
    if (userId.toString() === sellerId.toString()) {
      return res.json({ canReview: false, message: "You cannot review your own product" });
    }

    // Check if conversation exists for this specific product
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, sellerId] },
      product: productId
    });

    if (!conversation) {
      return res.json({ canReview: false, message: "You must chat with the seller about this product first" });
    }

    // Check if seller has replied (two-way communication)
    const sellerReplied = await Message.exists({
      conversation: conversation._id,
      sender: sellerId
    });

    if (!sellerReplied) {
      return res.json({ canReview: false, message: "Seller must reply to your chat before you can review" });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ product: productId, reviewer: userId });
    if (existingReview) {
      return res.json({ canReview: false, message: "You have already reviewed this product" });
    }

    res.json({ canReview: true });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a review
router.post("/", protect, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating || !comment) {
      return res.status(400).json({ message: "Rating and comment are required" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const sellerId = product.seller;

    if (userId.toString() === sellerId.toString()) {
      return res.status(400).json({ message: "You cannot review your own product" });
    }

    // Check if conversation exists for this specific product
    const conversation = await Conversation.findOne({
      participants: { $all: [userId, sellerId] },
      product: productId
    });

    if (!conversation) {
      return res.status(403).json({ message: "You must chat with the seller about this product first" });
    }

    // Check if seller has replied (two-way communication)
    const sellerReplied = await Message.exists({
      conversation: conversation._id,
      sender: sellerId
    });

    if (!sellerReplied) {
      return res.status(403).json({ message: "Seller must reply to your chat before you can review" });
    }

    const existingReview = await Review.findOne({ product: productId, reviewer: userId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    // Sentiment Analysis
    const sentiment = await analyzeSentiment(comment, rating);

    const review = await Review.create({
      product: productId,
      reviewer: userId,
      seller: sellerId,
      rating,
      comment,
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label
    });

    // Update Seller Trust Score
    // Run asynchronously to not block response? 
    // User requested: "Recalculate only that seller immediately"
    // We can await it to ensure it's done, or let it float.
    // Let's await to be safe and consistent.
    await calculateTrustScore(sellerId);

    const populatedReview = await Review.findById(review._id).populate("reviewer", "name");

    recordReviewSignal(userId, productId, sentiment.score).catch(() => {});

    res.status(201).json(populatedReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("reviewer", "name")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a review
router.put("/:id", protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ensure ownership
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized to edit this review" });
    }

    if (rating) review.rating = rating;
    if (comment) {
      review.comment = comment;
      // Re-analyze sentiment if comment changed
      const sentiment = await analyzeSentiment(comment, rating || review.rating);
      review.sentimentScore = sentiment.score;
      review.sentimentLabel = sentiment.label;
    } else if (rating) {
      // Re-analyze if only rating changed (because of overrides)
      const sentiment = await analyzeSentiment(review.comment, rating);
      review.sentimentScore = sentiment.score;
      review.sentimentLabel = sentiment.label;
    }

    await review.save();

    // Recalculate Trust Score
    await calculateTrustScore(review.seller);

    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a review
router.delete("/:id", protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Ensure ownership (or admin)
    if (review.reviewer.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({ message: "Not authorized to delete this review" });
    }

    const sellerId = review.seller;
    await review.deleteOne();

    // Recalculate Trust Score
    await calculateTrustScore(sellerId);

    res.json({ message: "Review removed" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
