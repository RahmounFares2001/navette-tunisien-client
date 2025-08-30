import mongoose from "mongoose";
import multer from "multer";
import { User } from "../../models/models.js";
import { createMulter } from "../../utils/multerConfigUser.js"; 
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { verifyAdmin } from "../../utils/verifyAdmin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getUsers = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { search, page = 1, limit = 22 } = req.query;
      const query = search
        ? {
            $or: [
              { fullName: { $regex: search, $options: "i" } },
            ],
          }
        : {};

      const users = await User.find(query)
        .sort({ createdAt: -1 }) 
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean();

      const total = await User.countDocuments(query);

      res.status(200).json({
        success: true,
        data: users,
        total,
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("getUsers error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(404).json({ success: false, message: error.message });
  }
};

export const getUserByLicenseID = async (req, res) => {
  try {
    const { licenseIDNumber } = req.query; 
    const user = await User.findOne({ licenseIDNumber: licenseIDNumber });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("getUserByLicenseID error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



// create user
export const createUser = async (req, res) => {
  const userId = new mongoose.Types.ObjectId().toString();
  const uploadPath = join(__dirname, "../../public/users", userId);
  const upload = createMulter(uploadPath, 5 * 1024 * 1024);

  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("createUser: Multer error:", err.message, err.code);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum size is 5MB" });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ success: false, message: "Too many files. Maximum is 2 (identity and license)" });
      }
      if (req.files && Object.keys(req.files).length > 0) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
              (`createUser: Cleaned up file: ${file.path}`);
            } catch (fileErr) {
              console.error(`createUser: Failed to clean up file ${file.path}:`, fileErr);
            }
          }
        }
      }
      return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
    } else if (err) {
      console.error("createUser: File filter error:", err.message);
      if (req.files && Object.keys(req.files).length > 0) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
              (`createUser: Cleaned up file: ${file.path}`);
            } catch (fileErr) {
              console.error(`createUser: Failed to clean up file ${file.path}:`, fileErr);
            }
          }
        }
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    ("createUser: req.body:", req.body);
    (
      "createUser: req.files:",
      req.files
        ? Object.keys(req.files).map(field =>
            req.files[field].map(f => ({ name: f.originalname, size: f.size, type: f.mimetype, path: f.path }))
          )
        : []
    );

    const { fullName, email, phone, licenseIDNumber } = req.body;

    // Validate required fields
    const requiredFields = { fullName, email, phone, licenseIDNumber };
    const missingFields = Object.keys(requiredFields).filter(key => !requiredFields[key]);
    if (missingFields.length > 0) {
      if (req.files && Object.keys(req.files).length > 0) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
              (`createUser: Cleaned up file: ${file.path}`);
            } catch (fileErr) {
              console.error(`createUser: Failed to clean up file ${file.path}:`, fileErr);
            }
          }
        }
      }
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Process uploaded files
    let identityDocUrl, licenseUrl;
    if (req.files && Object.keys(req.files).length > 0) {
      if (
        (req.files["identity"] && req.files["identity"].length > 1) ||
        (req.files["license"] && req.files["license"].length > 1) ||
        Object.keys(req.files).length > 2
      ) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
              (`createUser: Cleaned up file: ${file.path}`);
            } catch (fileErr) {
              console.error(`createUser: Failed to clean up file ${file.path}:`, fileErr);
            }
          }
        }
        return res.status(400).json({ success: false, message: "Maximum 2 files allowed (identity and license)" });
      }

      for (const field in req.files) {
        for (const file of req.files[field]) {
          const extension = file.originalname.split(".").pop().toLowerCase();
          const newFilename = field === "identity" ? `identity.${extension}` : `license.${extension}`;
          const newPath = join(uploadPath, newFilename);
          try {
            await fs.rename(file.path, newPath);
            (`createUser: Moved file from ${file.path} to ${newPath}`);
            if (field === "identity") {
              identityDocUrl = `/users/${userId}/${newFilename}`;
            } else {
              licenseUrl = `/users/${userId}/${newFilename}`;
            }
          } catch (fileErr) {
            console.error(`createUser: Failed to move file ${file.path} to ${newPath}:`, fileErr);
            for (const f in req.files) {
              for (const file of req.files[f]) {
                try {
                  await fs.unlink(file.path);
                  (`createUser: Cleaned up file: ${file.path}`);
                } catch (unlinkErr) {
                  console.error(`createUser: Failed to clean up file ${file.path}:`, unlinkErr);
                }
              }
            }
            return res.status(500).json({ success: false, message: `Failed to process file ${file.originalname}` });
          }
        }
      }
    }

    const userData = {
      _id: userId,
      fullName,
      email,
      phone,
      licenseIDNumber,
      identityDocUrl,
      licenseUrl,
    };

    try {
      const user = new User(userData);
      await user.save();
      (`User created with ID: ${userId}, identityDocUrl: ${identityDocUrl}, licenseUrl: ${licenseUrl}`);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      console.error("createUser: Database error:", error);
      if (req.files && Object.keys(req.files).length > 0) {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            try {
              await fs.unlink(file.path);
              (`createUser: Cleaned up file: ${file.path}`);
            } catch (fileErr) {
              console.error(`createUser: Failed to clean up file ${file.path}:`, fileErr);
            }
          }
        }
        try {
          await fs.rm(uploadPath, { recursive: true, force: true });
          (`createUser: Cleaned up directory: ${uploadPath}`);
        } catch (dirErr) {
          console.error(`createUser: Failed to clean up directory ${uploadPath}:`, dirErr);
        }
      }
      res.status(400).json({ success: false, message: `Failed to create user: ${error.message}` });
    }
  });
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("updateUser error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const userDir = join(__dirname, "../../public/users", id);
    try {
      await fs.rm(userDir, { recursive: true, force: true });
      (`deleteUser: Deleted directory: ${userDir}`);
    } catch (dirErr) {
      console.error(`deleteUser: Failed to clean up directory ${userDir}:`, dirErr);
    }
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("deleteUser error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};