import User from "../../models/User.js";

/**
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    console.log("Fetching all users...");
    const users = await User.find().select("-password");
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * PUT /api/admin/block/:id
 */
export const blockOrUnblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      message: user.isBlocked ? "User blocked" : "User unblocked",
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update user" });
  }
};
