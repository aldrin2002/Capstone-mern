import express from "express";
import {
    getAllOrders,
    getOrdersByStatus,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder,
    getCustomerOrders,
    getOrderStatuses,
    assignDriver,
    getDriverOrders,
    addOrderRating,
    getAllRatings,
    restoreInventoryForOrder // ✅ ADD THIS
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// ✅ Keep authentication for customer routes
router.get("/customer", verifyToken, getCustomerOrders); // ✅ Needs token
router.post("/", verifyToken, createOrder); // ✅ Needs token

// Upload route for proof of payment (authenticated)
router.post("/upload", verifyToken, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: "No file uploaded" 
            });
        }
        
        console.log("📁 Cloudinary upload successful:", {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        });
        
        res.status(200).json({ 
            success: true,
            imagePath: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        console.error("❌ Error uploading to Cloudinary:", error);
        res.status(500).json({ 
            success: false,
            message: "Error uploading file to Cloudinary",
            error: error.message 
        });
    }
});

// Admin routes (require authentication)
router.get("/", verifyToken, getAllOrders);
router.get("/status/:status", verifyToken, getOrdersByStatus);
router.get("/statuses", verifyToken, getOrderStatuses);
router.get("/:id", verifyToken, getOrderById);
router.put("/:id", verifyToken, updateOrder);
router.patch("/:id/status", verifyToken, updateOrderStatus);
router.patch("/:id/assign-driver", verifyToken, assignDriver);
router.get("/driver/my-orders", verifyToken, getDriverOrders);
router.delete("/:id", verifyToken, deleteOrder);
router.post("/:id/rating", verifyToken, addOrderRating);
router.get("/ratings/all", verifyToken, getAllRatings);

// ✅ NEW: Manual inventory restoration endpoint (for emergency use)
router.post("/:orderId/restore-inventory", verifyToken, restoreInventoryForOrder);

export default router;