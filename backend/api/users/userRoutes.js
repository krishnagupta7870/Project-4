import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../../models/User.js";
import Product from "../../models/Product.js";

import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Update Profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: req.headers.authorization.split(" ")[1] // Keep existing token
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Public seller profile with products
router.get("/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    const user = await User.findById(id).select("_id name email role isVerified createdAt trustScore sellerStats");
    if (!user) return res.status(404).json({ message: "User not found" });

    const products = await Product.find({ seller: id })
      .select("name price images status createdAt likes")
      .sort({ createdAt: -1 })
      .limit(60);

    // Get reviews with sentiment for this seller
    const Review = mongoose.model('Review');
    const reviews = await Review.find({ seller: id })
      .populate('reviewer', 'name')
      .select('rating comment sentimentLabel sentimentScore createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    const profile = {
      user,
      stats: {
        products: products.length,
        followers: 0,
        following: 0
      },
      products,
      reviews
    };
    res.json(profile);
  } catch (err) {
    console.error("Seller profile error:", err);
    res.status(500).json({ message: "Failed to fetch seller profile" });
  }
});

export default router;
