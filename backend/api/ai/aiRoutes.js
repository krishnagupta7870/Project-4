import express from "express";
import { analyzeProductImage, analyzeSellerSentiment, chatbotAssistant } from "./aiController.js";
import { protect, optionalAuth } from "../../middleware/auth.js";

const router = express.Router();

router.post("/analyze", protect, analyzeProductImage);
router.get("/sentiment/seller/:sellerId", protect, analyzeSellerSentiment);
router.post("/chatbot", optionalAuth, chatbotAssistant);

export default router;
