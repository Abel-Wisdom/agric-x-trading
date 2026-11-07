import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC SETTINGS
router.get("/", getSettings);

// VNS 2: PROTECTED ADMIN SETTINGS
router.put("/", authMiddleware, updateSettings);

export default router;