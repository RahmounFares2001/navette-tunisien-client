import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { User, Car } from "../../models/models.js";
import { verifyAdmin } from "../../utils/verifyAdmin.js";


const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve files from /var/secure_docs for authenticated admins
router.get("/users/:id/:filename", verifyAdmin, async (req, res) => {
  try {
    const { id, filename } = req.params;

    const basePath = path.join(__dirname, "../../var/secure_docs"); 
    const filePath = path.join(basePath, "users", id, filename);

    // Prevent directory traversal
    if (!filePath.startsWith(basePath)) {
      return res.status(400).json({ success: false, message: "Invalid file path" });
    }

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    // Check file permissions
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (error) {
      return res.status(403).json({ success: false, message: "File not readable", error: error.message });
    }

    // Verify user ownership
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.identityDocUrl !== `/users/${id}/${filename}` && user.licenseUrl !== `/users/${id}/${filename}`) {
      return res.status(403).json({ success: false, message: "File not associated with user" });
    }

    // Set content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
    }[ext] || "application/octet-stream";

    // Stream the file
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.on("error", (err) => {
      res.status(500).json({ success: false, message: "Error streaming file" });
    });
    stream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;