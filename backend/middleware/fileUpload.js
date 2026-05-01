import multer from "multer";
import path from "path";
import fs from "fs";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const hasCloudinaryConfig =
  !!process.env.CLOUD_NAME &&
  !!process.env.CLOUD_API_KEY &&
  !!process.env.CLOUD_API_SECRET;

const createLocalImageStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `uploads/${subfolder}`;
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      } catch {}
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(
        null,
        `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
      );
    },
  });

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files allowed"), false);
  }
};

const sellerKycStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "dealmate_seller_kyc",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "svg", "avif", "ico", "jfif"],
      },
    })
  : createLocalImageStorage("seller_kyc");

export const sellerKycUpload = multer({
  storage: sellerKycStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const productStorage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "dealmate_products",
        allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "svg", "avif", "ico", "jfif"],
      },
    })
  : createLocalImageStorage("images");

export const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Audio upload (voice messages, etc.)
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/audio";
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const audioFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files allowed"), false);
  }
};

export const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});
