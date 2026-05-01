import Category from "../../models/Category.js";
import { productUpload } from "../../middleware/fileUpload.js";
import express from "express";

export const getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ createdAt: -1 });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });

    let imagePath = req.body.image || "";
    if (req.file) {
      imagePath = `/${req.file.path.replace(/\\/g, "/")}`;
    }

    const cat = await Category.create({ name: name.trim(), image: imagePath });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ message: "Failed to create category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    await cat.deleteOne();
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export const adminCategoryRouter = express.Router();
adminCategoryRouter.get("/", getCategories);
adminCategoryRouter.post("/", productUpload.single("image"), createCategory);
adminCategoryRouter.delete("/:id", deleteCategory);
adminCategoryRouter.put("/:id", productUpload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ message: "Category not found" });
    if (name) cat.name = name.trim();
    if (req.file) {
      cat.image = `/${req.file.path.replace(/\\/g, "/")}`;
    } else if (req.body.image) {
      cat.image = req.body.image;
    }
    const saved = await cat.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
});
