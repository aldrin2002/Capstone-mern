import { Gallery } from "../models/gallery.model.js";
import { cloudinary } from "../config/cloudinary.js";

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    // Example URL: https://res.cloudinary.com/djmmcxkg2/image/upload/v1755617039/proof-of-payment/proof_1755617035645_avocado_milkshare.jpg
    try {
        // Extract the part after /upload/
        const parts = url.split('/upload/');
        if (parts.length !== 2) return null;
        
        // Remove version number (v1234567890/) and file extension
        const afterVersion = parts[1].replace(/^v\d+\//, '');
        const publicId = afterVersion.substring(0, afterVersion.lastIndexOf('.'));
        return publicId;
    } catch (error) {
        console.error("Error extracting public ID:", error);
        return null;
    }
};

// Get all gallery images
export const getAllGalleryImages = async (req, res) => {
    try {
        const images = await Gallery.find().sort({ displayOrder: 1, createdAt: -1 });
        res.status(200).json(images);
    } catch (error) {
        console.error("Error in getAllGalleryImages:", error);
        res.status(500).json({ message: "Server error while fetching gallery images" });
    }
};

// Get featured gallery images
export const getFeaturedGalleryImages = async (req, res) => {
    try {
        const featuredImages = await Gallery.find({ featured: true }).sort({ displayOrder: 1 });
        res.status(200).json(featuredImages);
    } catch (error) {
        console.error("Error in getFeaturedGalleryImages:", error);
        res.status(500).json({ message: "Server error while fetching featured gallery images" });
    }
};

// Get gallery image by ID
export const getGalleryImageById = async (req, res) => {
    try {
        const { id } = req.params;
        const image = await Gallery.findById(id);
        
        if (!image) {
            return res.status(404).json({ message: "Gallery image not found" });
        }
        
        res.status(200).json(image);
    } catch (error) {
        console.error("Error in getGalleryImageById:", error);
        res.status(500).json({ message: "Server error while fetching gallery image" });
    }
};

// Create new gallery image
export const createGalleryImage = async (req, res) => {
    try {
        const { title, description, featured, image } = req.body;
        
        // Validate required fields
        if (!title || !image) {
            return res.status(400).json({ message: "Title and image are required" });
        }
        
        const newGalleryImage = new Gallery({
            title,
            description: description || "",
            featured: featured === "true",
            image, // This is now the URL string, not a file
            displayOrder: 0
        });
        
        const savedImage = await newGalleryImage.save();
        res.status(201).json(savedImage);
    } catch (error) {
        console.error("Error in createGalleryImage:", error);
        res.status(500).json({ message: "Server error while creating gallery image" });
    }
};

// Update gallery image
export const updateGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, featured, displayOrder, image } = req.body;
        
        // First, get the existing image to check if we need to delete anything
        const existingImage = await Gallery.findById(id);
        if (!existingImage) {
            return res.status(404).json({ message: "Gallery image not found" });
        }

        const updates = {
            title,
            description: description || "",
            featured: featured === true || featured === "true",
            displayOrder: Number(displayOrder) || 0
        };
        
        // If new image URL is provided and different from the existing one,
        // delete the old image from Cloudinary
        if (image && image !== existingImage.image) {
            updates.image = image;
            
            // Delete old image from Cloudinary if it's a Cloudinary URL
            if (existingImage.image && existingImage.image.includes('cloudinary.com')) {
                const publicId = extractPublicId(existingImage.image);
                if (publicId) {
                    try {
                        await cloudinary.uploader.destroy(publicId);
                        console.log(`✅ Deleted old image from Cloudinary: ${publicId}`);
                    } catch (cloudinaryError) {
                        console.error("Error deleting image from Cloudinary:", cloudinaryError);
                        // Continue with update even if Cloudinary delete fails
                    }
                }
            }
        }
        
        const updatedImage = await Gallery.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        res.status(200).json(updatedImage);
    } catch (error) {
        console.error("Error in updateGalleryImage:", error);
        res.status(500).json({ message: "Server error while updating gallery image" });
    }
};

// Delete gallery image
export const deleteGalleryImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Find the image first to get its URL
        const imageToDelete = await Gallery.findById(id);
        
        if (!imageToDelete) {
            return res.status(404).json({ message: "Gallery image not found" });
        }
        
        // Delete the image from Cloudinary if it's a Cloudinary URL
        if (imageToDelete.image && imageToDelete.image.includes('cloudinary.com')) {
            const publicId = extractPublicId(imageToDelete.image);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                    console.log(`✅ Deleted image from Cloudinary: ${publicId}`);
                } catch (cloudinaryError) {
                    console.error("Error deleting image from Cloudinary:", cloudinaryError);
                    // Continue with deletion even if Cloudinary delete fails
                }
            }
        }
        
        // Now delete from database
        await Gallery.findByIdAndDelete(id);
        
        res.status(200).json({ message: "Gallery image deleted successfully" });
    } catch (error) {
        console.error("Error in deleteGalleryImage:", error);
        res.status(500).json({ message: "Server error while deleting gallery image" });
    }
};