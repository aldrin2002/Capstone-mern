import express from "express";
import {
    getAllOrders,
    getOrdersByStatus,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getCustomerOrders
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../config/cloudinary.js"; // Import Cloudinary upload

const router = express.Router();

// All routes require authentication
router.get("/", verifyToken, getAllOrders);
router.get("/customer", verifyToken, getCustomerOrders);
router.get("/status/:status", verifyToken, getOrdersByStatus);
router.get("/:id", verifyToken, getOrderById);
router.post("/", verifyToken, createOrder);

// Updated upload route for Cloudinary
router.post("/upload", upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        console.log("📁 Cloudinary upload successful:", {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });
        
        // Return the Cloudinary URL
        res.status(200).json({ 
            imagePath: req.file.path, // This is the Cloudinary URL
            publicId: req.file.filename // This is the Cloudinary public ID
        });
    } catch (error) {
        console.error("Error uploading order proof to Cloudinary:", error);
        res.status(500).json({ message: "Error uploading file to Cloudinary" });
    }
});

router.put("/:id", verifyToken, updateOrder);
router.patch("/:id/status", verifyToken, updateOrderStatus);
router.delete("/:id", verifyToken, deleteOrder);

export default router;