import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import fs from "fs";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const validMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);
const validExtensions = new Set(["jpeg", "jpg", "png"]);

export const createMulterBlog = (blogId) => {
  const maxSize = 2 * 1024 * 1024; // 2MB per file

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const id = blogId || req.params.blogId || new mongoose.Types.ObjectId().toString();
      const uploadPath = join(__dirname, "../..", "public", "blogs", id);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, "img.png");
    },
  });

  return multer({
    storage,
    limits: {
      fileSize: maxSize,
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      if (file.fieldname !== "image" || !validMimeTypes.has(file.mimetype) || !validExtensions.has(extension)) {
        return cb(new Error("Invalid field name, file type, or extension. Only JPEG/PNG images allowed."));
      }
      cb(null, true);
    },
  }).single("image");
};