import express from "express";
import mongoose from "mongoose";
import { protect } from "../../middleware/auth.js";
import { audioUpload } from "../../middleware/fileUpload.js";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";
import { recordSellerChatInteraction } from "../../services/UserActivityService.js";

const router = express.Router();

// Helper function to emit unread count update to a specific user
async function emitUnreadCountUpdate(io, userId) {
  try {
    const userConversations = await Conversation.find({ participants: userId }).distinct("_id");
    const unreadCount = await Message.countDocuments({
      conversation: { $in: userConversations },
      readBy: { $ne: userId },
      sender: { $ne: userId } // Don't count own messages as unread
    });
    io.to(String(userId)).emit("unread_count_update", { count: unreadCount });
  } catch (err) {
    console.error("Failed to emit unread count:", err);
  }
}

router.get("/conversations", protect, async (req, res) => {
  try {
    const list = await Conversation.find({ participants: req.user._id })
      .populate({ path: "participants", select: "name" })
      .populate({ path: "product", select: "name price images" })
      .sort({ updatedAt: -1 })
      .limit(200);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

router.post("/conversations", protect, async (req, res) => {
  try {
    const { participantId, title, product } = req.body;
    if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
      return res.status(400).json({ message: "participantId is required" });
    }
    const participants = [req.user._id, participantId].map((id) => new mongoose.Types.ObjectId(id));

    const hasValidProduct = product && mongoose.Types.ObjectId.isValid(product);
    const criteria = {
      participants: { $all: participants },
      $expr: { $eq: [{ $size: "$participants" }, 2] },
      ...(hasValidProduct ? { product: new mongoose.Types.ObjectId(product) } : { product: null }),
    };

    let convo = await Conversation.findOne(criteria);
    if (!convo) {
      convo = await Conversation.create({
        participants,
        title: title || "",
        product: hasValidProduct ? new mongoose.Types.ObjectId(product) : null
      });
    }
    const populated = await Conversation.findById(convo._id)
      .populate({ path: "participants", select: "name" })
      .populate({ path: "product", select: "name price images seller" });
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to start conversation" });
  }
});

router.get("/conversations/:id", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id)
      .populate({ path: "participants", select: "name" })
      .populate({ path: "product", select: "name price images seller" });
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p._id || p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });
    res.json(convo);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
});

router.get("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const msgs = await Message.find({ conversation: convo._id })
      .populate({ path: "sender", select: "name" })
      .sort({ createdAt: 1 })
      .limit(1000);
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

router.post("/messages", protect, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    if (!conversationId || !text || !String(text).trim()) {
      return res.status(400).json({ message: "conversationId and text are required" });
    }
    const convo = await Conversation.findById(conversationId).populate({
      path: "product",
      select: "seller"
    });
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const msg = await Message.create({
      conversation: convo._id,
      sender: req.user._id,
      text: String(text).trim(),
      readBy: [req.user._id]
    });

    if (convo.product && convo.product.seller) {
      const sellerId = String(convo.product.seller);
      const senderId = String(req.user._id);
      if (sellerId !== senderId) {
        recordSellerChatInteraction(senderId, sellerId).catch(() => {});
      }
    }

    // Update conversation's lastMessage
    convo.lastMessage = { text: msg.text, sender: req.user._id, at: msg.createdAt };
    await convo.save();

    const populated = await Message.findById(msg._id).populate({ path: "sender", select: "name" });

    // Emit via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("new_message", populated);

      // Fetch fully populated convo for sidebar sync
      const fullConvo = await Conversation.findById(conversationId)
        .populate({ path: "participants", select: "name image" })
        .populate({ path: "product", select: "name price images seller" });

      if (fullConvo) {
        fullConvo.participants.forEach(pId => {
          io.to(String(pId?._id || pId)).emit("convo_updated", fullConvo);
        });
      }

      // Emit unread count update to other participants (not sender)
      convo.participants.forEach(async (participantId) => {
        if (String(participantId) !== String(req.user._id)) {
          await emitUnreadCountUpdate(io, participantId);
        }
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// Upload and send a voice message (audio)
router.post("/messages/audio", protect, audioUpload.single("audio"), async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ message: "conversationId is required" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "audio file is required" });
    }
    const convo = await Conversation.findById(conversationId).populate({
      path: "product",
      select: "seller"
    });
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });

    const audioPath = `/${String(req.file.path).replace(/\\\\/g, "/").replace(/\\/g, "/")}`;

    const msg = await Message.create({
      conversation: convo._id,
      sender: req.user._id,
      type: "audio",
      audioUrl: audioPath,
      text: "Voice message",
      readBy: [req.user._id]
    });

    if (convo.product && convo.product.seller) {
      const sellerId = String(convo.product.seller);
      const senderId = String(req.user._id);
      if (sellerId !== senderId) {
        recordSellerChatInteraction(senderId, sellerId).catch(() => {});
      }
    }

    convo.lastMessage = { text: msg.text || "Voice message", sender: req.user._id, at: msg.createdAt };
    await convo.save();

    const populated = await Message.findById(msg._id).populate({ path: "sender", select: "name" });

    // Emit via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("new_message", populated);

      const fullConvo = await Conversation.findById(conversationId)
        .populate({ path: "participants", select: "name image" })
        .populate({ path: "product", select: "name price images seller" });

      if (fullConvo) {
        fullConvo.participants.forEach(pId => {
          io.to(String(pId?._id || pId)).emit("convo_updated", fullConvo);
        });
      }

      // Emit unread count update to other participants (not sender)
      convo.participants.forEach(async (participantId) => {
        if (String(participantId) !== String(req.user._id)) {
          await emitUnreadCountUpdate(io, participantId);
        }
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Failed to send audio message" });
  }
});

router.get("/unread-count", protect, async (req, res) => {
  try {
    const unread = await Message.countDocuments({
      readBy: { $ne: req.user._id },
      conversation: { $in: await Conversation.find({ participants: req.user._id }).distinct("_id") }
    });
    res.json({ count: unread });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute unread count" });
  }
});

router.get("/conversations/:id/unread", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id).select("_id participants");
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });
    const count = await Message.countDocuments({ conversation: convo._id, readBy: { $ne: req.user._id } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Failed to compute unread" });
  }
});

router.put("/conversations/:id/read", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id).select("_id participants");
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });
    await Message.updateMany(
      { conversation: convo._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    // Emit updated unread count to current user
    const io = req.app.get("io");
    if (io) {
      await emitUnreadCountUpdate(io, req.user._id);
    }

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as read" });
  }
});

router.delete("/conversations/:id/leave", protect, async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    const isMember = (convo.participants || []).some((p) => String(p) === String(req.user._id));
    if (!isMember) return res.status(403).json({ message: "Forbidden" });
    // Remove current user from participants
    await Conversation.updateOne({ _id: convo._id }, { $pull: { participants: req.user._id } });
    res.json({ message: "Left conversation" });
  } catch (err) {
    res.status(500).json({ message: "Failed to leave conversation" });
  }
});

export default router;
