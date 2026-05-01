import express from "express";
import {
  getHybridSimilarProducts,
  getHybridRecommendationsForUser,
  getTrendingProducts,
  getGuestRecommendations,
} from "./recommendationEngine.js";
import { protect, optionalAuth } from "../../middleware/auth.js";

const router = express.Router();

router.get("/similar-products/:id", optionalAuth, async (req, res) => {
  try {
    const items = await getHybridSimilarProducts(req.params.id, 10);
    res.json(items);
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/for-user", optionalAuth, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latitude = lat ? parseFloat(lat) : null;
    const longitude = lng ? parseFloat(lng) : null;

    if (!req.user) {
      const items = await getGuestRecommendations(10, latitude, longitude);
      return res.json(items);
    }
    const items = await getHybridRecommendationsForUser(req.user._id, 10);
    res.json(items);
  } catch (err) {
    console.error("Error in /api/recommend/for-user:", err);
    try {
      const fallback = await getTrendingProducts(10);
      return res.json(fallback);
    } catch (fallbackErr) {
      console.error("Fallback trending failed:", fallbackErr);
      res.status(500).json({ message: "Server Error" });
    }
  }
});

router.get("/trending", async (req, res) => {
  try {
    const items = await getTrendingProducts(10);
    res.json(items);
  } catch {
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
