
import express from "express";
import {
  loginAdmin,
  updateAdminProfile,
  changeAdminPassword,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC ADMIN LOGIN
router.post("/login", loginAdmin);

// VNS 2: PROTECTED ADMIN PROFILE
router.put("/profile", authMiddleware, updateAdminProfile);

// VNS 3: PROTECTED ADMIN PASSWORD
router.put("/change-password", authMiddleware, changeAdminPassword);

// VNS 4: VERIFY ADMIN SESSION
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    admin: req.admin,
  });
});

export default router;
