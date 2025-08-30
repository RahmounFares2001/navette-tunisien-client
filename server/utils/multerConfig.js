import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createMulter = (destinationPath, maxSize = 5 * 1024 * 1024, currentImageCount = 0) => {
  try {
    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
      (`Directory created: ${destinationPath}`);
    } else {
      (`Directory already exists: ${destinationPath}`);
    }

    fs.accessSync(destinationPath, fs.constants.W_OK);
    (`Directory is writable: ${destinationPath}`);
  } catch (error) {
    console.error(`Failed to create or access directory ${destinationPath}:`, error);
    throw new Error(`File system error: Unable to prepare directory ${destinationPath}`);
  }

  let fileCounter = 0;

  const storage = multer.diskStorage({
    destination: destinationPath,
    filename: (req, file, cb) => {
      try {
        const extension = file.originalname.split('.').pop().toLowerCase();
        fileCounter += 1;
        const index = currentImageCount + fileCounter;
        const filename = `img${index}.${extension}`;
        (`Generating filename: ${filename} (currentImageCount: ${currentImageCount}, fileCounter: ${fileCounter})`);
        cb(null, filename);
      } catch (error) {
        console.error(`Error in filename generation for ${file.originalname}:`, error);
        cb(new Error("Failed to generate filename"), null);
      }
    },
  });

  const multerInstance = multer({
    storage,
    limits: {
      fileSize: maxSize,
      files: 5,
      fieldSize: 10 * 1024 * 1024,
      parts: 20,
    },
    fileFilter: (req, file, cb) => {
      const filetypes = /jpeg|jpg|png/i;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(file.originalname.split('.').pop().toLowerCase());

      (`Processing file: ${file.originalname}, mimetype: ${file.mimetype}, destination: ${destinationPath}`);

      if (!mimetype || !extname) {
        console.error(`File rejected: ${file.originalname} (mimetype: ${file.mimetype}, extension: ${file.originalname.split('.').pop()})`);
        return cb(new Error(`Invalid file type for ${file.originalname}. Only .jpg, .jpeg, and .png files are allowed!`));
      }

      (`File accepted for processing: ${file.originalname}`);
      cb(null, true);
    },
  }).array("images", 5);

  return (req, res, next) => {
    fileCounter = 0;
    // Skip Multer processing for GET requests
    if (req.method === 'GET') {
      (`GET request detected, bypassing Multer processing`);
      return next();
    }

    multerInstance(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error(`Multer error: ${err.message} (code: ${err.code})`, err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ success: false, message: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({ success: false, message: `Too many files. Maximum is 5 files` });
        }
        if (err.code === 'LIMIT_PART_COUNT') {
          return res.status(400).json({ success: false, message: `Form has too many parts. Ensure correct form structure` });
        }
        if (err.code === 'LIMIT_FIELD_COUNT') {
          return res.status(400).json({ success: false, message: `Too many form fields. Ensure all required fields are included` });
        }
        if (err.message.includes('Unexpected end of form')) {
          console.error(`Multer parsing failed: ${err.message}`);
          if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
              try {
                fs.unlinkSync(file.path);
                (`Cleaned up partial file: ${file.path}`);
              } catch (unlinkErr) {
                console.error(`Failed to clean up file ${file.path}:`, unlinkErr);
              }
            });
          }
          return res.status(400).json({ success: false, message: `Invalid form data: Unexpected end of form. Check file sizes and form fields` });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error(`File filter error: ${err.message}`);
        return res.status(400).json({ success: false, message: err.message });
      }

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          try {
            const stats = fs.statSync(file.path);
            (`Validated file: ${file.originalname}, size: ${stats.size} bytes, path: ${file.path}`);
            if (stats.size === 0) {
              console.error(`Empty file detected: ${file.originalname}, path: ${file.path}`);
              try {
                fs.unlinkSync(file.path);
                (`Cleaned up empty file: ${file.path}`);
              } catch (unlinkErr) {
                console.error(`Failed to clean up empty file ${file.path}:`, unlinkErr);
              }
              return res.status(400).json({ success: false, message: `File ${file.originalname} is empty` });
            }
          } catch (statErr) {
            console.error(`Failed to stat file ${file.path}:`, statErr);
            return res.status(400).json({ success: false, message: `Error validating file ${file.originalname}` });
          }
        }
      } else {
        (`No files uploaded in request`);
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        console.error(`No form fields received in request`);
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
              (`Cleaned up file due to missing form fields: ${file.path}`);
            } catch (unlinkErr) {
              console.error(`Failed to clean up file ${file.path}:`, unlinkErr);
            }
          });
        }
        return res.status(400).json({ success: false, message: `No form fields received. Ensure all required fields (brand, model, type, pricePerDay, status, fuel, seats, transmission, year, quantity, matriculations) are included` });
      }

      (`Multer processing complete, proceeding to next middleware`);
      next();
    });
  };
};