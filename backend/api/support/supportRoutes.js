import express from "express";
import SupportTicket from "../../models/SupportTicket.js";
import { protect, optionalAuth } from "../../middleware/auth.js";

const router = express.Router();

// @route   POST /api/support
// @desc    Create a support ticket
// @access  Public (or Protected)
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const ticket = await SupportTicket.create({
      user: req.user ? req.user._id : null,
      email: req.user ? req.user.email : email,
      subject,
      message
    });

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (err) {
    console.error("Support ticket error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
