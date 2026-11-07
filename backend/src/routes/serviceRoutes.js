
import express from "express";
import {
  getPublishedServices,
  getAllServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC SERVICES
router.get("/published", getPublishedServices);

// VNS 2: PROTECTED ADMIN ROUTES
router.get("/", authMiddleware, getAllServices);
router.post("/", authMiddleware, createService);
router.put("/:id", authMiddleware, updateService);
router.delete("/:id", authMiddleware, deleteService);

export default router;
