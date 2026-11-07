
import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All dashboard statistics require admin authentication.
router.get("/stats", authMiddleware, getDashboardStats);

export default router;
