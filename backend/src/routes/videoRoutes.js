
import express from "express";

import {
  getPublishedVideos,
  getVideoBySlug,
  getAllVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from "../controllers/videoController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC VIDEO ROUTES
router.get("/published", getPublishedVideos);
router.get("/published/:slug", getVideoBySlug);

// VNS 2: PROTECTED ADMIN VIDEO ROUTES
router.get("/", authMiddleware, getAllVideos);
router.post("/", authMiddleware, createVideo);
router.put("/:id", authMiddleware, updateVideo);
router.delete("/:id", authMiddleware, deleteVideo);

export default router;
