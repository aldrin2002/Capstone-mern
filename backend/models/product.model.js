import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            required: true,
            enum: ["Coffee", "Tea", "Pastry", "Sandwich", "Dessert", "Other"],
            default: "Other"
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            default: ""
        },
        stock: {
            type: Number,
            default: 0,
            min: 0
        },
        image: {
            type: String,
            default: ""
        },
        featured: {
            type: Boolean,
            default: false
        },
        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema); 