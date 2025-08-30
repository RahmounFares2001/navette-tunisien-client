import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pre-define valid types for fastest lookup
const validMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "application/pdf"]);
const validExtensions = new Set(["jpeg", "jpg", "png", "pdf"]);

export const createMulter = (destinationPath) => {
  const maxSize = 2 * 1024 * 1024; // 2MB per file - STRICT LIMIT

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath); // Directory handled by controller
    },
    filename: (req, file, cb) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const filename = `${file.fieldname}_${timestamp}_${random}.${extension}`;
      cb(null, filename);
    },
  });

  const multerInstance = multer({
    storage,
    limits: {
      fileSize: maxSize, // 2MB MAXIMUM per individual file
      files: 2, // Max 2 files
      fieldSize: 3 * 1024 * 1024, // 3MB for other fields
      fieldNameSize: 50, // Max field name length
    },
    fileFilter: (req, file, cb) => {
      const extension = file.originalname.split(".").pop().toLowerCase();
      // Combined validation for fieldname, MIME type, and extension
      if (
        (file.fieldname !== "identity" && file.fieldname !== "license") ||
        !validMimeTypes.has(file.mimetype) ||
        !validExtensions.has(extension)
      ) {
        return cb(new Error("Invalid field name, file type, or extension"));
      }
      cb(null, true);
    },
  }).fields([
    { name: "identity", maxCount: 1 },
    { name: "license", maxCount: 1 },
  ]);

  return (req, res, next) => {
    const start = Date.now(); // Log upload time
    res.setTimeout(300000); 

    multerInstance(req, res, (err) => {
      if (err) {
        let errorMessage = err.message;
        if (err.code === "LIMIT_FILE_SIZE") {
          errorMessage = `File too large. Maximum size allowed is 2MB per document`;
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