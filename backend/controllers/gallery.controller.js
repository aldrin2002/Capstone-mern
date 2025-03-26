import { Gallery } from "../models/gallery.model.js";

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
        const { title, description, featured, displayOrder } = req.body;
        
        // Validate required fields
        if (!title || !req.file) {
            return res.status(400).json({ message: "Title and image are required" });
        }
        
        // Get image path from uploaded file
        const imagePath = `/uploads/${req.file.filename}`;
        
        const newGalleryImage = new Gallery({
            title,
            description: description || "",
            image: imagePath,
            featured: featured === "true",
            displayOrder: Number(displayOrder) || 0
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
        const { title, description, featured, displayOrder } = req.body;
        
        const updates = {
            title,
            description: description || "",
            featured: featured === "true",
            displayOrder: Number(displayOrder) || 0
        };
        
        // Only update image if a new file was uploaded
        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }
        
        const updatedImage = await Gallery.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedImage) {
            return res.status(404).json({ message: "Gallery image not found" });
        }
        
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
        
        const deletedImage = await Gallery.findByIdAndDelete(id);
        
        if (!deletedImage) {
            return res.status(404).json({ message: "Gallery image not found" });
        }
        
        res.status(200).json({ message: "Gallery image deleted successfully" });
    } catch (error) {
        console.error("Error in deleteGalleryImage:", error);
        res.status(500).json({ message: "Server error while deleting gallery image" });
    }
}; 