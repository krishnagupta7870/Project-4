import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const hasCloudinaryConfig =
  !!process.env.CLOUD_NAME &&
  !!process.env.CLOUD_API_KEY &&
  !!process.env.CLOUD_API_SECRET;

const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dealmate_products",
    allowed_formats: ["jpg", "png", "jpeg", "webp", "gif", "bmp", "tiff", "heic", "svg", "avif", "ico", "jfif"],
  },
});

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/images");
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.includes(".")
      ? file.originalname.substring(file.originalname.lastIndexOf("."))
      : "";
    cb(
      null,
      `image-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
    );
  },
});

const storage = hasCloudinaryConfig ? cloudStorage : localStorage;

const upload = multer({ storage });

export default upload;
export const conditionalUploadSingle = (field) => (req, res, next) => {
  const ct = String(req.headers["content-type"] || "");
  if (ct.includes("multipart/form-data")) {
    return upload.single(field)(req, res, next);
  }
  next();
};
