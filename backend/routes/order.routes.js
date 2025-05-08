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

const router = express.Router();

// All routes require authentication
router.get("/", verifyToken, getAllOrders);
// Important: customer route must come BEFORE /:id route
router.get("/customer", verifyToken, getCustomerOrders);
router.get("/status/:status", verifyToken, getOrdersByStatus);
router.get("/:id", verifyToken, getOrderById);
router.post("/", verifyToken, createOrder);
router.put("/:id", verifyToken, updateOrder);
router.patch("/:id/status", verifyToken, updateOrderStatus);
router.delete("/:id", verifyToken, deleteOrder);

export default router;