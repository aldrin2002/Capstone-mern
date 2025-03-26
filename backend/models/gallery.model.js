import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            default: ""
        },
        image: {
            type: String,
            required: true
        },
        featured: {
            type: Boolean,
            default: false
        },
        displayOrder: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

export const Gallery = mongoose.model("Gallery", gallerySchema); 