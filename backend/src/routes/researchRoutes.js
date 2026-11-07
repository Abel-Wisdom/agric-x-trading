
import express from "express";
import {
  getPublishedResearch,
  getResearchBySlug,
  getAllResearch,
  createResearch,
  updateResearch,
  deleteResearch,
} from "../controllers/researchController.js";

import {
  uploadResearchFiles,
} from "../controllers/researchUploadController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { researchUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC RESEARCH ROUTES
router.get("/published", getPublishedResearch);
router.get("/published/:slug", getResearchBySlug);

// VNS 2: PROTECT ADMIN RESEARCH ROUTES
router.use(authMiddleware);

// VNS 3: UPLOAD RESEARCH FILES
router.post(
  "/upload-files",
  researchUpload.fields([
    { name: "cover", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
    { name: "contentImages", maxCount: 10 },
    { name: "contentVideos", maxCount: 5 },
  ]),
  uploadResearchFiles
);

// VNS 4: RESEARCH REPORT MANAGEMENT
router.get("/", getAllResearch);
router.post("/", createResearch);
router.put("/:id", updateResearch);
router.delete("/:id", deleteResearch);

export default router;
