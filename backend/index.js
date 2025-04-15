import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import fs from 'fs';

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import galleryRoutes from "./routes/gallery.routes.js";
import orderRoutes from "./routes/order.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set up paths - combining both approaches
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);      // For ES modules support
const projectRoot = path.resolve();              // For absolute project root

// Create path to uploads - in the project root
const uploadsDir = path.join(projectRoot, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
}

app.use(cors({ 
    origin: process.env.NODE_ENV === "production" ? true : "http://localhost:5173", 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files from project root uploads directory
app.use('/uploads', express.static(uploadsDir));
console.log('Serving uploads from:', uploadsDir);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Backend server is running!' });
});

if (process.env.NODE_ENV === "production") {
    // Use the __dirname for relative paths within the backend
    // and projectRoot for absolute paths from project root
    app.use(express.static(path.join(projectRoot, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(projectRoot, "frontend", "dist", "index.html"));
    });
}

app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port:", PORT);
});