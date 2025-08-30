import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache directory check to avoid repeated filesystem calls
const directoryCache = new Set();

// Pre-define valid types for fastest lookup
const validMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png"]);
const validExtensions = new Set(["jpeg", "jpg", "png"]);

export const createMulter = (destinationPath, currentImageCount = 0) => {
  const maxSize = 1 * 1024 * 1024; // 1MB per file - STRICT LIMIT

  // Async directory check for full path
  const ensureDirectory = async () => {
    if (!directoryCache.has(destinationPath)) {
      try {
        await fs.mkdir(destinationPath, { recursive: true });
        directoryCache.add(destinationPath);
      } catch (error) {
        throw new Error(`File system error: Unable to prepare directory ${destinationPath}`);
      }
    }
  };

  let fileCounter = 0;

  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureDirectory();
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      fileCounter += 1;
      const filename = `img${currentImageCount + fileCounter}.${extension}`;
      cb(null, filename);
    },
  });

  const multerInstance = multer({
    storage,
    limits: {
      fileSize: maxSize, // 1MB MAXIMUM per individual file
      files: 5, // Max 5 files
      fieldSize: 3 * 1024 * 1024, // 3MB for other fields
      fieldNameSize: 50, // Max field name length
    },
    fileFilter: (req, file, cb) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      if (
        file.fieldname !== "images" ||
        !validMimeTypes.has(file.mimetype) ||
        !validExtensions.has(extension)
      ) {
        return cb(new Error("Invalid field name, file type, or extension"));
      }
      cb(null, true);
    },
  }).array("images", 5);

  return async (req, res, next) => {
    fileCounter = 0;
    const start = Date.now(); 
    res.setTimeout(300000);

    multerInstance(req, res, (err) => {
      if (err) {
        let errorMessage = err.message;
        if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = `File too large. Maximum size allowed is 1MB per image`;
        }
        console.error(`Upload error: ${errorMessage}`);
        return res.status(400).json({
          success: false,
          message: errorMessage,
        });
      }
      next();
    });
  };
};