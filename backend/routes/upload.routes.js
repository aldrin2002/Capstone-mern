import express from "express";
import upload from "../middleware/upload.js";

const router = express.Router();

// Upload a file and return the file path
router.post("/", upload.single("image"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        
        // Return the path to the uploaded file
        const imagePath = `/uploads/${req.file.filename}`;
        res.status(200).json({ 
            success: true, 
            message: "File uploaded successfully", 
            imagePath 
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to upload file" 
        });
    }
});

export default router; 