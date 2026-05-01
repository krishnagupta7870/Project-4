import express from "express";
import SellerVerification from "../../models/SellerVerification.js";
import { sellerKycUpload } from "../../middleware/fileUpload.js";
import auth from "../../middleware/auth.js"; // your existing auth
import Notification from "../../models/Notification.js";
import User from "../../models/User.js";

const router = express.Router();

/**
 * @route   POST /api/vendor/verification/submit
 * @desc    Submit seller KYC
 * @access  Private
 */
router.post(
  "/submit",
  auth,
  sellerKycUpload.fields([
    { name: "docFront", maxCount: 1 },
    { name: "docBack", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      console.log("✅ KYC route hit");
      console.log("🧑 user:", req.user?.id);
      console.log("📦 body:", req.body);
      console.log("📂 files:", req.files);

      const verification = new SellerVerification({
        userId: req.user.id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        address: req.body.address,
        phone: req.body.phone,
        documentType: req.body.documentType,
        documentFront: req.files.docFront[0].path,
        documentBack: req.files.docBack?.[0]?.path || null
      });

      console.log("🧾 before save:", verification);

      await verification.save();

      console.log("✅ saved to DB");

      res.status(201).json({
        message: "Seller verification submitted",
        status: "pending"
      });
      try {
        const admins = await User.find({ role: "admin" }).select("_id");
        const items = admins.map(a => ({
          userId: a._id,
          type: "kyc_submitted",
          title: "New seller verification submitted",
          message: "A user submitted a new seller verification.",
          link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`
        }));
        if (items.length) {
          await Notification.insertMany(items);
        }
      } catch {}
    } catch (error) {
      console.error("❌ KYC SAVE ERROR:", error);
      res.status(500).json({
        message: "Failed to submit seller verification",
        error: error.message
      });
    }
  }
);
router.get("/status", auth, async (req, res) => {
  try {
    // Get the latest verification request
    const kyc = await SellerVerification.findOne({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    if (!kyc) {
      return res.json({
        exists: false,
        status: null
      });
    }

    return res.json({
      exists: true,
      status: kyc.status,
      adminComment: kyc.adminComment
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch KYC status" });
  }
});


export default router;
