import { Product } from "../models/product.model.js";

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
        
        // Validate required fields
        if (!name || !category || !price) {
            return res.status(400).json({ message: "Name, category, and price are required" });
        }
        
        // Get image path if file was uploaded
        const imagePath = req.file ? `/uploads/${req.file.filename}` : "";
        
        const newProduct = new Product({
            name,
            category,
            price: Number(price),
            description: description || "",
            stock: Number(stock) || 0,
            image: imagePath,
            featured: featured === "true"
        });
        
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        console.error("Error in createProduct:", error);
        res.status(500).json({ message: "Server error while creating product" });
    }
};

// Update product
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, description, stock, featured } = req.body;
        
        const updates = {
            name,
            category,
            price: Number(price),
            description: description || "",
            stock: Number(stock) || 0,
            featured: featured === "true"
        };
        
        // Only update image if a new file was uploaded
        if (req.file) {
            updates.image = `/uploads/${req.file.filename}`;
        }
        
        const updatedProduct = await Product.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error in updateProduct:", error);
        res.status(500).json({ message: "Server error while updating product" });
    }
};

// Delete product
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        
        if (!deletedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error in deleteProduct:", error);
        res.status(500).json({ message: "Server error while deleting product" });
    }
}; 