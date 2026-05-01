import SellerVerification from "../../models/SellerVerification.js";
import User from "../../models/User.js";
import { sendEmail } from "../../utils/emailService.js";
import { createNotification } from "../../services/notificationService.js";

/**
 * GET /api/admin/verifications
 * Get all verification requests (optionally filter by status)
 */
export const getVerificationRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await SellerVerification.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch verification requests" });
  }
};

/**
 * PUT /api/admin/verifications/:id/approve
 * Approve a seller verification
 */
export const approveVerification = async (req, res) => {
  try {
    console.log("Approving verification:", req.params.id);
    const verification = await SellerVerification.findById(req.params.id);
    if (!verification) {
      console.log("Verification not found");
      return res.status(404).json({ message: "Verification request not found" });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({ message: "Request already approved" });
    }

    verification.status = 'approved';
    verification.adminComment = req.body?.comment || "Approved by admin";
    verification.reviewedAt = Date.now();

    console.log("Updating verification status...");
    await verification.save();

    // Update user role to seller
    console.log("Updating user role for:", verification.userId);
    const user = await User.findById(verification.userId);
    if (user) {
      user.role = 'seller';
      await user.save();
      console.log("User role updated to seller");
    } else {
      console.log("User not found for verification:", verification.userId);
    }

    res.json({ message: "Seller approved successfully", verification });
    await createNotification({
      userId: verification.userId,
      type: "kyc_approved",
      title: "Seller verification approved",
      message: "Your seller verification has been approved. You can start selling.",
      link: "/seller",
    }).catch(() => { });
  } catch (error) {
    console.error("Approve Verification Error:", error);
    res.status(500).json({ message: "Failed to approve verification", error: error.message });
  }
};

/**
 * PUT /api/admin/verifications/:id/reject
 * Reject a seller verification
 */
export const rejectVerification = async (req, res) => {
  try {
    const verification = await SellerVerification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: "Verification request not found" });
    }

    const previousStatus = verification.status;

    verification.status = 'rejected';
    verification.adminComment = req.body.reason || "Rejected by admin";
    verification.reviewedAt = Date.now();
    await verification.save();

    // If it was previously approved, we must revert the user role
    if (previousStatus === 'approved') {
      const user = await User.findById(verification.userId);
      if (user) {
        user.role = 'user'; // Revert to standard user
        await user.save();
        console.log(`User ${user.email} role reverted to 'user'`);
      }
    }

    // Send Rejection Email
    try {
      const user = await User.findById(verification.userId);
      if (user) {
        const html = `
                <p>Hello <strong>${user.name}</strong>,</p>
                <p>We regret to inform you that your seller verification request for DealMate has been <strong>rejected</strong>.</p>
                <p><strong>Reason:</strong> ${verification.adminComment}</p>
                <p>You can review your application and re-apply by visiting the seller verification page.</p>
                <br/>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-seller">View Status</a>
            `;
        await sendEmail(user.email, "Update on your Seller Verification Request", html);
        console.log(`Rejection email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.error("Failed to send rejection email:", emailErr);
      // Don't fail the request if email fails
    }

    res.json({ message: "Seller verification rejected", verification });
    await createNotification({
      userId: verification.userId,
      type: "kyc_rejected",
      title: "Seller verification rejected",
      message: verification.adminComment || "Your verification was rejected.",
      link: "/verify-seller",
    }).catch(() => { });
  } catch (error) {
    res.status(500).json({ message: "Failed to reject verification" });
  }
};

/**
 * POST /api/admin/verifications/request
 * Request KYC verification from a user
 */
export const requestKycVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already a seller
    if (user.role === 'seller') {
      return res.status(400).json({ message: "User is already a seller" });
    }

    // Check if pending request exists
    const existingRequest = await SellerVerification.findOne({ userId: user._id, status: 'pending' });
    if (existingRequest) {
      return res.status(400).json({ message: "User already has a pending verification request" });
    }

    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-seller`;

    const html = `
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>The admin team at DealMate has requested you to complete your Seller KYC Verification.</p>
      <p>Please click the link below to submit your documents:</p>
      <a href="${verificationLink}" style="padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Complete Verification</a>
      <p>If the button doesn't work, copy and paste this link:</p>
      <p>${verificationLink}</p>
    `;

    await sendEmail(user.email, "Action Required: Complete Seller Verification", html);

    res.json({ message: `Verification request sent to ${user.email}` });
    await createNotification({
      userId: user._id,
      type: "kyc_requested",
      title: "Admin requested seller verification",
      message: "Please complete your KYC to become a seller.",
      link: "/verify-seller",
    }).catch(() => { });
  } catch (error) {
    console.error("Request KYC Error:", error);
    res.status(500).json({ message: "Failed to send request", error: error.message });
  }
};
