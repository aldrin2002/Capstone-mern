import mongoose from "mongoose";

// Location sub-schema
const locationSchema = new mongoose.Schema(
    {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function() {
                return !this.googleId;
            },
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: function() {
                return !this.googleId;
            },
        },
        address: {
            type: String,
            required: function() {
                return !this.googleId;
            },
        },
        // ✅ Location field for BOTH admin and customer
        location: {
            type: locationSchema,
            required: function() {
                return !this.googleId; // Required for both roles (except Google OAuth)
            }
        },
        role: {
            type: String,
            enum: ["admin", "customer", "driver"],
            default: "customer"
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        googleId: {
            type: String,
            sparse: true
        },
        profilePicture: {
            type: String
        },
        // ✅ Email verification fields
        emailVerified: { type: Boolean, default: false },
        verificationCode: { type: String, default: null },
        verificationExpires: { type: Date, default: null }
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);