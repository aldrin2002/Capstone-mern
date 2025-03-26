import express from "express";
import {
    getAllProducts,
    getProductsByCategory,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/product.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getAllProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/:id", getProductById);

// Protected routes (admin only)
router.post("/", verifyToken, upload.single('image'), createProduct);
router.put("/:id", verifyToken, upload.single('image'), updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router; 