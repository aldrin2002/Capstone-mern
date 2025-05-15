import express from "express";
import { User } from "../models/user.model.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";

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

// Delete user by ID
router.delete("/:id", verifyToken, async (req, res) => {
    try {
        // Check if requesting user is an admin
        if (req.role !== "admin") {
            return res.status(403).json({ 
                success: false, 
                message: "Only administrators can delete users" 
            });
        }
        
        // Check if user exists
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Don't allow deletion of admin users
        if (user.role === "admin") {
            return res.status(403).json({ 
                success: false, 
                message: "Admin users cannot be deleted" 
            });
        }
        
        // Find user's conversation
        const conversation = await Conversation.findOne({ customer: req.params.id });
        
        // Delete all messages in the user's conversation
        if (conversation) {
            await Message.deleteMany({ conversation: conversation._id });
            // Delete the conversation itself
            await Conversation.findByIdAndDelete(conversation._id);
        }
        
        // Delete user
        await User.findByIdAndDelete(req.params.id);
        
        // Return success response
        res.status(200).json({ 
            success: true, 
            message: "User and all associated data deleted successfully" 
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error deleting user",
            error: error.message
        });
    }
});

export default router; 