import express from 'express';
import { productUpload } from '../middleware/fileUpload.js';

const router = express.Router();

router.post("/", productUpload.array("images", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const imagePaths = req.files.map((file) => {
      const raw = file.path || "";
      const normalized = raw.replace(/\\/g, "/");
      if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
        return normalized;
      }
      return normalized.startsWith("/") ? normalized : `/${normalized}`;
    });

    res.json(imagePaths);
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

export default router;
