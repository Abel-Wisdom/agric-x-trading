
import express from "express";
import {
  getAllMedia,
  uploadMedia,
  deleteMedia,
  previewMedia,
} from "../controllers/mediaController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// VNS 1: PROTECT ALL MEDIA ROUTES
router.use(authMiddleware);

// VNS 2: MEDIA MANAGEMENT
router.get("/", getAllMedia);
router.get("/:id/preview", previewMedia);
router.post("/upload", upload.array("files", 20), uploadMedia);
router.delete("/:id", deleteMedia);

export default router;
