import express from "express";
import {
    getAllGalleryImages,
    getFeaturedGalleryImages,
    getGalleryImageById,
    createGalleryImage,
    updateGalleryImage,
    deleteGalleryImage
} from "../controllers/gallery.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Public routes
router.get("/", getAllGalleryImages);
router.get("/featured", getFeaturedGalleryImages);
router.get("/:id", getGalleryImageById);

// Protected routes (admin only)
router.post("/", verifyToken, upload.single('image'), createGalleryImage);
router.put("/:id", verifyToken, upload.single('image'), updateGalleryImage);
router.delete("/:id", verifyToken, deleteGalleryImage);

export default router; 