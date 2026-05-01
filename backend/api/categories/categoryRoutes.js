import express from "express";
import Category from "../../models/Category.js";
import { protect, adminOnly } from "../../middleware/auth.js";
import { productUpload } from "../../middleware/fileUpload.js";
import seedRoutes from "./seedRoutes.js";

const router = express.Router();

// Mount seed routes (includes /seed and /full endpoints)
router.use("/", seedRoutes);

// Public: List categories
router.get("/", async (req, res) => {
  try {
    const cats = await Category.find().sort({ order: 1, name: 1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Admin: Create (fallback endpoint)
router.post(
  "/",
  protect,
  adminOnly,
  productUpload.single("image"),
  async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      let imagePath = req.body.image || "";
      if (req.file) imagePath = `/${req.file.path.replace(/\\\\/g, "/").replace(/\\/g, "/")}`;
      const cat = await Category.create({ name: name.trim(), image: imagePath });
      res.status(201).json(cat);
    } catch (err) {
      res.status(500).json({ message: "Failed to create category" });
    }
  }
);

// Admin: Delete
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    await cat.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// Admin: Update
router.put("/:id", protect, adminOnly, productUpload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    if (name) cat.name = name.trim();
    if (req.body.order !== undefined) cat.order = Number(req.body.order);
    if (req.file) {
      cat.image = `/${req.file.path.replace(/\\\\/g, "/").replace(/\\/g, "/")}`;
    } else if (req.body.image) {
      cat.image = req.body.image;
    }
    const saved = await cat.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
});

export default router;
