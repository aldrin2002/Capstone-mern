import express from "express";
import { User } from "../models/user.model.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Get all users
router.get("/", verifyToken, async (req, res) => {
    try {
        const users = await User.find({}).select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("Error getting users:", error);
        res.status(500).json({ success: false, message: "Error retrieving users" });
    }
});

// Get user by ID
router.get("/:id", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error getting user by ID:", error);
        res.status(500).json({ success: false, message: "Error retrieving user" });
    }
});

export default router; 