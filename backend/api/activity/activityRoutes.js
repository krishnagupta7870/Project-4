import express from "express";
import { optionalAuth } from "../../middleware/auth.js";
import { recordProductViewDuration, recordSearch, recordClick } from "../../services/UserActivityService.js";

const router = express.Router();

router.post("/product-view", optionalAuth, async (req, res) => {
  try {
    const { productId, durationMs } = req.body || {};
    if (!productId || typeof durationMs === "undefined") {
      return res.status(400).json({ message: "productId and durationMs are required" });
    }
    if (!req.user) {
      return res.json({ tracked: false });
    }
    await recordProductViewDuration(req.user._id, productId, durationMs);
    res.json({ tracked: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to record activity" });
  }
});

router.post("/search", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ tracked: false });
    }
    const { raw, filters, source } = req.body || {};
    await recordSearch(req.user._id, {
      source: source || "searchBox",
      raw: raw || "",
      filters: filters || null
    });
    res.json({ tracked: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to record search" });
  }
});

router.post("/search-click", optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ tracked: false });
    }
    const { productId, context } = req.body || {};
    await recordSearch(req.user._id, {
      source: "chatbot_click",
      raw: "",
      filters: {
        productId: productId || null,
        context: context || null
      }
    });
    res.json({ tracked: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to record search click" });
  }
});

router.post("/track-click", optionalAuth, async (req, res) => {
  try {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ message: "productId is required" });
    if (!req.user) return res.json({ tracked: false });

    await recordClick(req.user._id, productId);
    res.json({ tracked: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to record click intent" });
  }
});

export default router;
