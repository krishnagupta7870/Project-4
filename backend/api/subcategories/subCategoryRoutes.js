import express from "express";
import SubCategory from "../../models/SubCategory.js";
import { protect, adminOnly } from "../../middleware/auth.js";
import { productUpload } from "../../middleware/fileUpload.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { category: categoryId } : {};
    const subs = await SubCategory.find(filter).sort({ order: 1, name: 1 });
    res.json(subs);
  } catch {
    res.status(500).json({ message: "Failed to fetch sub categories" });
  }
});

router.post("/", protect, adminOnly, productUpload.single("image"), async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ message: "Name and category required" });
    let imagePath = req.body.image || "";
    if (req.file) imagePath = `/${req.file.path.replace(/\\\\/g, "/").replace(/\\/g, "/")}`;
    const sub = await SubCategory.create({ name: name.trim(), category, image: imagePath });
    res.status(201).json(sub);
  } catch {
    res.status(500).json({ message: "Failed to create sub category" });
  }
});

router.put("/:id", protect, adminOnly, productUpload.single("image"), async (req, res) => {
  try {
    const sub = await SubCategory.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Sub category not found" });
    if (req.body.name) sub.name = req.body.name.trim();
    if (req.body.category) sub.category = req.body.category;
    if (req.body.fields) sub.fields = req.body.fields;
    if (req.file) {
      sub.image = `/${req.file.path.replace(/\\\\/g, "/").replace(/\\/g, "/")}`;
    } else if (req.body.image) {
      sub.image = req.body.image;
    }
    if (req.body.order !== undefined) sub.order = Number(req.body.order);
    const saved = await sub.save();
    res.json(saved);
  } catch {
    res.status(500).json({ message: "Failed to update sub category" });
  }
});

router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const sub = await SubCategory.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Sub category not found" });
    await sub.deleteOne();
    res.json({ message: "Sub category deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete sub category" });
  }
});

// Admin: Bulk create
router.post("/bulk", protect, adminOnly, async (req, res) => {
  try {
    const { category, names = [] } = req.body;
    if (!category || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ message: "category and names[] required" });
    }
    const docs = names
      .map((n) => (typeof n === "string" ? n.trim() : ""))
      .filter(Boolean)
      .map((n) => ({ name: n, category }));
    if (docs.length === 0) return res.status(400).json({ message: "No valid names" });
    const created = await SubCategory.insertMany(docs);
    res.status(201).json(created);
  } catch {
    res.status(500).json({ message: "Failed to bulk create sub categories" });
  }
});

export default router;
