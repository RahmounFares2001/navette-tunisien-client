import mongoose from "mongoose";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { verifyAdmin } from "../../utils/verifyAdmin.js";
import { createMulterBlog } from "../../utils/multer/multerConfigBlog.js";
import { Blog } from "../../models/models.js";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createBlog = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const blogId = new mongoose.Types.ObjectId().toString();
    const upload = createMulterBlog(blogId);

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("createBlog: Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 2MB" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ success: false, message: "Too many files. Only one file allowed" });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("createBlog: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        const { title, description } = req.body;

        const requiredFields = { title, description };
        const missingFields = Object.keys(requiredFields).filter((key) => !requiredFields[key]);
        if (missingFields.length > 0 || !req.file) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileErr) {
              console.error(`createBlog: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.concat(!req.file ? ["image"] : []).join(", ")}`,
          });
        }

        const imgUrl = `/blogs/${blogId}/img.png`;

        const blog = new Blog({
          _id: blogId,
          title,
          description,
          imgUrl,
        });

        await blog.save();
        res.status(201).json({ success: true, data: blog, message: "Blog créé avec succès" });
      } catch (err) {
        console.error("createBlog: Database error:", err);
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (fileErr) {
            console.error(`createBlog: Failed to clean up file ${req.file.path}:`, fileErr);
          }
        }
        res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
      }
    });
  });
};

export const getAllBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await Blog.countDocuments();
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: blogs,
      currentPage: page,
      totalPages,
      totalItems,
    });
  } catch (err) {
    console.error("getAllBlogs error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
};

export const getBlogById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "ID de blog invalide" });
      }

      const blog = await Blog.findById(id);
      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog non trouvé" });
      }

      res.json({ success: true, data: blog });
    } catch (err) {
      console.error("getBlogById error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
};

export const updateBlog = async (req, res) => {
  verifyAdmin(req, res, async () => {
    const { id } = req.params;
    const upload = createMulterBlog(id);

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("updateBlog: Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large. Maximum size is 2MB" });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ success: false, message: "Too many files. Only one file allowed" });
        }
        return res.status(400).json({ success: false, message: `Multer error: ${err.message}` });
      } else if (err) {
        console.error("updateBlog: File filter error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }

      try {
        if (!mongoose.isValidObjectId(id)) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileErr) {
              console.error(`updateBlog: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(400).json({ success: false, message: "ID de blog invalide" });
        }

        const blog = await Blog.findById(id);
        if (!blog) {
          if (req.file) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (fileErr) {
              console.error(`updateBlog: Failed to clean up file ${req.file.path}:`, fileErr);
            }
          }
          return res.status(404).json({ success: false, message: "Blog non trouvé" });
        }

        if (req.file) {
          const targetImagePath = join(__dirname, "../../public/blogs", id, "img.png");

          const oldImagePath = join(__dirname, "../../public", blog.imgUrl);
          if (fs.existsSync(oldImagePath) && oldImagePath !== targetImagePath) {
            try {
              fs.unlinkSync(oldImagePath);
            } catch (fileErr) {
              console.error(`updateBlog: Failed to delete old image ${oldImagePath}:`, fileErr);
            }
          }

          const uploadDir = join(__dirname, "../../public/blogs", id);
          try {
            fs.mkdirSync(uploadDir, { recursive: true });
          } catch (dirErr) {
            console.error(`updateBlog: Failed to create directory ${uploadDir}:`, dirErr);
            if (req.file) {
              fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ success: false, message: "Erreur lors de la création du répertoire" });
          }

          if (!fs.existsSync(req.file.path)) {
            console.error(`updateBlog: Uploaded file not found at ${req.file.path}`);
            return res.status(500).json({ success: false, message: "Fichier téléchargé introuvable" });
          }

          if (req.file.path !== targetImagePath) {
            try {
              fs.renameSync(req.file.path, targetImagePath);
            } catch (fileErr) {
              console.error(`updateBlog: Failed to move file to ${targetImagePath}:`, fileErr);
              if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
              }
              return res.status(500).json({ success: false, message: "Erreur lors de l'enregistrement de l'image" });
            }
          }

          blog.imgUrl = `/blogs/${id}/img.png`;
        }

        const { title, description } = req.body;
        if (title) blog.title = title;
        if (description) blog.description = description;

        await blog.save();
        res.json({ success: true, data: blog, message: "Blog mis à jour avec succès" });
      } catch (err) {
        console.error("updateBlog: Database error:", err);
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (fileErr) {
            console.error(`updateBlog: Failed to clean up file ${req.file.path}:`, fileErr);
          }
        }
        res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
      }
    });
  });
};

export const deleteBlog = async (req, res) => {
  verifyAdmin(req, res, async () => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "ID de blog invalide" });
      }

      const blog = await Blog.findById(id);
      if (!blog) {
        return res.status(404).json({ success: false, message: "Blog non trouvé" });
      }

      const imageDir = join(__dirname, "../../public/blogs", id);
      if (fs.existsSync(imageDir)) {
        try {
          fs.rmSync(imageDir, { recursive: true, force: true });
        } catch (fileErr) {
          console.error(`deleteBlog: Failed to delete directory ${imageDir}:`, fileErr);
        }
      }

      await Blog.findByIdAndDelete(id);
      res.json({ success: true, message: "Blog supprimé avec succès" });
    } catch (err) {
      console.error("deleteBlog: Database error:", err);
      res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
    }
  });
};