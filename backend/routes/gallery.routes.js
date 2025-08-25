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
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/", getAllGalleryImages);
router.get("/featured", getFeaturedGalleryImages);
router.get("/:id", getGalleryImageById);

// Protected routes (admin only)
router.post("/", verifyToken, createGalleryImage);  // Remove upload middleware here
router.put("/:id", verifyToken, updateGalleryImage); // Remove upload middleware here if you're updating with URL too
router.delete("/:id", verifyToken, deleteGalleryImage);
router.post("/upload", verifyToken, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Return the Cloudinary URL
        res.status(200).json({ 
            imagePath: req.file.path,
            publicId: req.file.filename
        });
    } catch (error) {
        console.error("Error uploading gallery image to Cloudinary:", error);
        res.status(500).json({ message: "Error uploading file to Cloudinary" });
    }
});

export default router;