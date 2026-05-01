import express from "express";
import Notification from "../../models/Notification.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

router.get("/my", protect, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.put("/:id/read", protect, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n || String(n.userId) !== String(req.user.id)) {
      return res.status(404).json({ message: "Notification not found" });
    }
    n.read = true;
    await n.save();
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark all as read" });
  }
});

export default router;
