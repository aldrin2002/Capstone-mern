import express from "express";
import {
    getContactInfo,
    updateContactInfo
} from "../controllers/contact.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Public route to get contact information
router.get("/", getContactInfo);

// Protected route to update contact information (admin only)
router.put("/", verifyToken, updateContactInfo);

export default router; 