import express from "express";
import User from "../../models/User.js";
import Product from "../../models/Product.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Get current user's wishlist (IDs)
router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("wishlist");
    res.json(user?.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// Get populated wishlist
router.get("/populated", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.json(user?.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// Toggle product in wishlist AND sync with Product likes
router.post("/:productId", protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id).select("wishlist");
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const wishlistIdx = user.wishlist.findIndex((id) => id.toString() === productId);
    const likesIdx = (product.likes || []).findIndex((id) => id.toString() === req.user._id.toString());

    if (wishlistIdx >= 0) {
      // Remove from wishlist
      user.wishlist.splice(wishlistIdx, 1);
      // Remove from product likes
      if (likesIdx >= 0) product.likes.splice(likesIdx, 1);
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      // Add to product likes
      if (likesIdx === -1) {
        if (!product.likes) product.likes = [];
        product.likes.push(req.user._id);
      }
    }

    await Promise.all([user.save(), product.save()]);
    res.json(user.wishlist);
  } catch (err) {
    console.error("Wishlist sync error:", err);
    res.status(500).json({ message: "Failed to update wishlist" });
  }
});

export default router;
