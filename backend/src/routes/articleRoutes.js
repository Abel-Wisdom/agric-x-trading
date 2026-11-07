
import express from "express";
import {
  getPublishedArticles,
  getArticleBySlug,
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC ARTICLE ROUTES
router.get("/published", getPublishedArticles);
router.get("/published/:slug", getArticleBySlug);

// VNS 2: PROTECTED ADMIN ROUTES
router.get("/", authMiddleware, getAllArticles);
router.post("/", authMiddleware, createArticle);
router.put("/:id", authMiddleware, updateArticle);
router.delete("/:id", authMiddleware, deleteArticle);

export default router;
