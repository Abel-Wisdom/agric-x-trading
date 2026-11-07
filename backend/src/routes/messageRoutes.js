
import express from "express";
import {
  createMessage,
  getAllMessages,
  updateMessageStatus,
  deleteMessage,
  sendMessageReply,
} from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// VNS 1: PUBLIC CONTACT FORM
router.post("/", createMessage);

// VNS 2: PROTECTED ADMIN ROUTES
router.get("/", authMiddleware, getAllMessages);
router.patch("/:id/status", authMiddleware, updateMessageStatus);
router.post("/:id/reply", authMiddleware, sendMessageReply);
router.delete("/:id", authMiddleware, deleteMessage);

export default router;
