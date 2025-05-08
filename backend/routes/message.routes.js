import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  getMessages, 
  getOrCreateConversation, 
  getAllConversations,
  uploadAttachment 
} from "../controllers/message.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images are allowed"));
  }
});

// Get customer conversation
router.get("/conversation", verifyToken, getOrCreateConversation);

// Get all conversations (admin only)
router.get("/conversations", verifyToken, getAllConversations);

// Get messages for a conversation
router.get("/:conversationId", verifyToken, getMessages);

// Upload attachment
router.post("/attachment", verifyToken, upload.single("attachment"), uploadAttachment);

export default router;