import express from "express";
import {
    getAllOrders,
    getOrdersByStatus,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    deleteOrder
} from "../controllers/order.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// All order routes are protected for admin only
router.get("/", verifyToken, getAllOrders);
router.get("/status/:status", verifyToken, getOrdersByStatus);
router.get("/:id", verifyToken, getOrderById);
router.post("/", verifyToken, createOrder);
router.put("/:id", verifyToken, updateOrder);
router.patch("/:id/status", verifyToken, updateOrderStatus);
router.delete("/:id", verifyToken, deleteOrder);

export default router; 