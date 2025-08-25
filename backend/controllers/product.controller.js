import { Product } from "../models/product.model.js";
import { cloudinary } from "../config/cloudinary.js";

// Get all products
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getAllProducts:", error);
        res.status(500).json({ message: "Server error while fetching products" });
    }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const products = await Product.find({ category }).sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getProductsByCategory:", error);
        res.status(500).json({ message: "Server error while fetching products by category" });
    }
};

// Get product by ID
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json(product);
    } catch (error) {
        console.error("Error in getProductById:", error);
        res.status(500).json({ message: "Server error while fetching product" });
    }
};

// Create new product
export const createProduct = async (req, res) => {
    try {
        const { name, category, price, description, stock, featured } = req.body;
        
        console.log("📝 Creating product with data:", { name, category, price, description, stock });
        console.log("📁 File received:", req.file);
        
        // Validate required fields
        if (!name || !category || !price) {
            return res.status(400).json({ message: "Name, category, and price are required" });
        }
        
        // Check if image was uploaded
        let imageUrl = "";
        let imagePublicId = "";
        
        if (req.file) {
            imageUrl = req.file.path; // This should be the Cloudinary URL
            imagePublicId = req.file.filename; // This should be the Cloudinary public_id
            
            console.log("📷 Image uploaded to Cloudinary:");
            console.log("  - URL:", imageUrl);
            console.log("  - Public ID:", imagePublicId);
            console.log("  - Original name:", req.file.originalname);
        } else {
            console.log("❌ No image uploaded");
        }
        
        const newProduct = new Product({
            name,
            category,
            price: Number(price),
            description: description || "",
            stock: Number(stock) || 0,
            image: imageUrl,
            imagePublicId: imagePublicId,
            featured: featured === "true"
        });
        
        const savedProduct = await newProduct.save();
        console.log("✅ Product saved to database:", {
            id: savedProduct._id,
            name: savedProduct.name,
            image: savedProduct.image
        });
        
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("❌ Error in createProduct:", error);
        
        // If there was an error and an image was uploaded, delete it from Cloudinary
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log("🗑️ Cleaned up uploaded image due to error");
            } catch (deleteError) {
                console.error("❌ Error deleting image from Cloudinary:", deleteError);
            }
        }
        
        res.status(500).json({ message: "Server error while creating product", error: error.message });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, description, stock, featured } = req.body;
        
        console.log("Updating product:", id);
        console.log("Update data:", { name, category, price, description, stock });
        console.log("New file:", req.file);
        
        // Find the existing product
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        const updates = {
            name: name || existingProduct.name,
            category: category || existingProduct.category,
            price: price ? Number(price) : existingProduct.price,
            description: description !== undefined ? description : existingProduct.description,
            stock: stock !== undefined ? Number(stock) : existingProduct.stock,
            featured: featured !== undefined ? featured === "true" : existingProduct.featured
        };
        
        // Handle image update
        if (req.file) {
            // Delete old image from Cloudinary if it exists
            if (existingProduct.imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(existingProduct.imagePublicId);
                    console.log("Deleted old image:", existingProduct.imagePublicId);
                } catch (deleteError) {
                    console.error("Error deleting old image from Cloudinary:", deleteError);
                }
            }
            
            // Set new image
            updates.image = req.file.path;
            updates.imagePublicId = req.file.filename;
            console.log("New image set:", { url: req.file.path, publicId: req.file.filename });
        } else {
            // Keep existing image
            updates.image = existingProduct.image;
            updates.imagePublicId = existingProduct.imagePublicId;
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        console.log("Product updated:", updatedProduct);
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error in updateProduct:", error);
        
        // If there was an error and a new image was uploaded, delete it from Cloudinary
        if (req.file && req.file.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename);
                console.log("Cleaned up new image due to error");
            } catch (deleteError) {
                console.error("Error deleting new image from Cloudinary:", deleteError);
            }
        }
        
        res.status(500).json({ message: "Server error while updating product", error: error.message });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        // Delete image from Cloudinary if it exists
        if (product.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(product.imagePublicId);
                console.log("Deleted image from Cloudinary:", product.imagePublicId);
            } catch (deleteError) {
                console.error("Error deleting image from Cloudinary:", deleteError);
            }
        }
        
        // Delete product from database
        await Product.findByIdAndDelete(id);
        
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        res.status(500).json({ message: "Server error while deleting product" });
    }
};