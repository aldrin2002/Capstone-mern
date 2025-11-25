import express from "express";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { verifyToken } from "../middleware/verifyToken.js";
import { 
  getMessages, 
  getOrCreateConversation, 
  getAllConversations,
  uploadAttachment,
  deleteMessage,
  deleteConversation,
  getUnreadCount,
  markAllMessagesAsRead,
  getOrCreateOrderConversation,
  getActiveOrderConversations,
  getOrderConversationDetails
} from "../controllers/message.controller.js";
import fs from 'fs';

const router = express.Router();

// Make sure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory at:', uploadsDir);
}

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

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A multer error occurred
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    // A non-multer error occurred
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get unread message count
router.get("/unread-count", verifyToken, getUnreadCount);

// Get general (non-order) customer conversation
router.get("/conversation", verifyToken, getOrCreateConversation);

// Get or create order-specific conversation
router.get("/conversation/order/:orderId", verifyToken, getOrCreateOrderConversation);

// Get active order conversations for current customer
router.get("/conversations/active-orders", verifyToken, getActiveOrderConversations);

// Get detailed order conversation (conversation + messages + order)
router.get("/conversation/order/:orderId/details", verifyToken, getOrderConversationDetails);

// Get all conversations (admin only)
router.get("/conversations", verifyToken, getAllConversations);

// Get messages for a conversation
router.get("/:conversationId", verifyToken, getMessages);

// Upload attachment with error handling
router.post("/attachment", verifyToken, (req, res, next) => {
  upload.single("attachment")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadAttachment);

// Delete a single message
router.delete("/:id", verifyToken, deleteMessage);

// Delete a conversation and all its messages
router.delete("/conversation/:id", verifyToken, deleteConversation);

// Add this route
router.post("/mark-all-read", verifyToken, markAllMessagesAsRead);

export default router;