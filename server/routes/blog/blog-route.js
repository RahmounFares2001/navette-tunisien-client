import express from "express";
import { verifyAdmin } from "../../utils/verifyAdmin.js";
import { createBlog, getAllBlogs, getBlogById, 
    updateBlog, deleteBlog } from "../../controllers/blog/blog-controller.js";

const router = express.Router();

router.post("/", verifyAdmin, createBlog);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id", verifyAdmin, updateBlog);
router.delete("/:id", verifyAdmin, deleteBlog);

export default router;