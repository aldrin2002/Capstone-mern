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
import { verifyToken } from "../middleware/verifyToken.js"; // Import from middleware
import upload from "../middleware/upload.js"; // Import upload middleware

const router = express.Router();

// All routes require authentication
router.get("/", verifyToken, getAllOrders);
// Important: customer route must come BEFORE /:id route
router.get("/customer", verifyToken, getCustomerOrders);
router.get("/status/:status", verifyToken, getOrdersByStatus);
router.get("/:id", verifyToken, getOrderById);
router.post("/", verifyToken, createOrder);
router.post("/upload", upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        const imagePath = `/uploads/${req.file.filename}`;
        res.status(200).json({ imagePath });
    } catch (error) {
        console.error("Error uploading order proof:", error);
        res.status(500).json({ message: "Error uploading file" });
    }
});
router.put("/:id", verifyToken, updateOrder);
router.patch("/:id/status", verifyToken, updateOrderStatus);
router.delete("/:id", verifyToken, deleteOrder);

export default router;