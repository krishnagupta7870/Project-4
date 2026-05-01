import express from "express";
import { protect } from "../../middleware/auth.js";
import Report from "../../models/Report.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";
import Notification from "../../models/Notification.js";
import { createNotification } from "../../services/notificationService.js";
import { analyzeSentiment } from "../../utils/sentimentService.js";
import { calculateTrustScore } from "../../services/TrustScoreService.js";

const router = express.Router();

// @route   POST /api/reports
// @desc    Create a new report
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { targetId, reportType, reason, description } = req.body;

    if (!targetId || !reportType || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!["product", "user", "other"].includes(reportType)) {
      return res.status(400).json({ message: "Invalid report type" });
    }

    // Verify target exists
    if (reportType === "product") {
      const product = await Product.findById(targetId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      // Self-reporting check (moved here for efficiency)
      if (product.seller.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You cannot report your own product." });
      }
    } else if (reportType === "user") {
      const user = await User.findById(targetId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You cannot report your own profile." });
      }
    }

    // Verify product ownership for product reports
    if (reportType === "product") {
      const product = await Product.findById(targetId);
      if (product && product.seller.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: "You cannot report your own product." });
      }
    }

    // Check for duplicate pending report from same user on same target
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      targetId,
      status: "pending"
    });

    if (existingReport) {
      return res.status(400).json({ message: "You have already submitted a report for this." });
    }

    // Sentiment Analysis on Report Reason
    const sentiment = await analyzeSentiment(reason);

    const report = await Report.create({
      reporter: req.user._id,
      reportType,
      targetId,
      reason,
      description,
      sentimentScore: sentiment.score
    });

    // Update Trust Score if target is a User
    // If target is Product, identifying seller is needed to update THEIR score?
    // User request: "Recalculate only that seller immediately"
    // So if reportType is product, get product.seller.

    let targetUserId = null;
    if (reportType === 'user') {
      targetUserId = targetId;
    } else if (reportType === 'product') {
      const product = await Product.findById(targetId);
      if (product) targetUserId = product.seller;
    }

    if (targetUserId) {
      await calculateTrustScore(targetUserId);
    }

    // Send notification to all admins
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      for (const admin of admins) {
        await createNotification({
          userId: admin._id,
          type: "report_created",
          title: "New Report Submitted",
          message: `A new ${reportType} report has been submitted by ${req.user.name}. Reason: ${reason}`,
          link: "/admin?tab=reports"
        }).catch(() => { });
      }
    } catch (notifError) {
      console.error("Failed to send admin notifications:", notifError);
      // Continue execution, don't fail the request
    }

    res.status(201).json(report);
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
