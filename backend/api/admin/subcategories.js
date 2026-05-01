import express from "express";
import SubCategory from "../../models/SubCategory.js";
import { productUpload } from "../../middleware/fileUpload.js";

export const getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const filter = categoryId ? { category: categoryId } : {};
    const subs = await SubCategory.find(filter).sort({ createdAt: -1 });
    res.json(subs);
  } catch {
    res.status(500).json({ message: "Failed to fetch sub categories" });
  }
};

export const createSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;
    if (!name || !category) return res.status(400).json({ message: "Name and category required" });
    let imagePath = req.body.image || "";
    if (req.file) imagePath = `/${req.file.path.replace(/\\/g, "/")}`;
    const sub = await SubCategory.create({ name: name.trim(), category, image: imagePath });
    res.status(201).json(sub);
  } catch {
    res.status(500).json({ message: "Failed to create sub category" });
  }
};

export const updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await SubCategory.findById(id);
    if (!sub) return res.status(404).json({ message: "Sub category not found" });
    if (req.body.name) sub.name = req.body.name.trim();
    if (req.body.category) sub.category = req.body.category;
    if (req.file) {
      sub.image = `/${req.file.path.replace(/\\/g, "/")}`;
    } else if (req.body.image) {
      sub.image = req.body.image;
    }
    const saved = await sub.save();
    res.json(saved);
  } catch {
    res.status(500).json({ message: "Failed to update sub category" });
  }
};

export const deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const sub = await SubCategory.findById(id);
    if (!sub) return res.status(404).json({ message: "Sub category not found" });
    await sub.deleteOne();
    res.json({ message: "Sub category deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete sub category" });
  }
};

export const adminSubCategoryRouter = express.Router();
adminSubCategoryRouter.get("/", getSubCategories);
adminSubCategoryRouter.post("/", productUpload.single("image"), createSubCategory);
adminSubCategoryRouter.put("/:id", productUpload.single("image"), updateSubCategory);
adminSubCategoryRouter.delete("/:id", deleteSubCategory);
adminSubCategoryRouter.post("/bulk", async (req, res) => {
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
